import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEmailProviderConfig } from './emailDelivery';

test('resolveEmailProviderConfig prefers Resend when an API key is present', () => {
    const config = resolveEmailProviderConfig({
        RESEND_API_KEY: 're_test_123',
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
    });

    assert.deepEqual(config, {
        provider: 'resend',
        apiKey: 're_test_123',
        apiBaseUrl: 'https://api.resend.com',
    });
});

test('resolveEmailProviderConfig falls back to SMTP when no Resend API key is set', () => {
    const config = resolveEmailProviderConfig({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_SECURE: 'true',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
    });

    assert.deepEqual(config, {
        provider: 'smtp',
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        user: 'user',
        pass: 'pass',
    });
});

test('resolveEmailProviderConfig reports missing SMTP settings when neither provider is configured', () => {
    assert.throws(
        () => resolveEmailProviderConfig({}),
        /Email delivery is not configured. Missing SMTP_HOST./
    );
});
