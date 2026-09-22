# Start Here

Use this repository as a repeatable engineering operating system for AI-assisted projects.

For a new repository, the fastest start is:

```bash
npx --yes github:MoeEyani/Vibe-Coding-Production-Kit init . --agent all
```

See `docs/CLI.md` for safe overwrite behavior, tool adapters, and non-interactive options.

## Recommended order

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
