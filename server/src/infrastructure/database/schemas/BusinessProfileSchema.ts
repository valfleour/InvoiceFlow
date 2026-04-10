import mongoose, { Schema, Document } from 'mongoose';

export interface BusinessProfileDocument extends Document {
    workspaceId: string;
    ownerUserId: string;
    isActive: boolean;
    businessName: string;
    logoUrl?: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    email: string;
    phone: string;
    website?: string;
    taxId?: string;
    defaultCurrency: string;
    paymentInstructions?: string;
    createdBy?: string | null;
    createdAt: Date;
    updatedBy?: string | null;
    updatedAt: Date;
    deletedAt?: Date | null;
    deletedBy?: string | null;
}

const AddressSubSchema = new Schema(
    {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    { _id: false }
);

const BusinessProfileSchema = new Schema<BusinessProfileDocument>(
    {
        ownerUserId: { type: String, required: true, index: true },
        workspaceId: { type: String, required: true, index: true },
        isActive: { type: Boolean, required: true, default: false },
        businessName: { type: String, required: true },
        logoUrl: { type: String },
        address: { type: AddressSubSchema, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        website: { type: String },
        taxId: { type: String },
        defaultCurrency: { type: String, required: true, default: 'USD' },
        paymentInstructions: { type: String },
        createdBy: { type: String, default: null },
        updatedBy: { type: String, default: null },
        deletedAt: { type: Date, default: null, index: true },
        deletedBy: { type: String, default: null },
    },
    { timestamps: true }
);

BusinessProfileSchema.index(
    { workspaceId: 1, isActive: 1 },
    { partialFilterExpression: { deletedAt: null, isActive: true } }
);

export const BusinessProfileModel = mongoose.model<BusinessProfileDocument>(
    'BusinessProfile',
    BusinessProfileSchema
);
