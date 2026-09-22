# Doctor

`vcp doctor` is a read-only audit for repositories using the Vibe Coding Production Kit. It answers a different question from the initializer:

> Is the engineering system actually configured, or were the template files merely copied?

## Run it

From a published/local install:

```bash
vcp doctor .
```

From this GitHub repository:

```bash
npx --yes --package=github:MoeEyani/Vibe-Coding-Production-Kit vibe-coding-production doctor .
```

Machine-readable output:

```bash
vcp doctor . --json
```

Strict CI mode:

```bash
vcp doctor . --strict
```

Default mode exits non-zero only when a `FAIL` exists. `--strict` also exits non-zero when warnings remain.

## What it checks

The doctor currently inspects:

- target directory readability;
- detected stack;
- repository-wide `AGENTS.md`;
- unresolved verification-command slots in `AGENTS.md`;
- presence of core product, architecture, security, testing, and delivery documents;
- known starter-template markers that suggest a document has not been customized yet;
- framework validation CI;
- local validation script;
- planning and independent-review prompts.

## Result semantics

### PASS

Evidence for the expected engineering control was found.

### WARN

The repository can continue, but a project-specific decision is still missing or a recommended control was not found. Examples include an untouched product brief, an unresolved test command, or missing CI scaffolding.

### FAIL

A foundational control is missing or unusable, such as an absent `AGENTS.md` or a missing core source-of-truth document.

## Important limitation

Doctor does **not** certify that a project is secure, correct, compliant, or production-ready. It validates visible engineering signals and configuration. Human review, real tests, threat analysis, operational evidence, and context-specific judgment remain necessary.

## Why there is no readiness score

A single percentage would hide important differences between projects and can create false confidence. Doctor reports concrete checks and remediation instead, so teams can decide which warnings matter for their context.
