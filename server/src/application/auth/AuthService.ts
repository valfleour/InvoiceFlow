import { createHash, randomBytes } from 'crypto';
import { SessionRepository } from '../../domain/auth/repositories/SessionRepository';
import { User } from '../../domain/users/entities/User';
import { PasswordPolicy } from '../../domain/users/policies/PasswordPolicy';
import { UserRepository } from '../../domain/users/repositories/UserRepository';
import { Workspace } from '../../domain/workspaces/entities/Workspace';
import { WorkspaceRepository } from '../../domain/workspaces/repositories/WorkspaceRepository';
import { sendEmailVerificationEmail } from '../../infrastructure/email/emailVerificationMailer';
import { hashPassword, verifyPassword } from '../../infrastructure/security/passwords';
import { sendPasswordResetEmail } from '../../infrastructure/email/passwordResetMailer';
import { SignInThrottle } from './SignInThrottle';

export interface RegisterUserCommand {
    name: string;
    email: string;
    password: string;
}

export interface SignInCommand {
    email: string;
    password: string;
}

export interface SignInResult {
    user: User;
    sessionToken: string;
    sessionExpiresAt: Date;
}

export interface UpdateProfileCommand {
    name: string;
}

export interface ForgotPasswordCommand {
    email: string;
}

export interface RequestEmailVerificationCommand {
    email: string;
}

export interface VerifyEmailCommand {
    token: string;
}

export interface ResetPasswordCommand {
    token: string;
    password: string;
}

type EmailVerificationSender = (payload: {
    to: string;
    name: string;
    verificationUrl: string;
}) => Promise<void>;

const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60;
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 1000 * 60;
const EMAIL_VERIFICATION_RESEND_WINDOW_MS = 1000 * 60 * 60;
const EMAIL_VERIFICATION_RESEND_MAX_PER_WINDOW = 5;

function hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

function hashEmailVerificationToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

