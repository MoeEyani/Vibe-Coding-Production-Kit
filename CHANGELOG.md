# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

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
