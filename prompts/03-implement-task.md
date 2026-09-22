# Prompt: Implement an Approved Task

```text
Implement only the approved plan and task scope.

Rules:
- follow AGENTS.md and accepted ADRs;
- preserve existing public contracts unless the task explicitly changes them;
- do not refactor unrelated code;
- do not add dependencies unless necessary and justified;
- validate external input at trust boundaries;
- enforce authorization server-side where applicable;
- add/update tests with the behavior;
- add migrations instead of manually mutating persistent schemas;
- update relevant docs/contracts when behavior changes.

After implementation:
1. run all relevant configured verification commands;
2. review the diff for correctness, architecture, security, data integrity, concurrency, error handling, backward compatibility, unnecessary complexity, missing tests, stale docs, and unrelated changes;
3. fix issues found;
4. report exactly what changed, checks actually run, and remaining risks.

Never claim a check passed unless you executed it successfully.
```
