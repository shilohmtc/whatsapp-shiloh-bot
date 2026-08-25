# Shiloh OS — Project Tracker Addendum — Meta Business Verification Convergence

Date: 2026-08-25
Owner: 00 — Control & Reconciliation

## Controlled unit

`SHILOH-META-BUSINESS-VERIFICATION-CONVERGENCE-RECHECK`

Status: COMPLETE — META SUPPORT REQUIRED.

Execution owner: 30 — WhatsApp & Meta Integration — terminal specialist work complete.
Acceptance: 00 — Control & Reconciliation.
External dependency: Meta Business Support.

This Meta track is parallel and is not on the critical path for Christel browser Calendar booking.

## Final authorized provider evidence

The single final GET-only recheck authorized by PR #475 has been consumed. No further provider recheck is authorized under this unit.

Authenticated Meta UI reports Business verification VERIFIED / APPROVED.

Fresh sanitized provider API evidence still reports:

- Business verification `rejected`;
- overall provider health `LIMITED`;
- BUSINESS health `LIMITED`;
- WABA health `AVAILABLE`;
- APP health `AVAILABLE`.

The following remain proven:

- token valid;
- token type SYSTEM_USER;
- `whatsapp_business_management` granted;
- `whatsapp_business_messaging` granted;
- template inventory readable;
- WABA account review `APPROVED`;
- WABA `ACTIVE`;
- WABA ownership `SELF`.

The Meta UI and live provider API therefore remain non-converged after the final authorized recheck.

## Audit safety and production evidence

The bounded audit used the existing default-off diagnostic only.

Audit deploy: `dep-da6hu6942hec73d6ame0`.

`META_WABA_TEMPLATE_PERMISSION_AUDIT_ON_START` was restored to `false` immediately after evidence capture.

Re-lock deploy: `dep-da6hug8n74is73f6cm2g`.

Re-lock startup evidence:

- Node 24.14.1;
- build successful;
- zero npm vulnerabilities;
- Google Calendar provider health passed;
- Shiloh started normally.

## Holds / do not redo

- Do not perform another provider convergence recheck under PR #475.
- Do not experiment with token scopes, roles, system users, asset assignments, WABA ownership/sharing, credentials, or phone registration.
- Do not create or submit `shiloh_staff_auth_otp_v1` yet.
- Do not create any other template as a workaround.
- Do not send a real staff-auth WhatsApp message or another Christel challenge.
- Do not change Calendar authority because of this Meta discrepancy.

No unauthorized provider, permission, template, message, challenge, credential, phone-registration, or Calendar mutation occurred during the final recheck.

## Next sequence

1. NOW / PARALLEL — JP opens a Meta Business Support case using the exact sanitized UI/API discrepancy.
2. 30 remains paused; no further provider polling or permission experimentation while support is pending.
3. When Meta provides a substantive resolution or the provider state demonstrably changes, return that evidence to 00 — Control & Reconciliation.
4. Template creation remains separately gated and requires a new Control decision after the provider-side state is resolved.
5. Christel browser Calendar work continues independently under 10 — Booking & Admin UX and must not wait for Meta staff OTP.
