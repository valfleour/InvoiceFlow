import test from 'node:test';
import assert from 'node:assert/strict';
import { ClientService } from './ClientService';
import { Client } from '../../domain/clients/entities/Client';
import { ClientRepository } from '../../domain/clients/repositories/ClientRepository';
import { InvoiceRepository } from '../../domain/invoices/repositories/InvoiceRepository';

class InMemoryClientRepository implements ClientRepository {
    private readonly clients = new Map<string, Client>();

    constructor(initialClients: Client[] = []) {
        for (const client of initialClients) {
            this.clients.set(client.id, client);
        }
    }

    async findById(id: string, ownerUserId: string): Promise<Client | null> {
        const client = this.clients.get(id);
        return client && client.ownerUserId === ownerUserId ? client : null;
    }

    async findByBusinessId(businessId: string, ownerUserId: string): Promise<Client[]> {
        return [...this.clients.values()].filter(
            (client) => client.businessId === businessId && client.ownerUserId === ownerUserId
        );
    }

    async findByNormalizedIdentity(ownerUserId: string, normalizedName: string, normalizedEmail: string): Promise<Client | null> {
        return [...this.clients.values()].find(
            (client) =>
                client.ownerUserId === ownerUserId
                && client.clientName.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedName
                && client.email.trim().toLowerCase() === normalizedEmail
        ) ?? null;
    }

    async save(client: Client): Promise<Client> {
        const stored = client.id
            ? client
            : Client.reconstitute({
                id: `client-${this.clients.size + 1}`,
                workspaceId: client.workspaceId,
                ownerUserId: client.ownerUserId,
                businessId: client.businessId,
                isActive: client.isActive,
                clientName: client.clientName,
                companyName: client.companyName,
                billingAddress: client.billingAddress,
                email: client.email,
                phone: client.phone,
                taxId: client.taxId,
                notes: client.notes,
                createdAt: client.createdAt,
                createdBy: client.createdBy,
                updatedAt: client.updatedAt,
                updatedBy: client.updatedBy,
                deletedAt: client.deletedAt,
                deletedBy: client.deletedBy,
            });
        this.clients.set(stored.id, stored);
        return stored;
    }

    async update(client: Client): Promise<Client> {
        this.clients.set(client.id, client);
        return client;
    }

    async delete(id: string, ownerUserId: string): Promise<void> {
        const client = this.clients.get(id);
        if (client && client.ownerUserId === ownerUserId) {
            this.clients.delete(id);
        }
    }
}

class StubInvoiceRepository implements Partial<InvoiceRepository> {
    constructor(
        private readonly referencedClientIds = new Set<string>()
    ) { }

    async existsByClientId(clientId: string): Promise<boolean> {
        return this.referencedClientIds.has(clientId);
    }

    async existsByBusinessId(): Promise<boolean> {
        return false;
    }
}

function createClient(overrides: Partial<Parameters<typeof Client.reconstitute>[0]> = {}) {
    const base = {
        id: 'client-1',
        workspaceId: 'workspace-1',
        ownerUserId: 'workspace-1',
        businessId: 'business-1',
        clientName: 'Jane Client',
        billingAddress: {
            street: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '100-0001',
            country: 'JP',
        },
        email: 'jane@example.com',
    };

    return Client.reconstitute({ ...base, ...overrides });
}

test('createClient persists a valid client in the correct workspace', async () => {
    const service = new ClientService(
        new InMemoryClientRepository(),
        new StubInvoiceRepository() as unknown as InvoiceRepository
    );

    const created = await service.createClient('user-1', 'workspace-1', {
        businessId: 'business-1',
        clientName: 'Jane Client',
        billingAddress: {
            street: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '100-0001',
            country: 'JP',
        },
        email: 'jane@example.com',
    });

    assert.equal(created.workspaceId, 'workspace-1');
    assert.equal(created.ownerUserId, 'user-1');
    assert.equal(created.clientName, 'Jane Client');
});

test('createClient rejects missing names and invalid email addresses', async () => {
    const service = new ClientService(
        new InMemoryClientRepository(),
        new StubInvoiceRepository() as unknown as InvoiceRepository
    );

    await assert.rejects(
        service.createClient('workspace-1', 'workspace-1', {
            businessId: 'business-1',
            clientName: '   ',
            billingAddress: {
                street: '1 Main St',
                city: 'Tokyo',
                state: 'Tokyo',
                postalCode: '100-0001',
                country: 'JP',
            },
            email: 'jane@example.com',
        }),
        /Client name is required/
    );

    await assert.rejects(
        service.createClient('workspace-1', 'workspace-1', {
            businessId: 'business-1',
            clientName: 'Jane Client',
            billingAddress: {
                street: '1 Main St',
                city: 'Tokyo',
                state: 'Tokyo',
                postalCode: '100-0001',
                country: 'JP',
            },
            email: 'not-an-email',
        }),
        /Invalid email address/
    );
});

test('createClient rejects normalized duplicates within the same workspace', async () => {
    const service = new ClientService(
        new InMemoryClientRepository([
            createClient(),
        ]),
        new StubInvoiceRepository() as unknown as InvoiceRepository
    );

    await assert.rejects(
        service.createClient('workspace-1', 'workspace-1', {
            businessId: 'business-2',
            clientName: '  Jane   Client ',
            billingAddress: {
                street: '2 Main St',
                city: 'Osaka',
                state: 'Osaka',
                postalCode: '530-0001',
                country: 'JP',
            },
            email: 'JANE@example.com',
        }),
        /same normalized name and email already exists in this workspace/
    );
});

test('createClient allows the same normalized client identity in another workspace', async () => {
    const service = new ClientService(
        new InMemoryClientRepository([
            createClient(),
        ]),
        new StubInvoiceRepository() as unknown as InvoiceRepository
    );

    const created = await service.createClient('workspace-2', 'workspace-2', {
        businessId: 'business-2',
        clientName: 'Jane Client',
        billingAddress: {
            street: '2 Main St',
            city: 'Osaka',
            state: 'Osaka',
            postalCode: '530-0001',
            country: 'JP',
        },
        email: 'jane@example.com',
    });

    assert.equal(created.ownerUserId, 'workspace-2');
    assert.equal(created.workspaceId, 'workspace-2');
});

test('getClient and getClientsByBusiness return only records from the requested workspace', async () => {
    const service = new ClientService(
        new InMemoryClientRepository([
            createClient(),
            createClient({
                id: 'client-2',
                workspaceId: 'workspace-2',
                ownerUserId: 'workspace-2',
                businessId: 'business-2',
                email: 'other@example.com',
            }),
        ]),
        new StubInvoiceRepository() as unknown as InvoiceRepository
    );

    assert.equal(await service.getClient('workspace-2', 'client-1'), null);
    assert.equal((await service.getClient('workspace-1', 'client-1'))?.clientName, 'Jane Client');
    assert.equal((await service.getClientsByBusiness('workspace-1', 'business-1')).length, 1);
    assert.equal((await service.getClientsByBusiness('workspace-2', 'business-2')).length, 1);
});

test('deleteClient blocks deletion when invoices already reference the client', async () => {
    const service = new ClientService(
        new InMemoryClientRepository([createClient()]),
        new StubInvoiceRepository(new Set(['client-1'])) as unknown as InvoiceRepository
    );

    await assert.rejects(
        service.deleteClient('workspace-1', 'client-1', 'user-1'),
        /Clients referenced by invoices cannot be deleted/
    );
});
