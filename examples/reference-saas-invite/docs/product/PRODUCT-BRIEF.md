# Product Brief — Organization Invitations

## Problem

Teams need a controlled way to add people to an organization without administrators sharing credentials or operators manually editing membership records. A weak invitation flow creates tenant-boundary, account-takeover, replay, and audit risks.

## Primary users

- Organization administrator: invites a known person to the administrator's organization.
- Invitee: accepts an invitation after authenticating with the intended verified email address.

## Desired outcome

An authorized organization administrator can issue a time-limited invitation, and the intended person can accept it exactly once into the correct organization with an auditable record.

## Success signals

- No accepted invitation crosses organization boundaries.
- No raw invitation token is persisted.
- Expired, revoked, already-used, or email-mismatched invitations cannot create membership.
- Creation and acceptance generate auditable domain events in the production design.

## Constraints

- Multi-tenant system.
- Invitation links may pass through email systems, browsers, and user devices and must be treated as bearer secrets.
- Acceptance must tolerate duplicate/retried requests safely.
- User-facing failures should avoid leaking unnecessary invitation/account state.

## Non-goals

- Building the authentication system.
- Implementing email delivery.
- Defining all organization roles.
- Supporting bulk import or SCIM in this slice.
