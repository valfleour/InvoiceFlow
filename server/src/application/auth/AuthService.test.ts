import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'crypto';
import { AuthService } from './AuthService';
import { SignInThrottle } from './SignInThrottle';
import { SessionRecord, SessionRepository } from '../../domain/auth/repositories/SessionRepository';
import { User } from '../../domain/users/entities/User';
import { UserRepository } from '../../domain/users/repositories/UserRepository';
import { WorkspaceRepository } from '../../domain/workspaces/repositories/WorkspaceRepository';
import { Workspace } from '../../domain/workspaces/entities/Workspace';
import { verifyPassword } from '../../infrastructure/security/passwords';

class InMemoryUserRepository implements UserRepository {
    private readonly users = new Map<string, User>();

    constructor(initialUsers: User[] = []) {
        for (const user of initialUsers) {
            this.users.set(user.id, user);
        }
    }

    async findById(id: string): Promise<User | null> {
        return this.users.get(id) ?? null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const normalizedEmail = email.trim().toLowerCase();
        return [...this.users.values()].find((user) => user.email === normalizedEmail) ?? null;
    }

    async findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null> {
        return [...this.users.values()].find((user) => user.emailVerificationTokenHash === tokenHash) ?? null;
    }

    async findByResetPasswordTokenHash(tokenHash: string): Promise<User | null> {
        return [...this.users.values()].find((user) => user.resetPasswordTokenHash === tokenHash) ?? null;
    }

    async existsByEmail(email: string): Promise<boolean> {
        const normalizedEmail = email.trim().toLowerCase();
        return [...this.users.values()].some((user) => user.email === normalizedEmail);
    }

    async save(user: User): Promise<User> {
        const stored = user.id
            ? user
            : User.reconstitute({
                id: `user-${this.users.size + 1}`,
                name: user.name,
                email: user.email,
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
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            });
        this.users.set(stored.id, stored);
        return stored;
    }

    async update(user: User): Promise<User> {
        this.users.set(user.id, user);
        return user;
    }
}

class InMemoryWorkspaceRepository implements WorkspaceRepository {
    private readonly workspaces = new Map<string, Workspace>();

    async findById(id: string): Promise<Workspace | null> {
        return this.workspaces.get(id) ?? null;
    }

    async findByOwnerUserId(ownerUserId: string): Promise<Workspace | null> {
        return [...this.workspaces.values()].find((workspace) => workspace.ownerUserId === ownerUserId) ?? null;
    }

    async save(workspace: Workspace): Promise<Workspace> {
        const stored = workspace.id
            ? workspace
            : Workspace.reconstitute({
                id: `workspace-${this.workspaces.size + 1}`,
                ownerUserId: workspace.ownerUserId,
                memberUserIds: workspace.memberUserIds,
                defaultCurrency: workspace.defaultCurrency,
                invoiceNumbering: workspace.invoiceNumbering,
                createdAt: workspace.createdAt,
                updatedAt: workspace.updatedAt,
            });
        this.workspaces.set(stored.id, stored);
        return stored;
    }
}

class InMemorySessionRepository implements SessionRepository {
    private readonly sessions = new Map<string, SessionRecord>();

