# Shiloh OS — Project Tracker

Updated: 2026-08-17 16:19 SAST
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

New chat: read Master + Tracker + `docs/SHILOH-OS-RECONCILIATION-2026-08-16-LATE.md` on GitHub `main` first; verify applicable production/provider state; give the four-part checkpoint; obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping. Stop for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Provider lead-time and button-first rules remain permanent. Never manufacture appointments, provider approval, attendance truth, Calendar truth or handset evidence.

## Production baseline / convergence

GitHub `main` before this reconciliation documentation update was **`9ec976c202852a0f01e4b9b735f00abcdc85bbfd`** (#278, Admin manual start-time picker). #278 CI passed.

Fresh Render check at 16:19 SAST: `shiloh-whatsapp-bot` is live at **`4e64ba9b7a9c8ac0c44b74698edf2e1a43a95d30`** (#276, Admin booking-change confirmation). Render is configured for `main` with auto-deploy enabled. #277 and #278 are merged but **not yet proven production-live**. Documentation commits may advance `main` further without changing this runtime conclusion.

Latest authoritative provider evidence remains, without a fresh provider re-check in this reconciliation:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**
- `shiloh_staff_finalization_actions_v1` — **PENDING / UTILITY**
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | Render catch-up to current runtime `main` | 🔵 ACTIVE | Fresh Render live = #276 `4e64ba9...`; desired runtime includes #277 + #278. Auto-deploy enabled. Verify a Render deployment containing both before claiming production-live. |
| ADMIN-POLISH | Role-aware Admin UX polish | 🟢 VERIFIED | Appointments/Reports/More/pricing/schedule polish remains accepted; do not redo. |
| ADMIN-RESCHEDULE-NEXT | Next-available Admin reschedule UX (#272) | 🟢 MERGED / previously deployed lineage | Shows next available choices before forcing manual date entry. |
| ADMIN-RESCHEDULE-SAMEDAY | Direct same-day Admin time change (#273) | 🟢 MERGED / previously deployed lineage | Allows direct same-day time selection through canonical availability. |
| ADMIN-RESCHEDULE-DATETIME | Direct date+time Admin input (#274) | 🟢 MERGED / previously deployed lineage | Accepts direct date/time input while preserving authoritative validation. |
| ADMIN-RESCHEDULE-DURABLE | Restart-safe typed reschedule context (#275) | 🟢 VERIFIED LIVE lineage | Render previously showed #275 live before #276 superseded it. |
| ADMIN-CHANGE-CONFIRM | Confirmation before Admin booking changes (#276) | 🟢 VERIFIED LIVE | Fresh Render live commit is `4e64ba9...`. Change preview/revalidation guard is production-loaded. |
| ADMIN-CONFIRM-COMMIT | Confirmed reschedule commit-path repair (#277) | 🟢 MERGED / 🟠 DEPLOYMENT | `2bc06e...` clears durable preview context before replaying the guarded confirmed commit. Not yet proven live. |
| ADMIN-MANUAL-START | Start-time-first manual booking picker (#278) | 🟢 MERGED + CI / 🟠 DEPLOYMENT | `9ec976c...`; existing authoritative 15-minute candidate generation unchanged. Row title becomes start time (e.g. 08:30), description shows calculated end. No override/double-booking path. Verify after Render convergence. |
| HIST-BOOK-CALENDAR | Historical manual booking CRM + Calendar sync | 🟢 VERIFIED | Canonical CRM appointment + configured Calendar sync; no ordinary client notification; unresolved for later certification. Do not redo. |
| ATT-AUTH | Attendance certification authority | 🟢 VERIFIED | Christel → Christel+Abigail; Marietjie → Marietjie; Abigail → none. Server-side enforcement. |
| A1-HIST-REVIEW | 1–15 Aug historical attendance final review | 🔵 ACTIVE / human truth | 48 routable visits was immediate post-reopen evidence only. Live count is dynamic; re-query before quoting. Four cancelled visits untouched. |
| A1-558 | Appointment #558 practitioner identity | 🔴 HOLD | 6 Aug, unresolved, historical practitioner `SHILOH MTC`. Establish real practitioner before assignment/finalization. |
| META-FINALIZE-ACTIONS | `shiloh_staff_finalization_actions_v1` | 🟠 WAITING provider | Latest authoritative state PENDING / UTILITY. Fresh provider check required before any approval/send claim. |
| FINALIZE-SHORTCUT | Proactive historical Finalize button | 🟢 IMPLEMENTED / 🟠 provider gate | Role/count-aware, idempotent, direct authorized queue. Ordinary Admin path remains usable. |
| C1-UNIVERSAL-WELCOME | Universal WhatsApp client entry | 🟢 VERIFIED | Handset-proven; do not redo. |
| C1-WELCOME-BOOK-ROUTE | Registered/legacy Book appointment routing | 🟢 VERIFIED | Handset-proven; do not redo. |
| C1-ELIGIBLE-ORDER | Eligible-practitioner DISTINCT ordering | 🟢 VERIFIED | SQL ordering repaired/regression-covered. |
| C1-LIFECYCLE-PARITY | Booking/cancellation action-button parity | 🟢 VERIFIED | Controlled lifecycle journey proved confirmation/reminder/cancellation actions. |
| C1-PRACTITIONER-DIR | Client practitioner directory | 🟢 VERIFIED | Christel/Abigail Massage Practitioner; Marietjie Esthetician + Aesthetic Practitioner role line. |
| C1-CATEGORY-DIR | Client category ordering/count | 🟢 VERIFIED | Massage Treatments first, Pedicures & Foot Care second, remainder alphabetic; treatment counts. |
| C1-SQT | SQT taxonomy + labels + SQL repair | 🟢 VERIFIED | One virtual SQT family / 2 treatments; underlying CRM identities unchanged. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING normal cancellation | Remains Tue 18 Aug 08:30–10:15, Full Body Swedish, Christel. Do not mutate for proof. |
| C1-RESCHEDULE-UX | Client closed-day + loop-state repair | 🟢 VERIFIED | Handset-proven with Pa Derik. |
| C1-ACTION-HELPER | Supplemental action token helper | 🟢 FIXED / 🟠 natural evidence | Re-prove naturally; do not re-mutate #567. |
| JUVAN-E2E | Juvan controlled client E2E | ⚪ READY | Retained controlled regression identity; resume when higher-priority deployment/provider/human gates allow. |
| CRM-PROVENANCE | CRM48 / CRM473 provenance | 🟢 VERIFIED | Legitimate controlled Goldie imports; keep. |
| CRM1-REVIEW | CRM1 orphan-like provenance | ⚪ READY | Read-only identity/supersession review; no deletion without proof. |
| CRM-IMPORTED-CLAIM | Existing Goldie client first WhatsApp verification | 🟢 FIXED / 🟠 natural evidence | Unique unverified mobile claims same CRM; ambiguity fails closed. |
| META-LIFECYCLE | Existing lifecycle template package | 🟢 CONFIGURED / 🟠 per-route evidence | Genuine delivery evidence remains per-route. |
| C1-FOLLOWUP-V2 | Follow-up/rating | 🟠 WAITING genuine journey | Verify after genuine completed-visit timing. |
| C1-REMINDER-ACTIONS | Reminder actions | 🟢 PARTIALLY VERIFIED / 🟠 natural coverage | Controlled proof exists; remaining genuine-route evidence stays natural. |
| BIRTHDAY-V2 | Birthday delivery | 🟠 WAITING genuine eligibility | Genuine CRM birthday + opt-in/business rules only. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Lower priority; CRM authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last-authoritative 0 QPM. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Admin booking exact state

Manual Make a booking continues to use the canonical availability engine. #278 is presentation-only around those authoritative results: candidate starts remain generated at **15-minute intervals**, but each selectable row presents the **start time** as the primary title and the treatment end underneath. Example: **08:30** / `Ends 10:15 · available start`. The full service must still fit clinic hours, practitioner schedule, CRM conflicts and configured Calendar availability. A start that would overlap later is not shown.

Manage-booking reschedule now has a merged lineage through next-available choices, same-day direct time, direct date+time, restart-safe typed context, explicit confirmation and final confirmed-commit repair. #276 is production-live; #277 is required for the corrected final confirmed commit path and is waiting only for deployment proof.

## Historical attendance exact state

Initial production audit: 53 appointments in 1–15 Aug = 31 finalized, 4 cancelled, 17 unresolved/routable, 1 unroutable #558. Approved operation reopened the 31 finalized records with history preserved. Immediately afterward 48 visits were routable. Treat 48 as historical evidence only; re-query before quoting a current total. #558 remains separate and fail-closed.

## Meta/provider exact state

Latest authoritative evidence: finalization v1 APPROVED, finalization-actions v1 PENDING, booking confirmation v1 APPROVED. No fresh provider check occurred in this reconciliation. Proactive historical shortcut remains provider-gated.

## Pa Derik #567 exact state

#567 remains **Tue 18 Aug 2026, 08:30–10:15**, Full Body Swedish, Christel. Client reschedule path was handset-proven. Normal cancellation only when genuinely appropriate; no mutation for evidence.

## New-chat continuation

**Authoritative current state:** source/runtime target contains #277/#278, while fresh Render production is still #276. Existing client discovery/lifecycle work remains completed. Historical attendance and #558 remain human-evidence controlled. Finalization-actions remains provider-PENDING at latest evidence.

**Highest-priority next item:** verify Render deployment convergence to a runtime containing #277 and #278. Once live, verify the Admin confirmed-reschedule commit path and start-time-first manual booking picker through normal controlled use.

**Why next:** until convergence is proven, merged code must not be treated as production behaviour; #277 specifically closes the confirmed-reschedule commit path and #278 is the newly requested Admin start-time UX.

**Remaining gate:** Render deployment evidence, then handset/production behaviour evidence. Fresh Meta/provider and historical-attendance counts must be obtained separately before making claims in those domains.

## Guardrails

Preserve audit history. Never infer attendance, Calendar state, provider approval or handset behaviour. Never silently assign #558. Never reopen cancelled visits for proof. Never claim #277/#278 production-live until Render proves a deployment containing them. Never redo completed 17 August client UX/catalogue work merely because separate deployment/provider/genuine-journey gates remain.