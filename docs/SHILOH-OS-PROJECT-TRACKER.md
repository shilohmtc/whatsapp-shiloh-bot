# Shiloh OS — Project Tracker

Updated: 2026-08-18
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

New chat: read Master + Tracker + latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CUSTOMER-CHANGE-CONFIRMATIONS.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on GitHub `main`; verify applicable production/provider state; give the four-part checkpoint; obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping. Stop for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Operational screenshots are diagnostic evidence by default, not image-generation requests. Production defects follow trace → evidence → root cause → guarded repair → regression/E2E → CI → deploy → production verification → reconciliation. Never manufacture appointments, provider approval, attendance truth, Calendar truth or handset evidence.

## Production baseline

Accepted public-catalogue functional lineage remains **#301 / `6863958dbf97a6a6f593fc196c284571adf802c6`**. Google Calendar provider protection was added in **PR #302 / `bee0bdcd71f7dae768a78e6e5cfcd5ec5ddf76c9`**. Customer-change confirmation infrastructure was added in **PR #303 / `632ec4780489a97349b41a85567fa13b18d9ca35`**, with GitHub Actions CI run **#982** passing. Render deployment **`dep-da21jsdg1s2s73c1ju60`** is the PR #303 production deployment.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render production | 🟢 VERIFIED | PR #303 merge `632ec478...` deployed on Render; service live and Google Calendar health probe passed. |
| CUSTOMER-CHANGE-CONFIRM | Customer confirmations after successful Admin changes | 🟢 IMPLEMENTED / LIVE | PR #303 covers service, practitioner, date/time, price and cancellation after canonical mutation; audit-event-idempotent retry outbox. |
| META-BOOKING-UPDATE | `shiloh_booking_update_v1` | 🟠 WAITING PROVIDER | Production submission succeeded; latest provider status **PENDING**. Update notifications remain queued until APPROVED. |
| META-CANCEL-CONFIRM | `shiloh_cancellation_confirmation_v1` | 🟢 APPROVED / PROVIDER READY | Existing template already APPROVED; Admin cancellation confirmation path is enabled through PR #303. |
| CUSTOMER-CHANGE-EVIDENCE | Genuine post-approval update delivery | 🟠 WAITING GENUINE JOURNEY | Do not mutate #570 or another real booking for proof. Capture natural service/practitioner/date-time/price change after provider approval. |
| GOOGLE-CALENDAR-AUTH | Google Calendar OAuth/provider health | 🟢 VERIFIED HEALTHY | External OAuth app moved from Testing to In production; Client ID/secret/refresh-token chain reconciled; startup health probe passed. |
| ADMIN-PRACTITIONER-CHANGE | Manage booking → Change practitioner | 🟢 VERIFIED LIVE | Real booking #570 changed to Christel; Google Calendar event updated; Linda Dr / Sports Massage Package Session / 2026-08-21 14:30–15:20 / R0.00 preserved. Do not mutate again for proof. |
| ADMIN-PROVIDER-GUARD | PR #302 Calendar fail-closed guard | 🟢 VERIFIED / RETAIN | Expired/revoked provider failure becomes explicit no-write message; read-only startup/30-min health probe retained permanently. |
| PUBLIC-CATALOGUE-P1 | Shiloh-owned `/book` catalogue | 🟢 VERIFIED LIVE | CRM-backed category/name/duration/price/description/note, exact-service WhatsApp handoff, no availability assertion. |
| PUBLIC-CATALOGUE-GUARD | Public service eligibility | 🟢 VERIFIED | Only active services with an active client-bookable practitioner are exposed. |
| PUBLIC-CATALOGUE-POLISH | #282–#301 accepted presentation lineage | 🟢 VERIFIED LIVE | Final accepted state is #301; intermediate #284–#300 visual/layout variants are superseded. |
| PUBLIC-CATALOGUE-ORDER | Public category priority | 🟢 VERIFIED LIVE | Massage first; Pedicures & Foot Care second. |
| PUBLIC-CATALOGUE-VISUAL | Shiloh visual identity | 🟢 VERIFIED LIVE | Real clinic imagery; exact Inside Shiloh artwork at three approved signature positions; clean cards. |
| PUBLIC-CATALOGUE-SPECIALTY | Desktop specialty grouping | 🟢 VERIFIED LIVE | Plasma three-card row; SQT pair; approved HIFU + rejuvenation + pelvic row; responsive mobile stacking. |
| PUBLIC-CATALOGUE-NEXT | Business review of current #301 page | ⚪ READY | Resume only from accepted #301 state; preserve CRM/booking semantics. |
| ADMIN-POLISH | Role-aware Admin UX polish | 🟢 VERIFIED | Accepted and live; do not redo. |
| ADMIN-RESCHEDULE | #272–#277 reschedule lineage | 🟢 VERIFIED LIVE | Next available, direct time/date-time, durable context, confirmation and commit repair retained. |
| ADMIN-MANUAL-START | #278 start-time-first manual booking picker | 🟢 VERIFIED LIVE | 15-minute authoritative candidate generation; no override/double-booking path. |
| TIME-24H | Shiloh 24-hour presentation standard (#279) | 🟢 VERIFIED LIVE | Regression-covered; do not redo. |
| HIST-BOOK-CALENDAR | Historical manual booking CRM + Calendar sync | 🟢 VERIFIED | Canonical write + configured Calendar sync; no ordinary client notification. |
| ATT-AUTH | Attendance certification authority | 🟢 VERIFIED | Christel → Christel+Abigail; Marietjie → Marietjie; Abigail → none. |
| A1-HIST-REVIEW | 1–15 Aug historical attendance final review | 🔵 ACTIVE / human truth | Historical post-reopen count was 48 routable visits; re-query before quoting current count. |
| A1-558 | Appointment #558 practitioner identity | 🔴 HOLD | Historical practitioner `SHILOH MTC`; establish real practitioner before correction/finalization. |
| META-FINALIZE-ACTIONS | `shiloh_staff_finalization_actions_v1` | 🟢 APPROVED | APPROVED / UTILITY; genuine-use/evidence rules remain. |
| FINALIZE-SHORTCUT | Proactive historical Finalize button | 🟢 IMPLEMENTED / provider approved | Role/count/idempotency guards remain. |
| C1-UNIVERSAL-WELCOME | Universal WhatsApp client entry | 🟢 VERIFIED | Handset-proven; do not redo. |
| C1-WELCOME-BOOK-ROUTE | Registered/legacy Book appointment routing | 🟢 VERIFIED | Handset-proven; do not redo. |
| C1-ELIGIBLE-ORDER | Eligible-practitioner ordering | 🟢 VERIFIED | Regression-covered. |
| C1-LIFECYCLE-PARITY | Booking/cancellation action-button parity | 🟢 VERIFIED | Controlled lifecycle journey proved core actions. |
| C1-PRACTITIONER-DIR | Client practitioner directory | 🟢 VERIFIED | Approved role presentation retained. |
| C1-CATEGORY-DIR | Client category ordering/count | 🟢 VERIFIED | Massage first, Pedicures second, remainder alphabetic where applicable. |
| C1-SQT | SQT taxonomy + labels + SQL repair | 🟢 VERIFIED | One virtual family / two treatments; underlying CRM identities unchanged. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING genuine action | Last recorded Tue 18 Aug 08:30–10:15; re-query if needed; no mutation for proof. |
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

## Customer-change confirmation exact state

New appointments remain on the established `shiloh_booking_confirmation_v1` path. PR #303 adds downstream confirmation for successful Admin service, practitioner, date/time, price and cancellation mutations without weakening canonical write guards.

Each qualifying mutation is keyed to its CRM audit event in a retryable outbox. Service/practitioner/date-time/price use the latest appointment snapshot and `shiloh_booking_update_v1`; cancellation uses `shiloh_cancellation_confirmation_v1`. No proactive free-text fallback is permitted when a template is not approved.

Current Meta truth: cancellation confirmation is APPROVED; booking update template is PENDING. Pending update notifications remain queued and are retried rather than discarded.

## Exact continuation

**Authoritative current state:** PR #303 is merged, CI-passed and live. Customer-change notification infrastructure is active; cancellations are provider-ready; ordinary update confirmation waits on Meta approval of `shiloh_booking_update_v1`.

**Highest-priority next item:** re-check `shiloh_booking_update_v1` provider status. Once APPROVED, allow the queue to service genuine changes and capture natural delivery evidence without manufacturing a booking mutation.

**Why next:** engineering/CI/deployment gates are closed; Meta provider approval is now the controlling external dependency for service/practitioner/date-time/price confirmation delivery.

**Remaining gates:** `shiloh_booking_update_v1` approval; historical attendance and #558 human truth; genuine lifecycle/follow-up/birthday evidence; explicit approval for material commercial/service/business-rule changes.

## Guardrails

Preserve audit history. Never infer attendance, Calendar state, provider delivery or handset behaviour. Never silently assign #558. Never reopen cancelled visits for proof. Never create a static second public service catalogue when canonical CRM data can be projected instead. Retain the PR #302 provider guard/health probe and PR #303 idempotent customer-notification queue.