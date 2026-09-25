# Task Packs

`vcp task` turns a feature-sized intention into a repository-native work packet before implementation begins.

The goal is not to generate implementation code. The goal is to create the **bounded context and verification contract** that a coding agent and reviewer need.

The coding agent should draft and maintain the task pack from repository evidence. The developer should be asked only for product or engineering decisions that require human intent.

## Create a task

```bash
vcp task accept-invite --title "Accept organization invitation"
```

When running directly from this GitHub repository:

```bash
npx --yes --package=github:Moeeryani/Vibe-Coding-Production-Kit \
  vibe-coding-production task accept-invite \
  --title "Accept organization invitation"
```

By default the file is created at:

```text
docs/tasks/accept-invite.md
```

Target a different repository with:

```bash
vcp task accept-invite --dir ../my-app
```

Preview without writing:

```bash
vcp task accept-invite --dry-run
```

Replacing an existing task requires explicit opt-in:

```bash
vcp task accept-invite --force
```

## What a task pack contains

- one explicit outcome;
- source-of-truth references;
- requirement restatement;
- acceptance criteria;
- in-scope and out-of-scope boundaries;
- affected architecture/data/API boundaries;
- domain invariants;
- security/privacy/tenant questions;
- failure modes and edge cases;
- observability expectations;
- unit/integration/E2E/security test plan;
- rollout/migration/recovery thinking;
- a plan-before-code section;
- independent review checklist;
- completion report.

The agent should populate these sections from existing repository evidence and its bounded analysis. If a decision changes intended product behavior, security posture, compatibility policy, data ownership, or another choice that cannot be inferred safely, the agent should ask the developer a focused question and record the approved answer in the task or governing Source of Truth.

## Context-aware verification

If `AGENTS.md` contains concrete verification commands, the generator copies the applicable configured commands into the task pack.

For example, this project configuration:

```text
LINT_COMMAND=npm run lint
TYPECHECK_COMMAND=npm run typecheck
UNIT_TEST_COMMAND=npm test
BUILD_COMMAND=npm run build
```

becomes an explicit task verification section. Placeholder commands and non-applicable entries such as `n/a — no E2E surface` are not presented as executable checks.

This matters because the task should say **what was actually configured**, not invent commands from the language or framework.

## Recommended daily loop

What the developer does:

```text
State feature intent
      ↓
Answer only unresolved human decisions
      ↓
Approve/correct the plan
      ↓
Review final evidence and result
```

What the coding agent drives:

```text
Read Source of Truth + inspect affected area
        ↓
vcp task <slug>
        ↓
Draft/update the bounded task from evidence
        ↓
vcp ready <slug> --stage plan
        ↓
vcp context <slug> --mode plan
        ↓
Plan + resolve human decisions
        ↓
vcp ready <slug> --stage implement
        ↓
Implement bounded scope
        ↓
vcp verify <slug> --run
        ↓
Independent review
        ↓
vcp doctor .
        ↓
Merge / release
```

## Task naming

Use lowercase kebab-case slugs that describe one outcome:

Good:
- `accept-invite`
- `rotate-api-key`
- `retry-failed-payment`

Too broad:
- `build-auth-system`
- `finish-backend`
- `refactor-everything`

A large outcome should be decomposed before creating the task pack.
