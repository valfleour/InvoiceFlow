import mongoose, { Document, Schema } from 'mongoose';

export interface UserDocument extends Document {
    name: string;
    email: string;
    normalizedEmail: string;
    passwordHash: string;
    workspaceId?: string | null;
    isDisabled: boolean;
    emailVerifiedAt?: Date | null;
    emailVerificationTokenHash?: string | null;
    emailVerificationExpiresAt?: Date | null;
    emailVerificationLastSentAt?: Date | null;
    emailVerificationWindowStartedAt?: Date | null;
    emailVerificationRequestsInWindow: number;
    resetPasswordTokenHash?: string | null;
    resetPasswordExpiresAt?: Date | null;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        normalizedEmail: { type: String, required: true },
        passwordHash: { type: String, required: true },
        workspaceId: { type: String, default: null, index: true },
        isDisabled: { type: Boolean, required: true, default: false },
        emailVerifiedAt: { type: Date, default: null, index: true },
        emailVerificationTokenHash: { type: String, default: null, index: true },
        emailVerificationExpiresAt: { type: Date, default: null },
        emailVerificationLastSentAt: { type: Date, default: null },
        emailVerificationWindowStartedAt: { type: Date, default: null },
        emailVerificationRequestsInWindow: { type: Number, required: true, default: 0 },
        resetPasswordTokenHash: { type: String, default: null, index: true },
        resetPasswordExpiresAt: { type: Date, default: null },
        deletedAt: { type: Date, default: null, index: true },
    },
    { timestamps: true }
);

UserSchema.index({ normalizedEmail: 1 }, { unique: true });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
