# Shiloh OS — Project Tracker

Updated: 2026-08-17 13:28 SAST
Purpose: concise operational dashboard. Master is the detailed current ledger; do not redo completed work.

## Canonical status system

| State | Meaning |
|---|---|
| 🟢 VERIFIED | Completed with sufficient authoritative evidence. |
| 🔵 ACTIVE | Work currently being executed. |
| ⚪ READY | Actionable now, but not currently being executed. |
| 🟠 WAITING | Requires human/provider/external/genuine-journey truth before advancing. |
| 🔴 DEFECT / HOLD | Proven problem or unsafe state; fail closed until repaired and re-verified. |
| ⏸️ DEFERRED | Deliberately postponed by explicit project decision. |

## Governance

New chat: read Master + Tracker + `docs/SHILOH-OS-RECONCILIATION-2026-08-16-LATE.md` on GitHub `main` first; verify applicable production/provider state; give the four-part checkpoint (authoritative state, highest-priority continuation, why next, remaining gate); obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping. Stop for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Provider lead-time and button-first rules remain permanent. Never manufacture appointments, provider approval, attendance truth, or handset evidence.

## Production baseline

Latest runtime-semantic application baseline: **`0fba72068423e03a0c68fbb806ca1bb59d00ee48`** (`Fix SQT client-list SQL ordering`), verified **live** on Render after PR #261 CI passed. Shiloh started normally and repeated `/health` checks returned HTTP 200.

Documentation-only commits after `0fba720...` may advance `main`/Render without changing runtime semantics.

