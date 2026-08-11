# Shiloh Production Audit & Next-Chapter Handoff — current state 11 Aug 2026

> This file retains its original `2026-08-10` filename for continuity. GitHub `main`, Render production, Shiloh CRM-backed production state and Google Calendar are authoritative over older checklist wording.

## Classification key

- ✅ Complete — verified against current production evidence.
- 🟡 Partially complete / verification still required.
- ⬜ Outstanding.

## Current production baseline

- Repository: `shilohmtc/whatsapp-shiloh-bot`, branch `main`.
- Render service: `shiloh-whatsapp-bot`, auto-deploy from `main`, Node 24.14.1, Starter plan, Oregon, 1 instance, `npm ci` / `npm start`, `/health` health check.
- WhatsApp/CRM is the booking source of truth; Google Calendar is a synchronized operational view.
- Operational calendars: `Shiloh — Bookings`, `Shiloh — Marietjie`, `Shiloh — Abigail`.
- Roles: Christel owner/all-business; Jean-Pierre business admin/all-business; Marietjie `tenant_practitioner`; Abigail `employee_practitioner`.

## Fresh consolidated audit — P0 to P4

### P0 — Stabilize before adding commercial features

- ✅ Christel personal-account Google Calendar read/create/edit/delete permission verification.
- ✅ Automated regression tests + CI.
- ✅ Production observability / maintenance cleanup. Normal `npm start` contains no migrations, one-time repairs, imports, rollout jobs, reconciliations or smoke tests. Explicit maintenance commands and rollback/runbook safeguards are documented.

**P0 status: ✅ CLOSED / COMPLETE. Reopen only for a new regression.**

### P1 — Catalogue, data presentation and Goldie exit readiness

- ✅ Targeted legacy service/catalogue and imported-client text cleanup.
- ✅ Professional catalogue cross-surface review and authority hardening. Live production audit verified 49 active services across 14 active categories with no known legacy-name findings, missing price presentation or missing duration. Booking verification fails closed against the active CRM catalogue; free-form AI treats active CRM catalogue values as authoritative over legacy Goldie knowledge.
- ✅ Google Calendar presentation cleanup. All future shared-calendar events were audited; only confirmed presentation defects were repaired.
- ✅ Business-policy parity — OWNER APPROVED 11 Aug 2026. Couples/group/spa-day wording: **“Couples and group/spa-day bookings are available for selected treatments. Please contact Shiloh to arrange the most suitable option.”** Existing Facebook and Instagram destinations remain the official Shiloh social links.
- ✅ Non-PII Goldie archive manifest retained in Git; raw Goldie PII remains outside Git history.
- ✅ **Final Goldie future-booking reconciliation — VERIFIED 11 Aug 2026.** The archived exact `export-2026-08-10.zip` was recovered from the Shiloh library. Owner/admin attested that no Goldie bookings were created, changed, cancelled or rescheduled after that export, so a ceremonial second export was not required. The baseline contained **38 future rows = 27 appointments + 11 non-booking blocks**. The original guarded import created 3 appointments, matched 23 existing appointments, created all 11 blocks and initially held one `SHILOH MTC` practitioner row. Final reconciliation proved that held row exists as CRM appointment **#369**, correctly routed to Christel. The final shared `Shiloh — Bookings` scan contains **27 future appointment events**, one-for-one with the 27 Goldie future appointment rows.
- ✅ **Goldie duplicate #360 repaired.** Final reconciliation identified one import duplicate for the 15 Aug 09:00 Full Body Swedish booking. Owner confirmed `Maurusye Pedi` and `Maurusye Venter` are the same client. Production repair preserved canonical/import-resolved appointment **#551**, silently cancelled duplicate **#360**, deleted only #360's mapped Google Calendar event, and sent **0 WhatsApp messages**. Post-repair Calendar verification shows #551 remains and #360 is absent.
- ✅ **Zero unresolved future Goldie bookings proven.** No missing future appointment remains and no duplicate Goldie future appointment remains after #360 repair.
- ✅ **Shiloh-side Goldie live sync retired.** After reconciliation passed, the Goldie live knowledge-sync scheduler was removed from normal production startup. Shiloh no longer requires the public Goldie page to refresh current service/business knowledge.
- 🟡 **Goldie public booking page disable still required in the Goldie account UI.** This is the only remaining Goldie exit action not executable through the currently connected production tooling. After the owner disables public booking in Goldie, verify the public booking surface is no longer bookable and then mark P1 fully closed.

**P1 status: 🟡 CUTOVER RECONCILIATION PASSED; awaiting Goldie-account public-booking disable + verification only.**

