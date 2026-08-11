# Shiloh Production Audit & Next-Chapter Handoff — current state 11 Aug 2026

> This file retains its original `2026-08-10` filename for continuity. GitHub `main`, Render production, Shiloh CRM-backed production state and Google Calendar are authoritative over older checklist wording.

## Classification key

- ✅ Complete — verified against current production evidence.
- 🟡 Partially complete / verification still required.
- ⬜ Outstanding.

## Current production baseline

- Repository: `shilohmtc/whatsapp-shiloh-bot`, branch `main`.
- Render service: `shiloh-whatsapp-bot`, auto-deploy from `main`, Node 24.14.1, Starter plan, Oregon, 1 instance, `npm ci` / `npm start`, `/health` health check.
- WhatsApp/CRM is the booking and reporting source of truth; Google Calendar is a synchronized operational view.
- Operational calendars: `Shiloh — Bookings`, `Shiloh — Marietjie`, `Shiloh — Abigail`.
- Roles: Christel owner/all-business; Jean-Pierre business admin/all-business; Marietjie `tenant_practitioner`; Abigail `employee_practitioner`.

## Fresh consolidated audit — P0 to P4

### P0 — Stabilize before adding commercial features

- ✅ Christel personal-account Google Calendar read/create/edit/delete permission verification.
- ✅ Automated regression tests + CI.
- ✅ Production observability / maintenance cleanup. Normal `npm start` contains no migrations, one-time repairs, imports, rollout jobs, reconciliations or smoke tests.
- ✅ Render environment-variable hygiene — VERIFIED 11 Aug 2026. Obsolete Goldie/import/rollout/migration/repair/test controls were removed in guarded groups. Required database, Google Calendar/OAuth, OpenAI, Meta/WhatsApp, admin/audit and customer-care configuration was retained. `PEXELS_API_KEY` is intentionally retained for future approved image acquisition; current production imagery remains Shiloh-hosted and does not depend on Pexels at runtime.

**P0 status: ✅ CLOSED / COMPLETE.**

### P1 — Catalogue, data presentation and Goldie exit readiness

- ✅ Targeted legacy service/catalogue and imported-client text cleanup.
- ✅ Professional catalogue cross-surface review and CRM-authority hardening.
- ✅ Google Calendar presentation cleanup.
- ✅ Business-policy parity owner-approved.
- ✅ Non-PII Goldie archive manifest retained in Git; raw Goldie PII remains outside Git history.
- ✅ Final Goldie future-booking reconciliation: 27 appointments + 11 blocks baseline, zero missing / duplicate / unresolved future bookings after the scoped duplicate repair.
- ✅ Goldie duplicate #360 silently cancelled; canonical #551 retained; no client message sent.
- ✅ Shiloh-side Goldie live knowledge sync retired.
- ✅ Goldie public online booking disabled and public surface externally verified non-bookable.

**P1 status: ✅ CLOSED / COMPLETE. Goldie is retired from the active production booking flow.**

### P2 — Staff-scoped CRM authorization and calendars

- ✅ Role-specific WhatsApp admin menus and staff-scoped authorization.
- ✅ Marietjie tenant/practitioner permissions + `Shiloh — Marietjie` calendar.
- ✅ Abigail employee-practitioner permissions + `Shiloh — Abigail` calendar.
- ✅ Existing future appointments populated into staff calendars.
- ✅ Staff-scoped reporting authorization reuses the same backend role boundary: Christel/Jean-Pierre all-business; Marietjie/Abigail practitioner-self only.
- 🟡 Optional real-practitioner acceptance testing remains; never impersonate Marietjie or Abigail.

**P2 status: ✅ FUNCTIONALLY COMPLETE. Optional practitioner acceptance testing is not a production blocker.**

### P3 — Client experience, operations and customer care

- ✅ Premium customer greeting.
- ✅ Walk-in QR registration.
- ✅ Booking confirmation + calendar add.
- ✅ Client cancellation/rescheduling.
- ✅ Reminder/customer-care infrastructure.
- ✅ Birthday and loyalty foundations.
- ✅ CRM-backed customer service catalogue + WhatsApp booking UX.
- ✅ Service imagery: 12 approved third-party images converted to Shiloh-controlled WebP assets; all 49 active services resolve to approved imagery; unknown future services fail closed.
- ✅ Booking Policy & explicit client consent gate. Version `2026-08-11-v1`; explicit acceptance recorded with timestamp/channel/request snapshot; generic `YES` is insufficient at the policy step; acceptance alone never marks an appointment confirmed.
- ✅ Legacy Goldie booking handoff wording removed from the active client-facing path.
- ✅ **WhatsApp Operational Reporting — Today slice — VERIFIED 11 Aug 2026.** `Today's report` is available to business-wide admins and `My report today` to practitioner accounts from the role-specific WhatsApp Admin menu. Reports are sourced from Shiloh CRM, not Goldie or Google Calendar. Christel/Jean-Pierre receive clinic-wide appointment, service, staff and booked-value summaries. Marietjie and Abigail are hard-scoped in SQL to appointments assigned to their own `staff_id`; service summaries are additionally restricted through `staff_services`; practitioner reports expose no clinic-wide staff breakdown and no revenue/booked-value totals. Report access is audited in `crm_audit_events`.
- ✅ **Live read-only reporting authorization self-test passed.** Against current production CRM data the owner and business-admin views each returned 5 current-day appointments, while the tenant and employee practitioner views each returned 2. Assertions passed for owner/business-wide access, tenant self-scope, employee self-scope, zero cross-staff appointment leakage, zero cross-service leakage, no practitioner all-staff breakdown and no practitioner revenue exposure. No WhatsApp message was sent and no CRM appointment/calendar data was mutated.
- 🟡 Birthday outbound messaging remains fail-closed until an approved WhatsApp birthday template is configured.
- 🟡 Treatment-aware aftercare/rebooking specialization remains.
- 🟡 Loyalty redemption automation remains.
- 🟡 Dedicated reminder-confirmation response state remains optional/unimplemented.
- 🟡 Reporting expansion remains: Tomorrow, This Week, Services/Trends, Availability and optional scheduled weekly owner summary. These must reuse the verified scope engine rather than introduce a second authorization path.

