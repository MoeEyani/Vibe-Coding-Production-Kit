# Task Packs

`vcp task` turns a feature-sized intention into a repository-native work packet before implementation begins.

The goal is not to generate implementation code. The goal is to create the **bounded context and verification contract** that a coding agent and reviewer need.

## Create a task

```bash
vcp task accept-invite --title "Accept organization invitation"
```

When running directly from this GitHub repository:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
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

## Context-aware verification

If `AGENTS.md` contains concrete verification commands, the generator copies the applicable configured commands into the task pack.

For example, this project configuration:

```text
LINT_COMMAND=npm run lint
TYPECHECK_COMMAND=npm run typecheck
UNIT_TEST_COMMAND=npm test
BUILD_COMMAND=npm run build
```

becomes an explicit task verification section. Placeholder commands and `n/a` entries are not presented as executable checks.

This matters because the task should say **what was actually configured**, not invent commands from the language or framework.

## Recommended daily loop

```text
PRD / ADR / Threat Model
        ↓
vcp task <slug>
        ↓
Agent fills Implementation Plan before code
        ↓
Implement bounded scope
        ↓
Run task verification commands
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