Latest authoritative startup provider evidence:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**
- `shiloh_staff_finalization_actions_v1` — **PENDING / UTILITY**
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| ADMIN-POLISH | Role-aware Admin UX polish | 🟢 VERIFIED | Appointments prioritized Finalize → Make booking → Manage booking; Reports simplified; Client details moved to More; pricing/schedule UX role-aware and button/list-first. Historical finalization menu includes Completed, No-show, Cancelled, No charge, Service change, Adjust price, Reschedule, Leave unresolved. |
| HIST-BOOK-CALENDAR | Historical manual booking CRM + Calendar sync | 🟢 VERIFIED | Canonical CRM appointment + configured Google Calendar sync; no ordinary client notification; remains unresolved for later certification. Do not redo. |
| ATT-AUTH | Attendance certification authority | 🟢 VERIFIED | Christel finalizes Christel+Abigail only; Marietjie finalizes Marietjie only; Abigail cannot finalize. Server-side enforcement + reminder scoping. |
| A1-HIST-REVIEW | 1–15 Aug historical attendance final review | 🔵 ACTIVE / human truth | 31 prior Completed/No-show records were deliberately reopened with history preserved; plus 17 already unresolved gave 48 routable visits immediately after reopening. **Live remaining count is dynamic; re-query before quoting.** Four cancelled visits untouched. |
| A1-558 | Appointment #558 practitioner identity | 🔴 HOLD | 6 Aug, unresolved, historical practitioner `SHILOH MTC`. Fail closed; establish real practitioner before assignment/finalization. |
| META-FINALIZE-ACTIONS | `shiloh_staff_finalization_actions_v1` | 🟠 WAITING provider | Latest production startup state PENDING / UTILITY. Re-check Meta. No proactive shortcut send until APPROVED. |
| FINALIZE-SHORTCUT | Proactive historical Finalize button | 🟢 IMPLEMENTED / 🟠 provider gate | Role/count-aware, idempotent, direct to authorized queue. Ordinary Admin path remains usable. Delivery waits on META-FINALIZE-ACTIONS approval. |
| C1-UNIVERSAL-WELCOME | Universal WhatsApp client entry | 🟢 VERIFIED | Greeting-only first-contact model production-live; Meta body-limit defect repaired; registered-client handset path proven. |
| C1-WELCOME-BOOK-ROUTE | Registered/legacy Book appointment routing | 🟢 VERIFIED | Current and already-delivered legacy payloads route directly to service discovery. Handset-proven; do not redo. |
| C1-ELIGIBLE-ORDER | Eligible-practitioner DISTINCT ordering | 🟢 VERIFIED | PostgreSQL DISTINCT-compatible ordering repaired and regression-covered. |
| C1-LIFECYCLE-PARITY | Booking/cancellation appointment-action button parity | 🟢 VERIFIED | Pa Derik-tested controls restored; cancellation exposes button-first rebooking. Dummy Test #574 proved approval → confirmation → reminder actions → cancellation. |
| C1-PRACTITIONER-DIR | Client practitioner directory polish | 🟢 VERIFIED | Handset-proven: Christel/Abigail Massage Practitioner; Marietjie canonical title Esthetician with Aesthetic Practitioner role line; internal client-bookable wording removed. |
| C1-CATEGORY-DIR | Client category ordering/count polish | 🟢 VERIFIED | Massage Treatments pinned first, Pedicures & Foot Care second, remainder alphabetic; treatment counts; pagination preserved. |
| C1-SQT | SQT BioMicroneedling taxonomy + label + SQL repair | 🟢 VERIFIED | One virtual client family with 2 treatments; numeric prefixes removed; DISTINCT SQL defect repaired in `0fba720...`; final handset proof at 13:28 SAST. Underlying CRM identities unchanged. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING normal cancellation | Reschedule handset evidence captured; Sunday/loop defect fixed. #567 remains Tue 18 Aug 08:30–10:15 with Christel. Do not mutate for proof. |
| C1-RESCHEDULE-UX | Closed-day + loop-state repair | 🟢 VERIFIED | Closed Sunday excluded/rejected; another-date clears stale candidate; authoritative slot + explicit confirm handset-proven with Pa Derik. |
| C1-ACTION-HELPER | Supplemental appointment-action token helper | 🟢 FIXED / 🟠 natural evidence | `ensureToken` export defect fixed after Pa Derik core mutation. Re-prove naturally; do not re-mutate #567. |
| JUVAN-E2E | Juvan controlled beginning-to-end client acceptance | ⚪ READY | Retained controlled CRM identity/reset. Resume after immediate attendance/provider checkpoint unless reprioritized. |
| CRM-PROVENANCE | CRM48 / CRM473 provenance | 🟢 VERIFIED | Legitimate controlled Goldie imports; keep. CRM IDs are not proof of bot registration. |
| CRM1-REVIEW | CRM1 orphan-like provenance | ⚪ READY | Read-only identity/supersession review; do not delete without proof. |
| CRM-IMPORTED-CLAIM | Existing Goldie client first WhatsApp verification | 🟢 FIXED / 🟠 natural evidence | Unique unverified imported mobile enters claim/verification on same CRM; ambiguity fails closed. Await natural eligible first contact. |
| META-LIFECYCLE | Existing lifecycle template package | 🟢 CONFIGURED / 🟠 per-route evidence | Existing generation remains configured; genuine delivery evidence is per-route. Finalization-actions template tracked separately and still provider-gated. |
| C1-POSTBOOK-UX | Post-confirmation client UX | 🟢 VERIFIED | Appointment-action buttons restored and handset-proven in controlled lifecycle journey. |
| C1-FOLLOWUP-V2 | Follow-up/rating delivery | 🟠 WAITING genuine journey | Verify only after genuine completed-visit timing. |
| C1-REMINDER-ACTIONS | Reminder action delivery | 🟢 PARTIALLY VERIFIED / 🟠 natural coverage | Controlled Dummy Test proved reminder action buttons; remaining genuine-route evidence stays natural-journey gated. |
| BIRTHDAY-V2 | Birthday delivery | 🟠 WAITING genuine eligibility | Genuine CRM birthday + opt-in/business rules only. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Lower priority; CRM authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last-authoritative 0 QPM; revisit only when Google evidence changes. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Admin exact state

Appointments visible priority: **Finalize past visits → Make a booking → Manage a booking → Today's clients → Tomorrow's clients**. Availability is integrated into booking rather than a standalone everyday action. Walk-in is removed from normal navigation.

Historical finalization exposes **Completed, No-show, Cancelled, No charge, Service change, Adjust price, Reschedule, Leave unresolved**. Service change records actual treatment performed while preserving original service in audit/history; finalization authority remains role-scoped.

Reports: **Today's report + Earnings** with role-aware earnings access and completed-only accounting.

More: **Client details** plus back navigation; Calendar integrity remains diagnostic but hidden; generic Help removed.

Services/pricing: Christel controls shared Christel/Abigail pricing; Marietjie controls her own. Pieter/Savanna are removed from normal operational surfaces.

