# Reference Vertical Slice — Multi-tenant SaaS Invitations

This example shows what the Vibe Coding Production Kit looks like when the templates become real engineering decisions.

It deliberately uses a narrow but security-sensitive feature: **an organization administrator invites a person to join one tenant, and the invite may be accepted exactly once by an authenticated user whose verified email matches the invitation**.

The implementation is intentionally small and dependency-free so the engineering workflow is visible. It is **not** a complete deployable SaaS application and does not replace a real database, HTTP layer, authentication system, email provider, rate limiter, or production observability stack.

## What to inspect

Read in this order:

1. [`docs/product/PRODUCT-BRIEF.md`](docs/product/PRODUCT-BRIEF.md)
2. [`docs/product/PRD.md`](docs/product/PRD.md)
3. [`docs/architecture/DOMAIN.md`](docs/architecture/DOMAIN.md)
4. [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
5. [`docs/architecture/adr/ADR-001-invite-token-storage.md`](docs/architecture/adr/ADR-001-invite-token-storage.md)
6. [`docs/security/THREAT-MODEL.md`](docs/security/THREAT-MODEL.md)
7. [`docs/testing/TEST-STRATEGY.md`](docs/testing/TEST-STRATEGY.md)
8. [`docs/delivery/TASK-001-accept-invite.md`](docs/delivery/TASK-001-accept-invite.md)
9. [`src/`](src/) and [`test/`](test/)

That order is intentional: **why -> behavior -> domain -> architecture -> decision -> risk -> verification -> bounded task -> code**.

## Run the reference tests

```bash
npm test
npm run check
```

The tests include happy paths and negative paths for authorization, tenant isolation, token replay, expiry, revocation, and verified-email matching.

## Production gaps left on purpose

A real deployment still needs at least:

- persistent storage with a unique/atomic active-invite constraint;
- transactional acceptance and membership creation;
- real authentication and permission resolution;
- rate limits and abuse controls;
- email delivery with no token leakage in logs;
- HTTP/API input validation and error mapping;
- structured audit events, metrics, tracing, and alerts;
- retention/deletion rules;
- integration, contract, and E2E tests against real infrastructure.

Those gaps are explicit because “production-minded” means **knowing what is not proven**, not pretending a demo is production-ready.
