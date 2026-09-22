# Task Readiness Gates

`vcp ready` turns the project rule **“do not code an unready task”** into a deterministic repository check.

It deliberately separates two different questions:

1. Is this task clear enough to **plan**?
2. Is the approved task clear enough to **implement**?

A task can be ready for planning while security, testing, rollout, or observability questions still need to be resolved during that planning step. It must not be considered ready for implementation until those decisions are explicit.

## Ready for planning

```bash
vcp ready accept-invite --stage plan
```

The planning gate requires these foundations:

- a concrete outcome;
- repository-local Source of Truth references that exist and are not placeholders;
- at least one testable acceptance criterion;
- explicit in-scope and out-of-scope boundaries.

Unresolved implementation details are reported as `WARN` at this stage so the planner can close them deliberately.

## Ready for implementation

```bash
vcp ready accept-invite --stage implement
```

The implementation gate promotes the planning warnings to blocking failures. Before code changes begin, the task must address:

- module/file, API/contract, data/migration, and external-integration impact;
- domain invariants;
- authentication, authorization/resource ownership, tenant isolation, trust boundaries, secrets/PII/logging, abuse/replay/rate concerns, and relevant threat references;
- concrete failure modes and edge cases;
- observability;
- unit, integration/contract, E2E/regression, and negative/security test areas;
- deployment compatibility, migration/backfill, and rollback/recovery;
- a concrete implementation plan.

If an item truly does not apply, use a reasoned statement such as:

```text
n/a — no schema changes are required by this task.
```

A bare `n/a` is intentionally not treated as a substantive decision.

## Human-readable report

```bash
vcp ready accept-invite --stage implement
```

The output uses `PASS / WARN / FAIL` findings with remediation instead of a single readiness score. A score would hide which engineering contract is missing.

## JSON for automation

```bash
vcp ready accept-invite --stage implement --json
```

The JSON response includes the task path, stage, individual findings, and summary counts.

## Exit codes

By default:

- any `FAIL` returns non-zero;
- warnings alone do not block the command.

To make warnings fail as well:

```bash
vcp ready accept-invite --stage plan --strict
```

This is useful for teams that want a stricter planning-entry policy.

## Source-of-truth safety

The readiness check validates repository-local references instead of trusting the Markdown text blindly. It rejects:

- placeholder references such as `#...` or `ADR-...md`;
- missing referenced files;
- paths that escape the repository root.

This makes a task with copied template links visibly unready rather than silently treating the links as evidence.

## Recommended workflow

```text
vcp task <slug>
      ↓
Fill outcome + sources + acceptance criteria + scope
      ↓
vcp ready <slug> --stage plan
      ↓
vcp context <slug> --mode plan
      ↓
Complete and approve implementation/security/test/rollout plan
      ↓
vcp ready <slug> --stage implement
      ↓
vcp context <slug> --mode implement --include <affected files>
      ↓
Implement + verify
      ↓
vcp context <slug> --mode review --include <changed files/tests>
      ↓
vcp doctor .
      ↓
Merge / release
```

`ready` does not replace human judgment. It prevents obvious missing contracts from being mistaken for an approved task and makes the remaining judgment explicit.