export class AuthService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly workspaceRepo: WorkspaceRepository,
        private readonly sessionRepo: SessionRepository,
        private readonly emailVerificationSender: EmailVerificationSender = sendEmailVerificationEmail,
        private readonly signInThrottle = new SignInThrottle()
    ) { }

    async register(command: RegisterUserCommand): Promise<User> {
        const email = command.email.trim().toLowerCase();
        if (await this.userRepo.existsByEmail(email)) {
            throw new Error('A user with this email already exists');
        }

        PasswordPolicy.assertValidPlainText(command.password);
        const passwordHash = await hashPassword(command.password);
        const user = User.create({
            name: command.name,
            email,
            passwordHash,
        });

        const savedUser = await this.userRepo.save(user);
        const workspace = await this.workspaceRepo.save(Workspace.create({ ownerUserId: savedUser.id }));
        savedUser.assignWorkspace(workspace.id);
        const persistedUser = await this.userRepo.update(savedUser);
        await this.issueEmailVerification(persistedUser);
        return persistedUser;
    }

    async signIn(command: SignInCommand, context?: { ipAddress?: string }): Promise<SignInResult | null> {
        const email = command.email.trim().toLowerCase();
        this.signInThrottle.assertCanAttempt(email, context?.ipAddress);
        const user = await this.userRepo.findByEmail(email);

        if (!user) {
            this.signInThrottle.recordFailure(email, context?.ipAddress);
            return null;
        }
        if (user.deletedAt) {
            this.signInThrottle.recordFailure(email, context?.ipAddress);
            return null;
        }
        if (user.isDisabled) {
            this.signInThrottle.recordFailure(email, context?.ipAddress);
            return null;
        }
        if (!user.workspaceId) {
            this.signInThrottle.recordFailure(email, context?.ipAddress);
            return null;
        }
        const isPasswordValid = await verifyPassword(command.password, user.passwordHash);
        if (!isPasswordValid) {
            this.signInThrottle.recordFailure(email, context?.ipAddress);
            return null;
        }
        if (!user.isEmailVerified()) {
            this.signInThrottle.recordFailure(email, context?.ipAddress);
            throw new Error('Email verification is required before signing in');
        }

        this.signInThrottle.recordSuccess(email, context?.ipAddress);
        const sessionToken = randomBytes(32).toString('hex');
        const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
        await this.sessionRepo.create({
            userId: user.id,
            workspaceId: user.workspaceId,
            tokenHash: hashSessionToken(sessionToken),
            expiresAt: sessionExpiresAt,
        });

        return {
            user,
            sessionToken,
            sessionExpiresAt,
        };
    }

    async requestEmailVerification(command: RequestEmailVerificationCommand): Promise<void> {
        const email = command.email.trim().toLowerCase();
        const user = await this.userRepo.findByEmail(email);

        if (!user || user.deletedAt || user.isDisabled || user.isEmailVerified()) {
            return;
        }

        await this.issueEmailVerification(user);
    }

    async verifyEmail(command: VerifyEmailCommand): Promise<void> {
        const normalizedToken = command.token.trim();

        if (!normalizedToken) {
            throw new Error('Email verification token is required');
        }

        const tokenHash = hashEmailVerificationToken(normalizedToken);
        const user = await this.userRepo.findByEmailVerificationTokenHash(tokenHash);

        if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
            throw new Error('Email verification link is invalid or has expired');
        }

        user.markEmailVerified();
        await this.userRepo.update(user);
    }

    async requestPasswordReset(command: ForgotPasswordCommand): Promise<void> {
        const email = command.email.trim().toLowerCase();
        const user = await this.userRepo.findByEmail(email);

        if (!user) {
            return;
        }

        const rawToken = randomBytes(32).toString('hex');
        const tokenHash = hashResetToken(rawToken);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
        const clientOrigin = process.env.PASSWORD_RESET_URL_ORIGIN?.trim()
            || process.env.CLIENT_ORIGIN?.trim()
            || 'http://localhost:5173';
        const resetUrl = `${clientOrigin.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

        user.setPasswordResetToken(tokenHash, expiresAt);
        await this.userRepo.update(user);
        await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl,
        });
    }

    async resetPassword(command: ResetPasswordCommand): Promise<void> {
        const normalizedToken = command.token.trim();

        if (!normalizedToken) {
            throw new Error('Password reset token is required');
        }

        const tokenHash = hashResetToken(normalizedToken);
        const user = await this.userRepo.findByResetPasswordTokenHash(tokenHash);

        if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt.getTime() < Date.now()) {
            throw new Error('Password reset link is invalid or has expired');
        }

        PasswordPolicy.assertValidPlainText(command.password);
        const nextPasswordHash = await hashPassword(command.password);
        user.updatePasswordHash(nextPasswordHash);
        user.clearPasswordResetToken();
        await this.userRepo.update(user);
    }

    async getUserById(id: string): Promise<User | null> {
        return this.userRepo.findById(id);
    }

    async getUserBySessionToken(token: string): Promise<User | null> {
        const normalizedToken = token.trim();

        if (!normalizedToken) {
            return null;
        }

        const session = await this.sessionRepo.findByTokenHash(hashSessionToken(normalizedToken));

        if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
            return null;
        }

        const user = await this.userRepo.findById(session.userId);

        if (!user || user.deletedAt || user.isDisabled || !user.workspaceId || !user.isEmailVerified()) {
            return null;
        }

        return user;
    }

    async signOut(sessionToken: string): Promise<void> {
        const normalizedToken = sessionToken.trim();

        if (!normalizedToken) {
            return;
        }

        await this.sessionRepo.revokeByTokenHash(hashSessionToken(normalizedToken));
    }

    async updateProfile(userId: string, command: UpdateProfileCommand): Promise<User> {
        const user = await this.userRepo.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        user.updateName(command.name);

        return this.userRepo.update(user);
    }

    private async issueEmailVerification(user: User): Promise<void> {
        const now = new Date(Date.now());
        const lastSentAt = user.emailVerificationLastSentAt;

        if (lastSentAt && now.getTime() - lastSentAt.getTime() < EMAIL_VERIFICATION_RESEND_COOLDOWN_MS) {
            return;
        }

        const previousWindowStartedAt = user.emailVerificationWindowStartedAt;
        const windowIsActive = previousWindowStartedAt
            && now.getTime() - previousWindowStartedAt.getTime() < EMAIL_VERIFICATION_RESEND_WINDOW_MS;
        const nextWindowStartedAt = windowIsActive ? previousWindowStartedAt! : now;
        const nextRequestsInWindow = windowIsActive
            ? user.emailVerificationRequestsInWindow + 1
            : 1;

        if (nextRequestsInWindow > EMAIL_VERIFICATION_RESEND_MAX_PER_WINDOW) {
            return;
        }

        const rawToken = randomBytes(32).toString('hex');
        const tokenHash = hashEmailVerificationToken(rawToken);
        const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MS);
        const clientOrigin = process.env.EMAIL_VERIFICATION_URL_ORIGIN?.trim()
            || process.env.CLIENT_ORIGIN?.trim()
            || 'http://localhost:5173';
        const verificationUrl = `${clientOrigin.replace(/\/$/, '')}/verify-email?token=${rawToken}`;

        user.setEmailVerificationToken(tokenHash, expiresAt);
        user.recordEmailVerificationDispatch(now, nextWindowStartedAt, nextRequestsInWindow);
        await this.userRepo.update(user);

        try {
            await this.emailVerificationSender({
                to: user.email,
                name: user.name,
                verificationUrl,
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes('Email delivery is not configured')) {
                return;
            }

            throw error;
        }
    }
}

function hashSessionToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}
