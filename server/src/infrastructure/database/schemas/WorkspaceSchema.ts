import mongoose, { Document, Schema } from 'mongoose';

export interface WorkspaceDocument extends Document {
    ownerUserId: string;
    memberUserIds: string[];
    defaultCurrency: string;
    invoiceNumbering: {
        submittedPrefix: string;
        draftPrefix: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceSchema = new Schema<WorkspaceDocument>(
    {
        ownerUserId: { type: String, required: true, unique: true, index: true },
        memberUserIds: {
            type: [String],
            required: true,
            default: [],
            validate: {
                validator(this: any, memberUserIds: string[]) {
                    return memberUserIds.includes(this.ownerUserId);
                },
                message: 'Workspace owner must be included in memberUserIds',
            },
        },
        defaultCurrency: { type: String, required: true, default: 'USD' },
        invoiceNumbering: {
            submittedPrefix: { type: String, required: true, default: 'INV' },
            draftPrefix: { type: String, required: true, default: 'DRAFT' },
        },
    },
    { timestamps: true }
);

WorkspaceSchema.index({ memberUserIds: 1 });

export const WorkspaceModel = mongoose.model<WorkspaceDocument>('Workspace', WorkspaceSchema);
