# Shiloh Production Audit & Next-Chapter Handoff — 10 Aug 2026

## Current production baseline

- Repository: `shilohmtc/whatsapp-shiloh-bot`, branch `main`.
- Render service: `shiloh-whatsapp-bot`, auto-deploy from `main`, Node 24.14.1, Starter plan, Oregon, 1 instance, `npm ci` / `npm start`, `/health` health check.
- Current CRM-6 production baseline reached after commit `112c3c34d3fe285a885f5cbe07120fec15773f28`.
- WhatsApp CRM is the booking source of truth; Google Calendar is the synchronized operational view.
- All 28 future CRM appointments were presentation-reconciled to Google Calendar with 0 errors during CRM-6 rollout.
- Christel can see the shared `Shiloh — Bookings` calendar from her personal Google account.
- Christel and Jean-Pierre have business-wide booking and service/pricing administration in the current admin flow.
- Staff-scoped authorization remains the model for Marietjie and Abigail; do not impersonate or production-test their accounts while they are unavailable.

## Verified role model

- Christel — business owner; all-business operational scope and full booking/calendar management.
- Jean-Pierre — business admin; all-business operational scope.
- Marietjie — independent/tenant practitioner; own clients/services/appointments/pricing scope.
- Abigail — employee practitioner; own appointment/client operational scope; no catalogue pricing authority.
- Savanna and Pieter — freelance overflow; no permanent client-bookable/master-calendar authority.

## CRM-6 capabilities now live

- Admin menu exposes `Manage a booking` and `Services & pricing` for authorized admins.
- Authorized booking changes can update service, practitioner, date/time and booked price.
- Service/practitioner edits are atomic; scheduling edits re-check staff eligibility, clinic hours, staff schedule, CRM conflicts and Google Calendar conflicts.
- Existing appointment price snapshots are preserved unless the specific booking is explicitly repriced.
- Google Calendar titles lead with the treatment and practitioner, e.g. `💆 Full Body Swedish — Client — Christel`.
- Calendar event descriptions preserve Shiloh CRM metadata; treatment prices are intentionally excluded from calendar titles.
- Multi-service service replacement is intentionally blocked in the WhatsApp edit flow until a safer line-item editor exists.

## Audit findings requiring attention

1. **Automated test coverage is the largest engineering gap.** `package.json` currently has no `test` script and the latest GitHub commit has no CI status checks. Production smoke tests exist, but they are guarded one-time runtime routines, not a repeatable automated test suite.
2. **Direct Render Postgres audit connector currently fails SSL/TLS negotiation.** The application itself is healthy and database-backed smoke tests pass, but the external read-only Render SQL connector is not reliable enough to be our sole audit path.
3. **README is effectively empty.** Repository operational knowledge is distributed across code/docs/conversation history. This handoff and the revised README should become the canonical starting point.
4. **Goldie remains a live public source with stale/incompatible catalogue information.** Do not disconnect Goldie until the final catalogue/policy/booking cutover checklist below is complete.
5. **One-time repair/reconciliation code has accumulated in the application startup path.** All related flags are normally disabled, but after stabilization these routines should be moved to explicit maintenance scripts so startup stays small and deterministic.

## Priority checklist — tick off in this order

### P0 — Stabilize before adding commercial features

- [ ] **Safe Christel owner-access calendar test.** Create a disposable test event, edit it from Christel's personal Google account, verify intended permissions, then remove it. Do not touch a client appointment.
- [ ] **Add automated tests + CI.** Cover service/staff authorization, booking conflict checks, booking updates, pricing scope, calendar formatting/idempotency, cancellation and Goldie-import idempotency. Add `npm test` and GitHub Actions before the next large feature.
- [ ] **Production observability/maintenance cleanup.** Convert one-time startup repair flags to explicit maintenance scripts; add a small operational runbook and verify health/logging/deploy rollback procedure.

### P1 — Catalogue and Goldie exit readiness

