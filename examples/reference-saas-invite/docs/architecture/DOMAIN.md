# Domain — Invitations

## Entity: Invitation

Fields:
- `id`
- `orgId`
- `email` (normalized)
- `tokenHash`
- `status`: `pending | accepted | revoked`
- `issuedByUserId`
- `expiresAt`
- `acceptedByUserId?`
- `acceptedAt?`

## Invariants

1. Invitation belongs to exactly one organization.
2. Raw token is not part of persistent domain state.
3. Only `pending` may transition to `accepted` or `revoked`.
4. Expired invitations are not acceptable even when status remains `pending`.
5. Accepting user must have a verified email equal to the invited normalized email.
6. Organization membership target is derived from the invitation, not caller input.
7. A successful acceptance transition occurs at most once.

## State transitions

```text
pending -> accepted
pending -> revoked
pending -(time passes)-> expired behavior (derived, not persisted in this example)
accepted -> terminal
revoked -> terminal
```

The example derives expiry from `expiresAt` instead of adding a fourth persisted status, avoiding contradictory `status=pending` plus `isExpired=true` flags.
