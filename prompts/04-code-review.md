# Prompt: Independent Code Review

Use a fresh context/agent when practical.

```text
Review this change as a senior engineer. Start from the task requirements and acceptance criteria, then inspect the diff. Do not assume the implementation author's summary is correct.

Look for concrete problems in:
- functional correctness;
- missing acceptance criteria;
- architecture/module-boundary violations;
- authorization and trust-boundary validation;
- data integrity/migration risk;
- race conditions and idempotency;
- error handling/retry behavior;
- API/backward compatibility;
- performance/resource leaks where material;
- duplicated or unnecessary complexity;
- test quality and missing negative paths;
- observability gaps;
- stale or misleading documentation.

For every issue report:
- severity: critical / high / medium / low;
- file and line/area;
- concrete failure scenario;
- why it matters;
- recommended correction.

Do not give style-only feedback unless it affects readability, maintainability, correctness, or agreed conventions. If you find no blocking issue, say what you verified and identify residual risks rather than merely saying “LGTM”.
```
