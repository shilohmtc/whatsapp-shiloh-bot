# Shiloh Production Audit & Next-Chapter Handoff — current state 11 Aug 2026

> This file retains its original `2026-08-10` filename for continuity, but the status below was freshly reconciled on **11 Aug 2026**. GitHub `main`, Render production, Shiloh CRM-backed rollout evidence and Google Calendar are authoritative over older checklist wording.

## Classification key

- ✅ Complete — verified against current production evidence.
- 🟡 Partially complete / verification still required — production capability exists or most work is complete, but a defined verification or follow-up remains.
- ⬜ Outstanding — genuinely not yet implemented/completed.

## Current production baseline

- Repository: `shilohmtc/whatsapp-shiloh-bot`, branch `main`.
- Render service: `shiloh-whatsapp-bot`, auto-deploy from `main`, Node 24.14.1, Starter plan, Oregon, 1 instance, `npm ci` / `npm start`, `/health` health check.
- WhatsApp/CRM remains the booking source of truth; Google Calendar is a synchronized operational view.
- Operational calendars visible to `shilohmtc@gmail.com`: `Shiloh — Bookings`, `Shiloh — Marietjie`, and `Shiloh — Abigail`.
- Current role model remains: Christel owner/all-business; Jean-Pierre business admin/all-business; Marietjie `tenant_practitioner`; Abigail `employee_practitioner`.
- Direct Render read-only Postgres auditing remains blocked by a Render connector SSL/TLS negotiation error. This is not being treated as a production database outage: `/health` remains healthy. A sanitized public-business catalogue audit endpoint now provides read-only production catalogue verification without client/staff/appointment PII.

## Fresh consolidated audit — P0 to P4

### P0 — Stabilize before adding commercial features

- ✅ **Christel owner-access calendar verification.** Freshly verified on 11 Aug 2026 from Christel's genuine personal Google Calendar session against `Shiloh — Bookings`, using disposable test records only. Read/visibility, edit/save, delete and fresh create all passed. The fresh test event was deleted afterwards; no test residue remains and no genuine client appointment was modified or deleted.
- ✅ **Automated regression tests + CI.** `npm test` and `.github/workflows/ci.yml` are live on `main`. The non-mutating suite covers calendar ID/presentation contracts, walk-in registration policy, staff-scope/menu guards, booking conflict guards, client cancellation safeguards, structural Goldie replay/duplicate protections, clean startup boundaries and maintenance-command safety.
- ✅ **Production observability / maintenance cleanup.** Normal `npm start` now starts only the HTTP service plus legitimate long-running schedulers. Migrations, identity/staff repairs, smoke tests, staff-calendar rollouts, catalogue polish, Goldie future import, Google Calendar reconciliation/access setup and calendar-presentation reconciliation have been removed from normal startup and moved behind explicit `npm run maintenance -- <command>` operator actions. Mutating commands require `--confirm`; the legacy WhatsApp-capable startup test additionally suppresses messaging unless `--allow-whatsapp` is explicitly provided. `docs/PRODUCTION-RUNBOOK.md` documents deploy verification, pre-write safeguards, rollback and data/Calendar recovery.

**P0 status: ✅ CLOSED / COMPLETE. Reopen only for a new regression.**

### P1 — Catalogue, data presentation and Goldie exit readiness

- ✅ **Targeted legacy service/catalogue and imported-client text cleanup.** Production rollout completed successfully on 11 Aug with guarded cleanup of known legacy Goldie spelling/name presentation problems.
- ✅ **Professional catalogue cross-surface review and authority hardening.** Live production audit verified 49 active services across 14 active categories, with zero known legacy-name findings, no missing price presentation and no missing duration. `ba7f5940993fc7408fba2fecdc58ece90f4294b2` changed booking verification to fail closed against the active Shiloh CRM catalogue rather than Goldie knowledge. `bfe690836eef6e6ea854fa2c8b559ec05a56c805` made the active CRM catalogue authoritative over Goldie legacy knowledge for free-form AI service names, prices and durations. Full regression CI passed and Render deployed the exact hardening commit live. Detailed findings: `docs/P1-CATALOGUE-POLICY-AUDIT-2026-08-11.md`.
- ✅ **Google Calendar presentation cleanup.** Fresh read-only audit on 11 Aug covered all 28 future events on shared `Shiloh — Bookings`. Only two confirmed shared-calendar presentation defects were repaired: appointment #354 removed the legacy `Client -` prefix while preserving the CRM-backed canonical `Janita Hatting (Marietjie Pienaar)` display; appointment #552 restored the missing closing parenthesis in `Gwendie T (Willemien Lezar, Skoonsussie)`. Appointment #365 (`Helenay Swanepoel - Healing`) and other unusual-looking client labels were deliberately left unchanged because the CRM-backed dedicated practitioner calendar preserved the same production values, so there was no evidence they were defects. A fresh post-write scan confirmed the two fixes and no broad reconciliation was run.
- 🟡 **Goldie-vs-Shiloh public discrepancies.** Current Goldie remains stale relative to Shiloh: legacy spellings and Goldie-only/retired offerings still exist publicly. These are now contained because Shiloh active CRM catalogue is authoritative, but the public Goldie surface remains until final cutover.
- ✅ **Business-policy parity — OWNER APPROVED 11 Aug 2026.** Canonical wording is: **“Couples and group/spa-day bookings are available for selected treatments. Please contact Shiloh to arrange the most suitable option.”** The currently published Goldie Facebook and Instagram accounts are retained as Shiloh's official social links after Goldie retirement. Address, hours, high-level cancellation terms and Google review destination are aligned.
- ✅ **Non-PII Goldie archive manifest.** `docs/GOLDIE-EXPORT-MANIFEST-2026-08-10.md` records the historical 10 Aug export checksum/inventory; raw PII remains outside Git history.
- ⬜ **Final Goldie booking delta / cutover snapshot.** A new final export, future-appointment comparison, delta import and zero-unresolved reconciliation are required immediately before disconnect.

