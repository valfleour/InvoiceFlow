import mongoose, { Document, Schema } from 'mongoose';

export interface InvoiceCreationRequestDocument extends Document {
    workspaceId: string;
    idempotencyKey: string;
    requestHash: string;
    status: 'InProgress' | 'Completed';
    invoiceId?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

const InvoiceCreationRequestSchema = new Schema<InvoiceCreationRequestDocument>(
    {
        workspaceId: { type: String, required: true, index: true },
        idempotencyKey: { type: String, required: true },
        requestHash: { type: String, required: true },
        status: { type: String, required: true, enum: ['InProgress', 'Completed'], default: 'InProgress' },
        invoiceId: { type: Schema.Types.ObjectId, default: null },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

InvoiceCreationRequestSchema.index({ workspaceId: 1, idempotencyKey: 1 }, { unique: true });
InvoiceCreationRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InvoiceCreationRequestModel = mongoose.model<InvoiceCreationRequestDocument>(
    'InvoiceCreationRequest',
    InvoiceCreationRequestSchema
);
