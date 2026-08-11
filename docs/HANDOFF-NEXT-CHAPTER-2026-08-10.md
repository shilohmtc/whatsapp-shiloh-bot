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
- Current role model remains:
  - Christel — owner, all-business scope.
  - Jean-Pierre — business admin, all-business scope.
  - Marietjie — `tenant_practitioner`, own-services/client/appointment/pricing scope.
  - Abigail — `employee_practitioner`, own appointment/client operational scope and no catalogue-pricing authority.
- Direct Render read-only Postgres auditing is currently blocked by a Render connector SSL/TLS negotiation error. This is **not** being treated as a production database outage: `/health` is healthy and database-backed rollout/smoke routines are completing in the live service.

## Fresh consolidated audit — P0 to P4

### P0 — Stabilize before adding commercial features

- 🟡 **Christel owner-access calendar verification.** Christel can see the shared calendar according to the prior baseline and the calendars are healthy under the Shiloh account, but the final disposable-event create/edit/delete test from Christel's personal Google account has not been freshly re-verified in this audit. Never use a genuine client appointment for this test.
- ⬜ **Automated regression tests + CI.** `package.json` still has no `test` script and there is no `.github/workflows` directory. Guarded production smoke tests exist, but they are not a repeatable automated test suite.
- 🟡 **Production observability / maintenance cleanup.** Render health checks and structured logs are live and deploy verification is working. One-time rollout/repair routines still exist in the application startup path behind guards and should be moved to explicit maintenance scripts; an operational rollback/runbook remains to be formalized.

### P1 — Catalogue, data presentation and Goldie exit readiness

- ✅ **Targeted legacy service/catalogue and imported-client text cleanup.** Production rollout completed successfully on 11 Aug with `status=complete`, updating 3 categories, 21 services, 157 appointment snapshots, 26 canonical client names and 47 source-client names. This includes guarded cleanup of known legacy Goldie spelling/name presentation problems rather than blindly importing Goldie wording.
- 🟡 **Full professional catalogue cross-surface review.** The guarded cleanup is complete, but a final human review of every active service name, description, duration, category and price presentation across CRM/WhatsApp/client-facing surfaces is still required before calling the entire catalogue publication layer final.
- 🟡 **Google Calendar presentation cleanup.** Dedicated Marietjie and Abigail calendars are normalized and populated. The shared `Shiloh — Bookings` calendar is largely polished, but the 11 Aug audit still found at least one legacy `Client - ...` prefix and one legacy punctuation/name-format inconsistency. Do not bulk-destructively rewrite genuine appointments; use the existing idempotent reconciliation path or tightly scoped repairs.
- 🟡 **Goldie-vs-Shiloh discrepancies.** Shiloh staff authorization overrides historical Goldie staff mappings and known legacy service/name cleanup has been applied. The public Goldie catalogue remains an independent live surface until cutover, so final equivalence must be checked immediately before disconnect.
- 🟡 **Business-policy parity.** Clinic hours, the 24-hour cancellation / 50% late-cancel policy and loyalty foundation are represented in Shiloh. Final confirmation is still required for all public contact/social/review links and the desired couples/group-spa-day wording before Goldie is disabled.
- ✅ **Non-PII Goldie archive manifest.** `docs/GOLDIE-EXPORT-MANIFEST-2026-08-10.md` records the 10 Aug export checksum and inventory; raw PII remains outside Git history.
- ⬜ **Final Goldie booking delta / cutover snapshot.** The 10 Aug export is historical only. A new final export, future-appointment comparison, delta import and zero-unresolved reconciliation are still required immediately before disconnect.

### P2 — Staff-scoped CRM authorization and calendars

- ✅ **Role-specific WhatsApp admin menus and staff-scoped authorization.** Production P2 smoke test passed with 0 mutations and 0 WhatsApp messages. Owner/business-admin, tenant-practitioner and employee-practitioner scopes were resolved correctly, including role-specific menu visibility and service mappings.
- ✅ **Marietjie tenant/practitioner permissions.** `tenant_practitioner`, own-services calendar/service scope and own-client/appointment/pricing boundaries are live. No impersonation or real-client messaging was used to verify rollout.
- ✅ **Dedicated `Shiloh — Marietjie` Google Calendar.** Calendar exists and is owner-visible from the Shiloh account. Rollout recorded 10 future Marietjie appointments created successfully; the live calendar audit sees those future events.
- ✅ **Abigail employee-practitioner permissions.** `employee_practitioner`, own-appointments operational scope and no catalogue pricing authority are live. No impersonation or real-client messaging was used to verify rollout.
- ✅ **Dedicated `Shiloh — Abigail` Google Calendar.** Calendar exists and is owner-visible from the Shiloh account. Rollout recorded 7 future Abigail appointments created successfully; the live calendar audit sees those future events.
- ✅ **Existing future appointments populated into staff calendars.** Current dedicated-calendar event sets match the guarded rollout counts for Marietjie and Abigail.
- 🟡 **Staff acceptance testing with the real practitioners.** Core authorization is complete and production-smoke verified. Optional real-user acceptance should only occur with Marietjie/Abigail present; do not impersonate either person.

### P3 — Client experience and customer care

