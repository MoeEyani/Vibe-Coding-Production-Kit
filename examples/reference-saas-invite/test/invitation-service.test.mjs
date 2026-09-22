import assert from 'node:assert/strict';
import test from 'node:test';
import { InvitationService, AuthorizationError, InvalidInviteError, hashInviteToken } from '../src/application/invitation-service.mjs';
import { MemoryInvitationRepository } from '../src/infrastructure/memory-invitation-repository.mjs';

function harness({ now = new Date('2026-09-22T12:00:00Z') } = {}) {
  const repository = new MemoryInvitationRepository();
  let current = new Date(now);
  let tokenNumber = 0;
  let idNumber = 0;
  const service = new InvitationService({
    repository,
    now: () => new Date(current),
    tokenFactory: () => `reference-token-${String(++tokenNumber).padStart(32, '0')}`,
    idFactory: () => `invite-${++idNumber}`
  });
  return { repository, service, setNow(value) { current = new Date(value); } };
}

const adminA = { userId: 'admin-a', orgId: 'org-a', permissions: ['members.invite'] };
const memberA = { userId: 'member-a', orgId: 'org-a', permissions: [] };

async function issued(h, overrides = {}) {
  return h.service.issue({ actor: adminA, orgId: 'org-a', email: 'Person@Example.com', ...overrides });
}

test('authorized admin issues an invite and repository stores only its hash', async () => {
  const h = harness();
  const { invitation, deliveryToken } = await issued(h);
  const stored = await h.repository.findById(invitation.id);
  assert.equal(stored.orgId, 'org-a');
  assert.equal(stored.email, 'person@example.com');
  assert.equal(stored.tokenHash, hashInviteToken(deliveryToken));
  assert.notEqual(stored.tokenHash, deliveryToken);
  assert.equal('deliveryToken' in stored, false);
});

test('issuer must belong to target org', async () => {
  const h = harness();
  await assert.rejects(h.service.issue({ actor: adminA, orgId: 'org-b', email: 'person@example.com' }), AuthorizationError);
});

test('issuer must have members.invite permission', async () => {
  const h = harness();
  await assert.rejects(h.service.issue({ actor: memberA, orgId: 'org-a', email: 'person@example.com' }), AuthorizationError);
});

test('reissuing for same org and email revokes previous pending invitation', async () => {
  const h = harness();
  const first = await issued(h);
  await issued(h);
  const storedFirst = await h.repository.findById(first.invitation.id);
  assert.equal(storedFirst.status, 'revoked');
});

test('intended verified user can accept exactly once', async () => {
  const h = harness();
  const { deliveryToken } = await issued(h);
  const result = await h.service.accept({ token: deliveryToken, authenticatedUser: { userId: 'user-1', verifiedEmail: 'PERSON@example.com' } });
  assert.equal(result.orgId, 'org-a');
  assert.equal(result.acceptedByUserId, 'user-1');
  await assert.rejects(h.service.accept({ token: deliveryToken, authenticatedUser: { userId: 'user-1', verifiedEmail: 'person@example.com' } }), InvalidInviteError);
});

test('acceptance rejects verified-email mismatch', async () => {
  const h = harness();
  const { deliveryToken } = await issued(h);
  await assert.rejects(h.service.accept({ token: deliveryToken, authenticatedUser: { userId: 'user-2', verifiedEmail: 'attacker@example.com' } }), InvalidInviteError);
});

test('acceptance rejects expired invitation', async () => {
  const h = harness();
  const { deliveryToken } = await issued(h, { ttlMs: 60_000 });
  h.setNow('2026-09-22T12:01:00Z');
  await assert.rejects(h.service.accept({ token: deliveryToken, authenticatedUser: { userId: 'user-1', verifiedEmail: 'person@example.com' } }), InvalidInviteError);
});

test('reissued invitation makes old token unusable while new token works', async () => {
  const h = harness();
  const first = await issued(h);
  const second = await issued(h);
  await assert.rejects(h.service.accept({ token: first.deliveryToken, authenticatedUser: { userId: 'user-1', verifiedEmail: 'person@example.com' } }), InvalidInviteError);
  const result = await h.service.accept({ token: second.deliveryToken, authenticatedUser: { userId: 'user-1', verifiedEmail: 'person@example.com' } });
  assert.equal(result.orgId, 'org-a');
});

test('unknown token fails with coarse application error', async () => {
  const h = harness();
  await assert.rejects(h.service.accept({ token: 'unknown-token-that-is-long-enough-0000', authenticatedUser: { userId: 'user-1', verifiedEmail: 'person@example.com' } }), InvalidInviteError);
});
