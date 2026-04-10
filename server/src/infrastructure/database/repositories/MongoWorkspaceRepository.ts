import { Workspace } from '../../../domain/workspaces/entities/Workspace';
import { WorkspaceRepository } from '../../../domain/workspaces/repositories/WorkspaceRepository';
import { WorkspaceModel } from '../schemas/WorkspaceSchema';

export class MongoWorkspaceRepository implements WorkspaceRepository {
    async findById(id: string): Promise<Workspace | null> {
        const doc = await WorkspaceModel.findById(id).lean();
        if (!doc) {
            return null;
        }

        return Workspace.reconstitute({
            id: doc._id.toString(),
            ownerUserId: doc.ownerUserId,
            memberUserIds: doc.memberUserIds,
            defaultCurrency: doc.defaultCurrency,
            invoiceNumbering: doc.invoiceNumbering,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async findByOwnerUserId(ownerUserId: string): Promise<Workspace | null> {
        const doc = await WorkspaceModel.findOne({ ownerUserId }).lean();
        if (!doc) {
            return null;
        }

        return Workspace.reconstitute({
            id: doc._id.toString(),
            ownerUserId: doc.ownerUserId,
            memberUserIds: doc.memberUserIds,
            defaultCurrency: doc.defaultCurrency,
            invoiceNumbering: doc.invoiceNumbering,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async save(workspace: Workspace): Promise<Workspace> {
        const doc = await WorkspaceModel.create({
            ownerUserId: workspace.ownerUserId,
            memberUserIds: workspace.memberUserIds,
            defaultCurrency: workspace.defaultCurrency,
            invoiceNumbering: workspace.invoiceNumbering,
        });

        return Workspace.reconstitute({
            id: doc._id.toString(),
            ownerUserId: doc.ownerUserId,
            memberUserIds: doc.memberUserIds,
            defaultCurrency: doc.defaultCurrency,
            invoiceNumbering: doc.invoiceNumbering,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
