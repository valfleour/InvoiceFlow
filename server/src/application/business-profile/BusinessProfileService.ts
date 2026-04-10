import { InvoiceRepository } from '../../domain/invoices/repositories/InvoiceRepository';
import { BusinessProfile, BusinessProfileProps } from '../../domain/business-profile/entities/BusinessProfile';
import { BusinessProfileRepository } from '../../domain/business-profile/repositories/BusinessProfileRepository';

export class BusinessProfileService {
    constructor(
        private readonly repo: BusinessProfileRepository,
        private readonly invoiceRepo: InvoiceRepository
    ) { }

    async createProfile(ownerUserId: string, workspaceId: string, props: Omit<BusinessProfileProps, 'ownerUserId' | 'workspaceId'>): Promise<BusinessProfile> {
        const profile = BusinessProfile.create({ ...props, ownerUserId, workspaceId });
        return this.repo.save(profile);
    }

    async getProfile(workspaceId: string, id: string): Promise<BusinessProfile | null> {
        return this.repo.findById(id, workspaceId);
    }

    async getAllProfiles(workspaceId: string): Promise<BusinessProfile[]> {
        return this.repo.findAll(workspaceId);
    }

    async updateProfile(
        workspaceId: string,
        id: string,
        changes: Partial<Omit<BusinessProfileProps, 'id' | 'workspaceId' | 'ownerUserId' | 'createdAt' | 'createdBy' | 'deletedAt' | 'deletedBy'>>
    ): Promise<BusinessProfile> {
        const profile = await this.repo.findById(id, workspaceId);
        if (!profile) throw new Error(`Business profile ${id} not found`);
        profile.update(changes);
        return this.repo.update(profile);
    }

    async deleteProfile(workspaceId: string, id: string, deletedBy?: string): Promise<void> {
        if (await this.invoiceRepo.existsByBusinessId(id, workspaceId)) {
            throw new Error('Business profiles referenced by invoices cannot be deleted');
        }

        return this.repo.delete(id, workspaceId, deletedBy);
    }
}