    async create(props: {
        userId: string;
        workspaceId: string;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<SessionRecord> {
        const session: SessionRecord = {
            id: `session-${this.sessions.size + 1}`,
            userId: props.userId,
            workspaceId: props.workspaceId,
            tokenHash: props.tokenHash,
            expiresAt: props.expiresAt,
            revokedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.sessions.set(session.id, session);
        return session;
    }

    async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
        return [...this.sessions.values()].find((session) => session.tokenHash === tokenHash) ?? null;
    }

    async revokeByTokenHash(tokenHash: string): Promise<void> {
        const existingSession = [...this.sessions.values()].find((session) => session.tokenHash === tokenHash);

        if (!existingSession) {
            return;
        }

        this.sessions.set(existingSession.id, {
            ...existingSession,
            revokedAt: new Date(),
            updatedAt: new Date(),
        });
    }
}

const existingPasswordHash = 'fedcba9876543210fedcba9876543210:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function createService(initialUsers: User[] = []) {
    const userRepo = new InMemoryUserRepository(initialUsers);
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const sessionRepo = new InMemorySessionRepository();
    const sentVerificationEmails: Array<{ to: string; name: string; verificationUrl: string }> = [];

    return {
        service: new AuthService(userRepo, workspaceRepo, sessionRepo, async (payload) => {
            sentVerificationEmails.push(payload);
        }, new SignInThrottle()),
        userRepo,
        workspaceRepo,
        sessionRepo,
        sentVerificationEmails,
    };
}

test('register enforces uniqueness, normalizes email, and persists only a hash', async () => {
    const { service, workspaceRepo, sentVerificationEmails } = createService();

    const user = await service.register({
        name: 'Jane Doe',
        email: '  Jane@Example.com ',
        password: 'StrongPass1',
    });

    assert.equal(user.email, 'jane@example.com');
    assert.ok(user.workspaceId);
    assert.notEqual(user.passwordHash, 'StrongPass1');
    assert.match(user.passwordHash, /^[a-f0-9]{32}:[a-f0-9]{128}$/i);
    assert.equal(await verifyPassword('StrongPass1', user.passwordHash), true);
    assert.equal((await workspaceRepo.findById(user.workspaceId!))?.ownerUserId, user.id);
    assert.equal(user.emailVerifiedAt, null);
    assert.ok(user.emailVerificationTokenHash);
    assert.ok(user.emailVerificationExpiresAt);
    assert.equal(sentVerificationEmails.length, 1);
    assert.equal(sentVerificationEmails[0].to, 'jane@example.com');

    await assert.rejects(
        service.register({
            name: 'Jane Again',
            email: 'JANE@example.com',
            password: 'StrongPass1',
        }),
        /A user with this email already exists/
    );
});

test('register rejects weak passwords before hashing', async () => {
    const { service } = createService();

    await assert.rejects(
        service.register({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'weakpass',
        }),
        /uppercase letter|number/
    );
});

test('register rejects missing or invalid emails before creating the user', async () => {
    const { service } = createService();

    await assert.rejects(
        service.register({
            name: 'Jane Doe',
            email: '   ',
            password: 'StrongPass1',
        }),
        /Invalid email address/
    );

    await assert.rejects(
        service.register({
            name: 'Jane Doe',
            email: 'not-an-email',
            password: 'StrongPass1',
        }),
        /Invalid email address/
    );
});

test('register rejects passwords that are too short', async () => {
    const { service } = createService();

    await assert.rejects(
        service.register({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'Aa1',
        }),
        /Password must be at least 8 characters long/
    );
});

test('signIn rejects invalid passwords', async () => {
    const existingUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
    });
    const { service } = createService([existingUser]);

    const result = await service.signIn({
        email: 'jane@example.com',
        password: 'WrongPass1',
    });

    assert.equal(result, null);
});

test('signIn authenticates valid credentials and issues an expiring session token', async () => {
    const { service } = createService();
    const user = await service.register({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongPass1',
    });
    user.markEmailVerified(new Date('2026-04-01T00:00:00.000Z'));

    const result = await service.signIn({
        email: 'jane@example.com',
        password: 'StrongPass1',
    });

    assert.ok(result);
    assert.equal(result.user.email, 'jane@example.com');
    assert.ok(result.sessionToken.length > 20);
    assert.ok(result.sessionExpiresAt.getTime() > Date.now());
});

test('signIn rejects unknown email addresses', async () => {
    const { service } = createService();

    const result = await service.signIn({
        email: 'missing@example.com',
        password: 'StrongPass1',
    });

    assert.equal(result, null);
});

test('signIn rejects disabled users', async () => {
    const disabledUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        isDisabled: true,
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
    });
    const { service } = createService([disabledUser]);

    const result = await service.signIn({
        email: 'jane@example.com',
        password: 'StrongPass1',
    });

    assert.equal(result, null);
});

test('signIn rejects deleted users', async () => {
    const deletedUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
        deletedAt: new Date('2026-04-02T00:00:00.000Z'),
    });
    const { service } = createService([deletedUser]);

    const result = await service.signIn({
        email: 'jane@example.com',
        password: 'StrongPass1',
    });

    assert.equal(result, null);
});

