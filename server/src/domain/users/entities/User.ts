import { EmailAddress } from '../../shared/value-objects/EmailAddress';
import { PasswordHash } from '../value-objects/PasswordHash';

export interface UserProps {
    id?: string;
    name: string;
    email: string;
    passwordHash: string;
    workspaceId?: string | null;
    isDisabled?: boolean;
    emailVerifiedAt?: Date | null;
    emailVerificationTokenHash?: string | null;
    emailVerificationExpiresAt?: Date | null;
    emailVerificationLastSentAt?: Date | null;
    emailVerificationWindowStartedAt?: Date | null;
    emailVerificationRequestsInWindow?: number;
    resetPasswordTokenHash?: string | null;
    resetPasswordExpiresAt?: Date | null;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export class User {
    public readonly id: string;
    public name: string;
    public email: string;
    public passwordHash: string;
    public workspaceId: string | null;
    public isDisabled: boolean;
    public emailVerifiedAt: Date | null;
    public emailVerificationTokenHash: string | null;
    public emailVerificationExpiresAt: Date | null;
    public emailVerificationLastSentAt: Date | null;
    public emailVerificationWindowStartedAt: Date | null;
    public emailVerificationRequestsInWindow: number;
    public resetPasswordTokenHash: string | null;
    public resetPasswordExpiresAt: Date | null;
    public deletedAt: Date | null;
    public createdAt: Date;
    public updatedAt: Date;

    private constructor(props: UserProps) {
        this.id = props.id ?? '';
        this.name = normalizeUserName(props.name);
        this.email = EmailAddress.create(props.email).value;
        this.passwordHash = PasswordHash.create(props.passwordHash).value;
        this.workspaceId = props.workspaceId ?? null;
        this.isDisabled = props.isDisabled ?? false;
        this.emailVerifiedAt = props.emailVerifiedAt ?? null;
        this.emailVerificationTokenHash = props.emailVerificationTokenHash ?? null;
        this.emailVerificationExpiresAt = props.emailVerificationExpiresAt ?? null;
        this.emailVerificationLastSentAt = props.emailVerificationLastSentAt ?? null;
        this.emailVerificationWindowStartedAt = props.emailVerificationWindowStartedAt ?? null;
        this.emailVerificationRequestsInWindow = props.emailVerificationRequestsInWindow ?? 0;
        this.resetPasswordTokenHash = props.resetPasswordTokenHash ?? null;
        this.resetPasswordExpiresAt = props.resetPasswordExpiresAt ?? null;
        this.deletedAt = props.deletedAt ?? null;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? this.createdAt;
    }

    static create(props: UserProps): User {
        return new User(props);
    }

    static reconstitute(props: UserProps): User {
        return new User(props);
    }

    updateName(name: string) {
        this.name = normalizeUserName(name);
        this.updatedAt = new Date();
    }

    updatePasswordHash(passwordHash: string) {
        this.passwordHash = PasswordHash.create(passwordHash).value;
        this.updatedAt = new Date();
    }

    assignWorkspace(workspaceId: string) {
        const normalizedWorkspaceId = workspaceId.trim();

        if (!normalizedWorkspaceId) {
            throw new Error('Workspace ID is required');
        }

        this.workspaceId = normalizedWorkspaceId;
        this.updatedAt = new Date();
    }

    disable() {
        this.isDisabled = true;
        this.updatedAt = new Date();
    }

    isEmailVerified() {
        return this.emailVerifiedAt !== null;
    }

    setEmailVerificationToken(tokenHash: string, expiresAt: Date) {
        const normalizedTokenHash = tokenHash.trim();

        if (!normalizedTokenHash) {
            throw new Error('Email verification token hash is required');
        }

        this.emailVerificationTokenHash = normalizedTokenHash;
        this.emailVerificationExpiresAt = expiresAt;
        this.updatedAt = new Date();
    }

    recordEmailVerificationDispatch(sentAt: Date, windowStartedAt: Date, requestsInWindow: number) {
        if (requestsInWindow < 1) {
            throw new Error('Email verification request count must be at least 1');
        }

        this.emailVerificationLastSentAt = sentAt;
        this.emailVerificationWindowStartedAt = windowStartedAt;
        this.emailVerificationRequestsInWindow = requestsInWindow;
        this.updatedAt = sentAt;
    }

    markEmailVerified(verifiedAt = new Date()) {
        this.emailVerifiedAt = verifiedAt;
        this.emailVerificationTokenHash = null;
        this.emailVerificationExpiresAt = null;
        this.emailVerificationLastSentAt = null;
        this.emailVerificationWindowStartedAt = null;
        this.emailVerificationRequestsInWindow = 0;
        this.updatedAt = verifiedAt;
    }

    markDeleted() {
        this.deletedAt = new Date();
        this.updatedAt = this.deletedAt;
    }

    setPasswordResetToken(tokenHash: string, expiresAt: Date) {
        const normalizedTokenHash = tokenHash.trim();

        if (!normalizedTokenHash) {
            throw new Error('Password reset token hash is required');
        }

        this.resetPasswordTokenHash = normalizedTokenHash;
        this.resetPasswordExpiresAt = expiresAt;
        this.updatedAt = new Date();
    }

    clearPasswordResetToken() {
        this.resetPasswordTokenHash = null;
        this.resetPasswordExpiresAt = null;
        this.updatedAt = new Date();
    }
}

function normalizeUserName(name: string): string {
    const normalizedName = name.trim();

    if (!normalizedName) {
        throw new Error('User name is required');
    }
    if (normalizedName.length < 2) {
        throw new Error('User name must be at least 2 characters long');
    }
    if (normalizedName.length > 100) {
        throw new Error('User name must be at most 100 characters long');
    }
    if (/[\r\n\t]/.test(normalizedName)) {
        throw new Error('User name contains invalid whitespace characters');
    }

    return normalizedName;
}
