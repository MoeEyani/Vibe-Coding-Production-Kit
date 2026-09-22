# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added
- End-to-end `docs/QUICKSTART.md` covering bootstrap, task creation, readiness, bounded context, verification evidence, review, and repository audit.
- Ready-to-paste v0.8.0 release notes and GitHub generated-release-notes category configuration.

## [0.8.0] - 2026-09-22

### Added
- Safe-by-default `vcp verify <task>` verification plan/evidence workflow.
- Explicit `--run` consent before repository-controlled shell commands can execute.
- Implementation-readiness enforcement before verification execution.
- Sequential command execution with stop-on-first-failure and skipped downstream checks.
- Optional repository-local JSON evidence with command, timing, exit, signal, timeout, and status metadata without persisted stdout/stderr.
- Repeatable `--only` command selection and per-command `--timeout-ms`.
- Preflight output-path and overwrite protection before any command execution.
- Verification tests covering preview safety, successful evidence, failure stopping, JSON CLI output, output conflicts, and unready-task refusal.

## [0.7.0] - 2026-09-22

### Added
- Read-only `vcp ready <task>` task-readiness gate with separate `plan` and `implement` stages.
- Planning gate for outcome, resolvable Source of Truth, concrete acceptance criteria, and explicit scope.
- Implementation gate for affected boundaries, domain invariants, security/privacy, failure modes, observability, testing, rollout/recovery, and a concrete implementation plan.
- Human-readable and `--json` reports plus `--strict` warning enforcement for CI/team policy.
- Repository-root validation for Source of Truth references and detection of unresolved template references.
- Regression coverage for blank task templates, plan-vs-implement semantics, unsafe references, and CLI JSON output.

### Fixed
- Readiness parsing now uses horizontal whitespace where required, preventing empty fields or acceptance criteria from accidentally consuming the next Markdown line.

## [0.6.0] - 2026-09-22

### Added
- `vcp context <task>` phase-specific context pack builder for plan, implement, review, security, and release work.
- Automatic inclusion of repository instructions, task definition, phase prompt, and existing Source of Truth references from the task pack.
- Repeatable `--include` for narrowly scoped implementation/test context and `--output` for reusable repository-local packs.
- Repository-root path protections and a default 120 KB context budget to prevent accidental local-file leakage or unbounded context dumps.
- Context pack tests covering source selection, explicit includes, safe output, overwrite protection, path traversal, size budgets, and the public CLI path.

## [0.5.0] - 2026-09-22

### Added
- Context-aware `vcp task <slug>` generator for bounded implementation task packs.
- Task packs include source-of-truth references, acceptance criteria, scope, domain/security/observability/test/rollout sections, plan-before-code, independent review, and completion reporting.
- Verification commands are imported from concrete `AGENTS.md` configuration instead of guessed from the stack.
- Safe `--dry-run`, `--force`, `--title`, and `--dir` task controls.
- Task generator tests for command discovery, overwrite protection, dry-run behavior, and slug validation.

## [0.4.0] - 2026-09-22

### Added
- Worked multi-tenant SaaS invitation reference vertical slice.
- Completed product, domain, architecture, data, ADR, threat-model, testing, and delivery artifacts for the reference.
- Layered dependency-free Node.js implementation with negative-path tests for authorization, tenant boundaries, token hashing, expiry, replay, and email binding.
- Reference-project AGENTS rules and explicit production-gap documentation.

## [0.3.0] - 2026-09-22

### Added
- Read-only `doctor` command with `PASS / WARN / FAIL` findings.
- JSON output for automation and `--strict` mode for CI enforcement.
- Detection of unresolved AGENTS verification commands and untouched starter-template signals.
- Doctor guidance that deliberately avoids a misleading single readiness score.

## [0.2.0] - 2026-09-22

### Added
- Zero-runtime-dependency Node.js CLI for bootstrapping the framework into new or existing repositories.
- Interactive and non-interactive initialization modes.
- `--dry-run`, `--force`, and `--no-github` safety controls.
- Thin agent adapters for Claude Code and GitHub Copilot; Codex and Cursor use `AGENTS.md` directly.
- CLI tests covering installation, conflicts, directory merging, adapters, dry-run, installed-framework validation, and stack detection.
- Evidence-based stack profiles for TypeScript, Python, and Go.
- Automatic package-manager/script discovery for TypeScript and tooling discovery for Python.
- Direct execution from the GitHub repository through `npx` package specs.

### Changed
- CI now validates the framework, CLI tests, syntax, and npm package contents on Node.js 24 LTS.
- Framework validation now works both in this repository and in projects bootstrapped by the CLI.

## [0.1.0] - 2026-09-22

### Added
- Initial Vibe Engineering operating model.
- Product, architecture, data, security, testing, and delivery templates.
- Repository-wide `AGENTS.md`.
- Agent prompts for discovery, planning, implementation, review, security, refactoring, and release readiness.
- GitHub contribution and CI scaffolding.
- English and Arabic README files.
