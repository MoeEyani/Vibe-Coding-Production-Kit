export class InvitationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'InvitationError';
    this.code = code;
  }
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') throw new InvitationError('invalid_email', 'Email is required.');
  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new InvitationError('invalid_email', 'Email is invalid.');
  }
  return normalized;
}

export function createInvitationEntity({ id, orgId, email, tokenHash, issuedByUserId, expiresAt }) {
  if (!id || !orgId || !tokenHash || !issuedByUserId) {
    throw new InvitationError('invalid_invitation', 'Invitation identifiers are required.');
  }
  if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
    throw new InvitationError('invalid_expiry', 'Invitation expiry is invalid.');
  }

  return {
    id,
    orgId,
    email: normalizeEmail(email),
    tokenHash,
    issuedByUserId,
    expiresAt: new Date(expiresAt),
    status: 'pending',
    acceptedByUserId: null,
    acceptedAt: null
  };
}

export function revokeInvitation(invitation) {
  if (invitation.status !== 'pending') {
    throw new InvitationError('invalid_transition', 'Only pending invitations can be revoked.');
  }
  return { ...invitation, status: 'revoked' };
}

export function acceptInvitationEntity(invitation, { userId, verifiedEmail, now }) {
  if (invitation.status !== 'pending') {
    throw new InvitationError('invite_not_pending', 'Invitation is no longer pending.');
  }
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new InvitationError('invalid_clock', 'Current time is invalid.');
  }
  if (now.getTime() >= invitation.expiresAt.getTime()) {
    throw new InvitationError('invite_expired', 'Invitation has expired.');
  }
  if (normalizeEmail(verifiedEmail) !== invitation.email) {
    throw new InvitationError('email_mismatch', 'Verified email does not match invitation.');
  }
  if (!userId) {
    throw new InvitationError('invalid_user', 'Authenticated user is required.');
  }

  return {
    ...invitation,
    status: 'accepted',
    acceptedByUserId: userId,
    acceptedAt: new Date(now)
  };
}