test('signIn blocks unverified users until they confirm their email', async () => {
    const { service } = createService();
    await service.register({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongPass1',
    });

    await assert.rejects(
        service.signIn({
            email: 'jane@example.com',
            password: 'StrongPass1',
        }),
        /Email verification is required before signing in/
    );
});

test('signIn does not reveal unverified status when the password is wrong', async () => {
    const existingUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: null,
    });
    const { service } = createService([existingUser]);

    const result = await service.signIn({
        email: 'jane@example.com',
        password: 'WrongPass1',
    });

    assert.equal(result, null);
});

test('requestEmailVerification issues a fresh token and verifyEmail marks the user as verified', async () => {
    const existingUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: null,
    });
    const { service, userRepo, sentVerificationEmails } = createService([existingUser]);

    await service.requestEmailVerification({
        email: 'jane@example.com',
    });

    const updatedUser = await userRepo.findById('user-1');
    assert.ok(updatedUser?.emailVerificationTokenHash);
    assert.ok(updatedUser?.emailVerificationExpiresAt);
    assert.equal(sentVerificationEmails.length, 1);

    const verificationUrl = new URL(sentVerificationEmails[0].verificationUrl);
    const token = verificationUrl.searchParams.get('token');
    assert.ok(token);

    await service.verifyEmail({ token: token! });

    const verifiedUser = await userRepo.findById('user-1');
    assert.ok(verifiedUser?.emailVerifiedAt);
    assert.equal(verifiedUser?.emailVerificationTokenHash, null);
    assert.equal(verifiedUser?.emailVerificationExpiresAt, null);
});

test('requestEmailVerification silently ignores unknown or already verified emails', async () => {
    const verifiedUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
    });
    const { service, sentVerificationEmails } = createService([verifiedUser]);

    await service.requestEmailVerification({ email: 'missing@example.com' });
    await service.requestEmailVerification({ email: 'jane@example.com' });

    assert.equal(sentVerificationEmails.length, 0);
});

test('requestEmailVerification applies resend cooldown and hourly caps while keeping a single latest token', async () => {
    const originalNow = Date.now;
    let now = new Date('2026-04-01T00:00:00.000Z').getTime();
    Date.now = () => now;

    try {
        const existingUser = User.reconstitute({
            id: 'user-1',
            name: 'Jane Doe',
            email: 'jane@example.com',
            passwordHash: existingPasswordHash,
            workspaceId: 'workspace-1',
            emailVerifiedAt: null,
        });
        const { service, userRepo, sentVerificationEmails } = createService([existingUser]);

        await service.requestEmailVerification({ email: 'jane@example.com' });
        const firstUser = await userRepo.findById('user-1');
        const firstTokenHash = firstUser?.emailVerificationTokenHash;
        assert.equal(sentVerificationEmails.length, 1);
        assert.equal(firstUser?.emailVerificationRequestsInWindow, 1);

        now += 30_000;
        await service.requestEmailVerification({ email: 'jane@example.com' });
        const cooldownUser = await userRepo.findById('user-1');
        assert.equal(sentVerificationEmails.length, 1);
        assert.equal(cooldownUser?.emailVerificationTokenHash, firstTokenHash);
        assert.equal(cooldownUser?.emailVerificationRequestsInWindow, 1);

        now += 31_000;
        for (let attempt = 0; attempt < 4; attempt += 1) {
            await service.requestEmailVerification({ email: 'jane@example.com' });
            now += 61_000;
        }

        const cappedUser = await userRepo.findById('user-1');
        assert.equal(sentVerificationEmails.length, 5);
        assert.equal(cappedUser?.emailVerificationRequestsInWindow, 5);
        const latestTokenHash = cappedUser?.emailVerificationTokenHash;
        assert.notEqual(latestTokenHash, firstTokenHash);

        await service.requestEmailVerification({ email: 'jane@example.com' });
        const afterCapUser = await userRepo.findById('user-1');
        assert.equal(sentVerificationEmails.length, 5);
        assert.equal(afterCapUser?.emailVerificationTokenHash, latestTokenHash);

        now += 1000 * 60 * 60;
        await service.requestEmailVerification({ email: 'jane@example.com' });
        const nextWindowUser = await userRepo.findById('user-1');
        assert.equal(sentVerificationEmails.length, 6);
        assert.equal(nextWindowUser?.emailVerificationRequestsInWindow, 1);
    } finally {
        Date.now = originalNow;
    }
});

