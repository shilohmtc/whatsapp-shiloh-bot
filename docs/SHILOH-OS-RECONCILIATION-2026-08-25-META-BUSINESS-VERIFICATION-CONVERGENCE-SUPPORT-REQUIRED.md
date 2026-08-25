# Shiloh OS — Control Reconciliation — Meta Business Verification Convergence Support Required

Date: 2026-08-25
Owner: 00 — Control & Reconciliation
Execution return: 30 — WhatsApp & Meta Integration
Control authority: PR #475
Controlled unit: `SHILOH-META-BUSINESS-VERIFICATION-CONVERGENCE-RECHECK`

## Control acceptance

00 accepts the terminal return from 30 as COMPLETE — META SUPPORT REQUIRED.

The exactly one final GET-only provider recheck authorized by PR #475 was consumed after the bounded propagation window. It remained non-converged.

Authenticated Meta UI state:

- Business verification VERIFIED / APPROVED.

Sanitized live provider API state:

- token valid;
- SYSTEM_USER token;
- `whatsapp_business_management` granted;
- `whatsapp_business_messaging` granted;
- template inventory readable;
- WABA account review `APPROVED`;
- WABA `ACTIVE`;
- WABA ownership `SELF`;
- WABA health `AVAILABLE`;
- APP health `AVAILABLE`;
- Business verification `rejected`;
- overall provider health `LIMITED`;
- BUSINESS health `LIMITED`.

Therefore the authenticated Meta UI and live provider API remain inconsistent after the final authorized recheck.

## Safety / production return

Audit deploy: `dep-da6hu6942hec73d6ame0`.

The bounded startup audit gate was restored immediately to:

`META_WABA_TEMPLATE_PERMISSION_AUDIT_ON_START=false`

Re-lock deploy: `dep-da6hug8n74is73f6cm2g`.

Re-lock startup evidence:

- Node 24.14.1;
- build successful;
- zero npm vulnerabilities;
- Google Calendar provider health passed;
- Shiloh started normally.

No unauthorized template creation, staff-auth send, Christel challenge, token-scope change, role/system-user change, asset-assignment change, WABA ownership/sharing change, credential/phone-registration change, or Calendar-authority change occurred.

## Terminal Control decision

Do not perform another provider convergence recheck under PR #475. Do not experiment with permissions or access configuration.

The exact UI/API discrepancy must now be escalated to Meta Business Support. `shiloh_staff_auth_otp_v1` creation remains blocked and separately gated until Meta resolves the provider-side state and 00 issues fresh authorization.

30 has no further execution action while Meta support is pending.

This Meta track is parallel and must not block the current Christel browser Calendar path under 10 — Booking & Admin UX.

## External escalation payload

Meta Business Support should be asked to reconcile why the authenticated Meta UI reports Business verification VERIFIED / APPROVED while the live provider API continues to report Business verification `rejected` and BUSINESS health `LIMITED`, despite WABA review `APPROVED`, WABA `ACTIVE`, WABA ownership `SELF`, and WABA/APP health `AVAILABLE` using a valid SYSTEM_USER token with the required WhatsApp management and messaging permissions.

No permission changes or template retries should be attempted merely to force convergence.
