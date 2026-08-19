# Shiloh OS — Client Welcome Diagnostic Reconciliation

Date: 2026-08-19
Status: **READ-ONLY DIAGNOSTIC VERIFIED LIVE / CLIENT-SPECIFIC STATE READ WAITING**
Owning workstream: **WhatsApp / Meta Integration**
Observers: **CRM & Identity**, **Production / DevOps**, **Control & Reconciliation**

## Scope

This reconciliation records the controlled investigation of a production WhatsApp welcome anomaly observed during the Juvan Botha client-journey test and the deployment of a narrowly scoped authenticated read-only diagnostic. It does **not** classify Juvan's canonical identity, registration status, consent, guardian status or welcome ledger truth, and it does not authorize any production-state reset or booking action.

The earlier booking-update production activation reconciliation remains authoritative for booking-update provider/configuration state. This reconciliation is newer only for the client-welcome diagnostic workstream and does not supersede the durable PR #326/#332/#334 Meta and booking-update evidence.

## Observed production evidence

A real handset greeting `Hi` at approximately 06:17 SAST produced the normal three-button client home menu rather than the universal `v2` welcome. Render logs independently recorded the corresponding incoming text from the masked client number and a three-button outbound response. This is inconsistent with the first-contact `v2` contract **unless** the durable phone-level welcome ledger already records that `v2` was delivered.

Current `main` routing remains explicit: `processClientTransitionWelcome()` runs before normal identity/discovery handling for greetings. The `v2` implementation uses `client_whatsapp_welcome_deliveries(phone, welcome_version, sent_at)` plus the canonical-client `whatsapp_universal_welcome_v2_sent_at` marker. A pre-existing `v2` ledger row permits greeting fall-through to the standard client menu.

Render outbound evidence located older sends for the same masked number before the `v2` rollout, but no successful `v2` outbound send was located between the 17 August `v2` rollout and the 19 August 06:17 greeting. The older implementation used a different marker (`whatsapp_transition_welcome_sent_at`) and is not itself proof of a `v2` delivery. This makes stale/incorrect persisted welcome state a strong hypothesis, but **root cause is not yet proven** until the new authenticated read-only diagnostic is invoked against the user-confirmed Juvan number.

## Direct database connector boundary

The sanctioned Render Postgres read-only connector remains unable to establish its connection. A fresh `SELECT 1 AS ok` attempt after the diagnostic deployment failed before SQL execution with the provider connection error ending in `FATAL: SSL/TLS required` / unexpected EOF. No write-capable workaround was used.

Render database networking was inspected through the dashboard. PostgreSQL inbound internet traffic remains blocked. The user was explicitly instructed not to add an inbound source or weaken database networking merely for this diagnostic, and no networking rule was changed.

## PR #335 — authenticated read-only diagnostic

PR **#335**, **Add authenticated read-only client welcome diagnostic**, merged as:

`59469d6670cb116a5be20ebc3ab682d4f36ad717`

The implementation adds `GET /audit-read/client-welcome/status?phone=...`, protected by the established `auditReadAuth` / `AUDIT_READ_TOKEN` boundary.

The diagnostic executes exactly two parameterized `SELECT` queries:

1. reads only the requested phone's `v2` row from `client_whatsapp_welcome_deliveries`;
2. aggregates active canonical-client matches for the normalized phone and, only when identity is unique, reports whether the canonical `whatsapp_universal_welcome_v2_sent_at` marker exists and its timestamp.

Returned output is intentionally sanitized:

- last four phone digits only;
- welcome version;
- ledger exists/timestamp;
- canonical identity status `none`, `unique` or `ambiguous` plus active-client count;
- canonical marker exists/timestamp only for a unique canonical identity.

The diagnostic does **not** return full phone, client ID, client name or contact detail. Ambiguous canonical identity fails closed and withholds marker detail. There is no migration and no `INSERT`, `UPDATE`, `DELETE`, appointment mutation, CRM mutation, provider action or welcome reset path.

## Regression and merge evidence

GitHub Actions CI run **#1070** completed successfully on PR #335:

- tests: **700**
- passed: **700**
- failed: **0**

