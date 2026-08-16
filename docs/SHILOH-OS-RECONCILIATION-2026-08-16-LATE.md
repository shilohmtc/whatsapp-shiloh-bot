# Shiloh OS — Late 16 August 2026 Reconciliation

Authoritative reconciliation point after the 19:26 SAST Master/Tracker snapshot.

## Production baseline

GitHub `main` and Render production are aligned at runtime commit `d1e9532eb4d92f18021118d23558b0f99cfdfa34` (`Add once-only existing-client WhatsApp transition welcome`). Render verified this exact commit `live` on 2026-08-16. The PR regression CI for the transition-welcome change completed successfully before merge.

This reconciliation supersedes the older runtime-baseline statements in the 19:26 SAST Master/Tracker where they conflict, while preserving all unrelated human/provider/evidence gates.

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

### Existing-client WhatsApp transition welcome — production live

Existing active fully registered clients now receive a polished once-only transition welcome when they begin with a greeting-only message such as Hi/Hello/Good morning. The message reassures prior users of the number that they are in the right place, introduces Shiloh as the clinic AI assistant, explains treatment guidance, live availability and booking/management capability, and provides direct human contact by Calls & SMS on `066 239 9138`.

The transition marker is durable in canonical client `custom_attributes` and is written only after successful WhatsApp delivery. Direct operational messages such as booking/reschedule/cancel are not intercepted. New/incomplete-client onboarding remains unchanged. Juvan remains a suitable controlled real-world acceptance client if he has not already received the transition welcome.

Runtime commit: `d1e9532eb4d92f18021118d23558b0f99cfdfa34` (`Add once-only existing-client WhatsApp transition welcome`) — current verified Render-live baseline.

## Business communication copy decision

Christel's personal WhatsApp autoreply copy was finalized outside the bot runtime. Official business contact number is `066 239 9138`; it is also the WhatsApp number connected to Shiloh. The direct WhatsApp CTA should therefore resolve to `https://wa.me/27662399138` and use the wording `Chat directly with Shiloh AI Assistant on WhatsApp`. The email copy is `shilohmtc@gmail.com`. This is a communication-copy decision, not a bot-runtime mutation.

## Gates preserved unchanged

- Historical attendance truth remains human-certified; never infer attendance.
- Appointment #558 remains fail-closed until the actual practitioner is established from authoritative evidence.
- Do not recreate or mutate appointments merely for proof.
- Pa Derik #567 remains subject only to the genuine normal cancellation action when appropriate; prior reschedule evidence remains preserved.
- Provider/template state must never be inferred from runtime code. `shiloh_staff_finalization_actions_v1` remains governed by the latest fresh Meta/provider evidence; re-check provider state before claiming proactive shortcut availability or delivery.
- Genuine handset/provider delivery evidence remains distinct from code/configuration state.

## Continuation priority

For the next continuation checkpoint, read the existing Master + Tracker and this reconciliation note together. Treat current runtime baseline as `d1e9532e...` verified live. Re-check any dynamic production/provider/human state before quoting live counts or provider status. Do not redo the historical-calendar, finalization-menu/service-change, or existing-client-transition-welcome work.