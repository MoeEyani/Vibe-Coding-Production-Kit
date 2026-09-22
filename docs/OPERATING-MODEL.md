# Operating Model

## Roles

### Human decision owner
Owns product intent, architecture trade-offs, risk acceptance, prioritization, and final approval.

### Planning agent
Reads the source of truth and proposes a bounded technical plan. It does not edit code during planning.

### Implementation agent
Executes the approved scope, adds tests, runs checks, and self-reviews the diff.

### Review agent / human reviewer
Starts from the requirements and diff rather than trusting the implementation narrative. Focuses on concrete defects and risk.

### CI
Acts as the mechanical gate for reproducible checks. CI is more authoritative than an agent saying “looks good.”

## Source-of-truth hierarchy

1. Accepted product requirements and acceptance criteria
2. Security/privacy/compliance requirements
3. Architecture + accepted ADRs
4. API/data contracts
5. Task scope
6. Existing code behavior where not contradictory
7. Chat context

When sources conflict, do not silently guess. Surface the conflict and resolve it in the durable source of truth.

## Change loop

1. Select one ready task.
2. Plan without code changes.
3. Review scope and assumptions.
4. Implement the smallest coherent solution.
5. Add/update tests with the behavior.
6. Run configured validation.
7. Self-review the diff.
8. Independent review.
9. Merge only when gates pass.
10. Observe after release and feed lessons back into docs/ADRs/tests.
