import mongoose, { Schema, Document } from 'mongoose';

export interface PaymentDocument extends Document {
    workspaceId: string;
    ownerUserId: string;
    invoiceId: mongoose.Types.ObjectId;
    businessId: mongoose.Types.ObjectId;
    currency: string;
    paymentDate: Date;
    amount: number;
    method: string;
    referenceNumber?: string;
    note?: string;
    createdBy?: string | null;
    createdAt: Date;
    updatedBy?: string | null;
    updatedAt: Date;
    deletedAt?: Date | null;
    deletedBy?: string | null;
}

const PaymentSchema = new Schema<PaymentDocument>(
    {
        ownerUserId: { type: String, required: true, index: true },
        workspaceId: { type: String, required: true, index: true },
        invoiceId: { type: Schema.Types.ObjectId, required: true, index: true },
        businessId: { type: Schema.Types.ObjectId, required: true, index: true },
        currency: { type: String, required: true },
        paymentDate: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
        method: { type: String, required: true },
        referenceNumber: { type: String },
        note: { type: String },
        createdBy: { type: String, default: null },
        updatedBy: { type: String, default: null },
        deletedAt: { type: Date, default: null, index: true },
        deletedBy: { type: String, default: null },
    },
    { timestamps: true }
);

PaymentSchema.index(
    { workspaceId: 1, invoiceId: 1, referenceNumber: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
            referenceNumber: { $exists: true, $type: 'string' },
        },
    }
);

export const PaymentModel = mongoose.model<PaymentDocument>('Payment', PaymentSchema);
