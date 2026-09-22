# Prompt: Plan a Task Before Coding

```text
Read:
- AGENTS.md
- the task/issue
- relevant PRD acceptance criteria
- relevant architecture/domain/data/security documents
- applicable ADRs
- existing implementation and tests in the affected area

Do not modify code yet.

Produce a bounded implementation plan containing:
1. requirement restatement;
2. assumptions that affect the design;
3. affected modules/files and why;
4. proposed implementation steps;
5. API/data/migration impact;
6. security/privacy/authorization impact;
7. concurrency/idempotency/failure-mode concerns where relevant;
8. edge cases;
9. tests to add/update by layer;
10. verification commands to run;
11. architecture or requirement conflicts;
12. explicit out-of-scope items.

Prefer the smallest coherent change. Do not propose unrelated refactors.
```
