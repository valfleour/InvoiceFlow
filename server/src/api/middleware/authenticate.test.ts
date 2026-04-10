import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from './authenticate';
import { User } from '../../domain/users/entities/User';

function createVerifiedUser(overrides: Partial<Parameters<typeof User.reconstitute>[0]> = {}) {
    return User.reconstitute({
        id: 'user-1',
        name: 'Jane Owner',
        email: 'jane@example.com',
        passwordHash: 'fedcba9876543210fedcba9876543210:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        workspaceId: 'workspace-1',
        emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
        ...overrides,
    });
}

function createResponse() {
    const response = {
        statusCode: 200,
        jsonBody: undefined as unknown,
        status(code: number) {
            response.statusCode = code;
            return response;
        },
        json(body: unknown) {
            response.jsonBody = body;
            return response;
        },
    };

    return response as unknown as Response & { statusCode: number; jsonBody: unknown };
}

test('authenticate rejects unauthenticated requests', async () => {
    const middleware = authenticate({
        async getUserBySessionToken() {
            return null;
        },
    } as never);
    const req = {
        header() {
            return undefined;
        },
    } as unknown as Request;
    const res = createResponse();
    let nextCalled = false;

    await middleware(req, res, (() => {
        nextCalled = true;
    }) as NextFunction);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.jsonBody, { error: 'Authentication is required' });
});

test('authenticate rejects invalid or expired sessions', async () => {
    const middleware = authenticate({
        async getUserBySessionToken() {
            return null;
        },
    } as never);
    const req = {
        header(name: string) {
            return name.toLowerCase() === 'authorization' ? 'Bearer expired-token' : undefined;
        },
    } as unknown as Request;
    const res = createResponse();

    await middleware(req, res, (() => {
        throw new Error('next should not be called for an invalid session');
    }) as NextFunction);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.jsonBody, { error: 'Authenticated session is invalid or expired' });
});

test('authenticate derives workspace context from the authenticated session instead of trusting request payload data', async () => {
    const authenticatedUser = createVerifiedUser({ workspaceId: 'workspace-1' });
    const middleware = authenticate({
        async getUserBySessionToken(token: string) {
            assert.equal(token, 'valid-session-token');
            return authenticatedUser;
        },
    } as never);
    const req = {
        body: { workspaceId: 'workspace-2' },
        header(name: string) {
            return name.toLowerCase() === 'authorization' ? 'Bearer valid-session-token' : undefined;
        },
    } as unknown as Request;
    const res = createResponse();
    let nextCalled = false;

    await middleware(req, res, (() => {
        nextCalled = true;
    }) as NextFunction);

    assert.equal(nextCalled, true);
    assert.equal((req as AuthenticatedRequest).auth.workspaceId, 'workspace-1');
    assert.equal((req as AuthenticatedRequest).auth.sessionToken, 'valid-session-token');
});
