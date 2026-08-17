# Shiloh OS — Late 16 August 2026 Reconciliation

Authoritative reconciliation point after the 19:26 SAST Master/Tracker snapshot, extended through the 17 August universal client-entry deployment.

## Production baseline

GitHub `main` and Render production are aligned at runtime commit `8e82edbcdc25c8fb3619b5c4b77e66687d085a1e` (`Use one universal Shiloh welcome for new and registered clients`). PR CI passed before merge, `main` CI passed after merge, Render verified this exact commit `live` on 2026-08-17, Shiloh started normally, and production health checks returned HTTP 200.

This reconciliation supersedes the older runtime-baseline statements in the 19:26 SAST Master/Tracker and the earlier baseline in this note where they conflict, while preserving all unrelated human/provider/evidence gates.

## Changes completed after the 19:26 SAST snapshot

### Historical manual bookings — production live

Historical manual bookings now create the canonical CRM appointment and synchronize the Google Calendar event so genuine past appointments are visible in the clinic diary. Practitioner-calendar mirroring follows the existing configured calendar path. Historical creation suppresses the ordinary client booking notification and leaves the appointment unresolved/scheduled for later certification through Admin → Appointments → Finalize past visits. Existing clinic/practitioner/service/conflict validation remains in force.

Runtime commit: `0e75f73d058b09a502994c22193981afda3bf660` (`Sync historical admin bookings to Google Calendar`), subsequently included in current production.

### Historical finalization menu parity + Service change — production live

The role-authorized historical finalization workflow now exposes the polished outcome set for both Christel and Marietjie:

1. Completed — Client attended as booked
2. No-show — Client did not attend
3. Cancelled — Appointment was cancelled
4. No charge — Client attended; R0 charge and R0 earnings
5. Service change — A different treatment was performed
6. Adjust price — Change the final amount charged
7. Reschedule — Move the appointment to another date/time
8. Leave unresolved — Save no final outcome yet

Service change is functional rather than presentation-only: it records the actual treatment performed, preserves the original service in audit/history, supports an optional final-price adjustment including R0, and finalizes the visit through the canonical completed path. Finalized visits leave the pending finalization queue. Marietjie receives menu parity without gaining Christel/Abigail certification authority; existing server-side certification scope remains unchanged.

Runtime commit: `41bda2ae2b57cb72dddc1addfecb45ba3e01dcb7` (`Add service change and finalization menu parity`), subsequently included in current production.

### Existing-client WhatsApp transition welcome — superseded by universal v2 entry model

The earlier once-only existing-client transition welcome at runtime commit `d1e9532eb4d92f18021118d23558b0f99cfdfa34` is now superseded by the universal client-entry model below. Its approved copy and transition intent are preserved within the v2 onboarding experience rather than remaining registered-client-only.

### Universal WhatsApp client welcome — production live

All clients now share one polished first-contact Shiloh introduction when entering through a greeting-only first-contact path. The welcome reassures prior users of the number that they are in the right place, introduces Shiloh as the clinic AI assistant, explains treatment guidance, live availability and booking/management capability, and provides direct human contact by Calls & SMS on `066 239 9138`.

After the shared introduction, Shiloh branches by authoritative identity/registration state:

- **Fully registered client:** Shiloh explicitly confirms that the client is already registered and does not need to register again, then presents a guided WhatsApp action surface for booking, treatments, practitioners and the main menu.
- **Genuinely new client:** Shiloh shows the same universal introduction first, then enters the canonical registration flow for first name, surname, date of birth and gender.
- **Incomplete or ambiguous existing identity:** existing claim/verification and fail-closed identity safeguards remain in force; Shiloh does not falsely declare the person fully registered.
- **Direct operational messages:** booking/reschedule/cancel intent is not intercepted merely to display onboarding copy.

The universal welcome has a durable phone-level v2 delivery ledger so the same person does not receive the transition introduction again merely because they move from unregistered to registered state. Delivery state is recorded only after successful send. The earlier client-level transition marker remains historical compatibility state and is not the canonical v2 gate.

Runtime commit: `8e82edbcdc25c8fb3619b5c4b77e66687d085a1e` (`Use one universal Shiloh welcome for new and registered clients`) — current verified Render-live baseline.

## Business communication copy decision

Christel's personal WhatsApp autoreply copy was finalized outside the bot runtime. Official business contact number is `066 239 9138`; it is also the WhatsApp number connected to Shiloh. The direct WhatsApp CTA should therefore resolve to `https://wa.me/27662399138` and use the wording `Chat directly with Shiloh AI Assistant on WhatsApp`. The email copy is `shilohmtc@gmail.com`. This is a communication-copy decision, not a bot-runtime mutation.

## Fresh provider state captured during 17 August deployment

Render startup evidence for current production confirmed:

- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — still **PENDING / UTILITY** at the fresh 2026-08-17 production startup check.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.

Therefore the proactive historical Finalize shortcut remains fail-closed on the new action-template provider gate. Ordinary Admin → Appointments → Finalize past visits remains the canonical available path and is not blocked by that provider status.

## Gates preserved unchanged

- Historical attendance truth remains human-certified; never infer attendance.
- Appointment #558 remains fail-closed until the actual practitioner is established from authoritative evidence.
- Do not recreate or mutate appointments merely for proof.
- Pa Derik #567 remains subject only to the genuine normal cancellation action when appropriate; prior reschedule evidence remains preserved.
- Provider/template state must never be inferred from runtime code. Re-check dynamic provider state before any later claim that a pending template has become approved or has delivered successfully.
- Genuine handset/provider delivery evidence remains distinct from code/configuration state.
- Live historical unresolved counts are dynamic; recount from production before quoting them as current.

## Continuation priority

For the next chat, read `docs/SHILOH-OS-MASTER-STATUS.md`, `docs/SHILOH-OS-PROJECT-TRACKER.md`, and this reconciliation note together before acting. Treat runtime `8e82edb...` as the verified production baseline. Re-check dynamic production/provider/human state before quoting live counts or provider status.

Do not redo the historical-calendar work, finalization-menu/service-change work, or universal client-welcome implementation. The next chat should give the standard four-part checkpoint before the first new substantial controlled action, then continue from the highest-priority genuinely actionable workstream.