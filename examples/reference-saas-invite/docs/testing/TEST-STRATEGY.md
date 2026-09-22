# Test Strategy — Invitation Slice

## Unit/domain tests

Verify:
- email normalization;
- pending->accepted transition;
- expired invitation rejection;
- revoked/accepted invitation rejection;
- verified-email mismatch rejection.

## Application tests

Verify:
- issuer authorization and tenant match;
- raw token is not persisted;
- replacement semantics for a repeated invite;
- unknown token rejection;
- replay cannot succeed twice;
- acceptance returns organization derived from the stored invite.

## Production integration tests still required

- database unique/locking/transaction semantics under concurrency;
- membership creation transaction/workflow;
- API validation and error mapping;
- authentication integration;
- email provider contract;
- audit event persistence;
- rate limiting.

## E2E critical path

1. Admin signs in.
2. Admin invites `person@example.com` to org A.
3. Mailbox receives link without token appearing in server logs.
4. Intended user signs in with verified matching email.
5. Invite acceptance creates membership in org A.
6. Reopening the same link cannot create another membership.
