import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { signInRequest, signOutRequest, signUpRequest, updateProfileRequest } from '../../features/auth/api';
import { currentUser } from '../../features/account/currentUser';
import {
    getStoredAuthSession,
    persistAuthSession,
    type AuthSession,
    type AuthUser,
} from '../../shared/authSession';

interface SignUpPayload {
    name: string;
    email: string;
    password: string;
}

interface SignInPayload {
    email: string;
    password: string;
}

interface AuthContextValue {
    isAuthenticated: boolean;
    user: AuthUser | null;
    signIn: (credentials: SignInPayload) => Promise<void>;
    signUp: (user: SignUpPayload) => Promise<{ verificationRequired: boolean; email: string; message: string }>;
    updateProfile: (profile: { name: string }) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    isAuthenticated: false,
    user: null,
    signIn: async () => { },
    signUp: async () => ({
        verificationRequired: true,
        email: '',
        message: '',
    }),
    updateProfile: async () => { },
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AuthSession>(getStoredAuthSession);

    useEffect(() => {
        persistAuthSession(session);
    }, [session]);

    const value = useMemo<AuthContextValue>(() => ({
        isAuthenticated: session.isAuthenticated,
        user: session.user,
        signIn: async (credentials) => {
            const result = await signInRequest(credentials);
            if (!result.session?.token || !result.session.expiresAt) {
                throw new Error('Sign in did not return a valid session.');
            }
            setSession({
                isAuthenticated: true,
                user: result.user,
                token: result.session.token,
                expiresAt: result.session.expiresAt,
            });
        },
        signUp: async (user) => {
            const createdUser = await signUpRequest(user);
            setSession({
                isAuthenticated: false,
                user: null,
                token: null,
                expiresAt: null,
            });
            return {
                verificationRequired: Boolean(createdUser.verificationRequired),
                email: createdUser.user.email,
                message: createdUser.message ?? 'Account created. Verify your email before signing in.',
            };
        },
        updateProfile: async (profile) => {
            const updatedUser = await updateProfileRequest(profile);
            setSession({
                isAuthenticated: true,
                user: updatedUser,
                token: session.token ?? null,
                expiresAt: session.expiresAt ?? null,
            });
        },
        signOut: async () => {
            try {
                if (session.isAuthenticated && session.token) {
                    await signOutRequest();
                }
            } catch {
                // Clear local state even if the API call fails.
            }
            setSession({
                isAuthenticated: false,
                user: null,
                token: null,
                expiresAt: null,
            });
        },
    }), [session]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export function getFallbackAuthEmail() {
    return currentUser.email;
}