Schedule: Abigail requests leave for Christel approval; Christel manages leave requests/own availability/controlled closures; Marietjie manages her own availability independently. Fixed staff hours and freelancer availability are not everyday controls. Leave approval must surface appointment conflicts and never silently move/cancel clients.

## Historical attendance exact state

Production audit before reopening found 53 appointments in 1–15 Aug: 31 finalized, 4 cancelled, 17 unresolved/routable, 1 unroutable #558.

Approved production operation reopened the 31 finalized records to unresolved/scheduled while preserving prior status history and adding explicit reopening provenance. Cancelled visits remained untouched.

Reopened IDs: `327, 328, 329, 330, 331, 334, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 349, 350, 351, 352, 357, 485, 486, 553, 554, 556, 557, 559, 562`.

Previously unresolved routing evidence:
- Christel: `353, 548, 355, 356, 487, 359, 551, 564`
- Marietjie: `326, 332, 333, 335, 555, 348, 354, 550, 358`

Thus **48 visits** were routable immediately after reopening. Treat that as historical checkpoint evidence, not a live current total. Re-query/recount before quoting the current remaining count.

#558 remains separate and fail-closed.

## Client discovery exact state

The 17 August client-discovery reconciliation is complete and must not be reopened without new evidence.

Practitioner directory handset presentation:
- **Christel · Massage** — Massage Practitioner
- **Abigail · Massage** — Massage Practitioner
- **Marietjie · Esthetician** — Aesthetic Practitioner
- **Book now** — Start with a service or preference

Category ordering:
1. **Massage Treatments** — pinned first; canonical category remains `Massage`.
2. **Pedicures & Foot Care** — pinned second.
3. Remaining categories alphabetized.
4. Client subtitles use treatment counts.
5. Existing two-page pagination preserved.

SQT client presentation:
- One **SQT BioMicroneedling** category with **2 treatments**.
- **SQT Anti-Aging Rejuvenation…** — 90 min · R1785–R2585.
- **SQT Resurfacing BioMicroneedling…** — 90 min · R1785–R1840.
- No `1.` / `2.` client-facing prefixes.
- Underlying CRM service/category identities remain untouched.

## Meta/provider exact state

Latest production startup evidence at runtime baseline `0fba720...`:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **PENDING / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.

The proactive historical shortcut remains provider-gated. Re-check current provider state before any claim that it is available or has sent.

## Pa Derik #567 exact state

Real reschedule evidence captured. #567 authoritative at **Tue 18 Aug 2026, 08:30–10:15**, Full Body Swedish, Christel. Closed-Sunday/relative-date/loop-state defect is fixed. Remaining action is normal Shiloh cancellation only when Pa Derik is genuinely available; do not mutate for evidence.

## Juvan exact scope

Juvan remains the controlled regression client. When resumed, track the beginning-to-end client journey across WhatsApp/provider behaviour, Render, CRM identity/appointment state, approval/hold, Google Calendar, booking confirmation, post-confirmation buttons, corrected reschedule/closed-day path, supplemental action helper and normal cancellation. Routine screenshots are unnecessary; request them only for handset/UI truth or unexpected behaviour.

## New-chat continuation

**Authoritative current state:** runtime-semantic baseline `0fba720...` is production-live and healthy; 17 August universal welcome, booking-route, lifecycle parity, practitioner/category directory and SQT repairs are completed and handset-verified; historical attendance remains human-controlled; #558 is fail-closed; proactive Finalize shortcut is implemented but `shiloh_staff_finalization_actions_v1` remains PENDING at the latest authoritative provider check.

**Highest-priority next item:** re-check **production health + current Meta status for `shiloh_staff_finalization_actions_v1` + current historical-finalization progress**. If APPROVED, verify the role-aware shortcut path and track Christel/Marietjie finalization progress. If still PENDING, keep it fail-closed; ordinary Admin finalization remains available and another safe Tracker item may proceed.

## Guardrails

Preserve audit history. Never infer attendance. Never silently assign #558. Never reopen cancelled visits merely for proof. Never claim a Meta template is approved or delivered without fresh authoritative evidence. Never reclassify completed 17 August client UX/catalogue work as pending merely because separate provider or genuine-journey evidence gates remain.
