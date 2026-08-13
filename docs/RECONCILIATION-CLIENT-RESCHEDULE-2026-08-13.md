# Shiloh OS — Client Reschedule Reconciliation — 2026-08-13

Status: subordinate reconciliation evidence for `docs/SHILOH-OS-MASTER-STATUS.md` and `docs/SHILOH-OS-PROJECT-TRACKER.md`.

Operational truth remains GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human evidence.

## Current production baseline

GitHub `main` is `441f4dfaaebd955d9325296ac74510312254906d`, the squash merge of PR #177 (`Fix bare client reschedule command`). Render deployment `dep-d9v1bsoae00c738t5qkg` is live on that exact SHA.

## Real Dummy Test evidence now established

The same dedicated Dummy Test journey progressed through HIFU → Marietjie → Friday 14 August 2026 → morning availability → 11:00 selection → booking-policy acceptance → canonical booking creation.

Real WhatsApp confirmed appointment #561 for HIFU with Marietjie on Friday 14 August 2026 at 11:00–11:30. Independent Google Calendar verification established matching shared `Shiloh — Bookings` and Marietjie calendar events referencing CRM appointment #561. This is sufficient evidence that booking creation and both Calendar mirrors succeeded, while direct CRM connector verification remains tooling-limited and must not be invented.

The booking confirmation exposed client-facing implementation diagnostics (`Booking created successfully — appointment #...`, Calendar sync lines, and `canonical CRM` / `calendar revalidation` wording). A separate isolated `polish-client-booking-confirmation` branch contains regression-first work for removing those diagnostics from client output while preserving internal audit/CRM/calendar evidence. That polish is not yet merged and must remain open; do not claim it production-live.

## Reschedule defect and production repair

After appointment #561 was created, real Dummy Test replied exactly `RESCHEDULE`, matching the confirmation instruction. Production fell through to the generic assistant, which asked the client to resend booking date, time, treatment, practitioner and desired new date/time.

Root cause: `appointmentChange.detectAction()` did not recognize bare `RESCHEDULE`; it required wording that also mentioned `appointment` or `booking`. The canonical appointment-change service itself already supports auto-selecting a sole upcoming appointment and carrying forward its service/practitioner/current time context.

PR #177 repaired only the client routing boundary. Exact bare `RESCHEDULE` or `CANCEL` is normalized to the existing appointment-change vocabulary before calling `processAppointmentChangeMessage()`. No appointment mutation, availability revalidation, atomic reschedule, compensation, or Calendar synchronization semantics were changed.

Self-test-first evidence:
- PR #177 test-only CI #435 failed before implementation.
- Implementation then added the narrow routing normalization.
- CI #437 passed on the corrected candidate.
- Final patch inspection showed only `src/controllers/webhookController.js` plus `tests/client-appointment-reschedule-atomicity.test.js`.
- PR #177 squash-merged as `441f4dfaaebd955d9325296ac74510312254906d`.
- Render auto-deployed that exact SHA as `dep-d9v1bsoae00c738t5qkg`, which is live.

## Current Product-Critical Gate

Client Perspective Testing remains ACTIVE / PRODUCT-CRITICAL. The exact next real WhatsApp step is to send `RESCHEDULE` again from the same Dummy Test number while appointment #561 remains unchanged. Expected behavior: Shiloh should identify the sole upcoming canonical appointment, display/carry forward HIFU + Marietjie + current appointment context, and ask only for the new day/date rather than requiring the client to re-enter known booking details.

Do not reset Dummy Test or recreate appointment #561. Preserve the existing appointment unless and until the reschedule flow positively confirms a new slot. After reschedule acceptance, independently verify CRM/Calendar mutation evidence, then continue cancellation acceptance using the same controlled lifecycle.

## Fail-closed items preserved

- A1 six Christel/Abigail attendance outcomes remain WAITING on explicit human truth.
- A3 staff finalization reminder template provider state must still be positively verified before promotion/sending.
- D1 birthday template provider state must still be positively verified before promotion/sending.
- E1 Ozow remains WAITING on merchant/configuration and explicit business rules.
- Destructive privacy/de-identification execution remains disabled; no reconciliation here changes that boundary.
