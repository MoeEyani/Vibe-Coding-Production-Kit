# Example Feature Spec: Email Registration

## Actor
Unauthenticated visitor.

## Preconditions
The email address is not already attached to an active account.

## Main flow
1. Visitor submits email and password.
2. Service validates input.
3. Service creates an unverified account.
4. Service sends a verification token through the email adapter.
5. Visitor opens a valid token.
6. Service marks the account verified.

## Edge/failure cases
- invalid email;
- weak password;
- existing account;
- expired/used token;
- repeated submit;
- email provider timeout/failure;
- verification request abuse.

## Acceptance criteria
- AC-01: valid new credentials create exactly one unverified account.
- AC-02: passwords are never stored or logged in plaintext.
- AC-03: duplicate requests cannot create duplicate accounts for the same normalized email.
- AC-04: verification tokens expire and cannot be reused.
- AC-05: externally observable responses do not unnecessarily enable account enumeration.
- AC-06: rate controls exist for registration and verification endpoints.

## Expected tests
- unit: email normalization/password policy/token state transition;
- integration: unique constraint, password hash adapter, token persistence;
- API integration: validation, duplicate submit, authorization-independent responses;
- E2E: register -> verify -> sign in (if this is a critical journey).
