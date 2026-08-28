# Shiloh OS Control Addendum — 2026-08-28 — Clean CRM V2 Production Foundation

Controlled unit: `SHILOH-CLEAN-CRM-V2-PRODUCTION-FOUNDATION-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **COMPLETE / RECONCILED**

## 00 terminal decision

00 accepts issue #522 (`SHILOH-CLEAN-CRM-V2-PRODUCTION-MIGRATION-084-P0`) as PASS and terminally complete after independent revalidation of the GitHub/Render release boundary.

#522 is closed `completed` and must not be redone.

Upstream migration-control units are also terminal:

- #523 — migration-ledger reconciliation — PASS / CLOSED / DO NOT REDO;
- #525 — migration-ledger repair — PASS / CLOSED / DO NOT REDO.

The accepted durable production outcome is a fully current **88 / 88 migration ledger with zero pending migrations**, plus an empty physical CRM V2 client master and nullable appointment compatibility seam.

## 00 sequencing decision

The next controlled unit is issue #526:

`SHILOH-CALENDAR-CLEAN-CRM-V2-CUTOVER-P0`

Owner: **10 — Calendar & Booking Assurance**  
Executor: **Shiloh OS — WS-10 — Calendar Clean CRM V2 Cutover P0**

### Why Calendar is first

Calendar is the authoritative booking spine and already owns deliberate staff booking confirmation. Moving that bounded internal workflow onto the clean client master first provides the smallest controlled proof of CRM V2 identity creation/resolution and appointment linkage before the same model is exposed through WhatsApp registration.

WhatsApp ↔ CRM V2 cutover therefore remains sequenced after Calendar V2 proof.

### Architecture decision

00 rejects a permanent dual-write client design.

The merged CRM V2 foundation contract governs #526:

- new V2 bookings resolve/create clients only through the CRM V2 service;
- exact normalized mobile is the only automatic resolution key;
- new V2 appointments write `crm_v2_client_id`;
- new V2 appointments leave legacy `client_id` null;
- existing appointments retain their existing legacy pointers/snapshots;
- no legacy import/backfill is used to populate CRM V2;
- booking-time final-mobile acknowledgement is Calendar-owned;
- V2 confirmation delivery must not manufacture legacy client/contact/name-authority state.

This is the smallest design that advances the operational spine while reducing, rather than extending, the legacy identity dependency.

## Adjacent control reconciliation

### #524

Closed `not_planned` as a standalone implementation because #526 supersedes the legacy booking-client surface.

The approved product decision is preserved as mandatory #526 acceptance:

`Find client | New client`

No separate top-level Client registration action.

### #512

Closed `completed` for its engineering/runtime tranche. Merged PR #513 made Shiloh the normal scheduling authority and removed Google from normal scheduling/availability dependency.

The issue's explicit cutover gate kept physical Google provider/environment disconnection outside the engineering package. That provider retirement is still not done and remains a future fresh JP-only gate because destructive provider disconnection is outside standing 00 authority.

00 does not assign active priority to that physical disconnection while it is no longer on the operational scheduling path.

## Authorization boundary for #526

Workspace execution is authorized because #526 is a substantial multi-file integration/test package.

WS-10 may produce a Draft PR, focused tests, full non-mutating regression and exact-head non-production browser proof.

WS-10 may not merge/deploy, apply a production migration, mutate real production bookings/clients for proof, start WhatsApp cutover, retire legacy CRM/identity data, change provider/configuration/credentials/permissions, or send production messages.

If the engineering package requires a new additive migration definition for pending-session/delivery compatibility, production application remains a separate 00 → 40 bounded release gate after merge.

## Doctrine classification

- Clean CRM V2 operational client master: **OWN**.
- Calendar ↔ CRM V2 cutover: **OWN / DO NOW** — advances the operational spine and retires a live legacy dependency.
- Standalone #524 label deployment: **RETIRE AS SEPARATE WORK / ABSORB INTO #526**.
- Google scheduling dependency: **RETIRED FROM NORMAL RUNTIME AUTHORITY**.
- Physical Google provider disconnection: **RETIRE LATER / JP-ONLY GATE**, not current P0.
- Bulk legacy client/appointment migration into CRM V2: **DO NOT DO NOW**; it adds risk/complexity and is not needed for the new operational spine.

## Control close

This production-foundation reconciliation is complete when the associated Project Tracker, Master Status and Cockpit checkpoint are merged.

Next execution owner after that reconciliation: **WS-10 on issue #526**.