- [ ] **Professional service-catalogue polish.** Normalize service names, spelling, categories, descriptions, durations and price presentation across CRM/WhatsApp/calendar/client-facing text.
- [ ] **Resolve Goldie-vs-Shiloh discrepancies.** Important current discrepancies include Pressotherapy still being publicly offered on Goldie despite removal from Shiloh; Goldie export staff mappings that conflict with Shiloh's authoritative staff rules; and legacy copy/spelling issues.
- [ ] **Confirm business policies before Goldie disconnect.** Preserve/implement clinic hours, 24-hour cancellation/50% late-cancel policy, loyalty reward policy, address/contact/social links, and any desired couples/group-spa-day rules.
- [ ] **Final Goldie booking delta.** Immediately before disconnecting Goldie, take one final export and import/reconcile any bookings created after the 10 Aug export. Then disable public Goldie booking only after the delta is zero.
- [ ] **Archive non-PII Goldie reference material.** Keep an export manifest/checksum and sanitized business/catalogue snapshot in GitHub. Keep raw client/appointment exports outside Git history because they contain client PII.

### P2 — Staff rollout

- [ ] **Marietjie calendar authorization.** Grant only the calendar/client scope required for her independent services. Test with Marietjie present.
- [ ] **Abigail calendar authorization.** Grant employee-practitioner visibility/operational scope. Test with Abigail present.
- [ ] **Staff admin UX polish.** Make admin responses concise, constructive and consistent; ensure role-specific menus hide functions users cannot perform.

### P3 — Client experience layer

- [ ] **New client WhatsApp greeting.** Friendly, premium and concise; position Shiloh as the clinic's AI booking assistant without over-selling AI.
- [ ] **Walk-in QR registration.** QR should open a mobile-first registration/WhatsApp flow with privacy notice, minimal required fields and duplicate-client matching. Do not expose admin endpoints in the QR.
- [ ] **Booking communication lifecycle.** Instant confirmation, calendar-add link/ICS, 24-hour reminder, confirmation tracking, cancellation/reschedule confirmation, aftercare and rebooking, using approved WhatsApp templates where required.
- [ ] **Loyalty + birthdays.** Rebuild the desired Goldie loyalty rule in Shiloh and add opt-in customer-care automation with frequency controls.

### P4 — Payments and vouchers

- [ ] **Ozow discovery/design first.** Define voucher purchase, deposits and payment-link use cases; confirm fees/API/webhook capabilities, refunds, expiry, reconciliation and POPIA/accounting requirements before implementation.
- [ ] **Payment ledger + webhook idempotency.** Never treat a redirect/browser return as authoritative payment success. Record provider transaction IDs, signed webhook status and reconciliation history.
- [ ] **Voucher lifecycle.** Unique voucher code, purchaser/recipient, amount/service, issue/redeem/expiry/refund states, audit trail and partial redemption policy.

## Goldie disconnect gate

Goldie should not be disconnected until all of these are true:

- Future appointment delta is zero after a final export.
- Every future appointment is represented in Shiloh CRM and Google Calendar.
- Staff routing/service ownership is authoritative in Shiloh.
- Active service catalogue, prices and durations have been reviewed.
- Cancellation/loyalty/contact/hours policies are represented in Shiloh.
- Client booking entry point is clearly moved to WhatsApp/Shiloh (and QR where applicable).
- Goldie public booking is disabled only after a controlled cutover check.

## Start prompt for the next chat

> Continue the Shiloh production project from `docs/HANDOFF-NEXT-CHAPTER-2026-08-10.md`. Treat GitHub `main`, Render production, Shiloh CRM and the shared Google Calendar as authoritative. Work through the Priority Checklist one item at a time, starting at P0. Verify each change in GitHub and Render before marking it complete. Do not production-test Marietjie or Abigail while they are unavailable, and do not send client messages during migration/audit work unless explicitly requested.
