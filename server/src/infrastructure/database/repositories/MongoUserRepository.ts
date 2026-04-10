import { User } from '../../../domain/users/entities/User';
import { UserRepository } from '../../../domain/users/repositories/UserRepository';
import { UserModel } from '../schemas/UserSchema';

export class MongoUserRepository implements UserRepository {
    async findById(id: string): Promise<User | null> {
        const doc = await UserModel.findById(id).lean();

        if (!doc) {
            return null;
        }

        return User.reconstitute({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            workspaceId: doc.workspaceId ?? null,
            isDisabled: doc.isDisabled,
            emailVerifiedAt: doc.emailVerifiedAt ?? null,
            emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
            emailVerificationExpiresAt: doc.emailVerificationExpiresAt ?? null,
            emailVerificationLastSentAt: doc.emailVerificationLastSentAt ?? null,
            emailVerificationWindowStartedAt: doc.emailVerificationWindowStartedAt ?? null,
            emailVerificationRequestsInWindow: doc.emailVerificationRequestsInWindow ?? 0,
            resetPasswordTokenHash: doc.resetPasswordTokenHash ?? null,
            resetPasswordExpiresAt: doc.resetPasswordExpiresAt ?? null,
            deletedAt: doc.deletedAt ?? null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        const doc = await UserModel.findOne({ normalizedEmail: email.trim().toLowerCase() }).lean();

        if (!doc) {
            return null;
        }

        return User.reconstitute({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            workspaceId: doc.workspaceId ?? null,
            isDisabled: doc.isDisabled,
            emailVerifiedAt: doc.emailVerifiedAt ?? null,
            emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
            emailVerificationExpiresAt: doc.emailVerificationExpiresAt ?? null,
            emailVerificationLastSentAt: doc.emailVerificationLastSentAt ?? null,
            emailVerificationWindowStartedAt: doc.emailVerificationWindowStartedAt ?? null,
            emailVerificationRequestsInWindow: doc.emailVerificationRequestsInWindow ?? 0,
            resetPasswordTokenHash: doc.resetPasswordTokenHash ?? null,
            resetPasswordExpiresAt: doc.resetPasswordExpiresAt ?? null,
            deletedAt: doc.deletedAt ?? null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null> {
        const doc = await UserModel.findOne({ emailVerificationTokenHash: tokenHash.trim() }).lean();

        if (!doc) {
            return null;
        }

        return User.reconstitute({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            workspaceId: doc.workspaceId ?? null,
            isDisabled: doc.isDisabled,
            emailVerifiedAt: doc.emailVerifiedAt ?? null,
            emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
            emailVerificationExpiresAt: doc.emailVerificationExpiresAt ?? null,
            emailVerificationLastSentAt: doc.emailVerificationLastSentAt ?? null,
            emailVerificationWindowStartedAt: doc.emailVerificationWindowStartedAt ?? null,
            emailVerificationRequestsInWindow: doc.emailVerificationRequestsInWindow ?? 0,
            resetPasswordTokenHash: doc.resetPasswordTokenHash ?? null,
            resetPasswordExpiresAt: doc.resetPasswordExpiresAt ?? null,
            deletedAt: doc.deletedAt ?? null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async findByResetPasswordTokenHash(tokenHash: string): Promise<User | null> {
        const doc = await UserModel.findOne({ resetPasswordTokenHash: tokenHash.trim() }).lean();

        if (!doc) {
            return null;
        }

        return User.reconstitute({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            workspaceId: doc.workspaceId ?? null,
            isDisabled: doc.isDisabled,
            emailVerifiedAt: doc.emailVerifiedAt ?? null,
            emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
            emailVerificationExpiresAt: doc.emailVerificationExpiresAt ?? null,
            emailVerificationLastSentAt: doc.emailVerificationLastSentAt ?? null,
            emailVerificationWindowStartedAt: doc.emailVerificationWindowStartedAt ?? null,
            emailVerificationRequestsInWindow: doc.emailVerificationRequestsInWindow ?? 0,
            resetPasswordTokenHash: doc.resetPasswordTokenHash ?? null,
            resetPasswordExpiresAt: doc.resetPasswordExpiresAt ?? null,
            deletedAt: doc.deletedAt ?? null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async existsByEmail(email: string): Promise<boolean> {
        const count = await UserModel.countDocuments({ normalizedEmail: email.trim().toLowerCase() });
        return count > 0;
    }

    async save(user: User): Promise<User> {
        const doc = await UserModel.create({
            name: user.name,
            email: user.email,
            normalizedEmail: user.email,
            passwordHash: user.passwordHash,
            workspaceId: user.workspaceId,
            isDisabled: user.isDisabled,
            emailVerifiedAt: user.emailVerifiedAt,
            emailVerificationTokenHash: user.emailVerificationTokenHash,
            emailVerificationExpiresAt: user.emailVerificationExpiresAt,
            emailVerificationLastSentAt: user.emailVerificationLastSentAt,
            emailVerificationWindowStartedAt: user.emailVerificationWindowStartedAt,
            emailVerificationRequestsInWindow: user.emailVerificationRequestsInWindow,
            deletedAt: user.deletedAt,
        });

        return User.reconstitute({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            workspaceId: doc.workspaceId ?? null,
            isDisabled: doc.isDisabled,
            emailVerifiedAt: doc.emailVerifiedAt ?? null,
            emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
            emailVerificationExpiresAt: doc.emailVerificationExpiresAt ?? null,
            emailVerificationLastSentAt: doc.emailVerificationLastSentAt ?? null,
            emailVerificationWindowStartedAt: doc.emailVerificationWindowStartedAt ?? null,
            emailVerificationRequestsInWindow: doc.emailVerificationRequestsInWindow ?? 0,
            resetPasswordTokenHash: doc.resetPasswordTokenHash ?? null,
            resetPasswordExpiresAt: doc.resetPasswordExpiresAt ?? null,
            deletedAt: doc.deletedAt ?? null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async update(user: User): Promise<User> {
        const doc = await UserModel.findByIdAndUpdate(
            user.id,
            {
                name: user.name,
                normalizedEmail: user.email,
                passwordHash: user.passwordHash,
                workspaceId: user.workspaceId,
                isDisabled: user.isDisabled,
                emailVerifiedAt: user.emailVerifiedAt,
                emailVerificationTokenHash: user.emailVerificationTokenHash,
                emailVerificationExpiresAt: user.emailVerificationExpiresAt,
                emailVerificationLastSentAt: user.emailVerificationLastSentAt,
                emailVerificationWindowStartedAt: user.emailVerificationWindowStartedAt,
                emailVerificationRequestsInWindow: user.emailVerificationRequestsInWindow,
                resetPasswordTokenHash: user.resetPasswordTokenHash,
                resetPasswordExpiresAt: user.resetPasswordExpiresAt,
                deletedAt: user.deletedAt,
            },
            {
                new: true,
                runValidators: true,
            }
        ).lean();

        if (!doc) {
            throw new Error('User not found');
        }

        return User.reconstitute({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            workspaceId: doc.workspaceId ?? null,
            isDisabled: doc.isDisabled,
            emailVerifiedAt: doc.emailVerifiedAt ?? null,
            emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
            emailVerificationExpiresAt: doc.emailVerificationExpiresAt ?? null,
            emailVerificationLastSentAt: doc.emailVerificationLastSentAt ?? null,
            emailVerificationWindowStartedAt: doc.emailVerificationWindowStartedAt ?? null,
            emailVerificationRequestsInWindow: doc.emailVerificationRequestsInWindow ?? 0,
            resetPasswordTokenHash: doc.resetPasswordTokenHash ?? null,
            resetPasswordExpiresAt: doc.resetPasswordExpiresAt ?? null,
            deletedAt: doc.deletedAt ?? null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
