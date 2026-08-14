# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth across ChatGPT sessions. Historical detail is preserved in the archived pre-approval ledger and Git history; do not redo completed work merely because this current ledger is concise.

## Authority model

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or calendar state without positive evidence.

## Current production baseline

- Ordinary approval policy: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative.
- Dummy Test approval: JP admin account alone.
- Client-created pending holds have no automatic expiry and remain unavailable until explicit approval/decline.
- MediHeel treatment ownership: **Christel only**.
- PR #207: confirmation calendar CTAs + Reschedule/Cancel controls.
- PR #209: symmetric `Add to Google Calendar` / `Add to Apple / Outlook` copy.
- PR #210: deterministic multi-booking Reschedule/Cancel selection, list pagination above three, typed fallback, no guessing.
- PR #211: suppress reminders during active client change collection; canonical CRM client-name preference.
- PR #213: reschedule availability excludes only the appointment being moved and its own Google Calendar event.
- PR #214: post-reschedule calendar/change controls; provider-safe support for future reminder template with native change buttons.
- **PR #216 runtime baseline:** squash merge `23c366271528aa851fccf588d2060ff66a8fee7e`; Render deploy `dep-d9vg4had0e5s73afuh30` live. Destructive cancellation review uses **Confirm cancellation** / **Keep appointment** buttons while preserving typed `YES` / `STOP`, late-policy warning and canonical cancellation semantics.
- Reconciliation PR #217 merge `3398740e5ca95cc9f3311ffb3438b2b8cc8db7ce`; descendant Render deploy `dep-d9vg66bncjis738tmuvg` live.
- Direct Render Postgres reads remain tooling-limited by the known SSL/TLS connector failure; do not treat that tooling limitation as CRM truth.

## Real Client Perspective acceptance — 2026-08-14

### Appointment #564 — fully accepted positive approval path

Dummy Test #564 proves the complete positive approval chain for Medi-Heel Pedicure (With Gel Toes) & Foot Massage with Christel: indefinite held slot, JP-only actionable approval, held-slot exclusion, explicit JP approval, client confirmation, and canonical `Shiloh — Bookings` Google Calendar event containing CRM appointment #564 and Dummy Test mobile `27716742646`.

**#564 remains confirmed Saturday 15 August 2026, 10:45–12:15. Do not mutate or cancel it merely for proof.**

### Confirmation and change UX — real accepted

- Booking confirmation: concise summary, Google Calendar CTA, Apple / Outlook CTA, Reschedule and Cancel booking buttons, typed fallbacks.
- Multi-booking Reschedule and Cancel selection: deterministic appointment buttons, full summaries, typed booking-number fallback, no guessing, explicit statement that other bookings remain unchanged.
- Reminder/change coordination: reminders do not interrupt an active change journey; after completion the reminder used canonical client name `Dummy Test` and updated appointment time.
- Cancellation destructive review: correct appointment context, within-24-hours warning, `Nothing has changed yet.`, **Confirm cancellation** / **Keep appointment** buttons, typed `YES` / `STOP` fallback.

### Appointment #565 reschedule — REAL-ACCEPTED

#565 was successfully rescheduled from 12:30 to **12:15–13:45**. PR #213 repaired a real self-conflict defect in replacement-slot discovery. Post-deploy availability correctly offered 12:15 and 12:30 while preserving #564's occupied period. Review showed old → new time and `Nothing has changed yet.` before write. Google Calendar independently verified the existing #565 event updated to 12:15–13:45 and #564 remained 10:45–12:15, meeting exactly at the boundary with no overlap.

### Appointment #565 cancellation — REAL-ACCEPTED

The controlled cancellation lifecycle is now complete and accepted:
- old pre-PR-#216 typed-only review was safely stopped; Shiloh explicitly confirmed the appointment remained unchanged;
- Cancel booking was re-entered and `12:15 · #565` selected deterministically;
- new destructive review showed correct MediHeel service, Christel, Sat 15 Aug 2026 12:15, booking #565, within-24-hours/possible 50% fee warning, `Nothing has changed yet.`, **Confirm cancellation** and **Keep appointment** buttons, plus typed `YES` / `STOP` fallback;
- explicit **Confirm cancellation** produced the client confirmation `Your appointment has been cancelled`, retained the late-policy notice, and offered `BOOK` as the next route;
- independent Google Calendar search immediately after cancellation found **no #565 event** in the 15 August window;
- independent Google Calendar search verified **#564 remained unchanged at 10:45–12:15**, Christel + correct MediHeel service, with Dummy Test mobile `27716742646` retained.

**#565 is now cancelled. Do not recreate it merely for testing.**

## Provider/template and other fail-closed items

- 🟡 Post-reschedule Google/Apple calendar CTAs + Reschedule/Cancel controls are code/CI/production-live via PR #214; REAL acceptance waits for a future genuine successful reschedule. Do not mutate #564 solely to prove them.
- 🟠 Reminder native Reschedule/Cancel buttons remain provider-template WAITING. Code supports/provisions `shiloh_appointment_reminder_actions_v1`, but production must continue using the existing approved reminder template until Meta approval, explicit `WHATSAPP_REMINDER_ACTIONS_TEMPLATE` configuration, and real delivery evidence exist.
- 🟠 Google Contacts synchronization is not implemented. Shiloh CRM remains authoritative. If implemented later, use deliberate one-way CRM → Google Contacts sync with normalized-phone dedupe, durable CRM identity linkage, auditable failures and privacy/deletion rules; exclude test/demo clients by default unless explicitly authorized.
- 🟠 Six known attendance finalizations remain WAITING for genuine Completed/No-show truth; never infer attendance.
- 🟠 Ozow remains WAITING on merchant configuration and explicit business rules.
- 🟠 Destructive privacy execution remains fail-closed pending legal/owner authority and evidence.

## Remaining Client Perspective priorities

Completed/accepted: Lymphatic family/routing; Beauty & Aesthetics presentation; MediHeel presentation and Christel-only routing; #564 positive Dummy Test approval/hold/calendar path; booking confirmation actions; multi-booking change selection; #565 canonical reschedule; reminder/change coordination; #565 canonical cancellation and Calendar removal.

Genuinely unfinished actionable work:
1. **Separate genuine Dummy Test JP-decline journey** — ready and highest-priority actionable Client Perspective item. It must use a new genuine request and prove indefinite hold → JP Decline → client decline outcome → held slot released → no confirmed Calendar event. Do not recreate #561, #565, or alter #564.
2. **Ordinary approval acceptance** — Marietjie self; Christel self; Abigail approved by Abigail or Christel, first valid decision authoritative. Requires genuine controlled evidence.
3. Post-reschedule action controls — wait for a future genuine reschedule rather than manufacturing another mutation solely for proof.
4. Reminder native buttons — provider/Meta evidence-gated; preserve WAITING.

## Exact continuation state

Controlled appointments:
- **#561** — cancelled historical test. Never recreate.
- **#564** — confirmed, Sat 15 Aug 2026 **10:45–12:15**, Christel + MediHeel, fully accepted positive-approval evidence. Leave unchanged.
- **#565** — **cancelled** after fully accepted controlled cancellation lifecycle. Google Calendar #565 event absent after cancellation. Never recreate merely for proof.

**Next actionable Client Perspective priority:** run a **new genuine Dummy Test JP-decline journey**. This is next because the positive JP approval path is already accepted while the symmetric explicit-decline path remains unproven and is not externally blocked. Use safe self-test-first engineering only if a defect is exposed. Preserve all WAITING items fail-closed and do not mutate #564.
