# Definition of Done

Apply relevant items to every completed task.

## Product correctness
- [ ] Acceptance criteria satisfied.
- [ ] Important edge/error paths handled.
- [ ] No known silent behavior change outside scope.

## Code quality
- [ ] Architecture/module boundaries respected.
- [ ] No unrelated refactor or formatting churn.
- [ ] No unnecessary dependency/abstraction introduced.
- [ ] Errors are handled intentionally.

## Data/API
- [ ] Contracts/docs updated when changed.
- [ ] Migrations are versioned and reviewed.
- [ ] Compatibility/rollback concerns addressed.

## Security/privacy
- [ ] Authorization is enforced at the correct boundary.
- [ ] Input/trust-boundary validation is present.
- [ ] No secrets/PII leak through code, logs, fixtures, or errors.
- [ ] Security-sensitive negative tests added.

## Verification
- [ ] New/changed behavior has appropriate automated tests.
- [ ] Required lint/typecheck/build/test checks pass.
- [ ] Critical manual checks completed if needed.

## Operations
- [ ] Logs/metrics/traces/audit updated where operationally relevant.
- [ ] Feature flag/runbook/deployment notes updated if needed.

## Documentation
- [ ] Source-of-truth docs and ADRs updated.
- [ ] User/developer docs updated if behavior changed.

## Review
- [ ] Self-review completed.
- [ ] Independent review completed per project policy.
- [ ] Remaining risks/limitations are explicit.
