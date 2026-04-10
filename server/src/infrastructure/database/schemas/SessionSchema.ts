import mongoose, { Document, Schema } from 'mongoose';

export interface SessionDocument extends Document {
    userId: string;
    workspaceId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema = new Schema<SessionDocument>(
    {
        userId: { type: String, required: true, index: true },
        workspaceId: { type: String, required: true, index: true },
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        revokedAt: { type: Date, default: null, index: true },
    },
    { timestamps: true }
);

SessionSchema.index({ tokenHash: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = mongoose.model<SessionDocument>('Session', SessionSchema);
