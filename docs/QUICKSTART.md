# Quickstart — from repository to verified AI task

This is the shortest end-to-end path through Vibe Coding Production Kit.

The goal is not to generate a whole application in one prompt. The goal is to establish enough engineering structure that an AI coding agent can work on one bounded task with explicit requirements, context, and verification.

## 1. Bootstrap the kit

From an existing repository:

```bash
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent all --stack auto --yes
```

Preview first if you want to see every managed path before writing:

```bash
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent all --stack auto --yes --dry-run
```

The initializer does not overwrite framework-managed files unless `--force` is explicitly supplied.

## 2. Establish the source of truth

Complete these files before asking an agent to build meaningful product behavior:

1. `docs/product/PRODUCT-BRIEF.md`
2. `docs/product/PRD.md`
3. `docs/product/USER-FLOWS.md`
4. `docs/architecture/DOMAIN.md`
5. `docs/architecture/ARCHITECTURE.md`
6. `docs/architecture/DATA-MODEL.md`
7. `docs/security/THREAT-MODEL.md`
8. `docs/testing/TEST-STRATEGY.md`

Also make sure `AGENTS.md` contains the repository's real verification commands. `--stack auto` fills only commands it can infer from repository evidence; unresolved commands stay explicit instead of being guessed.

## 3. Create one bounded task

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production task accept-invite \
  --title "Accept organization invitation"
```

This creates:

```text
docs/tasks/accept-invite.md
```

Fill its outcome, Source of Truth, acceptance criteria, scope, security decisions, failure modes, tests, rollout/recovery, and implementation plan.

## 4. Gate planning readiness

Before asking an AI agent to plan:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production ready accept-invite --stage plan
```

Do not continue while blocking findings remain.

## 5. Build the planning context

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production context accept-invite --mode plan
```

The context pack includes repository rules, the task, the planning prompt, and existing Source of Truth references from the task. It does not dump the whole repository.

Review and approve the plan before implementation.

## 6. Gate implementation readiness

After the plan is explicit:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production ready accept-invite --stage implement
```

The implementation gate is intentionally stricter than the planning gate.

## 7. Build implementation context

Add only the files the approved plan needs:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production context accept-invite \
  --mode implement \
  --include src/invitations/service.ts \
  --include test/invitations/service.test.ts
```

Use the output with your coding agent. Keep implementation bounded to the task contract.

## 8. Preview verification

Before executing repository-controlled commands:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production verify accept-invite
```

Preview is safe by default and does not run the commands.

## 9. Run verification and keep evidence

After reviewing the command list:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production verify accept-invite \
  --run \
  --output .vcp/evidence/accept-invite.json
```

Verification runs sequentially, stops after the first failure, and records mechanical evidence without persisting raw stdout/stderr by default.

## 10. Build independent review context

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production context accept-invite \
  --mode review \
  --include src/invitations/service.ts \
  --include test/invitations/service.test.ts
```

Prefer a fresh agent/context for review rather than relying only on the agent that wrote the change.

## 11. Audit the repository before merge/release

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production doctor .
```

Use `--strict` when warnings should block your team or CI policy.

## The complete loop

```text
Source of Truth
      ↓
vcp task <slug>
      ↓
vcp ready <slug> --stage plan
      ↓
vcp context <slug> --mode plan
      ↓
Approve plan
      ↓
vcp ready <slug> --stage implement
      ↓
vcp context <slug> --mode implement --include <affected files>
      ↓
Implement bounded scope
      ↓
vcp verify <slug>
      ↓
vcp verify <slug> --run --output .vcp/evidence/<slug>.json
      ↓
vcp context <slug> --mode review --include <changed files/tests>
      ↓
vcp doctor .
      ↓
Merge / release / observe
```

For a completed worked example, see [`../examples/reference-saas-invite/`](../examples/reference-saas-invite/).
