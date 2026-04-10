export const AUTH_STORAGE_KEY = 'invoiceflow.auth-session';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    workspaceId?: string | null;
    emailVerifiedAt?: string | null;
    isEmailVerified?: boolean;
}

export interface AuthSession {
    isAuthenticated: boolean;
    user: AuthUser | null;
    token?: string | null;
    expiresAt?: string | null;
}

export function getStoredAuthSession(): AuthSession {
    if (typeof window === 'undefined') {
        return {
            isAuthenticated: false,
            user: null,
            token: null,
            expiresAt: null,
        };
    }

    const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedValue) {
        return {
            isAuthenticated: false,
            user: null,
            token: null,
            expiresAt: null,
        };
    }

    try {
        const parsed = JSON.parse(storedValue) as Partial<AuthSession>;

        if (
            !parsed.isAuthenticated
            || !parsed.user?.id
            || !parsed.user.email
            || !parsed.user.name
            || !parsed.token
            || !parsed.expiresAt
        ) {
            return {
                isAuthenticated: false,
                user: null,
                token: null,
                expiresAt: null,
            };
        }

        if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
            return {
                isAuthenticated: false,
                user: null,
                token: null,
                expiresAt: null,
            };
        }

        return {
            isAuthenticated: true,
            user: {
                id: parsed.user.id,
                name: parsed.user.name.trim(),
                email: parsed.user.email.trim().toLowerCase(),
                workspaceId: parsed.user.workspaceId ?? null,
                emailVerifiedAt: parsed.user.emailVerifiedAt ?? null,
                isEmailVerified: parsed.user.isEmailVerified ?? Boolean(parsed.user.emailVerifiedAt),
            },
            token: parsed.token,
            expiresAt: parsed.expiresAt,
        };
    } catch {
        return {
            isAuthenticated: false,
            user: null,
            token: null,
            expiresAt: null,
        };
    }
}

export function persistAuthSession(session: AuthSession) {
    if (typeof window === 'undefined') {
        return;
    }

    if (session.isAuthenticated && session.user) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
