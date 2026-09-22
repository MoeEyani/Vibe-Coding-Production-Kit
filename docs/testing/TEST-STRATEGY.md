# Test Strategy

## Objectives
Testing should create confidence in important behavior and contracts, not maximize a vanity coverage number.

## Risk matrix
| Area | Failure impact | Change frequency | Test level | Notes |
|---|---:|---:|---|---|
| | | | | |

## Test layers

### Unit
Use for deterministic business rules and state transitions.

### Integration
Use for databases, queues, caches, filesystem, external adapters, framework configuration, and serialization boundaries.

### Contract
Use where independently changing components/services must agree on request/response/event contracts.

### End-to-end
Reserve for critical journeys and integration confidence across the deployed system.

### Regression
Every important production defect should leave behind a test at the cheapest reliable layer.

## Critical journeys
| Journey | E2E? | Why |
|---|---|---|
| Sign-in / auth recovery | | |
| Core transaction | | |
| Payment/billing if applicable | | |
| Destructive admin action | | |

## Negative/security paths
-

## Test data
Document factories/fixtures, isolation, deterministic time/randomness, sensitive-data restrictions, and cleanup.

## Flake policy
Flaky tests are defects. Do not normalize blind retries as a permanent fix.

## CI tiers
Example:
- PR: fast deterministic suite;
- merge/main: broader integration suite;
- pre-release: E2E/security/smoke;
- scheduled: expensive or long-running checks.
