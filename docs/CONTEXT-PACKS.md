# Context Packs

`vcp context` builds the **smallest useful context bundle** for one task and one engineering phase.

The goal is not to dump the repository into an AI chat. The goal is to give a coding agent enough authoritative context to plan, implement, review, or assess risk without losing the task boundary.

## Basic usage

Create a planning context from a task slug:

```bash
vcp context accept-invite --mode plan
```

The command reads `docs/tasks/accept-invite.md`, `AGENTS.md`, the planning prompt, and repository-local files referenced in the task's `## Source of truth` section.

Running directly from GitHub:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production context accept-invite --mode plan
```

You can also pass the task file explicitly:

```bash
vcp context docs/tasks/accept-invite.md --mode implement
```

## Modes

| Mode | Prompt used | Purpose |
|---|---|---|
| `plan` | `prompts/02-plan-task.md` | understand scope and propose the smallest coherent plan before code |
| `implement` | `prompts/03-implement-task.md` | execute an approved task within repository constraints |
| `review` | `prompts/04-code-review.md` | independent senior review against requirements and the changed area |
| `security` | `prompts/05-security-review.md` | focused threat/control review for sensitive changes |
| `release` | `prompts/07-release-review.md` | release-readiness and operational verification |

## Explicit implementation context

Source-of-truth documents describe intent and constraints, but a reviewer or implementer may need a small amount of current code context. Add it explicitly:

```bash
vcp context accept-invite \
  --mode review \
  --include src/invitations/service.ts \
  --include test/invitations/service.test.ts
```

`--include` is repeatable. Paths must stay inside the repository root.

## Write a reusable pack

By default the pack is printed to stdout so it can be pasted or piped into any coding tool. To save it:

```bash
vcp context accept-invite \
  --mode plan \
  --output .vcp/context/accept-invite-plan.md
```

Existing output files are protected. Replacing one requires explicit `--force`.

Preview an output operation without writing:

```bash
vcp context accept-invite \
  --mode plan \
  --output .vcp/context/accept-invite-plan.md \
  --dry-run
```

## Context budget

The default rendered limit is **120,000 bytes**. A pack above that limit fails instead of silently flooding the agent with context.

```bash
vcp context accept-invite --mode plan --max-bytes 80000
```

Set `--max-bytes 0` only when you deliberately want no limit.

When a pack is too large, prefer removing irrelevant task references or unnecessary `--include` files rather than simply raising the limit.

## Security and path safety

The command rejects:

- task paths outside the repository;
- source-of-truth references that escape the repository root;
- explicit includes outside the repository;
- output paths outside the repository;
- URL references as local files.

This prevents a task document from accidentally causing the context builder to read unrelated local files.

## Recommended phase loop

```text
vcp task <slug>
      ↓
Fill task acceptance criteria + Source of Truth
      ↓
vcp context <slug> --mode plan
      ↓
Approve the plan
      ↓
vcp context <slug> --mode implement --include <affected files>
      ↓
Run verification commands
      ↓
vcp context <slug> --mode review --include <changed files/tests>
      ↓
vcp doctor .
      ↓
Merge / release
```

A context pack is a **transport format**, not a replacement for repository-native documentation. Decisions still belong in PRD/ADR/security/testing/task files and Git history, not only in an AI conversation.
