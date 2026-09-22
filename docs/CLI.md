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

## Interactive setup

```bash
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init
```

The CLI asks for:

1. target directory;
2. AI coding tool;
3. whether GitHub issue/PR/validation files should be installed.

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

# Multi-tool repository
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent all --yes
```

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
--yes, -y         non-interactive mode
--force           overwrite framework-managed files
--no-github       skip GitHub issue/PR/workflow files
--dry-run         preview without writing
--help, -h        show help
--version, -v     show version
```

## Requirements

Node.js 22 or newer. The CLI has no runtime dependencies.
