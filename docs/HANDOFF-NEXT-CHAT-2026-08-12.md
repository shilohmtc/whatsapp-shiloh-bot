# Shiloh OS — Production Handoff — 12 Aug 2026

This is the authoritative next-chat entry point. GitHub `main`, Render production, Shiloh CRM and Google Calendar override older notes.

## Audited current production state

- GitHub `main` application release audited at `0bbb74761eda883fce561c3904426f57edce8213` before this documentation update.
- Render `shiloh-whatsapp-bot` is live on that same application release; auto-deploy remains enabled.
- Recent WhatsApp production evidence confirms Christel remains recognized as Admin. Recent failures were routing/session-contract defects, not authorization loss.
- Admin fixes now live include: hard escape from unfinished Demo Client with Menu/Admin Menu/Home; deterministic Today/Tomorrow routing; Last week's clients; earnings integrity/provisional warnings; Last Week earnings; guided Find Client state; Demo Client for Christel/Abigail/Marietjie; mandatory demo cleanup.
- Booking/calendar integrity remains: CRM is authoritative; Google Calendar is availability/diary/mirror only; `Shiloh — Bookings` is human read-only; practitioner calendars are checked for busy conflicts; unlinked booking-like calendar events are monitored fail-closed.

## Audit findings — Admin Mode

1. The main Admin Menu is still primarily rendered as a long dynamically numbered text menu. Only a small subset of top-level actions use genuine WhatsApp controls.
2. This design has repeatedly allowed display/routing drift (for example numbered Today/Tomorrow and guided Find Client). Although those specific defects are fixed, the interface contract remains fragile.
3. Recommended architecture: make the main Admin Menu a genuine WhatsApp interactive list using stable action IDs. Use reply buttons only for short decisions with at most three choices. Numbers may remain as optional aliases, never as the primary routing contract.
4. Every visible Admin action must have an automated route test proving: displayed action ID -> intended guarded handler -> correct role/scope -> no generic-assistant fallthrough.
5. Reporting is business-critical. Earnings remain completed-only and fail closed/provisional when CRM final-status gaps or unresolved Goldie evidence could understate a figure.

## Audit findings — Client booking / service discovery

1. Shiloh's general AI receives the authoritative active CRM service catalogue (service names, category, duration, price, customer description and booking note).
2. The authoritative `staff_services` mapping is enforced by booking/availability logic, but that practitioner↔service mapping is NOT currently included in the general AI knowledge context.
3. Therefore, Shiloh must not yet be considered fully authoritative for conversational questions such as “Which services does Marietjie offer?” or “Who can do this treatment?” outside the guarded booking path.
4. The client booking experience is still substantially conversational/text-driven. It should be upgraded to a WhatsApp-native browse-and-book journey that can expose the active service catalogue and the eligible client-bookable practitioner(s) for the selected service.
5. Clients should also be able to browse in the reverse direction: practitioner -> active services that practitioner is mapped to.
6. Client-bookable practitioners remain Christel, Abigail and Marietjie only. Savanna/Pieter remain internal overflow freelancers and must never appear as direct client choices.

## Audit finding — Practitioner profiles / AI answers

- There is no dedicated authoritative customer-facing practitioner-profile layer yet.
- Add structured CRM-backed fields for client-facing practitioner title/role, short bio and optional approved specialties/intro copy.
- AI knowledge should combine those approved practitioner profiles with the live active `staff_services` mapping.
- Never infer or embellish qualifications/titles. Christel and Abigail are to be presented as Shiloh massage practitioners per current business direction. Marietjie's exact customer-facing title/description must be stored from an explicitly approved business value rather than guessed.
- Once implemented, Shiloh should accurately answer: “Tell me about Christel”, “What does Abigail do?”, “What does Marietjie offer?”, “Who does Swedish Massage?”, and equivalent service/practitioner questions.

## New prioritized checklist

1. 🟡 **Admin Menu reliability + real WhatsApp UI.** Convert the top-level Admin Menu to a genuine interactive list with stable IDs; audit every visible action end-to-end for Christel, Abigail and Marietjie; retain scoped permissions and hard Menu/Home escape; remove generic-assistant fallthrough for advertised actions.
2. 🟡 **Client booking UX + service/practitioner discovery.** Build a genuine WhatsApp-native client journey: Browse services / Our practitioners -> service category -> service -> eligible practitioner(s) -> availability -> onboarding/identity as needed -> guarded confirmation. Support practitioner -> services as well as service -> practitioners.
3. 🟡 **Authoritative practitioner profiles + AI knowledge.** Add approved customer-facing practitioner metadata and include active practitioner/service mappings in AI context. Keep freelancer/internal data excluded. Do not guess Marietjie's public title.
4. 🟡 **Booking-path end-to-end production audit.** Run synthetic/client-safe tests for new client, returning client, service questions, practitioner questions, practitioner-specific booking, any-eligible-practitioner booking, unavailable practitioner, reschedule, cancellation, policy acceptance, calendar mirroring and fail-closed conflict behavior.
5. 🟡 **Admin reporting/earnings production audit.** Verify Today/Tomorrow/Last Week appointment views and Christel/Abigail Today/This Week/Last Week/This Month earnings; resolve remaining Goldie reconciliation exceptions and past appointments awaiting final status so reports can become final instead of provisional where appropriate.
6. 🟡 **Birthday template approval/configuration.** Preserve fail-closed state while externally blocked on Meta approval; enable only after positive approval of `shiloh_birthday_wish_v2`.
7. 🟡 **Remaining P3 customer-care work.** Treatment-aware aftercare/rebooking, loyalty lifecycle follow-through and optional reminder-confirmation improvements only after booking/admin journeys are stable.
8. ⬜ **P4 payments/Ozow/vouchers.** Deliberately deferred until Admin + client booking are proven reliable. Payment truth must remain separate from booking truth.

## Safe engineering rule

Test safely yourself first: CI/non-mutating regression tests -> synthetic/read-only production verification -> narrowly guarded test hooks only when necessary. Do not send unnecessary real-client messages, mutate genuine appointments, weaken authorization, or bypass CRM/calendar integrity to test.

## Start here in the next chat

**Shiloh OS**

Continue the Shiloh OS production project from `docs/HANDOFF-NEXT-CHAT-2026-08-12.md`.

Treat GitHub `main`, Render production, Shiloh CRM and Google Calendar as authoritative. Do not redo completed work. Apply the safe self-test-first engineering rule automatically.

Start with the highest-priority genuinely unfinished actionable item in the new checklist. Current expected next item: **#1 Admin Menu reliability + real WhatsApp UI**. If authoritative evidence shows #1 already complete, move automatically to #2.
