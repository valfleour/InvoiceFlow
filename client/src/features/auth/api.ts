import api from '../../shared/api';
import type { AuthUser } from '../../shared/authSession';

interface AuthResponse {
    user: AuthUser;
    session?: {
        token: string;
        expiresAt: string;
    };
    verificationRequired?: boolean;
    message?: string;
}

interface ForgotPasswordResponse {
    message: string;
}

interface ResetPasswordResponse {
    message: string;
}

interface MessageResponse {
    message: string;
}

export async function signUpRequest(payload: {
    name: string;
    email: string;
    password: string;
}): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signup', payload);
    return data;
}

export async function signInRequest(payload: {
    email: string;
    password: string;
}): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signin', payload);
    return data;
}

export async function updateProfileRequest(payload: {
    name: string;
}): Promise<AuthUser> {
    const { data } = await api.patch<AuthResponse>('/auth/me', payload);
    return data.user;
}

export async function forgotPasswordRequest(payload: {
    email: string;
}): Promise<string> {
    const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', payload);
    return data.message;
}

export async function requestEmailVerificationRequest(payload: {
    email: string;
}): Promise<string> {
    const { data } = await api.post<MessageResponse>('/auth/verify-email/request', payload);
    return data.message;
}

export async function confirmEmailVerificationRequest(payload: {
    token: string;
}): Promise<string> {
    const { data } = await api.post<MessageResponse>('/auth/verify-email/confirm', payload);
    return data.message;
}

export async function resetPasswordRequest(payload: {
    token: string;
    password: string;
}): Promise<string> {
    const { data } = await api.post<ResetPasswordResponse>('/auth/reset-password', payload);
    return data.message;
}

export async function signOutRequest(): Promise<void> {
    await api.post('/auth/signout');
}