The new diagnostic regression coverage verifies phone normalization/privacy, ledger and unique-marker reporting, ambiguous-identity fail-closed behavior, deterministic identity status, SELECT-only SQL and `auditReadAuth` route protection.

## Production deployment evidence

Render auto-deploy **`dep-da2ttdcs728c73b99mbg`** deployed merge commit `59469d6670cb116a5be20ebc3ab682d4f36ad717` and reached **LIVE** at 2026-08-19 16:50:40Z.

Post-deploy evidence:

- build successful;
- Shiloh started normally;
- repeated `/health` requests returned HTTP 200;
- Google Calendar provider health passed;
- existing booking-update and cancellation template provisioning checks remained `submitted=false`, `reason=already_exists`, `providerStatus=APPROVED`;
- booking confirmation and staff finalization templates remained approved/existing;
- no Meta template resubmission was caused by PR #335.

This confirms the diagnostic surface is live while preserving the newer authoritative booking-update activation/provider state.

## Current classification

### Diagnostic capability

**🟢 VERIFIED LIVE.** PR #335 is merged, regression-green and production-live.

### Universal welcome routing contract

The #312 routing contract remains accepted: for a greeting where `v2` has not already been delivered, the universal welcome precedes client-state branching. The 19 August Juvan observation is newer contradictory evidence for the **client-specific persisted state**, not proof that the routing code itself is wrong.

### Juvan client-specific `v2` state

**🟠 WAITING AUTHENTICATED READ-ONLY EVIDENCE.** The ledger row and canonical marker have not yet been read through the new endpoint. Do not infer Juvan's identity, CRM registration or welcome state from the handset behavior alone.

### Repair authorization

**NOT GRANTED.** The user's approval was for the read-only welcome diagnostic only. No ledger deletion/reset, client mutation, CRM merge, identity correction, appointment change or outbound test message is authorized by this work unit.

## Exact next action

Invoke the authenticated production endpoint against the **user-confirmed Juvan WhatsApp number**, keeping `AUDIT_READ_TOKEN` private. Compare:

- `ledger.exists` / `ledger.sentAt`;
- `canonicalIdentity.status`;
- `canonicalMarker.exists` / `canonicalMarker.sentAt` when identity is unique;
- the already-preserved outbound WhatsApp log evidence.

Then classify one of the following without inference:

1. **Ledger absent:** greeting should have received the universal welcome; investigate why the transition handler did not mark/handle the greeting before any repair recommendation.
2. **Ledger present with matching genuine prior `v2` outbound evidence:** current menu behavior is expected once-only suppression.
3. **Ledger present without corresponding genuine `v2` outbound evidence:** persisted welcome state is stale/incorrect; propose the smallest proof-bound state repair and obtain explicit approval before any write.
4. **Canonical identity ambiguous:** fail closed; CRM & Identity owns resolution before any client-specific marker interpretation or repair.

Do not send another handset greeting solely to manufacture evidence before this read is complete.

## Final specialist checkpoint

**Authoritative state:** PR #335 / `59469d6670cb116a5be20ebc3ab682d4f36ad717` is the current verified production runtime addition for client-welcome diagnostics; CI #1070 is 700/0; Render deploy `dep-da2ttdcs728c73b99mbg` is LIVE and healthy. Existing PR #326 Meta integration, PR #332 stale-suppression lineage and PR #334 booking-update activation reconciliation remain preserved.

**Complete — do not redo:** handler trace, production log correlation, direct-DB connector failure verification, protected database-networking decision, SELECT-only diagnostic implementation, regression, PR/merge and production deployment/health verification.

**Unresolved gate:** authenticated client-specific read for the user-confirmed Juvan number. Root cause remains unproven until that read is obtained.

**Reconciliation:** Project Tracker and Master must record PR #335 as current runtime and the Juvan welcome state as waiting read-only evidence, not as a repaired defect.

**Next owner:** WhatsApp / Meta Integration owns the diagnostic invocation and behavioral classification; CRM & Identity observes canonical identity status; Production / DevOps observes runtime access/health; Control & Reconciliation tracks any later repair approval boundary.
