import { Workspace } from '../entities/Workspace';

export interface WorkspaceRepository {
    findById(id: string): Promise<Workspace | null>;
    findByOwnerUserId(ownerUserId: string): Promise<Workspace | null>;
    save(workspace: Workspace): Promise<Workspace>;
}