**P3 status: 🟡 CORE EXPERIENCE + TODAY OPERATIONAL REPORTING COMPLETE. Remaining work is customer-care specialization and optional reporting expansion.**

### P4 — Payments and vouchers

- ⬜ Ozow discovery/design.
- ⬜ Payment ledger + webhook idempotency.
- ⬜ Voucher lifecycle.

## Goldie disconnect gate — FINAL

**Overall: ✅ CLEARED / CLOSED 11 Aug 2026.**

- ✅ Goldie delta since archived 10 Aug export: ZERO, owner/admin attested.
- ✅ Exact archived 10 Aug export validated as cutover baseline.
- ✅ Future inventory reconciled one-for-one.
- ✅ Duplicate #360 safely repaired; no client message sent.
- ✅ Zero missing / zero duplicate / zero unresolved future Goldie bookings.
- ✅ Active Shiloh catalogue protected from stale/retired Goldie offerings.
- ✅ Client entry has Shiloh WhatsApp and walk-in QR paths.
- ✅ Shiloh live Goldie knowledge-sync dependency retired.
- ✅ Goldie public online booking disabled and verified non-bookable.
- ✅ Historical Goldie account/data retained; no destructive account deletion performed.

## Prioritized checklist

Work one item at a time and verify GitHub + Render after production changes.

1. **P3 — Configure an approved WhatsApp birthday template** before enabling birthday outbound messaging.
2. **P3 — Treatment-aware aftercare/rebooking specialization.**
3. **P3 — Loyalty redemption automation.**
4. **P3 — Reporting expansion:** Tomorrow → This Week → Services/Trends → Availability → optional weekly owner summary, all using the already-verified staff-scope engine.
5. **P3 optional — Dedicated reminder-confirmation response state**, only if operationally desired.
6. **P4 — Ozow/payment/voucher discovery and design** after P3 production hardening.

## Completed during this chapter

- ✅ P0 automated regression tests + CI; Christel personal Calendar permission test; startup/maintenance separation; Render environment cleanup.
- ✅ P1 shared Calendar presentation normalization; live catalogue audit; policy parity; Goldie baseline reconciliation; duplicate repair; Goldie public booking retirement.
- ✅ P3 public CRM-backed services catalogue, professional descriptions, WhatsApp deep links, AI catalogue alignment and Shiloh-hosted service imagery.
- ✅ P3 versioned Booking Policy & explicit WhatsApp consent gate with safe live synthetic verification.
- ✅ P3 first Shiloh-native WhatsApp operational report: role-aware Today summary with business-wide owner/admin view and practitioner-self Marietjie/Abigail views.
- ✅ P3 live read-only authorization verification proving zero practitioner cross-staff and cross-service leakage and no practitioner revenue exposure.

## Safety rules retained

- Do not impersonate Marietjie or Abigail.
- Do not send unnecessary messages to real clients during audits/migrations/tests.
- Do not use genuine appointments for destructive testing.
- Prefer read-only/non-mutating verification and narrowly scoped guarded repairs when a write is unavoidable.
- Do not delete the Goldie account or historical data; it remains archival reference.
- Do not redo production work already marked ✅ unless a new regression is discovered.
- Use only Shiloh-owned/licensed or explicitly approved imagery for customer-facing service cards.
- `PEXELS_API_KEY` may remain in Render for future approved image acquisition, but current production catalogue rendering must not depend on Pexels availability.
- Do not bulk-replace Render environment variables without a verified inventory of all required production keys.
- Production self-tests must not send messages to real clients, create genuine appointments or Calendar events, or mutate genuine booking data.
- Practitioner reporting scope must be enforced in backend queries, not merely hidden in WhatsApp menus.

## Next action

**P0 and P1 are CLOSED. P2 is functionally complete. P3 catalogue, imagery, booking-policy consent and the staff-scoped Today operational report are COMPLETE.** Proceed one item at a time with the highest-priority genuinely unfinished production item: **configure and approve the WhatsApp birthday template before enabling birthday outbound messaging**.