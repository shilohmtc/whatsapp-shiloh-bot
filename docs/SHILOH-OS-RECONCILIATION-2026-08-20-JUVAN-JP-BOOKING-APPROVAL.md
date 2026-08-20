# Shiloh OS — Juvan Botha → Jean-Pierre Booking Approval Reconciliation

Date: 2026-08-20
Status: VERIFIED LIVE / CANONICAL CLIENT-ID POLICY ACTIVE
Owning workstream: Booking & Admin UX
CRM & Identity role: dependency / observer — canonical identity verification closed by production startup evidence
Governance baseline: PR #340 / `aeb4e35361c34413d4310b1846c7043642a31cd2`

## Authority and requested business rule

This controlled unit extends the existing special booking-approval model used for OS CRM Dummy Test to one additional explicitly approved canonical CRM client: **Juvan Botha**. The business rule is deliberately client-specific: Juvan client bookings require **Admin Jean-Pierre (JP)** as the sole required approver, while practitioner selection, booking entitlement, availability, Calendar/conflict validation, booking confirmation gating and all unrelated client behavior remain unchanged.

The unit began from GitHub `main` at PR #349 / `b752295bdd543cac4f25b693f6d03af0f58ab0b4`, after independently re-reading Master Status, Project Tracker, the then-current v1-delivery-polish reconciliation and Engineering Governance. The newer #346/#347 client-reschedule practitioner-approval feature remained dark/default-off and the #348 live-v1 confirmation polish remained authoritative.

## Existing Dummy Test → JP contract inspected before implementation

The existing OS CRM Dummy Test path already had two independent fail-closed enforcement layers:

1. **Database hold trigger**
   - applies only to `shiloh_client_whatsapp` appointments and the first appointment-staff row;
   - requires exactly one active CRM Dummy Test record;
   - resolves exactly one active `Jean-Pierre` `staff_admin_accounts` row satisfying `business_admin`, `all_business`, `all_services` and configured normalized WhatsApp identity;
   - writes the durable pending booking approval with `approver_admin_id`, not a manufactured practitioner/staff link;
   - retains ordinary Abigail/Christel observer and practitioner-self approval rules for all other clients.

2. **Application approval service**
   - independently re-resolves the special Dummy Test/JP rule before the pending-row upsert;
   - sends the approved booking-approval request template to the exact admin identity;
   - authorizes the decision by exact `approver_admin_id` or the existing practitioner/observer IDs;
   - row-locks approval/appointment truth before the first authoritative decision;
   - sends the customer booking confirmation only after approval;
   - on decline, records history/audit, cancels the held appointment and releases shared/practitioner Google Calendar mirrors;
   - pending bookings remain real availability conflicts and do not expire automatically.

PR #350 preserves this contract.

## Canonical Juvan identity — production evidence

The sanctioned Render read-only Postgres query surface was attempted before implementation, but the connector again failed during SSL/TLS negotiation before executing SQL (`FATAL: SSL/TLS required` / connection EOF). No write-capable or environment-based workaround was used.

The prior 19 August Juvan welcome diagnostic had established that the user-confirmed WhatsApp identity resolved to exactly one active canonical client, but that diagnostic intentionally did not expose the canonical client ID/name. It was therefore corroborating evidence only and was not treated as sufficient authority for an ID-specific approval rule.

PR #350 instead makes production startup itself a fail-closed canonical identity preflight. Checksum-controlled migration `065_juvan_botha_jp_booking_approval.sql` may persist the rule only when all of the following are simultaneously true:

- exactly one **active** canonical CRM client has exact normalized display name `Juvan Botha`;
- that canonical row has at least one WhatsApp/mobile normalized contact identity;
- none of those WhatsApp/mobile identities is shared with another active client;
- exactly one active Jean-Pierre admin satisfies the existing guarded JP business-admin/all-business/all-services/WhatsApp contract.

Production startup on 20 August 2026 established:

- canonical client ID: **845**;
- display name: **Juvan Botha**;
- active exact-name count: **1**;
- canonical WhatsApp/mobile identity count: **1**;
- shared-active-client identity count: **0**;
- exact approver admin ID: **4**;
- approver: **Jean-Pierre**;
- approver WhatsApp configured: **true**.

