# Shiloh OS — Provider Credential Rotation Reconciliation

Date: 2026-08-21
Owning workstream: Production / DevOps
Status: 🟢 VERIFIED COMPLETE

## Scope and authoritative baseline

This reconciliation closes the provider-credential security hold introduced by Tracker reconciliation PR #386. It was performed against GitHub `main` `ae3825925277205512a4db0d9e13964fb3e79ea5`, the current Master, Project Tracker, latest guarded-Juvan reconciliation and Engineering Governance.

Current accepted application code remains PR #388 / `e4833a743945db63b8cce3731d593f76c9f17921`. PR #389 and this reconciliation are documentation-only. The rotation preserves PR #385's completed Meta template contracts and production behaviour, plus every newer Juvan, booking, Calendar, CRM and human-truth boundary.

No old or replacement credential value was displayed, copied into chat, logged or committed.

## Exposed credential and legitimate ownership

Non-secret log fingerprints and code/runtime consumer tracing uniquely established the exposed item as the Meta WhatsApp Cloud API bearer credential stored in Render as `WHATSAPP_TOKEN`.

Legitimate runtime ownership is bounded to:

- Render service `shiloh-whatsapp-bot`;
- Meta business `406573210678288`;
- app `Shiloh_MTC`;
- production WABA `Shiloh_MTC`, ID `4002592316709920`; and
- the service's bounded WhatsApp transport and template-verification modules.

No OpenAI or Google credential matched the exposure evidence. No unrelated secret was rotated.

## Forward log hardening

PR #387 merged as `8e124ec8a06183576db67ce6e3b27eca28b7d85e` before replacement installation.

- The regression reproducing the original nested Axios serialization leak now passes.
- Nested `config`, `request` and `response` objects are not serialized.
- Safe error code/status evidence remains available.
- CI #1212 passed the full PR gate: 835 tests.
- PR #385's frozen Meta template contracts and trigger behaviour remain unchanged.

## Controlled replacement and least-privilege identity

The initially generated replacement was installed and verified before the stronger final ownership boundary was established. Meta's revoke operation is system-user-wide, so a dedicated production identity was created instead of leaving the final token on the generic user.

Final authority is:

- dedicated system user name: `Shiloh`;
- system user ID: `61593365711509`;
- role: Employee access;
- assigned assets: production `Shiloh_MTC` app and production `Shiloh_MTC` WABA only;
- Test WhatsApp Business Account excluded;
- token expiration: Never;
- token permissions exactly `whatsapp_business_management` and `whatsapp_business_messaging`;
- unrelated `business_management`, `manage_app_solution` and `whatsapp_business_manage_events` permissions excluded; and
- only Render secret `WHATSAPP_TOKEN` updated through the Render secret-management path.

## Production and provider verification

Final-token Render deploy `dep-da47tk6k1f9s73asbcn0` reached LIVE. After explicit authorization, every token belonging to the former generic system user `Employee`, ID `61593165503862`, was revoked.

A fresh same-commit redeploy after revocation, `dep-da47v6n40ujc73d1qeug`, reached LIVE on `ae3825925277205512a4db0d9e13964fb3e79ea5`.

Post-revocation evidence established:

- `/` and `/health` returned HTTP 200;
- the verified log window contained zero errors;
- booking-update and cancellation templates remained provider APPROVED;
- staff-finalization templates remained provider APPROVED / UTILITY;
- booking-confirmation verification returned `ok=true`, provider v1 APPROVED / UTILITY and configured v2 unchanged;
- zero Authorization header values;
- zero Bearer values;
- zero Meta-token-like values;
- zero `WHATSAPP_TOKEN` values; and
- no real customer message, booking or catalogue mutation was created for verification.

The successful provider calls after old-system-user revocation prove that the final dedicated Shiloh token is the operational production credential.

## Revocation and historic-log boundary

All tokens for the former generic `Employee` system user were revoked only after the dedicated final token passed production and provider verification. The dedicated `Shiloh` token remains active.

The old `Employee` system user and its asset assignments were not deleted or changed because deletion was outside the authorized scope and is not required to revoke the exposed credential.

Render provides no supported control to delete an individual retained log entry. Historic entries were therefore not destroyed and remain subject to provider retention. Required audit evidence is preserved; unsupported destructive cleanup is not authorized.

## Completed / do not redo

- Exposed credential family, ownership and every legitimate runtime consumer were established without revealing the value.
- PR #387 forward redaction hardening is merged, tested and production-verified.
- The final replacement is installed in only `WHATSAPP_TOKEN`.
- The final token belongs to a dedicated production-only system user with two least-privilege WhatsApp permissions.
- Production health and provider/template behaviour are verified after old-token revocation.
- Every former generic `Employee` token is revoked.
- PR #385 contracts and current application behaviour remain preserved.
- Master and Project Tracker are reconciled by the documentation PR containing this file.
- Do not regenerate or revoke the dedicated `Shiloh` token merely to reproduce evidence.

## Remaining gates

None for this controlled rotation unit. Natural future WhatsApp traffic may provide additional delivery evidence but is not a completion requirement.

**Next specialist:** None — controlled unit complete.
