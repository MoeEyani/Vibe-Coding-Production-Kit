# TASK-001 — Accept organization invitation

## Requirement
Implement the application/domain behavior for accepting a pending organization invite.

## Source of truth
- PRD: FR-002 / AC-101 through AC-105
- Domain invariants: `docs/architecture/DOMAIN.md`
- Token decision: ADR-001
- Threats: T-004 through T-008

## Scope

In scope:
- token hash lookup;
- invitation state/expiry checks;
- verified-email binding;
- exactly-once in-memory transition semantics for the reference repository;
- tests for all negative paths.

Out of scope:
- HTTP endpoint;
- authentication implementation;
- persistent database;
- membership write;
- email provider.

## Acceptance criteria

- Unknown token rejected.
- Expired invite rejected.
- Revoked invite rejected.
- Email mismatch rejected.
- Valid invite accepted once.
- Replay rejected.
- Returned org ID comes from stored invitation.

## Security notes

Do not log the raw token. Do not accept org ID as an input to acceptance.

## Verification

```bash
npm test
npm run check
```