This is the authoritative identity evidence for the rule. Runtime booking routing is keyed by persisted canonical **client ID 845**, not by a name pattern. The exact Juvan name remains only a drift/backstop invariant: a different or newly duplicated client merely named Juvan Botha is blocked rather than inheriting the exception.

## Implementation — PR #350

PR #350 — **Route canonical Juvan bookings to JP approval** — head `259ce6c172629c3f2a9df5a82d6467cce40231d5`, merged as:

`bb26eb62a719f84cbe0471aa54530e71cb104da9`

The change is limited to the booking-approval policy surface:

- new checksum migration `065_juvan_botha_jp_booking_approval.sql`;
- new durable `client_booking_approval_policies` table keyed by policy and unique canonical `client_id`;
- persisted policy `juvan_botha_jp_booking_approval` binds canonical client 845 to exact JP admin 4;
- database trigger routes by persisted client ID and rechecks client/contact/JP invariants;
- if a booking client is named Juvan Botha but does not match the persisted canonical client policy, it fails closed with `canonical client policy is missing` rather than falling through to ordinary approval;
- application `resolveJuvanApprovalPolicy` independently revalidates the same client-ID/contact/JP invariants before pending approval upsert;
- JP remains represented by `approver_admin_id` only; no practitioner/staff identity is manufactured;
- startup applies/checksum-verifies migration 065 and verifies the persisted policy before opening the HTTP listener.

No practitioner entitlement, service eligibility, availability engine, conflict checks, booking policy, Calendar integration, booking confirmation contract, Meta template contract, CRM contact value, appointment history or JP permission set was broadened.

## Regression / CI

Full GitHub CI **#1120** passed **744 / 744, 0 failed** using Node 24.14.1.

The seven new focused assertions cover:

- exactly-one-active Juvan resolution before persisting the ID-keyed policy;
- no broad `LIKE`/name-pattern routing;
- required canonical WhatsApp/mobile identity and zero shared-active-client contact ownership;
- exact guarded Jean-Pierre admin contract without creating a staff identity;
- database trigger client-ID routing and fail-closed drift/missing-policy behavior;
- independent application-layer revalidation;
- preservation of Dummy Test and ordinary practitioner approval behavior;
- startup verification before the HTTP listener.

The full suite also retained JP entitlement/finalization restrictions, Google Calendar/conflict safeguards, v1 polish, booking confirmation/approval behavior and #346/#347 dark-reschedule regression.

As in prior reconciliations, any Meta booking-confirmation-v2 `APPROVED` values produced by CI test fixtures are synthetic and are not production provider evidence.

## Production deployment and verification

Render auto-deploy **`dep-da39p0bm8hqs739jldtg`** deployed exact merge `bb26eb62a719f84cbe0471aa54530e71cb104da9` and reached **LIVE**. No manual deploy or environment-variable write was used.

At 08:20:14 SAST the new production instance logged successful Juvan policy verification after applying migration 065:

- `applied=true`;
- `checksumVerified=true`;
- `policyKey=juvan_botha_jp_booking_approval`;
- `clientId=845`;
- `activeNameCount=1`;
- `canonicalContactCount=1`;
- `sharedActiveContactCount=0`;
- `approverAdminId=4`;
- `approverName=Jean-Pierre`;
- `approverWhatsAppConfigured=true`.

Only after that verification did the instance open its HTTP listener. Post-start production evidence also established:

- `/health` HTTP 200;
- Google Calendar provider health passed;
- `shiloh_booking_confirmation_v1` remained configured **APPROVED / UTILITY / already_exists**, `submitted=false`;
- customer-change templates remained approved/already-existing without submission;
- PR #346/#347 reschedule-approval schema remained healthy while `featureEnabled=false`, approval-template configured=false and declined-template configured=false.

A bounded post-deploy log search for Juvan found only the startup policy-verification event. No Juvan booking, approval decision, Calendar event or WhatsApp journey was created or sent merely to manufacture runtime evidence.

## Accepted live booking-approval rule

For canonical CRM client **845 / Juvan Botha**:

- a normal client booking still passes all existing identity, policy, service/practitioner eligibility, availability, CRM-conflict, shared Google Calendar and practitioner Calendar checks;
- when the canonical appointment/staff hold is created, the pending booking-approval record is assigned to **Jean-Pierre admin ID 4** as sole required approver;
- the held slot remains unavailable while pending;
- JP approval is authorized by the established Admin WhatsApp identity and unlocks the existing customer booking confirmation path;
- JP decline follows the established decline path, preserving audit/history while cancelling the held appointment and releasing Calendar mirrors;
- all rules fail closed if the canonical Juvan policy, contact ownership or JP admin invariants drift.

OS CRM Dummy Test retains its existing JP approval behavior. Ordinary Abigail/Christel/Marietjie and other client booking approval behavior is unchanged.

## Completed / do not redo

- Do not add a broad display-name or name-pattern exception for Juvan.
- Do not create a second Juvan CRM record or relink a phone merely to satisfy this rule.
- Do not replace canonical client ID 845 in the policy without new authoritative CRM identity evidence and a controlled migration.
- Do not manufacture a staff/practitioner link for JP; the approval contract intentionally uses `approver_admin_id=4`.
- Do not alter the established Dummy Test → JP path as part of this rule.
- Do not create a Juvan booking merely to demonstrate the approval message.
- Do not weaken booking entitlement, availability, conflict, Calendar, confirmation, audit/history or JP finalization restrictions.
- Do not infer booking-confirmation-v2 approval from test fixtures; its last authoritative provider state remains PENDING until a fresh provider read changes it.

## Completion boundary / PR #340 handoff

**Authoritative current application state:** PR #350 / `bb26eb62a719f84cbe0471aa54530e71cb104da9` is regression-green and production-live. Canonical CRM client 845 / Juvan Botha is uniquely verified and bound by an ID-keyed policy to exact Jean-Pierre admin ID 4 for booking approval. Dummy Test and all unrelated approval rules are preserved. V1 booking confirmation remains live/polished; #346/#347 remains dark/default-off; booking-confirmation v2 remains last-authoritatively PENDING and non-sendable.

**Current controlled unit:** complete. CRM & Identity dependency for the Juvan canonical identity is closed by production preflight evidence; no separate CRM mutation is required.

**Next dependency:** external Meta review of booking confirmation v2, returning to the interrupted provider-monitoring workstream.

**Owning workstream:** WhatsApp / Meta Integration.

**Exact chat:** `Shiloh OS — WhatsApp / Meta Integration`.

**Ownership reason:** the next open booking-confirmation boundary is provider approval evidence; Production / DevOps activation remains premature while the last authoritative v2 state is PENDING.

**Dependencies / observers:** Production / DevOps becomes activation owner only after WhatsApp / Meta Integration verifies APPROVED + exact + duplicate-free. CRM & Identity should observe any future change to canonical client 845 that could invalidate the Juvan policy. Control & Reconciliation observes shared-state integrity.

**Status: Blocked — external Meta approval.**

```text
Shiloh OS — WhatsApp / Meta Integration: resume booking confirmation v2 approval monitoring after the completed Juvan booking-approval rule.

Independently re-read current GitHub main, Master Status, Project Tracker, latest reconciliation, Meta readiness matrix and Engineering Governance. Preserve any authority newer than this handoff; treat this handoff as routing context only.

Preserve PR #350: canonical CRM client 845 / Juvan Botha is now production-verified and routed by an ID-keyed booking-approval policy to exact Jean-Pierre admin ID 4. Do not broaden the rule by name, alter Dummy Test approval, or manufacture a Juvan booking for evidence. Preserve PR #348 v1 delivery polish and PR #346/#347 reschedule approval as dark/default-off.

Verify `shiloh_booking_confirmation_v2` through an authoritative read-only Meta/provider surface. Do not submit or resubmit it. Confirm provider name, language, category, full semantic components, status and duplicate count. The last authoritative production evidence remains PENDING / UTILITY / en / exact / duplicateCount=0; CI fixture values are not provider evidence.

If v2 is still PENDING, reconcile only genuinely changed evidence and stop fail-closed. If and only if v2 is APPROVED + exact + duplicate-free, reconcile that provider state and issue the PR #340 handoff to Shiloh OS — Production / DevOps for a separate controlled activation. Do not activate v2 in the Meta-monitoring unit and do not manufacture a booking for handset evidence.
```
