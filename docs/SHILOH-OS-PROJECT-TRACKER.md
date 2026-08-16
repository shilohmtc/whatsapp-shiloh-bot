# Shiloh OS — Project Tracker

Updated: 2026-08-16 19:26 SAST
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

New chat: read Master + Tracker on GitHub `main` first; verify applicable production/provider state; give the four-part checkpoint (authoritative state, highest-priority continuation, why next, remaining gate); obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping. Stop for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Provider lead-time and button-first rules remain permanent. Never manufacture appointments, provider approval, attendance truth, or handset evidence.

## Production baseline

Runtime application baseline before this documentation reconciliation: **`03c11fade6e2b37e627bfc33c2d47368363ef308`** (`Provision and schedule historical finalization shortcut`), verified **live** on Render with successful CI. Documentation reconciliation commits after it do not alter runtime semantics.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| ADMIN-POLISH | Role-aware Admin UX polish | 🟢 IMPLEMENTED | Appointments prioritized Finalize → Make booking → Manage booking; Reports simplified; Client details moved to More; Help/Calendar integrity hidden; pricing/schedule UX role-aware and button/list-first where practical. |
| ATT-AUTH | Attendance certification authority | 🟢 IMPLEMENTED | Christel finalizes Christel+Abigail only; Marietjie finalizes Marietjie only; Abigail cannot finalize. Server-side enforcement + reminder scoping. |
| A1-HIST-REVIEW | 1–15 Aug historical attendance final review | 🔵 ACTIVE / human truth | 31 prior Completed/No-show records deliberately reopened with history preserved; plus 17 already unresolved = 48 routable visits before subsequent practitioner actions. Christel/Marietjie perform final certification. Four cancelled visits untouched. |
| A1-558 | Appointment #558 practitioner identity | 🔴 HOLD | 6 Aug, unresolved, historical practitioner `SHILOH MTC`. Fail closed; establish real practitioner before assignment/finalization. |
| META-FINALIZE-ACTIONS | `shiloh_staff_finalization_actions_v1` | 🟠 WAITING provider | Submitted successfully as Utility; last provider status PENDING. Re-check Meta. No proactive shortcut send until APPROVED. |
| FINALIZE-SHORTCUT | Proactive historical Finalize button | 🟢 IMPLEMENTED / 🟠 provider gate | Role/count-aware, idempotent, direct to authorized queue. Ordinary Admin path remains usable. Delivery waits on META-FINALIZE-ACTIONS approval. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING normal cancellation | Reschedule handset evidence captured; Sunday/loop defect fixed. #567 remains Tue 18 Aug 08:30–10:15 with Christel. Do not mutate for proof. |
| C1-RESCHEDULE-UX | Closed-day + loop-state repair | 🟢 VERIFIED core UX | Closed Sunday excluded/rejected; another-date clears stale candidate; authoritative slot + explicit confirm handset-proven with Pa Derik. |
| C1-ACTION-HELPER | Supplemental appointment-action token helper | 🟢 FIXED / 🟠 natural evidence | `ensureToken` export defect fixed after Pa Derik core mutation. Re-prove naturally; do not re-mutate #567. |
| JUVAN-E2E | Juvan controlled beginning-to-end client acceptance | ⚪ READY | Retained controlled CRM identity/reset. Resume after immediate attendance/provider checkpoint unless reprioritized. Track WhatsApp, Render, CRM, approval, Calendar, templates, post-book UX, reschedule/closed-day and cancellation. |
| CRM-PROVENANCE | CRM48 / CRM473 provenance | 🟢 VERIFIED | Legitimate controlled Goldie imports; keep. CRM IDs are not proof of bot registration. |
| CRM1-REVIEW | CRM1 orphan-like provenance | ⚪ READY | Read-only identity/supersession review; do not delete without proof. |
| CRM-IMPORTED-CLAIM | Existing Goldie client first WhatsApp verification | 🟢 FIXED / 🟠 natural evidence | Unique unverified imported mobile enters claim/verification on same CRM; ambiguity fails closed. Await natural eligible first contact. |
| META-LIFECYCLE | Existing lifecycle template package | 🟢 CONFIGURED / 🟠 per-route evidence | Earlier provider gate resolved for existing generation; genuine delivery evidence remains per-route. New finalization-actions template is tracked separately and still gated. |
| C1-POSTBOOK-UX | Post-confirmation client UX | 🟢 COMPLETE | Book another treatment / My appointments / Main menu button-first actions production-live. |
| C1-FOLLOWUP-V2 | Follow-up/rating delivery | 🟠 WAITING genuine journey | Verify only after genuine completed-visit timing. |
| C1-REMINDER-ACTIONS | Reminder action delivery | 🟠 WAITING genuine journey | Verify naturally when due. |
| BIRTHDAY-V2 | Birthday delivery | 🟠 WAITING genuine eligibility | Genuine CRM birthday + opt-in/business rules only. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Lower priority; CRM authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last-authoritative 0 QPM; revisit only when Google evidence changes. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Admin exact state

