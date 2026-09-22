# Contributing

Thanks for improving Vibe Coding Production Kit.

## Contribution principles

- Keep the framework vendor-neutral unless a file is explicitly tool-specific.
- Prefer concrete, testable engineering guidance over vague “best practices.”
- Avoid adding process that does not reduce real risk or improve delivery.
- Templates should be useful when copied into a real project.
- Keep examples safe and production-minded.
- Keep the CLI dependency-light; adding runtime dependencies requires clear justification.

## Proposing a change

For substantial changes, open an issue describing:
- problem with the current framework;
- proposed outcome;
- users/workflows affected;
- trade-offs;
- example of the improved experience.

## Pull requests

Keep PRs focused. Explain what changed and why, and update examples/docs when a template or CLI contract changes.

Requires Node.js 22+.

Run before submitting:

```bash
npm ci
npm run validate
npm run pack:check
```
