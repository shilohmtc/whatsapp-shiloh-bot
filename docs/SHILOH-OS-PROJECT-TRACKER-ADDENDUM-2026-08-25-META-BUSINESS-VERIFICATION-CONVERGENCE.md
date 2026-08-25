# Shiloh OS — Project Tracker Addendum — Meta Business Verification Convergence

Date: 2026-08-25
Owner: 00 — Control & Reconciliation

## Current controlled unit

`SHILOH-META-BUSINESS-VERIFICATION-CONVERGENCE-RECHECK`

Status: AUTHORIZED / WAITING FOR BOUNDED PROVIDER PROPAGATION WINDOW.

Execution owner: 30 — WhatsApp & Meta Integration.
Acceptance: 00 — Control & Reconciliation.
Priority: HIGHEST CURRENT CALENDAR DEPENDENCY.

## Current evidence

JP's authenticated Meta UI reports Business verification VERIFIED / APPROVED.

Read-only provider API evidence recorded by commit `63bc7feaaf4ae313d4f4bde717fad03f1d5b2aa4` still reports:

- Business verification `rejected`;
- overall provider health `LIMITED`;
- BUSINESS health `LIMITED`;
- WABA and APP health `AVAILABLE`.

Token validity, SYSTEM_USER token type, required WhatsApp scopes, WABA review `APPROVED`, WABA status `ACTIVE`, WABA ownership `SELF`, and readable template inventory remain proven.

No template creation, message, challenge, security/access mutation or Calendar activation occurred.

## Control authorization

PR for this addendum authorizes exactly one further GET-only provider recheck no earlier than 2026-08-25 06:45 Africa/Johannesburg (04:45 UTC).

Success requires both:

1. Business verification no longer reports `rejected`; and
2. BUSINESS health no longer reports `LIMITED`.

If successful: return read-only proof to 00. Template creation remains separately gated.

If either gate still fails: stop rechecking and route the exact UI/API mismatch to Meta Business Support through 00/JP.

## Holds

No template creation retry, no `shiloh_staff_auth_otp_v1` submission, no real staff-auth message, no Christel challenge, no token/role/system-user/asset/WABA ownership/credential/phone-registration mutation, and no Calendar/auth activation.

## Priority sequence

1. NOW — wait until the bounded recheck time and run one GET-only provider recheck.
2. If converged, 00 separately authorizes one OTP template creation.
3. If not converged, JP opens Meta Business Support case with sanitized discrepancy evidence.
4. After exact OTP template APPROVED/readback, 00 authorizes one Christel read-only pilot.
5. Successful pilot routes immediately to 10 — Booking & Admin UX for `SHILOH-CALENDAR-CREATE-BOOKING`.