Appointments visible priority: **Finalize past visits → Make a booking → Manage a booking → Today's clients → Tomorrow's clients**. Availability is integrated into booking rather than a standalone everyday action. Walk-in is removed from normal navigation.

Reports: **Today's report + Earnings** with role-aware earnings access and completed-only accounting.

More: **Client details** plus back navigation; Calendar integrity remains diagnostic but hidden; generic Help removed.

Services/pricing: Christel controls shared Christel/Abigail pricing; Marietjie controls her own. Pieter/Savanna are removed from normal operational surfaces.

Schedule: Abigail requests leave for Christel approval; Christel manages leave requests/own availability/controlled closures; Marietjie manages her own availability independently. Fixed staff hours and freelancer availability are not everyday controls. Leave approval must surface appointment conflicts and never silently move/cancel clients.

## Historical attendance exact state

Production audit before reopening found 53 appointments in 1–15 Aug: 31 finalized, 4 cancelled, 17 unresolved/routable, 1 unroutable #558.

Approved production operation reopened the 31 finalized records to unresolved/scheduled while preserving their prior status history and adding explicit reopening provenance. Cancelled visits remained untouched.

Reopened IDs: `327, 328, 329, 330, 331, 334, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 349, 350, 351, 352, 357, 485, 486, 553, 554, 556, 557, 559, 562`.

Previously unresolved routing evidence:
- Christel: `353, 548, 355, 356, 487, 359, 551, 564`
- Marietjie: `326, 332, 333, 335, 555, 348, 354, 550, 358`

Thus **48 visits** were routable for human final review immediately after reopening. Treat the live remaining count as dynamic: re-query/recount if Christel or Marietjie has subsequently finalized anything. Do not continue to quote 48 as the live count without checking.

#558 remains separate and fail-closed.

## Meta/provider exact state

`shiloh_staff_finalization_v1` was confirmed APPROVED/UTILITY in production startup evidence.

`shiloh_staff_finalization_actions_v1` was newly submitted at production startup and returned **PENDING/UTILITY** at the last authoritative check. It powers the proactive historical shortcut and is not covered by the earlier resolved lifecycle-template review gate. Re-check current provider state before any claim that the shortcut is available/sent.

## Pa Derik #567 exact state

Real reschedule evidence captured. #567 authoritative at **Tue 18 Aug 2026, 08:30–10:15**, Full Body Swedish, Christel. Closed-Sunday/relative-date/loop-state defect is fixed. Remaining action is normal Shiloh cancellation only when Pa Derik is genuinely available; do not mutate for evidence.

## Juvan exact scope

Juvan remains the controlled regression client. When resumed, track the beginning-to-end client journey across WhatsApp/provider behaviour, Render, CRM identity/appointment state, approval/hold, Google Calendar, booking confirmation, post-confirmation buttons, corrected reschedule/closed-day path, supplemental action helper and normal cancellation. Routine screenshots are unnecessary; request them only for handset/UI truth or unexpected behaviour.

## New-chat continuation

**Authoritative current state:** runtime `03c11fade...` is production-live/CI-green; Admin polish is substantially complete; Christel/Marietjie certification authority is enforced; the 1–15 Aug historical cohort has been reopened for final human review; #558 is fail-closed; proactive Finalize shortcut is implemented but its new Meta template was still PENDING at last check.

**Highest-priority next item:** re-check **production health + Meta status for `shiloh_staff_finalization_actions_v1`**. If APPROVED, verify the role-aware shortcut path and then track Christel/Marietjie finalization progress. If still PENDING, keep it fail-closed; ordinary Admin finalization remains available and Juvan/read-only work may proceed without pretending provider approval.

## Guardrails

Preserve audit history. Never infer attendance. Never silently assign #558. Never reopen cancelled visits merely for proof. Never claim a Meta template is approved or delivered without fresh authoritative evidence. Never reclassify the completed Admin/client UX work as pending merely because a separate provider evidence gate remains.
