# Context Packs

`vcp context` builds the **smallest useful context bundle** for one task and one engineering phase.

The goal is not to dump the repository into an AI chat. The goal is to give a coding agent enough authoritative context to plan, implement, review, or assess risk without losing the task boundary.

The coding agent should normally drive this command itself after it has drafted the task and passed the relevant readiness gate.

## Basic usage

Create a planning context from a task slug:

```bash
vcp context accept-invite --mode plan
```

The command reads `docs/tasks/accept-invite.md`, `AGENTS.md`, the planning prompt, and repository-local files referenced in the task's `## Source of truth` section.

Running directly from GitHub:

```bash
npx --yes --package=github:Moeeryani/Vibe-Coding-Production-Kit \
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

Source-of-truth documents describe intent and constraints, but an implementer or reviewer may need a small amount of current code context.

Use repeatable `--include` flags only for repository-local files that already exist and whose current contents belong in the context pack:

```bash
vcp context accept-invite \
  --mode implement \
  --include src/invitations/repository.ts
```

For greenfield implementation files that do **not** exist yet, use repeatable `--planned` flags in `implement` mode:

```bash
vcp context accept-invite \
  --mode implement \
  --planned src/invitations/service.ts \
  --planned test/invitations/service.test.ts
```

A planned path is recorded in the context pack and manifest as an approved repository-local implementation path, but no file contents are included because the file does not exist yet. This lets the agent build implement context before creating greenfield files.

The distinction is deliberate:

- `--include <path>` means **this file exists; include its contents**;
- `--planned <path>` means **this implement-mode path is approved but does not exist yet**.

`--planned` is rejected outside `implement` mode. It is also rejected when the path already exists; use `--include` in that case. Both options reject paths outside the repository root. Review context remains strict: changed files should exist by review time and should be passed with `--include`.

## Write a reusable pack

By default the pack is printed to stdout so it can be piped or passed into any coding tool. To save it:

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
- planned paths outside the repository;
- output paths outside the repository;
- URL references as local files.

This prevents a task document or context option from accidentally causing the context builder to read or authorize unrelated local paths.

## Recommended phase loop

What the developer should experience:

```text
State feature intent
      ↓
Answer unresolved human decisions
      ↓
Approve/correct the plan
      ↓
Review final result and evidence
```

What the coding agent should execute:

```text
Inspect repository + draft/update task
      ↓
vcp ready <slug> --stage plan
      ↓
vcp context <slug> --mode plan
      ↓
Plan + human decision approval
      ↓
vcp ready <slug> --stage implement
      ↓
vcp context <slug> --mode implement [--include <existing affected files>] [--planned <new files>]
      ↓
Implement bounded scope
      ↓
vcp verify <slug> --run
      ↓
vcp context <slug> --mode review --include <changed files/tests>
      ↓
vcp doctor .
      ↓
Merge / release
```

A context pack is a **transport format**, not a replacement for repository-native documentation. Decisions still belong in PRD/ADR/security/testing/task files and Git history, not only in an AI conversation.