### P2 — Staff-scoped CRM authorization and calendars

- ✅ Role-specific WhatsApp admin menus and staff-scoped authorization.
- ✅ Marietjie tenant/practitioner permissions and dedicated `Shiloh — Marietjie` calendar.
- ✅ Abigail employee-practitioner permissions and dedicated `Shiloh — Abigail` calendar.
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

**Overall: 🟡 NOT CLEARED — Goldie must remain connected/public until the final gate is fully verified.**

- ⬜ New final Goldie export immediately before cutover.
- ⬜ Future appointment delta comparison.
- ⬜ Final booking delta import/reconciliation.
- 🟡 Re-prove every future appointment against the final export.
- ✅ Shiloh staff routing/service ownership is authoritative and P2-scoped.
- ✅ Active Shiloh catalogue authority is protected from stale/retired Goldie offerings.
- ✅ Business-policy parity owner-approved.
- ✅ Client entry has Shiloh WhatsApp and walk-in QR paths.
- ⬜ Zero unresolved future bookings formally proven at cutover.
- ⬜ Disable Goldie public booking only after all checks pass.
- ⬜ After Goldie public booking is disabled, retire Goldie legacy knowledge/sync dependencies from Shiloh.

## Prioritized checklist from this audit

Work **one item at a time** and verify GitHub + Render after each production change.

1. **P1 / Goldie exit gate — FINAL CUTOVER ONLY:** fresh export → compare future delta → import/reconcile delta → verify CRM/calendars/staff routing → prove zero unresolved → disable Goldie public booking → retire Goldie legacy knowledge/sync dependencies.
2. **P3 — Configure approved birthday template** before enabling birthday outbound messaging.
3. **P3 — Treatment-aware aftercare/rebooking and loyalty redemption rules**; add reminder-confirmation state only if operationally desired.
4. **P4 — Ozow/payment/voucher discovery and design**, only after operational cutover/stability work above is complete.

### Completed during this chapter

- ✅ P0 — Automated regression tests + CI.
- ✅ P0 — Christel personal-account calendar permission test.
- ✅ P0 — Startup/maintenance separation + production runbook + rollback safeguards (`166d59c5f4d099ef20b0e09d1d744ddf7c639721`).
- ✅ P1 — Shared `Shiloh — Bookings` calendar presentation audit and tightly scoped normalization of confirmed defects only.
- ✅ P1 — Live production catalogue audit: 49 active services / 14 active categories; legacy-name, price and duration checks all PASS.
- ✅ P1 — Booking flow validates current services against active CRM catalogue (`ba7f5940993fc7408fba2fecdc58ece90f4294b2`).
- ✅ P1 — Free-form AI prioritizes active CRM catalogue over Goldie legacy service knowledge (`bfe690836eef6e6ea854fa2c8b559ec05a56c805`).
- ✅ P1 — Owner approved selected-treatment couples/group/spa-day wording and retention of current Facebook/Instagram destinations as official Shiloh social links.

## Safety rules retained

- Do not impersonate Marietjie or Abigail.
- Do not send unnecessary messages to real clients during audits/migrations/tests.
- Do not use genuine appointments for destructive CRM/calendar testing.
- Prefer read-only/non-mutating smoke checks and disposable synthetic records/events where a write test is unavoidable.
- Mutating maintenance commands require explicit confirmation; WhatsApp-capable maintenance suppresses messaging by default.
- Do not disconnect Goldie until the exit gate above is fully verified.
- Do not redo production work already marked ✅ unless a new regression is discovered.

## Next action

**P1 business-policy parity is CLOSED / APPROVED.** Proceed directly to the final Goldie exit gate: obtain a fresh Goldie export immediately before cutover, compare all future appointments against Shiloh CRM/calendars, import/reconcile any delta, prove zero unresolved future bookings, then disable Goldie public booking and retire remaining Goldie legacy knowledge/sync dependencies.