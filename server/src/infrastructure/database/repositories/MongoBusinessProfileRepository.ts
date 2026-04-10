import { BusinessProfile } from '../../../domain/business-profile/entities/BusinessProfile';
import { BusinessProfileRepository } from '../../../domain/business-profile/repositories/BusinessProfileRepository';
import { BusinessProfileModel } from '../schemas/BusinessProfileSchema';

export class MongoBusinessProfileRepository implements BusinessProfileRepository {
    async findById(id: string, workspaceId: string): Promise<BusinessProfile | null> {
        const doc = await BusinessProfileModel.findOne({ _id: id, workspaceId, deletedAt: null }).lean();
        if (!doc) return null;
        return BusinessProfile.reconstitute({
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            ownerUserId: doc.ownerUserId,
            isActive: doc.isActive,
            businessName: doc.businessName,
            logoUrl: doc.logoUrl,
            address: doc.address,
            email: doc.email,
            phone: doc.phone,
            website: doc.website,
            taxId: doc.taxId,
            defaultCurrency: doc.defaultCurrency,
            paymentInstructions: doc.paymentInstructions,
            createdAt: doc.createdAt,
            createdBy: doc.createdBy,
            updatedAt: doc.updatedAt,
            updatedBy: doc.updatedBy,
            deletedAt: doc.deletedAt,
            deletedBy: doc.deletedBy,
        });
    }

    async findAll(workspaceId: string): Promise<BusinessProfile[]> {
        const docs = await BusinessProfileModel.find({ workspaceId, deletedAt: null }).lean();
        return docs.map((doc) =>
            BusinessProfile.reconstitute({
                id: doc._id.toString(),
                workspaceId: doc.workspaceId,
                ownerUserId: doc.ownerUserId,
                isActive: doc.isActive,
                businessName: doc.businessName,
                logoUrl: doc.logoUrl,
                address: doc.address,
                email: doc.email,
                phone: doc.phone,
                website: doc.website,
                taxId: doc.taxId,
                defaultCurrency: doc.defaultCurrency,
                paymentInstructions: doc.paymentInstructions,
                createdAt: doc.createdAt,
                createdBy: doc.createdBy,
                updatedAt: doc.updatedAt,
                updatedBy: doc.updatedBy,
                deletedAt: doc.deletedAt,
                deletedBy: doc.deletedBy,
            })
        );
    }

    async save(profile: BusinessProfile): Promise<BusinessProfile> {
        if (profile.isActive) {
            await BusinessProfileModel.updateMany({ workspaceId: profile.workspaceId, deletedAt: null }, { isActive: false });
        }

        const doc = await BusinessProfileModel.create({
            ownerUserId: profile.ownerUserId,
            workspaceId: profile.workspaceId,
            isActive: profile.isActive,
            businessName: profile.businessName,
            logoUrl: profile.logoUrl,
            address: profile.address,
            email: profile.email,
            phone: profile.phone,
            website: profile.website,
            taxId: profile.taxId,
            defaultCurrency: profile.defaultCurrency,
            paymentInstructions: profile.paymentInstructions,
            createdBy: profile.createdBy,
            updatedBy: profile.updatedBy,
        });
        return BusinessProfile.reconstitute({
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            ownerUserId: doc.ownerUserId,
            isActive: doc.isActive,
            businessName: doc.businessName,
            logoUrl: doc.logoUrl,
            address: doc.address,
            email: doc.email,
            phone: doc.phone,
            website: doc.website,
            taxId: doc.taxId,
            defaultCurrency: doc.defaultCurrency,
            paymentInstructions: doc.paymentInstructions,
            createdAt: doc.createdAt,
            createdBy: doc.createdBy,
            updatedAt: doc.updatedAt,
            updatedBy: doc.updatedBy,
            deletedAt: doc.deletedAt,
            deletedBy: doc.deletedBy,
        });
    }

    async update(profile: BusinessProfile): Promise<BusinessProfile> {
        if (profile.isActive) {
            await BusinessProfileModel.updateMany(
                { _id: { $ne: profile.id }, workspaceId: profile.workspaceId, deletedAt: null },
                { isActive: false }
            );
        }

        await BusinessProfileModel.findOneAndUpdate({ _id: profile.id, workspaceId: profile.workspaceId, deletedAt: null }, {
            isActive: profile.isActive,
            businessName: profile.businessName,
            logoUrl: profile.logoUrl,
            address: profile.address,
            email: profile.email,
            phone: profile.phone,
            website: profile.website,
            taxId: profile.taxId,
            defaultCurrency: profile.defaultCurrency,
            paymentInstructions: profile.paymentInstructions,
            updatedBy: profile.updatedBy,
            updatedAt: profile.updatedAt,
        });
        return profile;
    }

    async delete(id: string, workspaceId: string, deletedBy?: string): Promise<void> {
        await BusinessProfileModel.findOneAndUpdate(
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
