# Stack Profiles

Stack profiles adapt the generic engineering rules in `AGENTS.md` to the technology already present in a repository.

The goal is not to guess a framework. The CLI only fills commands when repository files provide enough evidence.

## Usage

Automatic detection is the default:

```bash
npx vibe-coding-production init . --agent all --stack auto
```

You can also choose explicitly:

```bash
vcp init . --stack javascript
vcp init . --stack typescript
vcp init . --stack python
vcp init . --stack go
vcp init . --stack generic
```

## JavaScript / Node.js

Detection: `package.json` when no TypeScript marker is present.

The profile:

- detects npm, pnpm, Yarn, or Bun from lockfiles;
- reads `package.json` scripts;
- maps existing `lint` or general `check` scripts into the lint/static-check slot;
- detects `test`, `test:unit`, `test:integration`, `build`, `test:e2e`, and `e2e` when present;
- marks clearly non-applicable checks such as TypeScript type checking as `n/a` instead of forcing the developer to fill irrelevant placeholders;
- adds JavaScript/Node-specific rules around runtime validation, module contracts, environment dependence, and regression tests.

## TypeScript

Detection: `tsconfig.json`.

The profile:

- detects npm, pnpm, Yarn, or Bun from lockfiles;
- reads `package.json` scripts;
- fills only commands backed by existing scripts such as `lint`, `check`, `typecheck`, `test`, `build`, `test:integration`, and `test:e2e`;
- adds TypeScript-specific rules around strictness, runtime validation, module boundaries, and async behavior.

If a required script does not exist, the CLI leaves the command as `<define>` instead of inventing one.

## Python

Detection: `pyproject.toml`, `requirements.txt`, or `uv.lock`.

The profile can recognize evidence for:

- uv, Poetry, or requirements-based installation;
- Ruff formatting/linting;
- mypy type checking;
- pytest tests.

It also adds Python-specific rules for exceptions, resource cleanup, runtime validation, type hints, and framework/domain boundaries.

## Go

Detection: `go.mod`.

Go has stable standard tooling, so the profile can provide stronger defaults:

```text
INSTALL_COMMAND=go mod download
FORMAT_CHECK_COMMAND=test -z "$(gofmt -l .)"
LINT_COMMAND=go vet ./...
TYPECHECK_COMMAND=go test ./...
UNIT_TEST_COMMAND=go test ./...
BUILD_COMMAND=go build ./...
```

The profile also adds rules for error wrapping, `context.Context`, goroutine lifecycle, interfaces, and shared state.

## Why evidence-based detection matters

A professional bootstrapper should not silently assume that every Node project uses the same scripts, every Python project uses pytest, or every repository has the same tooling. Wrong automation is worse than an explicit placeholder.

The invariant is:

> Detect what can be proven. Ask the developer only for decisions that repository evidence cannot safely establish.
