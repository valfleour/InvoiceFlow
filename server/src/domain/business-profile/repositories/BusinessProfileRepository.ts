import { BusinessProfile } from '../entities/BusinessProfile';

export interface BusinessProfileRepository {
    findById(id: string, workspaceId: string): Promise<BusinessProfile | null>;
    findAll(workspaceId: string): Promise<BusinessProfile[]>;
    save(profile: BusinessProfile): Promise<BusinessProfile>;
    update(profile: BusinessProfile): Promise<BusinessProfile>;
    delete(id: string, workspaceId: string, deletedBy?: string): Promise<void>;
}