test('resetPassword accepts a valid token, clears it, and hashes the replacement password', async () => {
    const resetToken = 'reset-token-1';
    const existingUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
        resetPasswordTokenHash: hashToken(resetToken),
        resetPasswordExpiresAt: new Date(Date.now() + 60_000),
    });
    const { service, userRepo } = createService([existingUser]);

    await service.resetPassword({
        token: resetToken,
        password: 'BetterPass2',
    });

    const updatedUser = await userRepo.findById('user-1');
    assert.ok(updatedUser);
    assert.equal(await verifyPassword('BetterPass2', updatedUser.passwordHash), true);
    assert.notEqual(updatedUser.passwordHash, existingPasswordHash);
    assert.equal(updatedUser.resetPasswordTokenHash, null);
    assert.equal(updatedUser.resetPasswordExpiresAt, null);
});

test('resetPassword rejects expired reset tokens', async () => {
    const resetToken = 'expired-token';
    const existingUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
        resetPasswordTokenHash: hashToken(resetToken),
        resetPasswordExpiresAt: new Date(Date.now() - 60_000),
    });
    const { service } = createService([existingUser]);

    await assert.rejects(
        service.resetPassword({
            token: resetToken,
            password: 'BetterPass2',
        }),
        /Password reset link is invalid or has expired/
    );
});

test('signIn creates a session token and authenticated lookup resolves only through the token', async () => {
    const existingUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
    });
    const { service } = createService([existingUser]);

    const result = await service.signIn({
        email: 'jane@example.com',
        password: 'WrongPass1',
    });
    assert.equal(result, null);

    const verifiedPasswordHashUser = await service.register({
        name: 'Session User',
        email: 'session@example.com',
        password: 'StrongPass1',
    });
    verifiedPasswordHashUser.markEmailVerified(new Date('2026-04-02T00:00:00.000Z'));

    const signedIn = await service.signIn({
        email: 'session@example.com',
        password: 'StrongPass1',
    });

    assert.ok(signedIn?.sessionToken);
    const authenticatedUser = await service.getUserBySessionToken(signedIn!.sessionToken);
    assert.equal(authenticatedUser?.email, 'session@example.com');

    await service.signOut(signedIn!.sessionToken);
    const signedOutLookup = await service.getUserBySessionToken(signedIn!.sessionToken);
    assert.equal(signedOutLookup, null);
});

test('signIn throttles repeated failed attempts from the same email and ip', async () => {
    let now = 0;
    const throttle = new SignInThrottle(3, 1000 * 60, 1000 * 60, () => now);
    const verifiedUser = User.reconstitute({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: existingPasswordHash,
        workspaceId: 'workspace-1',
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
    });
    const userRepo = new InMemoryUserRepository([verifiedUser]);
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const sessionRepo = new InMemorySessionRepository();
    const service = new AuthService(userRepo, workspaceRepo, sessionRepo, async () => { }, throttle);

    assert.equal(await service.signIn({ email: 'jane@example.com', password: 'WrongPass1' }, { ipAddress: '127.0.0.1' }), null);
    assert.equal(await service.signIn({ email: 'jane@example.com', password: 'WrongPass1' }, { ipAddress: '127.0.0.1' }), null);
    assert.equal(await service.signIn({ email: 'jane@example.com', password: 'WrongPass1' }, { ipAddress: '127.0.0.1' }), null);

    await assert.rejects(
        service.signIn({ email: 'jane@example.com', password: 'WrongPass1' }, { ipAddress: '127.0.0.1' }),
        /Too many sign in attempts/
    );

    now = 1000 * 60 * 2;
    assert.equal(await service.signIn({ email: 'jane@example.com', password: 'WrongPass1' }, { ipAddress: '127.0.0.1' }), null);
});

function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}
