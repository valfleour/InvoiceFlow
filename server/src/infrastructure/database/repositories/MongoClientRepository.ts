import { Client, normalizeClientEmail, normalizeClientName } from '../../../domain/clients/entities/Client';
import { ClientRepository } from '../../../domain/clients/repositories/ClientRepository';
import { ClientModel } from '../schemas/ClientSchema';

export class MongoClientRepository implements ClientRepository {
    async findById(id: string, workspaceId: string): Promise<Client | null> {
        const doc = await ClientModel.findOne({ _id: id, workspaceId, deletedAt: null }).lean();
        if (!doc) return null;
        return Client.reconstitute({
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            ownerUserId: doc.ownerUserId,
            businessId: doc.businessId.toString(),
            isActive: doc.isActive,
            clientName: doc.clientName,
            companyName: doc.companyName,
            billingAddress: doc.billingAddress,
            email: doc.email,
            phone: doc.phone,
            taxId: doc.taxId,
            notes: doc.notes,
            createdAt: doc.createdAt,
            createdBy: doc.createdBy,
            updatedAt: doc.updatedAt,
            updatedBy: doc.updatedBy,
            deletedAt: doc.deletedAt,
            deletedBy: doc.deletedBy,
        });
    }

    async findByBusinessId(businessId: string, workspaceId: string): Promise<Client[]> {
        const docs = await ClientModel.find({ businessId, workspaceId, deletedAt: null }).lean();
        return docs.map((doc) =>
            Client.reconstitute({
                id: doc._id.toString(),
                workspaceId: doc.workspaceId,
                ownerUserId: doc.ownerUserId,
                businessId: doc.businessId.toString(),
                isActive: doc.isActive,
                clientName: doc.clientName,
                companyName: doc.companyName,
                billingAddress: doc.billingAddress,
                email: doc.email,
                phone: doc.phone,
                taxId: doc.taxId,
                notes: doc.notes,
                createdAt: doc.createdAt,
                createdBy: doc.createdBy,
                updatedAt: doc.updatedAt,
                updatedBy: doc.updatedBy,
                deletedAt: doc.deletedAt,
                deletedBy: doc.deletedBy,
            })
        );
    }

    async findByNormalizedIdentity(workspaceId: string, normalizedName: string, normalizedEmail: string): Promise<Client | null> {
        const doc = await ClientModel.findOne({
            workspaceId,
            normalizedClientName: normalizedName,
            normalizedEmail,
            deletedAt: null,
        }).lean();
        if (!doc) return null;
        return Client.reconstitute({
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            ownerUserId: doc.ownerUserId,
            businessId: doc.businessId.toString(),
            isActive: doc.isActive,
            clientName: doc.clientName,
            companyName: doc.companyName,
            billingAddress: doc.billingAddress,
            email: doc.email,
            phone: doc.phone,
            taxId: doc.taxId,
            notes: doc.notes,
            createdAt: doc.createdAt,
            createdBy: doc.createdBy,
            updatedAt: doc.updatedAt,
            updatedBy: doc.updatedBy,
            deletedAt: doc.deletedAt,
            deletedBy: doc.deletedBy,
        });
    }

    async save(client: Client): Promise<Client> {
        const doc = await ClientModel.create({
            ownerUserId: client.ownerUserId,
            workspaceId: client.workspaceId,
            businessId: client.businessId,
            normalizedClientName: normalizeClientName(client.clientName).toLowerCase(),
            normalizedEmail: normalizeClientEmail(client.email),
            isActive: client.isActive,
            clientName: client.clientName,
            companyName: client.companyName,
            billingAddress: client.billingAddress,
            email: client.email,
            phone: client.phone,
            taxId: client.taxId,
            notes: client.notes,
            createdBy: client.createdBy,
            updatedBy: client.updatedBy,
        });
        return Client.reconstitute({
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            ownerUserId: doc.ownerUserId,
            businessId: doc.businessId.toString(),
            isActive: doc.isActive,
            clientName: doc.clientName,
            companyName: doc.companyName,
            billingAddress: doc.billingAddress,
            email: doc.email,
            phone: doc.phone,
            taxId: doc.taxId,
            notes: doc.notes,
            createdAt: doc.createdAt,
            createdBy: doc.createdBy,
            updatedAt: doc.updatedAt,
            updatedBy: doc.updatedBy,
            deletedAt: doc.deletedAt,
            deletedBy: doc.deletedBy,
        });
    }

    async update(client: Client): Promise<Client> {
        await ClientModel.findOneAndUpdate({ _id: client.id, workspaceId: client.workspaceId, deletedAt: null }, {
            normalizedClientName: normalizeClientName(client.clientName).toLowerCase(),
            normalizedEmail: normalizeClientEmail(client.email),
            isActive: client.isActive,
            clientName: client.clientName,
            companyName: client.companyName,
            billingAddress: client.billingAddress,
            email: client.email,
            phone: client.phone,
            taxId: client.taxId,
            notes: client.notes,
            updatedBy: client.updatedBy,
            updatedAt: client.updatedAt,
        });
        return client;
    }

    async delete(id: string, workspaceId: string, deletedBy?: string): Promise<void> {
        await ClientModel.findOneAndUpdate(
            { _id: id, workspaceId, deletedAt: null },
            {
                deletedAt: new Date(),
                deletedBy: deletedBy ?? null,
                updatedAt: new Date(),
                updatedBy: deletedBy ?? null,
            }
        );
    }
}
