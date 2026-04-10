import test from 'node:test';
import assert from 'node:assert/strict';
import { Workspace } from './Workspace';

test('Workspace.create always includes the owner as a member and removes duplicate member ids', () => {
    const workspace = Workspace.create({
        ownerUserId: ' owner-1 ',
        memberUserIds: ['member-1', 'owner-1', 'member-1', '   '],
    });

    assert.equal(workspace.ownerUserId, 'owner-1');
    assert.deepEqual(workspace.memberUserIds, ['member-1', 'owner-1']);
});

test('Workspace.create requires a non-empty owner user id', () => {
    assert.throws(
        () => Workspace.create({ ownerUserId: '   ' }),
        /Workspace owner is required/
    );
});
