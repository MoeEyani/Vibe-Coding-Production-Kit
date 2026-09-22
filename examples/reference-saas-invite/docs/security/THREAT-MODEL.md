# Threat Model — Organization Invitations

## Assets

| Asset | Why it matters |
|---|---|
| Organization membership | Grants tenant data/access |
| Invitation bearer token | Can authorize joining an organization |
| Verified email binding | Connects invite intent to identity |
| Audit trail | Needed for investigation and admin accountability |

## Trust boundaries

```text
Admin client -> authenticated API -> invitation service -> database
Email provider -> invitee mailbox/browser -> authenticated API
```

## Threat inventory

| ID | Threat | Control | Verification |
|---|---|---|---|
| T-001 | Cross-tenant invite issuance | Actor org must equal target org | Negative test |
| T-002 | Broken access control | Require `members.invite` | Negative test |
| T-003 | DB leak exposes usable invite links | Persist hash only | Storage assertion test |
| T-004 | Stolen token used by wrong account | Verified email must match | Negative test |
| T-005 | Replay / duplicate acceptance | Atomic pending->accepted transition | Replay test + DB integration test in production |
| T-006 | Expired token accepted | Compare clock with `expiresAt` | Boundary/expiry tests |
| T-007 | Revoked token accepted | Terminal revoked state | Negative test |
| T-008 | Client chooses another tenant on acceptance | Org derived only from invite | API contract test |
| T-009 | Invite bombing | Rate limits / quotas outside this reference code | Integration/abuse tests |
| T-010 | Token leaks through logs/analytics | Redaction + never log token | Logging tests/manual review |

## Residual risks

Email account compromise can still expose a valid invitation before acceptance. Production policy may require additional controls for privileged roles (shorter expiry, re-authentication, admin approval, or SSO/SCIM).
