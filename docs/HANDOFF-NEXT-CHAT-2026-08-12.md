# Shiloh OS — Production Handoff — 12 Aug 2026

This is the authoritative next-chat entry point. GitHub `main`, Render production, Shiloh CRM and Google Calendar override older notes.

## Audited current production state

- GitHub `main` and Render production are aligned at `226498b28401c3d71d7866851ff2c88b5b593a14` after PR #124, which added the guarded past-appointment finalization workflow.
- Render service `shiloh-whatsapp-bot` remains on `main` with auto-deploy enabled and health path `/health`.
- Post-release verification showed clean startup, repeated HTTP 200 health checks, no application warning/error/fatal logs in the checked window, and a booking-integrity scan with zero unlinked booking-like events.
- CRM remains authoritative for appointments, services, staff eligibility, client identity and reporting truth. Google Calendar remains availability/diary/mirror infrastructure rather than appointment truth.
- Client-bookable practitioners remain Christel, Abigail and Marietjie only. Savanna/Pieter remain internal overflow freelancers and are excluded from direct client discovery and routing.

## Completed since the original 12 Aug audit

1. ✅ **Admin Menu reliability + real WhatsApp UI.** Top-level Admin uses genuine WhatsApp interactive controls with stable action IDs; route coverage is regression-locked for Christel, Abigail and Marietjie; scoped authorization, hard Menu/Home escape and no advertised-action generic fallback are preserved.
2. ✅ **Client booking UX + service/practitioner discovery.** The client journey is CRM-backed and WhatsApp-native: category-first service browsing, service -> eligible practitioner(s), practitioner -> mapped services, Any available, authoritative slot selection, identity/onboarding preservation and guarded confirmation. Internal freelancers are excluded.
3. ✅ **Authoritative practitioner profiles + AI knowledge.** Active practitioner/service mappings are injected into authoritative AI business knowledge. Public practitioner metadata is approval-gated and fail-closed. Christel and Abigail use the approved public title “Massage practitioner”. Marietjie remains intentionally unpublished for title/bio/specialty fields until explicitly approved business copy is supplied; her live mapped services remain answerable without inferred qualifications.
4. ✅ **Booking-path end-to-end production audit.** The handoff acceptance set is covered by non-mutating regression contracts plus read-only production verification: new/returning client identity, service/practitioner questions, practitioner-specific and Any available booking, unavailable/stale slot behavior, explicit policy acceptance, canonical appointment creation, shared/practitioner Google Calendar mirroring, fail-closed final conflict checks, cancellation and rescheduling. Explicit `I AGREE` leads to one final locked revalidation and canonical CRM write; stale slots return to time selection, transient failures remain explicitly retryable, and partial calendar writes are compensated.
5. ✅ **Admin reporting/earnings production audit.** Appointment and earnings route contracts are regression-locked and production health is clean. Earnings remain completed-only and fail closed/provisional when canonical final-status truth is missing. Production integrity evidence showed zero unresolved Goldie reconciliation exceptions for Christel and Abigail. Today was clean for both. Historical periods were provisional only because past canonical appointments still lacked explicit final attendance state: Christel — week 4, last week 9, month 16; Abigail — week 2, last week 17, month 22 at the time of audit. No attendance was guessed. A guarded WhatsApp-native “Finalize past visits” workflow is now live: only past non-final appointments in authorized scope are listed; an admin must explicitly choose Completed or No-show; the appointment is revalidated/row-locked and canonical status, status history, lifecycle state and CRM audit are updated transactionally. Calendar/payment truth is not altered. Remaining provisional historical periods are therefore an operational truth-review backlog, not a reporting-engine defect.

## Booking integrity details now authoritative

- Client policy acceptance alone is not treated as a booking claim. Canonical appointment creation occurs only after final identity, active service, client-bookable practitioner, `staff_services`, clinic-hours, practitioner-schedule, CRM-conflict, shared Google Calendar and practitioner Google Calendar checks.
- Successful client bookings write canonical appointment/service/staff snapshots, status history and audit evidence, then consume the booking intent.
- Shared Google helper functions enforce dual-calendar behavior for client cancellation and rescheduling: availability checks include both calendars; updates maintain the practitioner mirror; cancellation removes the practitioner mirror and shared event.
- The booking-integrity monitor recognizes linked practitioner events through the canonical Shiloh appointment identifier and keeps unlinked booking-like events fail-closed for review.

## Reporting integrity details now authoritative

- Christel and Abigail earnings are based only on canonical appointments with status `completed`.
- Abigail remains fixed at 20% commission on eligible completed appointments plus R5,000 monthly salary on the monthly view only; shorter-period views do not prorate salary.
- Joint-practitioner and unpriced appointments fail closed rather than being silently counted.
- Historical appointments are never auto-completed because elapsed time does not establish attendance truth. `scheduled`/`confirmed` past visits must be explicitly finalized as Completed or No-show by an authorized admin when the business knows the real outcome.
- Goldie is no longer the active blocker for the audited earnings periods; unresolved canonical final statuses are the remaining source of provisional historical totals.

## Prioritized checklist — current state

1. ✅ **Admin Menu reliability + real WhatsApp UI.** Complete and production-verified.
2. ✅ **Client booking UX + service/practitioner discovery.** Complete and production-verified.
3. ✅ **Authoritative practitioner profiles + AI knowledge.** Actionable engineering complete; Marietjie public descriptive metadata remains intentionally fail-closed pending approved business wording.
4. ✅ **Booking-path end-to-end production audit.** Complete with CI/non-mutating contracts and read-only post-release production verification.
5. ✅ **Admin reporting/earnings production audit.** Engineering/audit complete. Historical totals remain correctly provisional until staff explicitly finalize unresolved past appointments using the new guarded workflow; do not auto-infer attendance.
6. 🟡 **Birthday template approval/configuration.** NEXT. Preserve fail-closed state while externally blocked on Meta approval; enable only after positive approval of `shiloh_birthday_wish_v2` and current-brand copy verification.
7. 🟡 **Remaining P3 customer-care work.** Treatment-aware aftercare/rebooking, loyalty lifecycle follow-through and optional reminder-confirmation improvements after booking/admin journeys are stable.
8. ⬜ **P4 payments/Ozow/vouchers.** Deliberately deferred until Admin + client booking/reporting are proven reliable. Payment truth must remain separate from booking truth.

## Safe engineering rule

Test safely yourself first: CI/non-mutating regression tests -> synthetic/read-only production verification -> narrowly guarded test hooks only when necessary. Do not send unnecessary real-client messages, mutate genuine appointments, weaken authorization, or bypass CRM/calendar integrity to test.

## Start here in the next chat

**Shiloh OS**

Continue the Shiloh OS production project from `docs/HANDOFF-NEXT-CHAT-2026-08-12.md`.

Treat GitHub `main`, Render production, Shiloh CRM and Google Calendar as authoritative. Do not redo completed work. Apply the safe self-test-first engineering rule automatically.

Start with the highest-priority genuinely unfinished actionable item. Current expected next item: **#6 Birthday template approval/configuration**. If Meta approval remains pending/rejected, preserve the fail-closed state and move to the next safely actionable item without weakening controls.
