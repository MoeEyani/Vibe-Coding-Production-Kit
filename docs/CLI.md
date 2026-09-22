# CLI

The CLI bootstraps the Vibe Coding Production Kit into a new or existing repository without replacing unrelated files.

## Run directly from GitHub

Until the npm package is published, npm can execute the package directly from this GitHub repository:

```bash
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent all
```

After an npm release, the shorter command will be:

```bash
npx vibe-coding-production init
```

The installed executable is also available as `vcp`.

To audit an existing repository without writing files:

```bash
vcp doctor .
```

See [`DOCTOR.md`](DOCTOR.md) for JSON output and strict CI behavior.

## Interactive setup

```bash
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init
```

The CLI asks for:

1. target directory;
2. AI coding tool;
3. stack profile (auto/generic/typescript/python/go);
4. whether GitHub issue/PR/validation files should be installed.

## Non-interactive examples

```bash
# Codex — AGENTS.md is used directly
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent codex --yes

# Cursor — AGENTS.md is used directly
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent cursor --yes

# Claude Code — adds a thin CLAUDE.md adapter
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent claude --yes

# GitHub Copilot — adds .github/copilot-instructions.md
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent copilot --yes

# Multi-tool repository with stack auto-detection
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent all --stack auto --yes
```

## Create a bounded task pack

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production task accept-invite --title "Accept invitation"
```

The task generator writes `docs/tasks/<slug>.md`, refuses overwrite unless `--force` is used, supports `--dry-run`, and imports concrete verification commands from `AGENTS.md`. See [`TASK-PACKS.md`](TASK-PACKS.md).

## Gate task readiness

A task can be ready to plan before it is ready to implement. Check those stages separately:

```bash
vcp ready accept-invite --stage plan
vcp ready accept-invite --stage implement
```

The planning gate blocks missing outcome, Source of Truth, acceptance criteria, or scope. The implementation gate additionally requires resolved architecture/data/integration boundaries, domain invariants, security/privacy, failure modes, observability, test coverage, rollout/recovery, and an implementation plan. Use `--json` for automation and `--strict` to make warnings non-zero. See [`TASK-READINESS.md`](TASK-READINESS.md).

## Build a bounded AI context pack

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit \
  vibe-coding-production context accept-invite --mode plan
```

`context` combines the task, `AGENTS.md`, the phase-specific operating prompt, and existing files referenced in the task's Source of Truth. Add current implementation files explicitly with repeatable `--include` flags. Print to stdout or use `--output` to save a pack inside the repository. See [`CONTEXT-PACKS.md`](CONTEXT-PACKS.md).

## Safety behavior

The CLI is intentionally conservative:

- it merges into existing directories instead of deleting them;
- it refuses to overwrite any framework-managed file by default;
- `--dry-run` previews every file that would be written;
- `--force` is required to replace an existing managed file;
- `--no-github` skips GitHub-specific templates and workflow files.

Before using `--force`, inspect the reported conflicts. The CLI never treats an overwrite as implicit approval.

## Options

```text
--agent <name>    generic | codex | cursor | claude | copilot | all
--stack <name>    auto | generic | typescript | python | go
--yes, -y         non-interactive mode
--force           overwrite framework-managed files
--no-github       skip GitHub issue/PR/workflow files
--dry-run         preview without writing
--title <text>    task title
--stage <name>    readiness stage: plan | implement
--dir <path>      task/context target repository (default: current directory)
--mode <name>     context mode: plan | implement | review | security | release
--include <path>  add an explicit context file; repeatable
--output <path>   write context pack inside the repository instead of stdout
--max-bytes <n>   maximum context pack bytes; 0 disables the limit
--help, -h        show help
--version, -v     show version
```

## Requirements

Node.js 22 or newer. The CLI has no runtime dependencies.

See [`STACK-PROFILES.md`](STACK-PROFILES.md) for evidence-based TypeScript, Python, and Go adaptation.
