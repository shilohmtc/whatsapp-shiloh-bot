# Shiloh OS — Control Reconciliation — Meta Business Verification Authorization

Date: 2026-08-25
Owner: 00 — Control & Reconciliation

## Control decision

Control ACCEPTS `SHILOH-META-WABA-TEMPLATE-CREATION-PERMISSION-REMEDIATION` as application-diagnostic complete and BLOCKED at a genuine external Meta Business verification gate.

The diagnostic implementation and provider evidence from PR #472 and the reconciliation from PR #473 are accepted as authoritative. Do not redo them.

Current authoritative main at acceptance: `e4e449b3127dc6e14358ce75aff1dd822c19e066`.

Exact current-main Render deploy at acceptance: `dep-da6fsc0u01pc73d4mqgg` — LIVE.

## Proven provider state

Sanitized evidence proves:

- message-template inventory is readable;
- the provider access token is valid and is a SYSTEM_USER token;
- `whatsapp_business_management` is granted;
- `whatsapp_business_messaging` is granted;
- WABA account review is `APPROVED`;
- WABA status is `ACTIVE`;
- WABA ownership type is `SELF`;
- Meta Business verification status is `rejected`;
- overall provider health is `LIMITED`;
- WABA health is `AVAILABLE`;
- APP health is `AVAILABLE`;
- BUSINESS health is `LIMITED`.

The provider token could not enumerate Business Manager context, WABA assigned-user tasks or system-user task state. Those states remain unproven and must not be inferred sufficient or deficient.

## Authoritative cause and recommendation

The directly proven blocker is the rejected Meta Business verification state and associated LIMITED business-level provider health.

Recommendation: remediate the rejected Meta Business verification now. Do not attempt speculative token-scope escalation, role changes, asset reassignment, WABA ownership changes or template retries as workarounds.

If Shiloh OS were my own project, I would choose this path because it addresses the only directly proven business-level restriction while preserving the existing least-privilege provider and application security boundaries.

## JP authorization — bounded external provider remediation

JP is authorized to use authenticated Meta Business administration to remediate only the existing rejected Meta Business verification.

Authorized actions are limited to:

1. inspect the existing Business verification rejection/reason and Meta-requested remediation requirements;
2. correct factual business-verification fields only where the correction is supported by authoritative business records and is required for verification;
3. submit or resubmit the existing Business verification using accurate business information;
4. upload only the supporting business documents specifically required by Meta for verification;
5. use an available appeal/review path for the existing rejected verification; and
6. if Meta provides no direct correction/resubmission/appeal path, open the appropriate Meta Business Support case about the rejected Business verification and request restoration of Business verification eligibility/capability.

This is a manual provider-account action by JP. It does not authorize ChatGPT or a specialist to change provider access or security settings on JP's behalf.

## Explicitly not authorized

Do not:

- create a new Meta Business portfolio as a workaround;
- change legal business identity to information not supported by authoritative business records;
- add/remove human users or change their Business Manager roles;
- add/remove/change system users or system-user roles;
- change WABA assigned-user/system-user task assignments;
- change app/token permission scopes;
- rotate or replace provider credentials;
- change WABA ownership, partner sharing or business ownership;
- change phone-number ownership/registration;
- retry template creation;
- create `shiloh_staff_auth_otp_v1`;
- send a real staff-auth WhatsApp message;
- consume a new Christel challenge;
- activate staff Calendar/auth pilot controls; or
- weaken existing Calendar/Google authority gates.

If Meta requires any non-verification security/ownership/access mutation above to proceed, stop and return the exact requirement to 00 before making it.

## Completion gate for JP's provider step

JP's external provider remediation is complete only when Meta itself reports the Business verification state as verified/approved, or when a Meta Support case has been opened because no direct remediation path exists.

A screenshot or exact sanitized provider status from the authenticated Meta interface is sufficient to return to 00. Do not provide business registration documents, identity documents, access tokens, phone numbers, account IDs or other sensitive provider material in chat unless specifically necessary and appropriately redacted.

## Follow-on sequence

After Meta reports the business as verified:

1. return to 30 — WhatsApp & Meta Integration;
2. 30 performs read-only proof that Business verification is `verified` and the business-level provider limitation has cleared;
3. return to 00;
4. 00 separately authorizes exactly one creation/submission of `shiloh_staff_auth_otp_v1`;
5. Meta must report the exact template APPROVED and Shiloh provider readback must match;
6. 00 separately authorizes one bounded genuine Christel read-only pilot challenge;
7. successful pilot routes immediately to 10 — Booking & Admin UX for `SHILOH-CALENDAR-CREATE-BOOKING`.

Do not divert into secondary Calendar features before this dependency path is complete.

## What this now enables

This Control decision does not make staff Calendar login usable yet. It gives JP a narrow, durable authorization to remediate the one directly proven external blocker — rejected Meta Business verification — without reopening finished Shiloh application work or broadening Meta security authority.

Once Meta verifies the business and 30 proves the limitation is cleared, Shiloh can proceed to the separately gated one-template creation step rather than redesigning authentication or Calendar architecture.