- ✅ **Premium customer greeting.** New/unknown greeting-only conversations receive the premium Shiloh welcome; registered returning clients keep the personalized welcome-back flow.
- ✅ **Walk-in QR registration.** `/walk-in` is wired to the production WhatsApp entry flow, reuses canonical identity matching, does not expose admin credentials/routes, and asks only for required registration data with privacy-use notice.
- ✅ **Booking confirmation + calendar add.** Confirmation is canonical/idempotent and includes service, practitioner, date/time, location, Google Calendar link and secure ICS where available.
- ✅ **Client cancellation/rescheduling.** Native Shiloh flow scopes requests to the client's own canonical upcoming appointments, requires explicit confirmation and synchronizes CRM/lifecycle/calendar updates with conflict re-checking.
- ✅ **Reminder/customer-care infrastructure.** Live runtime starts the appointment lifecycle scheduler with 24-hour reminders, post-appointment follow-up and both reminder/follow-up templates configured. Migrated Goldie bookings are not bulk-enrolled, avoiding unnecessary messages to real clients.
- ✅ **Birthday and loyalty foundations.** Canonical loyalty ledgers, 5-visit/10% reward entries, loyalty status commands, explicit birthday opt-in/out and idempotent birthday scheduling foundations are live.
- 🟡 **Birthday outbound messaging.** Customer-care scheduler is live but production currently reports `birthdayTemplateConfigured=false`; birthday messages remain correctly fail-closed until an approved WhatsApp birthday template is configured.
- 🟡 **Aftercare/rebooking specialization.** Generic follow-up infrastructure is live; treatment-aware aftercare/rebooking copy is still to be designed and mapped safely.
- 🟡 **Loyalty redemption.** Reward creation/status is live; booking/payment-layer redemption rules are not yet automated.
- 🟡 **Reminder confirmation tracking.** Reminder delivery exists; a dedicated client confirmation-response state (for example `CONFIRM APPOINTMENT`) remains optional/unimplemented.

### P4 — Payments and vouchers

- ⬜ **Ozow discovery/design.** Define voucher purchase, deposits/payment-link use cases, fees/API/webhook capabilities, refunds, expiry, reconciliation and POPIA/accounting requirements before implementation.
- ⬜ **Payment ledger + webhook idempotency.** No production implementation should treat a browser redirect as authoritative payment success; signed provider webhook state and reconciliation history remain to be designed/implemented.
- ⬜ **Voucher lifecycle.** Unique voucher code, purchaser/recipient, amount/service, issue/redeem/expiry/refund states, audit trail and partial-redemption policy remain outstanding.

## Goldie disconnect gate — current status

**Overall: 🟡 NOT CLEARED — Goldie must remain connected/public until the final gate is fully verified.**

- ⬜ New final Goldie export taken immediately before cutover.
- ⬜ Future appointment delta compared against Shiloh after that final export.
- ⬜ Any final booking delta imported and reconciled.
- 🟡 Every currently known future appointment is represented operationally in Shiloh/Google Calendar, but this must be re-proved against the final Goldie export.
- ✅ Shiloh staff routing/service ownership is authoritative and P2-scoped.
- 🟡 Active service catalogue/prices/durations have received targeted cleanup; full final cross-surface review remains.
- 🟡 Cancellation/loyalty/hours foundations are represented; final public policy/contact/couples/group wording still needs cutover review.
- ✅ Client entry has a Shiloh WhatsApp path and walk-in QR route.
- ⬜ Zero unresolved future bookings formally proven at cutover.
- ⬜ Goldie public booking disabled only after all checks above pass.

The 10 Aug Goldie ZIP/manifest is a historical cross-reference, **not** the final disconnect snapshot.

## Prioritized checklist from this audit

Work **one item at a time** and verify GitHub + Render after each production change.

1. **P0 — Automated regression tests + CI** — highest-priority actionable engineering gap. Add `npm test` and a safe CI workflow without mutating production or messaging clients.
2. **P0 — Christel personal-account calendar permission test** — still required, but must be performed using a disposable event from Christel's actual personal Google session; never impersonate another practitioner and never edit a client booking.
3. **P0 — Move guarded one-time startup repairs/rollouts into explicit maintenance scripts + document rollback/runbook.**
4. **P1 — Finish shared-calendar presentation normalization** using idempotent/tightly scoped reconciliation; no destructive testing on genuine appointments.
5. **P1 — Final human catalogue/policy cross-surface review** and close remaining Goldie-vs-Shiloh public discrepancies.
6. **P3 — Configure approved birthday template** before enabling birthday outbound messaging.
7. **P3 — Treatment-aware aftercare/rebooking and loyalty redemption rules**; add reminder-confirmation state only if operationally desired.
8. **Goldie exit gate — FINAL CUTOVER ONLY:** fresh export → compare future delta → import delta → reconcile CRM/calendar → prove zero unresolved → disable Goldie public booking.
9. **P4 — Ozow/payment/voucher discovery and design**, only after the operational cutover/stability work above is complete.

## Safety rules retained

- Do not impersonate Marietjie or Abigail.
- Do not send unnecessary messages to real clients during audits/migrations/tests.
- Do not use genuine appointments for destructive CRM/calendar testing.
- Prefer read-only/non-mutating smoke checks and disposable synthetic records/events where a write test is unavoidable.
- Do not disconnect Goldie until the exit gate above is fully verified.
- Do not redo production work already marked ✅ unless a new regression is discovered.

## Next action

Start with prioritized item **#1: P0 automated regression tests + CI**. The owner-personal calendar permission test remains important but requires Christel's genuine personal Google session; it must not be simulated by impersonation or by editing real client appointments.
