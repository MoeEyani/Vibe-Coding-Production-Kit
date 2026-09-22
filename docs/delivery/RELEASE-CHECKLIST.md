# Release Checklist

## Before release
- [ ] Scope/version identified.
- [ ] CI is green for the release commit.
- [ ] Critical acceptance journeys verified.
- [ ] Database migrations reviewed for lock/load/compatibility risk.
- [ ] Backfills have an execution and recovery plan.
- [ ] Feature flags/config values verified.
- [ ] Required secrets/configuration exist without being committed.
- [ ] Observability and dashboards/alerts are ready.
- [ ] Rollback or forward-fix strategy is understood.
- [ ] Known issues are documented.

## During release
- [ ] Deployment health monitored.
- [ ] Migrations/backfills observed.
- [ ] Error rate/latency/key business metrics checked.

## After release
- [ ] Smoke tests pass in production.
- [ ] No unexpected alert/error increase.
- [ ] Important business event flow confirmed.
- [ ] Release notes/changelog updated.
- [ ] Follow-up issues created for deferred work.
