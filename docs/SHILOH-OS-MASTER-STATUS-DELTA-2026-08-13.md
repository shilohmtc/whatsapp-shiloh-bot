# Shiloh OS — Master Status Delta

This subordinate delta records the 2026-08-13 Client Perspective lifecycle reconciliation pending the next safe full-Master edit. It supplements, but does not replace, `docs/SHILOH-OS-MASTER-STATUS.md`.

## Client booking + reschedule production truth

- Dummy Test booking **#561** was created for **HIFU · Marietjie · Friday 14 August 2026**, originally at **11:00–11:30**, after explicit acceptance of Booking Policy version `2026-08-11-v1`.
- Matching `Shiloh — Bookings` and `Shiloh — Marietjie` Calendar mirrors were independently verified after booking creation.
- PR #177 fixed exact bare `RESCHEDULE` / `CANCEL` routing into the existing canonical appointment-change flow. Real WhatsApp re-acceptance proved the existing HIFU/Marietjie appointment is carried forward without requiring the client to re-enter known booking details.
- PR #178 changed reschedule collection to **new date → Morning/Afternoon/Evening → authoritative available slots → selected-slot recheck → existing atomic confirmation**. The underlying appointment mutation/revalidation path remained fail-closed.
- PR #179 polished the reschedule availability presentation: `Choose an available time below. 🌿`, no client-visible `authoritative now`, natural `Available times` section naming, and explicit pagination destination copy.
- Real Dummy Test then selected **10:00** and explicitly confirmed the change. Appointment #561 was successfully rescheduled from **11:00–11:30 to 10:00–10:30** on Friday 14 August 2026.
- Independent Google Calendar verification after the mutation found appointment #561 at **10:00–10:30** in both `Shiloh — Bookings` and `Shiloh — Marietjie`, and no remaining Dummy Test event in the old 11:00 window. This is strong evidence that the existing appointment was moved rather than duplicated. Direct CRM-row verification remains tooling-limited and must not be inferred beyond the WhatsApp/Calendar evidence.

## PR #181 — reschedule confirmation UX

PR #181 (`Polish reschedule confirmation UX`) is production-live. Self-test-first evidence: regression-only CI **#448 failed** before implementation; final candidate CI **#453 passed**. The final patch changes only `src/services/clientRescheduleAvailability.js` plus `tests/client-reschedule-confirmation-polish.test.js`; the atomic `src/services/appointmentChange.js` mutation/revalidation engine is unchanged.

The production presentation contract is now:
- pre-commit reschedule confirmation is a genuine WhatsApp button interaction;
- client sees clearly separated **Current appointment** and **New appointment** details;
- client-visible internal booking number is removed from that confirmation;
- buttons are **Confirm reschedule** (`yes`) and **Keep appointment** (`stop`), reusing the existing proven YES/STOP semantics rather than introducing new mutation commands;
- post-reschedule client copy becomes `✅ Appointment rescheduled` and `We look forward to seeing you. 🌿`, removing CRM/Google Calendar synchronization diagnostics from the client surface.

GitHub `main` and Render production were positively aligned on PR #181 merge **`74348dccf9ad9fc3eacfdcd22fa789b4bceb71ed`**, Render deploy **`dep-d9v21llg1s2s73fibeo0`** live on 2026-08-13, before this documentation reconciliation commit.

## Current Product-Critical continuation

The functional reschedule transaction is **🟢 VERIFIED to real WhatsApp + both Calendar mirrors**. PR #181's new button/polished confirmation presentation is **🔵 deployed / awaiting real WhatsApp re-acceptance**. Re-enter `RESCHEDULE` on the same appointment #561 without resetting Dummy Test, reach the new confirmation controls and positively exercise the presentation/abort-or-confirm behavior. After that, proceed to the real cancellation lifecycle test.

The original booking-confirmation diagnostic copy and the normal new-booking availability diagnostic copy remain explicit open polish debt. All existing WAITING/provider/privacy/payment items remain fail-closed and are unchanged by this delta.
