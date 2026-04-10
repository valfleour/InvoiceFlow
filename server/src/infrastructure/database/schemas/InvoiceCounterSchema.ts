import mongoose, { Schema, Document } from 'mongoose';

export interface InvoiceCounterDocument extends Document {
    workspaceId: string;
    nextSequence: number;
    nextDraftSequence: number;
}

const InvoiceCounterSchema = new Schema<InvoiceCounterDocument>(
    {
        workspaceId: { type: String, required: true, unique: true, index: true },
        nextSequence: { type: Number, required: true, default: 0, min: 0 },
        nextDraftSequence: { type: Number, required: true, default: 0, min: 0 },
    },
    { timestamps: false }
);

export const InvoiceCounterModel = mongoose.model<InvoiceCounterDocument>('InvoiceCounter', InvoiceCounterSchema);
