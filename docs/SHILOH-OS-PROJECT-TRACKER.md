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

New chat: read Master + Tracker + latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-18-WORKSTREAM-OPERATING-MODEL.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on GitHub `main`; verify applicable production/provider state; give the four-part checkpoint; obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping. Stop for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Operational screenshots are diagnostic evidence by default, not image-generation requests. Production defects follow trace → evidence → root cause → guarded repair → regression/E2E → CI → deploy → production verification → reconciliation. Never manufacture appointments, provider approval, attendance truth, Calendar truth or handset evidence.

## Production baseline

Current accepted production code remains **PR #313 / `ef0da63681d244fc3a0fbb1e6c9e1cdb42bf77c7`**. The current deployed `main` governance baseline is **PR #314 / `9f6aa3d38ef292e8c80570c03b14be5250d616f8`**. Full regression CI run **#1015** passed; Render deploy **`dep-da26b39srm7s738g6gc0`** reached LIVE with no error-level logs.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render production | 🟢 VERIFIED | Production code #313 / `ef0da636...` remains accepted; governance #314 / `9f6aa3d...` passed CI #1015 and is LIVE as `dep-da26b39srm7s738g6gc0`; no error-level logs. |
| WORKSTREAM-OPERATING-MODEL | Five specialist chats with one shared authority | 🟢 VERIFIED LIVE | #314 adopts Control & Reconciliation, Booking & Admin UX, WhatsApp / Meta Integration, CRM & Identity, and Production / DevOps; guarded by full CI #1015 and dated reconciliation evidence. |
| WORKSTREAM-COMPLETION | End-to-end controlled-work protocol | 🟢 VERIFIED | Inspect → implement → full applicable regression → repair green → merge → production/provider verify → Tracker → durable Master → checkpoint; only material gates pause work. |
| WORKSTREAM-CROSS-CONTRACT | Cross-workstream dependency reconciliation | 🟢 VERIFIED | Specialist ownership cannot create conflicting Shiloh OS state; changed assumptions/contracts must be reconciled into shared authority. |
| ADMIN-BOOKING-ENTITLEMENT | Fail-closed practitioner booking scope | 🟢 VERIFIED LIVE | #313: Christel+Abigail shared scope; Marietjie only; other linked Admin own practitioner only; unlinked Admin including JP no catalogue; DB trigger enforces normal/crafted/historical paths. |
| ADMIN-BOOKING-MENU-UX | Grouped concise WhatsApp treatment selection | 🟢 VERIFIED LIVE | #313 adds treatment sub-groups and removes repetitive row descriptions while retaining eligibility, pagination, availability, client selection and confirmation guards. |
| ADMIN-JP-APPOINTMENTS | JP operational Appointments parity | 🟢 VERIFIED | #313 matches Christel's operational actions except Finalize past visits; attendance/finalization authority remains denied. |
| CLIENT-WELCOME-CATALOGUE | Welcome → `/book` treatment catalogue | 🟢 VERIFIED LIVE | #311 adds catalogue/booking-page access; #312 preserves universal welcome before client-state branching. |
| ADMIN-TYPED-TIME | Admin typed time + stale slot pagination | 🟢 VERIFIED LIVE | #304 / `278aab397...`; `14:00` and `2pm` normalize through authoritative slots; stale navigation-only page repaired. |
| ADMIN-CLIENT-NAME | Canonical Admin client name resolution | 🟢 VERIFIED LIVE | #305 / `4767d282...`; normalized/token matching without auto-create/merge. |
| ADMIN-GOLDIE-BRIDGE | Reconciled Goldie identity → canonical client lookup | 🟢 VERIFIED LIVE | #306 / `507c3f492...`; only already-reconciled external identity links are followed; unresolved identities fail closed. |
| ADMIN-PROVISIONAL-CLIENT | Reserve booking for genuinely new client | 🟢 VERIFIED LIVE | #307 / `55c2f00b...`; name + SA mobile → duplicate check → provisional canonical client → guarded confirmation. |
| ADMIN-PROVISIONAL-CLEANUP | Remove abandoned unused provisional clients | 🟢 VERIFIED LIVE | #308 / `fdcbae48...`; cleanup only when no appointment exists; never deletes existing/booked clients. |
| ADMIN-CROSS-CONFIRM | Christel↔Abigail pending-booking handoff | ⏸️ REMOVED / SUPERSEDED | #309 introduced it; #310 removed it by business decision. Accepted rule is same Admin prepares and confirms. Do not redo without new explicit requirement. |
| ADMIN-BOOKING-FAST-PATH | New-client booking operational flow | 🟢 VERIFIED | Real Stephan Erasmus journey reached authoritative 14:00 selection, provisional CRM client and final review; Christel subsequently confirmed herself. Do not recreate for proof. |
| GOOGLE-CALENDAR-AUTH | Google Calendar OAuth/provider health | 🟢 VERIFIED HEALTHY | OAuth app In production; client/secret/refresh-token chain reconciled; fresh #310 startup health probe passed. |
| ADMIN-PROVIDER-GUARD | PR #302 Calendar fail-closed guard | 🟢 VERIFIED / RETAIN | Provider failure blocks writes cleanly; startup/recurring health probe remains permanent. |
| ADMIN-PRACTITIONER-CHANGE | Manage booking → Change practitioner | 🟢 VERIFIED LIVE | Real #570 changed to Christel; Calendar updated; preserve evidence, do not mutate for proof. |
| CUSTOMER-CHANGE-CONFIRM | Customer confirmations after successful Admin changes | 🟢 IMPLEMENTED / LIVE | #303 covers service, practitioner, date/time, price and cancellation via durable idempotent outbox. |
| META-BOOKING-UPDATE | `shiloh_booking_update_v1` | 🟠 WAITING PROVIDER | Latest production provider status **PENDING**. Ordinary change notifications remain queued until APPROVED. |
| META-CANCEL-CONFIRM | `shiloh_cancellation_confirmation_v1` | 🟢 APPROVED / PROVIDER READY | Cancellation confirmation path ready. |
| CUSTOMER-CHANGE-EVIDENCE | Genuine post-approval update delivery | 🟠 WAITING GENUINE JOURNEY | Capture natural update after provider approval; do not mutate a booking for proof. |
| PUBLIC-CATALOGUE-P1 | Shiloh-owned `/book` catalogue | 🟢 VERIFIED LIVE | Accepted #301 CRM-backed catalogue; no duplicate static source of truth. |
| PUBLIC-CATALOGUE-POLISH | #282–#301 presentation lineage | 🟢 VERIFIED LIVE | #301 is accepted; #284–#300 visual/layout variants superseded. |
| PUBLIC-CATALOGUE-NEXT | Business review of current #301 page | ⚪ READY | Resume only from accepted #301 state and preserve CRM/booking semantics. |
| ADMIN-POLISH | Role-aware Admin UX polish | 🟢 VERIFIED | Accepted and live; do not redo. |
| ADMIN-RESCHEDULE | #272–#277 reschedule lineage | 🟢 VERIFIED LIVE | Next available, direct time/date-time, durable context, confirmation and commit repair retained. |
| ADMIN-MANUAL-START | #278 start-time-first manual picker | 🟢 VERIFIED LIVE | 15-minute authoritative candidate generation; no override/double-booking path. |
| TIME-24H | 24-hour presentation standard | 🟢 VERIFIED LIVE | Regression-covered; do not redo. |
| ATT-AUTH | Attendance certification authority | 🟢 VERIFIED | Christel → Christel+Abigail; Marietjie → Marietjie; Abigail → none. |
| A1-HIST-REVIEW | 1–15 Aug historical attendance final review | 🔵 ACTIVE / HUMAN TRUTH | Re-query before quoting current unresolved/routable count. |
| A1-558 | Appointment #558 practitioner identity | 🔴 HOLD | Historical practitioner `SHILOH MTC`; establish real practitioner before correction/finalization. |
| META-FINALIZE-ACTIONS | `shiloh_staff_finalization_actions_v1` | 🟢 APPROVED | APPROVED / UTILITY; genuine-use/evidence rules remain. |
| C1-UNIVERSAL-WELCOME | Universal WhatsApp client entry | 🟢 VERIFIED | Handset-proven; do not redo. |
| C1-WELCOME-BOOK-ROUTE | Registered/legacy Book appointment routing | 🟢 VERIFIED | Handset-proven; do not redo. |
| C1-ELIGIBLE-ORDER | Eligible-practitioner ordering | 🟢 VERIFIED | Regression-covered. |
| C1-LIFECYCLE-PARITY | Booking/cancellation action-button parity | 🟢 VERIFIED | Controlled lifecycle journey proved core actions. |
| C1-PRACTITIONER-DIR | Client practitioner directory | 🟢 VERIFIED | Approved role presentation retained. |
| C1-CATEGORY-DIR | Client category ordering/count | 🟢 VERIFIED | Massage first, Pedicures second, remainder alphabetic where applicable. |
| C1-SQT | SQT taxonomy + labels + SQL repair | 🟢 VERIFIED | One virtual family / two treatments; underlying CRM identities unchanged. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING GENUINE ACTION | Re-query if needed; no mutation for proof. |
| CRM-PROVENANCE | CRM48 / CRM473 provenance | 🟢 VERIFIED | Legitimate controlled Goldie imports; keep. |
| CRM1-REVIEW | CRM1 orphan-like provenance | ⚪ READY | Read-only identity/supersession review; no deletion without proof. |
| CRM-IMPORTED-CLAIM | Existing Goldie client first WhatsApp verification | 🟢 FIXED / 🟠 NATURAL EVIDENCE | Unique unverified mobile claims same CRM; ambiguity fails closed. |
| META-LIFECYCLE | Existing lifecycle template package | 🟢 CONFIGURED / 🟠 PER-ROUTE EVIDENCE | Genuine delivery evidence remains per-route. |
| C1-FOLLOWUP-V2 | Follow-up/rating | 🟠 WAITING GENUINE JOURNEY | Verify after genuine completed-visit timing. |
| BIRTHDAY-V2 | Birthday delivery | 🟠 WAITING GENUINE ELIGIBILITY | Genuine CRM birthday + opt-in/business rules only. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Lower priority; CRM authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last-authoritative 0 QPM. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Adopted workstream operating rule

