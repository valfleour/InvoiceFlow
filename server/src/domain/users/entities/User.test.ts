import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from './User';

const validPasswordHash = '0123456789abcdef0123456789abcdef:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

test('User.create normalizes name and email and accepts a valid password hash only', () => {
    const user = User.create({
        name: '  Jane Doe  ',
        email: '  JANE@Example.COM ',
        passwordHash: validPasswordHash,
    });

    assert.equal(user.name, 'Jane Doe');
    assert.equal(user.email, 'jane@example.com');
    assert.equal(user.passwordHash, validPasswordHash);
});

test('User.create rejects invalid identity fields and plain-text passwords', () => {
    assert.throws(
        () =>
            User.create({
                name: 'J',
                email: 'jane@example.com',
                passwordHash: validPasswordHash,
            }),
        /User name must be at least 2 characters long/
    );

    assert.throws(
        () =>
            User.create({
                name: 'Jane Doe',
                email: 'not-an-email',
                passwordHash: validPasswordHash,
            }),
        /Invalid email address/
    );

    assert.throws(
        () =>
            User.create({
                name: 'Jane Doe',
                email: 'jane@example.com',
                passwordHash: 'PlainTextPassword123',
            }),
        /User password hash must be a valid scrypt hash/
    );
});

test('User.updateName preserves the same domain validation rules', () => {
    const user = User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: validPasswordHash,
    });

    user.updateName('  Janet Doe  ');
    assert.equal(user.name, 'Janet Doe');

    assert.throws(() => user.updateName(' \n '), /User name is required|invalid whitespace/);
});

test('User email verification lifecycle stores tokens and clears them when verified', () => {
    const user = User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: validPasswordHash,
    });

    user.setEmailVerificationToken('token-hash', new Date('2026-04-11T00:00:00.000Z'));
    assert.equal(user.isEmailVerified(), false);
    assert.equal(user.emailVerificationTokenHash, 'token-hash');

    user.markEmailVerified(new Date('2026-04-10T00:00:00.000Z'));
    assert.equal(user.isEmailVerified(), true);
    assert.equal(user.emailVerificationTokenHash, null);
    assert.equal(user.emailVerificationExpiresAt, null);
});
