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
- ✅ Render environment-variable hygiene — VERIFIED 11 Aug 2026. Owner reviewed the complete Render Environment inventory and removed obsolete Goldie/import/rollout/migration/repair/test controls in guarded groups. Required database, Google Calendar/OAuth, OpenAI, Meta/WhatsApp, admin/audit and customer-care template configuration was retained. `PEXELS_API_KEY` is intentionally retained as a reusable asset-acquisition integration for future approved service imagery; current production service images remain Shiloh-controlled local WebP assets and do not depend on Pexels at runtime. Post-cleanup Render rebuild completed successfully and the production service remained live with one active instance and successful HTTP 200 traffic.

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
- ✅ **Service imagery — VERIFIED 11 Aug 2026.** Owner approved curated third-party Pexels imagery as an interim solution. Twelve approved/licensed source images were ingested through a temporary API bridge, converted to optimized Shiloh-controlled WebP assets under `public/service-images`, and the temporary bridge/importer was retired afterward. All 49 currently seeded active services resolve to an approved image; unknown future services fail closed with no automatic misleading image. Sensitive services such as Areola Reconstruction, Pelvic Floor Strengthening and intimate HIFU use neutral consultation/clinic imagery. Production smoke verification confirmed `/services` renders Shiloh-hosted image URLs plus WhatsApp booking controls and a representative WebP asset is served successfully.
- ✅ **Booking Policy & explicit client consent gate — VERIFIED 11 Aug 2026.** Shiloh now presents a versioned clinic Booking Policy & Terms before a WhatsApp booking request may proceed. Policy version `2026-08-11-v1` covers professional/non-sexual conduct, arrival/late-treatment handling, 24-hour cancellation/rescheduling notice, relevant health disclosure, treatment suitability/results, respect/safety and belongings. A generic `YES` is insufficient at the policy step; the client must explicitly reply `I AGREE` (or equivalent explicit acceptance). Acceptance is recorded with policy version, timestamp, channel and booking-request snapshot. Declining clears the booking request. Policy acceptance alone never marks an appointment confirmed. A production-safe synthetic self-test ran against the live CRM/database, sent no WhatsApp message, created no real appointment or Calendar event, cleaned its synthetic rows afterward, and passed all assertions: summary produced, no Goldie wording, policy displayed, generic yes rejected, explicit agreement accepted, acceptance audit recorded, no false appointment confirmation.
- ✅ Legacy Goldie booking handoff wording in the WhatsApp intent flow is suppressed from the active client-facing path; Goldie is not presented as the booking destination.
- 🟡 Birthday outbound messaging remains fail-closed until an approved WhatsApp birthday template is configured.
- 🟡 Treatment-aware aftercare/rebooking specialization remains.
- 🟡 Loyalty redemption automation remains.
- 🟡 Dedicated reminder-confirmation response state remains optional/unimplemented.

**P3 status: 🟡 CORE EXPERIENCE COMPLETE; catalogue, imagery and booking-policy consent are live. Remaining work is customer-care automation specialization.**

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

1. **P3 — Configure an approved WhatsApp birthday template** before enabling birthday outbound messaging. This is now the highest-priority genuinely unfinished production item.
2. **P3 — Treatment-aware aftercare/rebooking specialization.**
3. **P3 — Loyalty redemption automation.**
4. **P3 optional — Dedicated reminder-confirmation response state**, only if operationally desired.
5. **P4 — Ozow/payment/voucher discovery and design** after P3 production hardening.

## Completed during this chapter

- ✅ P0 — Automated regression tests + CI.
- ✅ P0 — Christel personal-account Calendar permission test.
- ✅ P0 — Startup/maintenance separation + production runbook + rollback safeguards.
- ✅ P0 — Render environment-variable hygiene; obsolete operational flags removed and production rebuild verified live.
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
- ✅ P3 — Twelve licensed interim service images ingested as Shiloh-controlled WebP assets.
- ✅ P3 — Effective image mapping verified for all 49 current active services; unknown future services fail closed.
- ✅ P3 — Production catalogue/asset/WhatsApp imagery smoke test passed; temporary Pexels bridge removed and importer/smoke workflows archived.
- ✅ P3 — Versioned Booking Policy & Terms implemented with explicit WhatsApp acceptance and auditable consent record.
- ✅ P3 — Safe synthetic production booking-policy self-test added behind admin authentication; no WhatsApp send or real booking mutation required.
- ✅ P3 — Live synthetic policy acceptance test passed and cleaned up after itself.

## Safety rules retained

- Do not impersonate Marietjie or Abigail.
- Do not send unnecessary messages to real clients during audits/migrations/tests.
- Do not use genuine appointments for destructive testing.
- Prefer read-only/non-mutating verification and narrowly scoped guarded repairs when a write is unavoidable.
- Do not delete the Goldie account or historical data; it remains archival reference.
- Do not redo production work already marked ✅ unless a new regression is discovered.
- Use only Shiloh-owned/licensed or explicitly approved imagery for customer-facing service cards; do not hotlink arbitrary third-party images.
- `PEXELS_API_KEY` may remain in Render for future approved image acquisition, but current production catalogue rendering must not depend on Pexels availability.
- Do not bulk-replace Render environment variables without a verified inventory of all currently required production keys.
- Production self-tests must use synthetic identities, must not send messages to real clients, must not create genuine appointments or Calendar events, and must clean synthetic state afterward.

## Next action

**P0 and P1 are CLOSED. P2 is functionally complete. P3 service catalogue imagery, Render environment cleanup and Booking Policy consent gate are COMPLETE.** Proceed one item at a time with the highest-priority genuinely unfinished production item: **configure and approve the WhatsApp birthday template before enabling birthday outbound messaging**.