Shiloh OS remains in one ChatGPT Work workspace with five focused specialist chats: **Control & Reconciliation**, **Booking & Admin UX**, **WhatsApp / Meta Integration**, **CRM & Identity**, and **Production / DevOps**. All read and write against the same GitHub/production/provider authority.

A specialist chat must read applicable authoritative state before controlled work, complete all available engineering/delivery/reconciliation stages, and surface any changed cross-workstream dependency. Chat history does not supersede repository evidence. Do not claim background continuation unless an actual scheduled/automated mechanism exists.

## Accepted Admin booking operating rule

The Admin who prepares a pending booking confirms it. Practitioner assignment is separate from confirmer identity: an authorized Admin may choose another eligible practitioner, while final CRM, clinic hours, staff schedule, conflict and Google Calendar checks remain authoritative.

For a genuinely new client, the accepted fast path is:

`service/practitioner/date/time → client search → no match → Reserve new client → name + mobile → duplicate check → provisional canonical client → review → explicit Confirm booking`.

Do not require a full profile before securing the slot. Do not silently create duplicates. Do not reintroduce Christel↔Abigail cross-confirm unless a future explicit business requirement justifies it.

PR #313 adds a separate fail-closed practitioner entitlement layer: Christel/Abigail share only their combined scope; Marietjie remains Marietjie-only; other practitioner-linked Admins remain own-practitioner-only; unlinked Admins such as JP retain Admin capability but receive no booking catalogue. JP's operational Appointments menu remains equivalent to Christel's except finalization.

## Exact continuation

**Authoritative current state:** PR #314 is regression-green, merged and LIVE on `9f6aa3d...`; the five-workstream shared-authority operating model is adopted. Production application behaviour remains the accepted #313 state on `ef0da636...`.

**Highest-priority next item:** re-check `shiloh_booking_update_v1` provider status. If still PENDING, continue the next approved Shiloh OS workstream without reopening the completed Admin-booking fixes.

**Why next:** engineering/CI/deployment gates for the Admin booking defects are closed. The remaining ordinary booking-change delivery dependency is Meta approval, not further booking-flow redesign.

**Remaining gates:** `shiloh_booking_update_v1` approval; historical attendance and #558 human truth; genuine lifecycle/follow-up/birthday evidence; explicit approval for material commercial/service/business-rule changes.

## Guardrails

Preserve audit history. Never infer attendance, Calendar state, provider delivery or handset behaviour. Never silently assign #558. Never manufacture appointments or booking changes for evidence. Never create a static second public service catalogue when canonical CRM data can be projected instead. Retain #302 provider protection, #303 idempotent notification queue, and #307/#308 provisional-client duplicate/cleanup safeguards.