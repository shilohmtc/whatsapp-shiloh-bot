# Shiloh OS — Project Tracker

Updated: 2026-08-18 09:03 SAST
Purpose: concise operational dashboard. Master is the detailed current ledger; do not redo completed or superseded work.

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

New chat: read Master + Tracker + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-18-PUBLIC-CATALOGUE-POLISH.md`, on GitHub `main`; verify applicable production/provider state; give the four-part checkpoint; obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping. Stop for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Never manufacture appointments, provider approval, attendance truth, Calendar truth or handset evidence. Public service presentation must remain a projection of canonical Shiloh CRM data rather than a duplicated catalogue.

## Production baseline

GitHub and Render are converged through **`6863958dbf97a6a6f593fc196c284571adf802c6`** (#301). The final #301 head passed GitHub Actions CI run **#970** before merge. Render deployment **`dep-da1ut3oae00c73c0g18g`** is **LIVE**.

Previously refreshed provider evidence remains:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**
- `shiloh_staff_finalization_actions_v1` — **APPROVED / UTILITY**
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render runtime convergence | 🟢 VERIFIED | Runtime converged through #301 `6863958d...`; Render `dep-da1ut3oae00c73c0g18g` LIVE. |
| PUBLIC-CATALOGUE-P1 | Shiloh-owned `/book` catalogue | 🟢 VERIFIED LIVE | CRM-backed category/name/duration/price/description/note, exact-service WhatsApp handoff, no availability assertion. |
| PUBLIC-CATALOGUE-GUARD | Public service eligibility | 🟢 VERIFIED | Only active services with an active client-bookable practitioner are exposed. |
| PUBLIC-CATALOGUE-POLISH | #282–#301 accepted presentation lineage | 🟢 VERIFIED LIVE | Final accepted state is #301; intermediate #284–#300 visual/layout variants are superseded, not outstanding. |
| PUBLIC-CATALOGUE-ORDER | Public category priority | 🟢 VERIFIED LIVE | Massage first; Pedicures & Foot Care second; remaining catalogue ordering preserved by renderer contract. |
| PUBLIC-CATALOGUE-VISUAL | Shiloh visual identity | 🟢 VERIFIED LIVE | Real clinic imagery served from repo assets; exact Inside Shiloh artwork appears at three approved signature positions; cards remain clean. |
| PUBLIC-CATALOGUE-SPECIALTY | Desktop specialty grouping | 🟢 VERIFIED LIVE | Plasma three-card row; SQT pair; approved HIFU + Vaginal Tightening & Rejuvenation + Neo Pelvic Therapy row; responsive mobile stacking. |
| PUBLIC-CATALOGUE-NEXT | Business review of current #301 page | ⚪ READY | Review current live accepted page; refine only from #301 state and preserve CRM/booking semantics. |
| ADMIN-POLISH | Role-aware Admin UX polish | 🟢 VERIFIED | Accepted and live; do not redo. |
| ADMIN-RESCHEDULE | #272–#277 reschedule lineage | 🟢 VERIFIED LIVE lineage | Next available, direct time/date-time, durable context, confirmation and confirmed-commit repair are contained in current runtime. |
| ADMIN-MANUAL-START | #278 start-time-first manual booking picker | 🟢 VERIFIED LIVE lineage | 15-minute authoritative candidate generation preserved; no override/double-booking path. |
| TIME-24H | Shiloh 24-hour presentation standard (#279) | 🟢 VERIFIED LIVE | Canonical 24-hour presentation with regression coverage; Google Calendar viewer preference separately configured by business. |
| HIST-BOOK-CALENDAR | Historical manual booking CRM + Calendar sync | 🟢 VERIFIED | Canonical write + configured Calendar sync; no ordinary client notification; unresolved for later certification. |
| ATT-AUTH | Attendance certification authority | 🟢 VERIFIED | Christel → Christel+Abigail; Marietjie → Marietjie; Abigail → none. |
| A1-HIST-REVIEW | 1–15 Aug historical attendance final review | 🔵 ACTIVE / human truth | Historical immediate post-reopen checkpoint was 48 routable visits. Re-query before quoting current count. |
| A1-558 | Appointment #558 practitioner identity | 🔴 HOLD | Historical practitioner `SHILOH MTC`; establish real practitioner before correction/finalization. |
| META-FINALIZE-ACTIONS | `shiloh_staff_finalization_actions_v1` | 🟢 APPROVED | Fresh production startup evidence = APPROVED / UTILITY. Provider gate cleared; genuine use/evidence rules remain. |
| FINALIZE-SHORTCUT | Proactive historical Finalize button | 🟢 IMPLEMENTED / provider approved | Existing role/count/idempotency guards remain. Do not manufacture handset evidence. |
| C1-UNIVERSAL-WELCOME | Universal WhatsApp client entry | 🟢 VERIFIED | Handset-proven; do not redo. |
| C1-WELCOME-BOOK-ROUTE | Registered/legacy Book appointment routing | 🟢 VERIFIED | Handset-proven; do not redo. |
| C1-ELIGIBLE-ORDER | Eligible-practitioner ordering | 🟢 VERIFIED | Regression-covered. |
| C1-LIFECYCLE-PARITY | Booking/cancellation action-button parity | 🟢 VERIFIED | Controlled lifecycle journey proved core actions. |
| C1-PRACTITIONER-DIR | Client practitioner directory | 🟢 VERIFIED | Approved role presentation retained. |
| C1-CATEGORY-DIR | Client category ordering/count | 🟢 VERIFIED | Massage first, Pedicures & Foot Care second, remainder alphabetic. |
| C1-SQT | SQT taxonomy + labels + SQL repair | 🟢 VERIFIED | One virtual family / two treatments; underlying CRM identities unchanged. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING genuine action | Last recorded state Tue 18 Aug 08:30–10:15. Re-query if needed; no mutation for proof. |
| C1-RESCHEDULE-UX | Client closed-day + loop-state repair | 🟢 VERIFIED | Handset-proven. |
| JUVAN-E2E | Juvan controlled client E2E | ⚪ READY | Resume only when it serves a current verification need. |
| CRM-PROVENANCE | CRM48 / CRM473 provenance | 🟢 VERIFIED | Legitimate controlled Goldie imports; keep. |
| CRM1-REVIEW | CRM1 orphan-like provenance | ⚪ READY | Read-only identity/supersession review; no deletion without proof. |
| CRM-IMPORTED-CLAIM | Existing Goldie client first WhatsApp verification | 🟢 FIXED / 🟠 natural evidence | Unique unverified mobile claims same CRM; ambiguity fails closed. |
| META-LIFECYCLE | Existing lifecycle template package | 🟢 CONFIGURED / 🟠 per-route evidence | Genuine delivery evidence remains per-route. |
| C1-FOLLOWUP-V2 | Follow-up/rating | 🟠 WAITING genuine journey | Verify after genuine completed-visit timing. |
| BIRTHDAY-V2 | Birthday delivery | 🟠 WAITING genuine eligibility | Genuine CRM birthday + opt-in/business rules only. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Lower priority; CRM authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last-authoritative 0 QPM. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Public catalogue exact state

`/book` is a Shiloh-owned, mobile-first public service catalogue reading canonical production service/category data. It does not carry a separate manually maintained list. Public rows must pass the active-service + active client-bookable practitioner guard.

The accepted current presentation is the #301 state: smaller hero, wider/scannable catalogue, Massage and Pedicures priority, real clinic assets, exact Inside Shiloh artwork at three signature positions, and responsive specialty grouping. The plasma family is now one three-column desktop row containing Profosma Jet Plasma, Plasma Fibroblast Consultation and Plasma Fibroblast Prices. The SQT pair and approved HIFU/rejuvenation/pelvic row remain grouped. Mobile stacks specialty rows responsively.

The #284–#294 visual experiments and #298–#300 earlier specialty variants are superseded by #301. Do not redo them as outstanding tasks.

Availability and final booking truth remain inside the canonical booking flow. None of the presentation work changes service, price, duration, practitioner eligibility, appointment, schedule, conflict, Calendar or WhatsApp booking semantics.

## Admin booking exact state

Manual Make a booking continues to use the canonical availability engine. Candidate starts remain generated at 15-minute intervals, with the start time presented first and calculated end beneath it. The full service must fit clinic hours, practitioner schedule, CRM conflicts and configured Calendar availability. The Admin reschedule lineage through #277 remains present in current production.

## Historical attendance exact state

Initial 1–15 Aug audit: 53 appointments = 31 finalized, 4 cancelled, 17 unresolved/routable, 1 unroutable #558. Approved reopening preserved audit/history. The immediate post-reopen 48 routable count is historical evidence, not a current guaranteed count. #558 remains fail-closed.

## Meta/provider exact state

Fresh production startup evidence on 17 August showed all three checked operational templates APPROVED / UTILITY, including `shiloh_staff_finalization_actions_v1`. Provider approval and handset delivery evidence remain distinct facts.

## New-chat continuation

**Authoritative current state:** GitHub and Render are converged through #301 `6863958d...`. The accepted `/book` presentation workstream through #301 is live, while canonical CRM remains the sole service truth.

**Highest-priority next item:** business review of the current live #301 `/book` experience; any further presentation refinement starts from this accepted state.

**Why next:** the implementation, CI and deployment gates for the current catalogue refinement are closed. Superseded visual/layout experiments must not be recreated.

**Remaining gate:** no engineering gate blocks the current catalogue. Material commercial/service changes require explicit business approval. Attendance, #558 and genuine lifecycle evidence remain fail-closed.

## Guardrails

Preserve audit history. Never infer attendance, Calendar state, provider delivery or handset behaviour. Never silently assign #558. Never reopen cancelled visits for proof. Never create a static second public service catalogue when canonical CRM data can be projected instead.