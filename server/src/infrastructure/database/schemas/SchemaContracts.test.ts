import test from 'node:test';
import assert from 'node:assert/strict';
import { UserModel } from './UserSchema';
import { WorkspaceModel } from './WorkspaceSchema';
import { ClientModel } from './ClientSchema';
import { BusinessProfileModel } from './BusinessProfileSchema';
import { InvoiceCreationRequestModel } from './InvoiceCreationRequestSchema';
import { InvoiceModel } from './InvoiceSchema';
import { PaymentModel } from './PaymentSchema';
import { SessionModel } from './SessionSchema';

function hasIndex(
    indexes: Array<[Record<string, 1 | -1>, Record<string, unknown>]>,
    expectedKeys: Record<string, 1 | -1>,
    predicate?: (options: Record<string, unknown>) => boolean
): boolean {
    return indexes.some(([keys, options]) => {
        const sameKeys = JSON.stringify(keys) === JSON.stringify(expectedKeys);
        return sameKeys && (!predicate || predicate(options));
    });
}

test('User schema enforces unique normalized email lookups', () => {
    const indexes = UserModel.schema.indexes();

    assert.equal(
        hasIndex(indexes, { normalizedEmail: 1 }, (options) => options.unique === true),
        true
    );
});

test('Workspace schema requires the owner to stay in memberUserIds', () => {
    const validationError = new WorkspaceModel({
        ownerUserId: 'owner-1',
        memberUserIds: ['member-1'],
    }).validateSync();

    assert.ok(validationError);
    assert.match(String(validationError?.message), /Workspace owner must be included in memberUserIds/);
});

test('Client and business profile schemas remain workspace-scoped', () => {
    assert.equal(
        hasIndex(
            ClientModel.schema.indexes(),
            { workspaceId: 1, normalizedClientName: 1, normalizedEmail: 1 },
            (options) => options.unique === true
        ),
        true
    );
    assert.equal(
        hasIndex(
            BusinessProfileModel.schema.indexes(),
            { workspaceId: 1, isActive: 1 }
        ),
        true
    );
});

test('Invoice schema includes the required workspace-scoped lookup indexes', () => {
    const indexes = InvoiceModel.schema.indexes();

    assert.equal(
        hasIndex(indexes, { workspaceId: 1, invoiceNumber: 1 }, (options) => options.unique === true),
        true
    );
    assert.equal(hasIndex(indexes, { workspaceId: 1, clientId: 1, deletedAt: 1 }), true);
    assert.equal(hasIndex(indexes, { workspaceId: 1, status: 1, deletedAt: 1 }), true);
    assert.equal(hasIndex(indexes, { workspaceId: 1, dueDate: 1, deletedAt: 1 }), true);
    assert.equal(hasIndex(indexes, { workspaceId: 1, createdAt: -1, deletedAt: 1 }), true);
});

test('Payment schema scopes duplicate reference numbers to the invoice inside a workspace', () => {
    const indexes = PaymentModel.schema.indexes();

    assert.equal(
        hasIndex(
            indexes,
            { workspaceId: 1, invoiceId: 1, referenceNumber: 1 },
            (options) => options.unique === true
        ),
        true
    );
});

test('Invoice creation request schema keeps idempotency keys unique per workspace', () => {
    const indexes = InvoiceCreationRequestModel.schema.indexes();

    assert.equal(
        hasIndex(
            indexes,
            { workspaceId: 1, idempotencyKey: 1 },
            (options) => options.unique === true
        ),
        true
    );
});

test('Session schema stores only unique hashed tokens and expires them automatically', () => {
    const indexes = SessionModel.schema.indexes();

    assert.equal(
        hasIndex(indexes, { tokenHash: 1 }, (options) => options.unique === true),
        true
    );
    assert.equal(
        hasIndex(indexes, { expiresAt: 1 }, (options) => options.expireAfterSeconds === 0),
        true
    );
});