### P2 — Staff-scoped CRM authorization and calendars

- ✅ Role-specific WhatsApp admin menus and staff-scoped authorization.
- ✅ Marietjie tenant/practitioner permissions + `Shiloh — Marietjie` calendar.
- ✅ Abigail employee-practitioner permissions + `Shiloh — Abigail` calendar.
- ✅ Existing future appointments populated into staff calendars.
- 🟡 Optional real-practitioner acceptance testing remains; never impersonate Marietjie or Abigail.

### P3 — Client experience and customer care

- ✅ Premium customer greeting.
- ✅ Walk-in QR registration.
- ✅ Booking confirmation + calendar add.
- ✅ Client cancellation/rescheduling.
- ✅ Reminder/customer-care infrastructure.
- ✅ Birthday and loyalty foundations.
- 🟡 Birthday outbound messaging remains fail-closed until an approved WhatsApp birthday template is configured.
- 🟡 Treatment-aware aftercare/rebooking specialization remains.
- 🟡 Loyalty redemption automation remains.
- 🟡 Dedicated reminder-confirmation response state remains optional/unimplemented.

### P4 — Payments and vouchers

- ⬜ Ozow discovery/design.
- ⬜ Payment ledger + webhook idempotency.
- ⬜ Voucher lifecycle.

## Goldie disconnect gate — current status

**Overall: 🟡 TECHNICAL RECONCILIATION CLEARED; public Goldie booking disable pending owner UI action.**

- ✅ Goldie delta since archived 10 Aug export: **ZERO**, owner/admin attested.
- ✅ Exact archived 10 Aug export recovered and validated as cutover baseline.
- ✅ Baseline future inventory: 27 appointments + 11 blocks.
- ✅ Original import/reconciliation evidence accounted for all 38 rows.
- ✅ Previously held `SHILOH MTC` future appointment proven in Shiloh as #369 / Christel.
- ✅ Duplicate #360 safely cancelled; #551 retained; no client message sent.
- ✅ Final shared Calendar future appointment count: **27**, matching Goldie baseline appointments one-for-one.
- ✅ Zero missing / zero duplicate / zero unresolved future Goldie bookings.
- ✅ Active Shiloh catalogue authority protected from stale/retired Goldie offerings.
- ✅ Business-policy parity owner-approved.
- ✅ Client entry has Shiloh WhatsApp and walk-in QR paths.
- ✅ Shiloh live Goldie knowledge-sync dependency retired.
- ⬜ Disable Goldie public booking in the authenticated Goldie account UI.
- ⬜ Verify the former Goldie public booking surface can no longer accept bookings.

## Prioritized checklist

Work one item at a time and verify GitHub + Render after production changes.

1. **P1 FINAL UI CUTOVER — disable Goldie public booking in Goldie, then verify it is no longer bookable.** Once verified: mark **P1 ✅ CLOSED / COMPLETE**.
2. **P3 — Configure approved birthday template** before enabling birthday outbound messaging.
3. **P3 — Treatment-aware aftercare/rebooking and loyalty redemption rules**; add reminder-confirmation state only if operationally desired.
4. **P4 — Ozow/payment/voucher discovery and design** after operational cutover/stability work.

## Completed during this chapter

- ✅ P0 — Automated regression tests + CI.
- ✅ P0 — Christel personal-account Calendar permission test.
- ✅ P0 — Startup/maintenance separation + production runbook + rollback safeguards.
- ✅ P1 — Shared Calendar presentation audit and scoped normalization.
- ✅ P1 — Live production catalogue audit + CRM-authority hardening.
- ✅ P1 — Owner policy parity approval.
- ✅ P1 — Archived Goldie cutover baseline reconciliation.
- ✅ P1 — Duplicate #360 silent repair; canonical #551 retained.
- ✅ P1 — 27/27 future Goldie appointments proven in current Shiloh shared Calendar, with zero unresolved future bookings.
- ✅ P1 — Shiloh Goldie live knowledge-sync scheduler retired.

## Safety rules retained

- Do not impersonate Marietjie or Abigail.
- Do not send unnecessary messages to real clients during audits/migrations/tests.
- Do not use genuine appointments for destructive testing.
- Prefer read-only/non-mutating verification and narrowly scoped guarded repairs when a write is unavoidable.
- Do not redo production work already marked ✅ unless a new regression is discovered.

## Next action

The Goldie data/reconciliation exit gate has passed. The only remaining P1 action is to **disable the public Goldie booking page from the authenticated Goldie account**, then verify that customers can no longer create Goldie bookings. After that verification, close P1 permanently unless a regression is discovered.