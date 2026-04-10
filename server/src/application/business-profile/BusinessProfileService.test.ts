import test from 'node:test';
import assert from 'node:assert/strict';
import { BusinessProfileService } from './BusinessProfileService';
import { BusinessProfile } from '../../domain/business-profile/entities/BusinessProfile';
import { BusinessProfileRepository } from '../../domain/business-profile/repositories/BusinessProfileRepository';
import { InvoiceRepository } from '../../domain/invoices/repositories/InvoiceRepository';

class InMemoryBusinessProfileRepository implements BusinessProfileRepository {
    private readonly profiles = new Map<string, BusinessProfile>();

    constructor(initialProfiles: BusinessProfile[] = []) {
        for (const profile of initialProfiles) {
            this.profiles.set(profile.id, profile);
        }
    }

    async findById(id: string, workspaceId: string): Promise<BusinessProfile | null> {
        const profile = this.profiles.get(id);
        return profile && profile.workspaceId === workspaceId ? profile : null;
    }

    async findAll(workspaceId: string): Promise<BusinessProfile[]> {
        return [...this.profiles.values()].filter((profile) => profile.workspaceId === workspaceId);
    }

    async save(profile: BusinessProfile): Promise<BusinessProfile> {
        this.profiles.set(profile.id, profile);
        return profile;
    }

    async update(profile: BusinessProfile): Promise<BusinessProfile> {
        this.profiles.set(profile.id, profile);
        return profile;
    }

    async delete(id: string, workspaceId: string): Promise<void> {
        const profile = this.profiles.get(id);
        if (profile && profile.workspaceId === workspaceId) {
            this.profiles.delete(id);
        }
    }
}

class StubInvoiceRepository implements Partial<InvoiceRepository> {
    constructor(
        private readonly referencedBusinessIds = new Set<string>()
    ) { }

    async existsByBusinessId(businessId: string): Promise<boolean> {
        return this.referencedBusinessIds.has(businessId);
    }

    async existsByClientId(): Promise<boolean> {
        return false;
    }
}

function createProfile() {
    return BusinessProfile.reconstitute({
        id: 'business-1',
        workspaceId: 'workspace-1',
        ownerUserId: 'user-1',
        isActive: true,
        businessName: 'Acme Studio',
        address: {
            street: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '100-0001',
            country: 'JP',
        },
        email: 'billing@acme.test',
        phone: '+81-3-0000-0000',
        defaultCurrency: 'USD',
    });
}

test('createProfile persists a valid business profile in the correct workspace', async () => {
    const repo = new InMemoryBusinessProfileRepository();
    const service = new BusinessProfileService(
        repo,
        new StubInvoiceRepository() as unknown as InvoiceRepository
    );

    const created = await service.createProfile('user-1', 'workspace-1', {
        isActive: true,
        businessName: 'Acme Studio',
        address: {
            street: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '100-0001',
            country: 'JP',
        },
        email: 'billing@acme.test',
        phone: '+81-3-0000-0000',
        defaultCurrency: 'USD',
    });

    assert.equal(created.workspaceId, 'workspace-1');
    assert.equal(created.ownerUserId, 'user-1');
    assert.equal(created.businessName, 'Acme Studio');
});

test('createProfile rejects missing business names and invalid emails', async () => {
    const service = new BusinessProfileService(
        new InMemoryBusinessProfileRepository(),
        new StubInvoiceRepository() as unknown as InvoiceRepository
    );

    await assert.rejects(
        service.createProfile('user-1', 'workspace-1', {
            isActive: true,
            businessName: '   ',
            address: {
                street: '1 Main St',
                city: 'Tokyo',
                state: 'Tokyo',
                postalCode: '100-0001',
                country: 'JP',
            },
            email: 'billing@acme.test',
            phone: '+81-3-0000-0000',
            defaultCurrency: 'USD',
        }),
        /Business name is required/
    );

    await assert.rejects(
        service.createProfile('user-1', 'workspace-1', {
            isActive: true,
            businessName: 'Acme Studio',
            address: {
                street: '1 Main St',
                city: 'Tokyo',
                state: 'Tokyo',
                postalCode: '100-0001',
                country: 'JP',
            },
            email: 'not-an-email',
            phone: '+81-3-0000-0000',
            defaultCurrency: 'USD',
        }),
        /Invalid email address/
    );
});

test('getProfile enforces workspace isolation for business profiles', async () => {
    const service = new BusinessProfileService(
        new InMemoryBusinessProfileRepository([createProfile()]),
        new StubInvoiceRepository() as unknown as InvoiceRepository
    );

    assert.equal(await service.getProfile('workspace-2', 'business-1'), null);
    assert.equal((await service.getProfile('workspace-1', 'business-1'))?.businessName, 'Acme Studio');
});

test('deleteProfile blocks deletion when invoices reference the business profile', async () => {
    const service = new BusinessProfileService(
        new InMemoryBusinessProfileRepository([createProfile()]),
        new StubInvoiceRepository(new Set(['business-1'])) as unknown as InvoiceRepository
    );

    await assert.rejects(
        service.deleteProfile('workspace-1', 'business-1', 'user-1'),
        /Business profiles referenced by invoices cannot be deleted/
    );
});
