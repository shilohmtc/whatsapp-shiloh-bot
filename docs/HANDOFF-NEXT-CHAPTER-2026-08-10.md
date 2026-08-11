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
- ✅ Final Goldie future-booking reconciliation — VERIFIED 11 Aug 2026. Archived exact 10 Aug export baseline: 38 future rows = 27 appointments + 11 blocks. Previously held `SHILOH MTC` row is CRM appointment #369 routed to Christel. Final shared-calendar scan contains 27 future appointment events one-for-one with the 27 Goldie future appointment rows.
- ✅ Goldie duplicate #360 repaired. Owner confirmed Maurusye Pedi and Mauryse Venter are the same client. Canonical #551 was retained; duplicate #360 was silently cancelled; only #360's mapped Calendar event was removed; 0 WhatsApp messages were sent.
- ✅ Zero unresolved future Goldie bookings proven: zero missing, zero duplicate, zero unresolved.
- ✅ Shiloh-side Goldie live knowledge sync retired; current Shiloh catalogue/CRM is authoritative.
- ✅ **Goldie public online booking disabled and externally verified 11 Aug 2026.** Authenticated Goldie Online Booking was switched off by the owner. The resulting public Goldie page displayed **“This business may no longer be accepting appointments online. You can ask them to activate the online booking.”** and no customer service-selection/booking controls were presented. Historical Goldie data remains intact as reference; do not delete the Goldie account/history.

**P1 status: ✅ CLOSED / COMPLETE. Goldie is retired from the active production booking flow. Reopen only for a new regression.**

### P2 — Staff-scoped CRM authorization and calendars

- ✅ Role-specific WhatsApp admin menus and staff-scoped authorization.
- ✅ Marietjie tenant/practitioner permissions + `Shiloh — Marietjie` calendar.
- ✅ Abigail employee-practitioner permissions + `Shiloh — Abigail` calendar.
- ✅ Existing future appointments populated into staff calendars.
- 🟡 Optional real-practitioner acceptance testing remains; never impersonate Marietjie or Abigail.

**P2 status: ✅ FUNCTIONALLY COMPLETE. Optional practitioner acceptance testing is not a production blocker.**

### P3 — Client experience and customer care

- ✅ Premium customer greeting.
- ✅ Walk-in QR registration.
- ✅ Booking confirmation + calendar add.
- ✅ Client cancellation/rescheduling.
- ✅ Reminder/customer-care infrastructure.
- ✅ Birthday and loyalty foundations.
- ✅ **CRM-backed customer service catalogue + WhatsApp booking UX — VERIFIED 11 Aug 2026.** The 49 active CRM services now have customer-facing professional descriptions. `/services` and `/services/:id` render current active treatments grouped by the canonical CRM categories with authoritative duration/price presentation and service-specific **Book via WhatsApp** links that prefill the selected treatment. Shiloh's AI consumes the same CRM customer descriptions and booking notes, preventing website/WhatsApp content divergence. Migrations 038/039 were applied once through a guarded one-shot path, verified idempotent, and all temporary migration plumbing was removed afterward.
- 🟡 **Service imagery:** image support is implemented in the CRM/service-card contract, but production coverage is currently 0/49. Populate only approved/licensed Shiloh-owned or otherwise explicitly approved imagery; missing images do not block booking.
- 🟡 Birthday outbound messaging remains fail-closed until an approved WhatsApp birthday template is configured.
- 🟡 Treatment-aware aftercare/rebooking specialization remains.
- 🟡 Loyalty redemption automation remains.
- 🟡 Dedicated reminder-confirmation response state remains optional/unimplemented.

**P3 status: 🟡 CORE COMPLETE; customer catalogue descriptions + WhatsApp booking UX are live, with approved imagery and remaining customer-care enhancements listed below.**

### P4 — Payments and vouchers

- ⬜ Ozow discovery/design.
- ⬜ Payment ledger + webhook idempotency.
- ⬜ Voucher lifecycle.

## Goldie disconnect gate — FINAL

**Overall: ✅ CLEARED / CLOSED 11 Aug 2026.**

