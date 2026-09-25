# Start Here

Use this repository as a repeatable engineering operating system for AI-assisted projects.

For a new repository, the fastest start is:

```bash
npx vibe-coding-production init . --agent all --stack auto --yes
```

If you intentionally want the current GitHub source instead of the published npm package:

```bash
npx --yes github:Moeeryani/Vibe-Coding-Production-Kit init . --agent all --stack auto --yes
```

See `docs/CLI.md` for safe overwrite behavior, tool adapters, and non-interactive options.

## Recommended order

The checklist below describes engineering state that should exist before production work. It is **not** a form-filling checklist for the developer. Your coding agent should inspect repository evidence, draft these artifacts, run VCP gates, and ask you only for decisions that require human product or engineering intent.

### Before code

- [ ] Product brief
- [ ] PRD and acceptance criteria
- [ ] User flows and UI states
- [ ] Domain model and invariants
- [ ] Architecture boundaries
- [ ] Data model
- [ ] ADRs for major decisions
- [ ] Threat model
- [ ] Test strategy
- [ ] Delivery breakdown

### Before each task

- [ ] Definition of Ready passes
- [ ] Agent reads relevant source of truth
- [ ] Plan is produced before edits
- [ ] Scope and tests are explicit

### Before merge

- [ ] Acceptance criteria verified
- [ ] Automated checks pass
- [ ] Diff self-reviewed
- [ ] Independent review completed
- [ ] Security impact considered
- [ ] Documentation updated

### Before release

- [ ] Deployment plan understood
- [ ] Migrations/backfills safe
- [ ] Rollback/recovery known
- [ ] Observability in place
- [ ] Critical journeys verified

## Agent-first setup

After `vcp init`, tell the coding agent to inspect the repository and establish VCP from evidence. A useful instruction is:

```text
Set up VCP for this repository. Inspect the existing code, package scripts, tests,
architecture, and documentation. Draft the Source of Truth from repository evidence.
Distinguish discovered facts from proposed decisions, ask me only for unresolved
human-intent decisions, and run vcp doctor . when done.
```

The agent should write the drafts and update `AGENTS.md`; the developer approves or corrects decisions that cannot be established safely from repository evidence.

## Day-to-day feature work

Once the Source of Truth is established, state the feature intent normally, for example:

```text
Use VCP and add verified email change. Draft the bounded task, run readiness,
ask me only for unresolved product/engineering decisions, plan before coding,
implement the approved scope, verify it, and perform an independent review.
```

Behind that interaction, the coding agent should drive:

```text
vcp task <slug>
      ↓
vcp ready <slug> --stage plan
      ↓
vcp context <slug> --mode plan
      ↓
plan + human decision approval
      ↓
vcp ready <slug> --stage implement
      ↓
vcp context <slug> --mode implement --include <affected files>
      ↓
implement
      ↓
vcp verify <slug>
      ↓
vcp verify <slug> --run
      ↓
vcp context <slug> --mode review --include <changed files/tests>
      ↓
vcp doctor .
```

The developer should not have to manually populate information the agent can reliably discover or draft.
