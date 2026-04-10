import mongoose, { Schema, Document } from 'mongoose';

export interface ClientDocument extends Document {
    workspaceId: string;
    ownerUserId: string;
    businessId: mongoose.Types.ObjectId;
    normalizedClientName: string;
    normalizedEmail: string;
    isActive: boolean;
    clientName: string;
    companyName?: string;
    billingAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    email: string;
    phone?: string;
    taxId?: string;
    notes?: string;
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

const ClientSchema = new Schema<ClientDocument>(
    {
        ownerUserId: { type: String, required: true, index: true },
        workspaceId: { type: String, required: true, index: true },
        businessId: { type: Schema.Types.ObjectId, required: true, index: true },
        normalizedClientName: { type: String, required: true },
        normalizedEmail: { type: String, required: true },
        isActive: { type: Boolean, required: true, default: true },
        clientName: { type: String, required: true },
        companyName: { type: String },
        billingAddress: { type: AddressSubSchema, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        taxId: { type: String },
        notes: { type: String },
        createdBy: { type: String, default: null },
        updatedBy: { type: String, default: null },
        deletedAt: { type: Date, default: null, index: true },
        deletedBy: { type: String, default: null },
    },
    { timestamps: true }
);

ClientSchema.index(
    { workspaceId: 1, normalizedClientName: 1, normalizedEmail: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

export const ClientModel = mongoose.model<ClientDocument>('Client', ClientSchema);
