import { Client } from '../entities/Client';

export interface ClientRepository {
    findById(id: string, workspaceId: string): Promise<Client | null>;
    findByBusinessId(businessId: string, workspaceId: string): Promise<Client[]>;
    findByNormalizedIdentity(workspaceId: string, normalizedName: string, normalizedEmail: string): Promise<Client | null>;
    save(client: Client): Promise<Client>;
    update(client: Client): Promise<Client>;
    delete(id: string, workspaceId: string, deletedBy?: string): Promise<void>;
}