- ✅ Goldie delta since archived 10 Aug export: ZERO, owner/admin attested.
- ✅ Exact archived 10 Aug export validated as cutover baseline.
- ✅ Baseline future inventory: 27 appointments + 11 blocks.
- ✅ Previously held `SHILOH MTC` appointment proven as #369 / Christel.
- ✅ Duplicate #360 safely cancelled; #551 retained; no client message sent.
- ✅ Final shared Calendar: 27 future appointment events matching the Goldie baseline one-for-one.
- ✅ Zero missing / zero duplicate / zero unresolved future Goldie bookings.
- ✅ Active Shiloh catalogue protected from stale/retired Goldie offerings.
- ✅ Business-policy parity owner-approved.
- ✅ Client entry has Shiloh WhatsApp and walk-in QR paths.
- ✅ Shiloh live Goldie knowledge-sync dependency retired.
- ✅ Goldie public online booking disabled by owner.
- ✅ Former Goldie public booking surface verified non-bookable.
- ✅ Historical Goldie account/data retained; no destructive account deletion performed.

## Prioritized checklist

Work one item at a time and verify GitHub + Render after production changes.

1. **P3 — Service imagery:** audit available Shiloh-owned/approved treatment and clinic photography, then populate service/category imagery without changing catalogue business data.
2. **P3 — Configure an approved WhatsApp birthday template** before enabling birthday outbound messaging.
3. **P3 — Treatment-aware aftercare/rebooking specialization.**
4. **P3 — Loyalty redemption automation.**
5. **P3 optional — Dedicated reminder-confirmation response state**, only if operationally desired.
6. **P4 — Ozow/payment/voucher discovery and design** after P3 production hardening.

## Completed during this chapter

- ✅ P0 — Automated regression tests + CI.
- ✅ P0 — Christel personal-account Calendar permission test.
- ✅ P0 — Startup/maintenance separation + production runbook + rollback safeguards.
- ✅ P1 — Shared Calendar presentation audit and scoped normalization.
- ✅ P1 — Live production catalogue audit + CRM-authority hardening.
- ✅ P1 — Owner policy parity approval.
- ✅ P1 — Archived Goldie cutover baseline reconciliation.
- ✅ P1 — Duplicate #360 silent repair; canonical #551 retained.
- ✅ P1 — 27/27 future Goldie appointments proven with zero unresolved future bookings.
- ✅ P1 — Shiloh Goldie live knowledge-sync scheduler retired.
- ✅ P1 — Goldie public online booking disabled and public non-bookable state verified.
- ✅ P3 — CRM-backed service catalogue presentation fields added without changing service names/prices/durations/staff mappings/bookings.
- ✅ P3 — Professional customer descriptions populated for all 49 active services.
- ✅ P3 — Public `/services` catalogue + individual treatment pages + WhatsApp service deep links verified live.
- ✅ P3 — AI catalogue knowledge aligned to the same CRM descriptions and booking notes.
- ✅ P3 — One-shot migrations 038/039 verified and temporary migration plumbing removed.

## Safety rules retained

- Do not impersonate Marietjie or Abigail.
- Do not send unnecessary messages to real clients during audits/migrations/tests.
- Do not use genuine appointments for destructive testing.
- Prefer read-only/non-mutating verification and narrowly scoped guarded repairs when a write is unavoidable.
- Do not delete the Goldie account or historical data; it remains archival reference.
- Do not redo production work already marked ✅ unless a new regression is discovered.
- Use only Shiloh-owned/licensed or explicitly approved imagery for customer-facing service cards; do not hotlink arbitrary third-party images.

## Next action

**P0 and P1 are CLOSED. P2 is functionally complete.** The highest-priority genuinely unfinished production item is now **P3 service imagery**: audit available Shiloh-owned/approved treatment and clinic photography and map it safely to the live CRM-backed service catalogue. Once imagery is handled (or explicitly deferred), continue with the approved WhatsApp birthday-template gate, treatment-aware aftercare/rebooking, and loyalty redemption.