import axios, { isAxiosError } from 'axios';
import { getStoredAuthSession } from './authSession';

const DEFAULT_API_BASE_URL = '/api';
export type ValidationErrors = Record<string, string[]>;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const session = getStoredAuthSession();

    if (session.isAuthenticated && session.token) {
        config.headers.set('Authorization', `Bearer ${session.token}`);
    }

    return config;
});

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError<{ error?: string }>(error)) {
        if (error.response?.data?.error) {
            return error.response.data.error;
        }

        if (error.response?.status === 401) {
            return 'Your session is not authorized. Please sign in again.';
        }

        if (error.response?.status === 429) {
            return error.response.data?.error || 'Too many requests. Please wait before trying again.';
        }

        if ([502, 503, 504].includes(error.response?.status ?? 0)) {
            return 'Cannot reach the API. Make sure the server is running on port 4000.';
        }

        if (error.code === 'ERR_NETWORK') {
            return 'Cannot reach the API. Make sure the server is running on port 4000.';
        }

        return error.message || fallback;
    }

    if (error instanceof Error) {
        return error.message || fallback;
    }

    return fallback;
}

export function getValidationErrors(error: unknown): ValidationErrors | undefined {
    if (isAxiosError<{ details?: ValidationErrors }>(error)) {
        return error.response?.data?.details;
    }

    return undefined;
}

export default api;
