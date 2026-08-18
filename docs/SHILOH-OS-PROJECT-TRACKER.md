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

New chat: read Master + Tracker + latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-18-OWN-APPOINTMENT-FINALIZATION.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on GitHub `main`; verify applicable production/provider state; give the four-part checkpoint; obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping. Stop for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Operational screenshots are diagnostic evidence by default, not image-generation requests. Production defects follow trace → evidence → root cause → guarded repair → regression/E2E → CI → deploy → production verification → reconciliation. Never manufacture appointments, provider approval, attendance truth, Calendar truth or handset evidence.

## Production baseline

Current accepted production application code is **PR #325 / `790b5c1254858e17d5811e0182acfb9cc83e32bd`**. The current governance baseline is **PR #317 / `f2a78bb33db212f759ac5bb72f1d832ca11cc104`**. Full regression CI run **#1041** passed with **662 passed / 0 failed**; Render deploy **`dep-da2a5bp5efls73cj9u10`** reached LIVE. Post-deployment error-level logs were clear, Google Calendar health passed, and repeated `/health` requests returned HTTP 200 after database-backed startup.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render production | 🟢 VERIFIED | Application #324 / `ac461dd...` passed CI #1041 (662/0) and is LIVE as `dep-da2a3037uimc73a20leg`; no post-deploy error logs; Calendar health and repeated `/health` HTTP 200 checks passed. Governance baseline is #317 / `f2a78bb...`. |
| WORKSTREAM-OPERATING-MODEL | Five specialist chats with one shared authority | 🟢 VERIFIED LIVE | #314 adopts Control & Reconciliation, Booking & Admin UX, WhatsApp / Meta Integration, CRM & Identity, and Production / DevOps; guarded by full CI #1015 and dated reconciliation evidence. |
| WORKSTREAM-COMPLETION | End-to-end controlled-work protocol | 🟢 VERIFIED | Inspect → implement → full applicable regression → repair green → merge → production/provider verify → Tracker → durable Master → checkpoint; only material gates pause work. |
| WORKSTREAM-CROSS-CONTRACT | Cross-workstream dependency reconciliation | 🟢 VERIFIED | Specialist ownership cannot create conflicting Shiloh OS state; changed assumptions/contracts must be reconciled into shared authority. |
| CONTROL-CHECKPOINT-ROUTING | Control recommendation → specialist continuation | 🟢 VERIFIED | Every Control checkpoint names the owner/chat/reason/dependencies/status and supplies a ready-to-copy instruction; blocked work remains with monitoring/control and is not routed to implementation. |
| SPECIALIST-RECONCILIATION | Mandatory specialist verification → Tracker/Master → final checkpoint | 🟢 VERIFIED | Each specialist independently reads authority, reconciles verified delivery before completion, records blocked gates, and supplies the mandatory five-part final specialist checkpoint. |
| ADMIN-BOOKING-ENTITLEMENT | Fail-closed practitioner booking scope | 🟢 VERIFIED LIVE | #318 centralizes the application entitlement and mirrors it in the DB trigger: Christel+Abigail shared scope; Marietjie only; other linked Admin own practitioner only; JP explicit Christel+Abigail exception; every other unlinked Admin no catalogue. No clinic-wide inference. |
| ADMIN-BOOKING-MENU-UX | Grouped full-label hybrid WhatsApp treatment selection | 🟢 VERIFIED LIVE | #320 preserves full canonical labels; #322 makes one-to-three safe choices directly tappable after #318 scope filtering. Four-or-more and unsafe choices remain lists; eligibility, pagination, availability, client selection and confirmation guards remain. |
| WHATSAPP-MENU-LABELS | Shared Admin/client list-row presentation | 🟢 VERIFIED LIVE | #320 centralizes the 24-character title / 72-character description contract across applicable Admin and client dynamic lists. Full canonical labels take priority over secondary details; no CRM names, permissions, bookings or attendance changed. CI #1033 passed (648/0); deploy `dep-da29chegekts7391fq90` LIVE and healthy. |
| WHATSAPP-MENU-CHOICES | Shared Admin/client hybrid choice presentation | 🟢 VERIFIED LIVE | #322 converts one-to-three safe list choices into visible reply buttons after booking-scope filtering, preserves full wording in the body and keeps original action IDs. Four-or-more, colliding-label, over-limit and explicit-list choices remain lists. CI #1037 passed (656/0); deploy `dep-da29l28ae00c73957t30` LIVE and healthy. |
| ADMIN-JP-APPOINTMENTS | JP Admin parity without finalization | 🟢 VERIFIED LIVE | #318 gives JP Christel-equivalent authorized Admin actions and Christel+Abigail booking scope only. Finalize past visits remains absent/denied; no practitioner CRM link was manufactured. CI #1026 passed (642/0); deploy `dep-da2909ou01pc73bite9g` LIVE and healthy. |
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
| META-TEMPLATE-AUDIT | WhatsApp / Meta Integration | 🔵 ACTIVE / DRAFT PR | Draft PR #326: centralized read-only 15-template inventory and fail-closed contracts under review; repair commit `af2ad5a...` fixes exact approval resend evidence, all post-acceptance follow-up failures, legacy endpoint retirement, language/duplicate matching, staff configuration and semantic fixtures. Focused 22/22 and full local regression 679/679 are green; awaiting remote CI, merge/deploy and production verification. |
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
| ATT-AUTH | Attendance certification authority | 🟢 VERIFIED LIVE | #324 makes finalization own-practitioner-only: Christel → Christel, Abigail → Abigail, Marietjie → Marietjie, JP → none. Exact active Admin↔staff identity is required; conflicts fail closed. Menu, reminder, prompt, queue and row-locked write enforcement agree. CI #1041 passed 662/0; deploy `dep-da2a3037uimc73a20leg` is LIVE and healthy. |
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
| GBP-PROVIDER | Google Business Profile API access | 🟠 WAITING PROVIDER | My Business Business Information API enabled; GBP access application submitted; API-specific quotas visible; general Requests/min remains 0. Access is not confirmed/usable. Production / DevOps owns verification; Control & Reconciliation tracks the dependency. Do not treat as quota-increase work or start OAuth/API integration until positive provider access or >0 usable quota is verified. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Google Business Profile provider gate

Current state is **external/provider gate — pending Google**. Existing PR #35 GBP sync scaffolding is implementation history only and does not prove provider access. Reopen GBP integration only when authoritative provider evidence confirms approval or a usable general request quota greater than 0; then start from current `main` and re-evaluate the existing scaffolding under the full controlled-work protocol.

## Adopted workstream operating rule

Shiloh OS remains in one ChatGPT Work workspace with five focused specialist chats: **Control & Reconciliation**, **Booking & Admin UX**, **WhatsApp / Meta Integration**, **CRM & Identity**, and **Production / DevOps**. All read and write against the same GitHub/production/provider authority.

A specialist chat must read applicable authoritative state before controlled work, complete all available engineering/delivery/reconciliation stages, and surface any changed cross-workstream dependency. Chat history does not supersede repository evidence. Do not claim background continuation unless an actual scheduled/automated mechanism exists.

Control & Reconciliation must convert each recommended next controlled action into an explicit route: owning workstream, exact specialist chat, ownership reason, dependencies/observers, implementation status and a ready-to-copy continuation instruction. The specialist instruction must require independent Master/Tracker/latest-reconciliation/governance and production/provider verification before action.

When a provider, approval, human-truth, genuine-journey or other external gate blocks the item, say that implementation must not proceed. Keep ownership with the appropriate monitoring/provider workstream, with Control & Reconciliation tracking the dependency, instead of routing implementation prematurely.

## Specialist completion and reconciliation contract

Booking & Admin UX, WhatsApp / Meta Integration, CRM & Identity, and Production / DevOps must each independently verify applicable Master, Tracker, latest reconciliation, GitHub `main` and production/provider/human authority before controlled work.

A specialist unit is not complete at implementation, test, PR, merge or deployment alone. It must reach the applicable verification boundary, reconcile delivery evidence/status/PR/commit/tests/production-provider verification/unresolved dependencies/next action into the Project Tracker, reconcile the Master only for verified durable state changes, and issue a final specialist checkpoint covering authoritative state, completed/do-not-redo work, unresolved gates, reconciliation performed, and dependency/next-action ownership.

Proposed, in-progress and unmerged work must not be recorded as completed Master state. If a genuine gate prevents completion, record the blocked state and dependency rather than claim completion. Control & Reconciliation uses reconciled authoritative evidence, not specialist-chat narrative, for continuity.

## Accepted Admin booking operating rule

The Admin who prepares a pending booking confirms it. Practitioner assignment is separate from confirmer identity: an authorized Admin may choose another eligible practitioner, while final CRM, clinic hours, staff schedule, conflict and Google Calendar checks remain authoritative.

For a genuinely new client, the accepted fast path is:

`service/practitioner/date/time → client search → no match → Reserve new client → name + mobile → duplicate check → provisional canonical client → review → explicit Confirm booking`.

Do not require a full profile before securing the slot. Do not silently create duplicates. Do not reintroduce Christel↔Abigail cross-confirm unless a future explicit business requirement justifies it.

PR #318 is the accepted entitlement contract. Christel and Abigail share only their combined scope; Marietjie remains Marietjie-only; other practitioner-linked Admins remain own-practitioner-only. JP is the sole explicit unlinked business-Admin exception and may book Christel or Abigail only, matching Christel's authorized Admin operations except finalization. No clinic-wide access is inferred, no practitioner/CRM link is manufactured, every other unlinked Admin remains fail-closed, and the menu, booking flow and database trigger enforce the same rule.

## Exact continuation

**Authoritative current state:** PR #325 is regression-green, merged and verified LIVE on `790b5c1...` as Render deploy `dep-da2a5bp5efls73cj9u10`. Christel, Abigail and Marietjie each finalize only their own appointments; JP finalizes none. Exact linked canonical identity is required and conflicts fail closed. PR #320/#322 menu presentation and JP's #318 Christel+Abigail booking entitlement remain unchanged. Governance baseline #317 remains authoritative. Google Business Profile remains an external/provider gate with general Requests/min at 0.

**Highest-priority next item:** continue the active historical attendance final review: re-query current CRM state and present only safely routable unresolved appointments for responsible-practitioner human determination.

**Why next:** own-practitioner routing is now centralized, regression-covered and live. Attendance remains explicit human truth; no outcome can be inferred or changed for evidence.

**Remaining gates:** `shiloh_booking_update_v1` approval; Google Business Profile positive provider approval or usable Requests/min >0; historical attendance and #558 human truth; natural handset evidence; genuine lifecycle/follow-up/birthday evidence; explicit approval for material commercial/service/business-rule changes.

## Guardrails

Preserve audit history. Never infer attendance, Calendar state, provider delivery or handset behaviour. Never silently assign #558. Never manufacture appointments or booking changes for evidence. Never create a static second public service catalogue when canonical CRM data can be projected instead. Retain #302 provider protection, #303 idempotent notification queue, and #307/#308 provisional-client duplicate/cleanup safeguards.

## Meta template production audit — implementation checkpoint

The focused branch implements the safe engineering gaps without submitting, editing, or sending a Meta template. The audit endpoint is sanitized and read-only. Provider evidence is the 18 August 2026 WhatsApp Manager capture recorded in `docs/META-TEMPLATE-READINESS-MATRIX.md`; `shiloh_booking_update_v1` remains In review and blocked. Initial branch suite passed **669 / 0**; review repairs have focused regression coverage and await the final full-suite result below. This is not merged or production-verified; WhatsApp / Meta Integration owns PR/CI and post-merge exact inventory/environment verification, Production / DevOps observes deployment/configuration, and Control & Reconciliation tracks genuine-journey gates. The Master is not changed for the unmerged implementation because no verified durable production behaviour has changed.

## PR #326 — complete Meta template contract reconciliation

**Delivery metadata:** PR **#326** is currently **non-draft** on branch `codex/continue-meta-template-production-audit`. CI **#1046** passed on prior remote head `d35d3af`; that SHA is superseded by the final repair commit once pushed, and final-head CI must pass before Update branch/merge consideration. PR remains unmerged and undeployed. No Meta template was submitted, edited, or sent.

Four-state columns mean: **Defined** in the exact Shiloh registry; **Configured** by the named production setting or fixed code path; **Provider** exact name+English contract and approval state; **Wired/verified** runtime route plus genuine evidence status. Exact copy and component ordering are the executable definitions referenced in `src/services/metaTemplateContracts.js`; the descriptors below state the complete semantic shape.

| # | Template / exact contract | Defined | Configured production gate | Provider / quality (18 Aug) | Trigger and code path | Wired / genuine evidence | Unresolved gate | Owner |
|---:|---|---|---|---|---|---|---|---|
| 1 | `shiloh_booking_update_v1`; Utility/en; BODY vars `{{1}}…{{7}}`, no buttons | Yes | `WHATSAPP_BOOKING_UPDATE_TEMPLATE` exact + `WHATSAPP_BOOKING_UPDATE_ENABLED=true` | In review / quality not yet applicable | Durable customer-change outbox → shared template transport | Wired, blocked; no genuine update delivery | APPROVED exact contract, both config gates, natural booking change | WhatsApp / Meta; Production / DevOps config |
| 2 | `shiloh_staff_finalization_actions_v1`; Utility/en; BODY `{{1}},{{2}}`; one `Finalize past visits` quick reply | Yes | Fixed current action identity | Active / Quality pending | Historical finalization prompt → shared transport | Genuine accepted production send exists | Natural use only; no manufactured attendance | WhatsApp / Meta + Booking/Admin UX |
| 3 | `shiloh_appointment_followup_v2`; Utility/en; BODY `{{1}},{{2}}`; buttons `1,2,3,4,5` in order | Yes | `WHATSAPP_FOLLOWUP_ACTIONS_TEMPLATE` exact | Active / Quality pending | Completed-attendance lifecycle claim → duplicate-safe delivery helper | Genuine accepted send exists; durable name/message ID | Genuine rating response | WhatsApp / Meta + Customer Care |
| 4 | `shiloh_booking_approval_outcome_v1`; Utility/en; BODY `{{1}}…{{6}}`, no buttons | Yes | `WHATSAPP_BOOKING_APPROVAL_OUTCOME_TEMPLATE` exact | Active / Quality pending | Approval decision peer notification → shared transport | Wired; genuine route evidence absent | Natural dual-authority outcome | WhatsApp / Meta + Booking/Admin UX |
| 5 | `shiloh_booking_declined_v1`; Utility/en; BODY `{{1}}…{{4}}`; one `Book another time` quick reply | Yes | `WHATSAPP_BOOKING_DECLINED_TEMPLATE` exact | Active / Quality pending | Authorized decline → client notification → shared transport | Wired; genuine route evidence absent | Natural declined booking | WhatsApp / Meta + Booking/Admin UX |
| 6 | `shiloh_booking_approval_request_v1`; Utility/en; BODY `{{1}}…{{5}}`; `Approve`,`Decline` in order | Yes | `WHATSAPP_BOOKING_APPROVAL_REQUEST_TEMPLATE` exact | Active / Quality pending | Initial request and pending-approval resend → shared transport | Genuine accepted send exists; resend now persists exact name/message ID | Post-merge resend production verification, no evidence-only resend | WhatsApp / Meta + Booking/Admin UX |
| 7 | `shiloh_cancellation_confirmation_v1`; Utility/en; BODY `{{1}}…{{5}}`, no buttons | Yes | `WHATSAPP_CANCELLATION_CONFIRMATION_TEMPLATE` exact | Active / Quality pending; API APPROVED | Cancellation outbox → shared transport | Wired; no genuine route evidence established | Natural cancellation | WhatsApp / Meta + Booking/Admin UX |
| 8 | `shiloh_reschedule_confirmation_v1`; Utility/en; BODY `{{1}}…{{5}}`, no buttons | Yes | `WHATSAPP_RESCHEDULE_CONFIRMATION_TEMPLATE` exact | Active / Quality pending | Successful guarded reschedule → shared transport | Wired; no genuine route evidence established | Natural reschedule | WhatsApp / Meta + Booking/Admin UX |
| 9 | `shiloh_appointment_reminder_actions_v1`; Utility/en; BODY `{{1}}…{{4}}`; `Reschedule`,`Cancel booking` in order | Yes | `WHATSAPP_REMINDER_ACTIONS_TEMPLATE` exact | Active / Quality pending | Due reminder lifecycle claim → shared transport | Genuine accepted production send exists | Natural handset evidence only | WhatsApp / Meta + Customer Care |
| 10 | `shiloh_booking_confirmation_v1`; Utility/en; BODY `{{1}}…{{7}}`, no template buttons | Yes | `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE` exact | Active / Quality pending; API APPROVED / Utility | Approved booking confirmation delivery claim → shared transport | Genuine accepted production send exists | Preserve natural delivery evidence | WhatsApp / Meta + Booking/Admin UX |
| 11 | `shiloh_staff_finalization_v1`; Utility/en; BODY vars `{{1}},{{2}},{{4}},{{3}}` in exact copy order, no buttons | Yes | `WHATSAPP_STAFF_FINALIZATION_TEMPLATE` optional: unset defaults to exact canonical name; exact override passes; any other override fails closed | Active / Quality pending; API APPROVED / Utility | Attendance finalization reminder → shared transport | Genuine accepted production send exists | Final-head CI, then post-merge effective-name/provider reconciliation | WhatsApp / Meta + Production / DevOps |
| 12 | `shiloh_birthday_wish_v2`; Marketing/en; brand-correct BODY `{{1}}` + exact opt-out FOOTER | Yes | `WHATSAPP_BIRTHDAY_TEMPLATE` must equal v2 | Active / Quality pending | Genuine DOB + opt-in customer-care scheduler → shared transport | Wired; no genuine birthday send established | Genuine eligible opted-in birthday | Customer Care + WhatsApp / Meta |
| 13 | `shiloh_birthday_wish_v1`; Marketing/en; legacy provider contract, deliberately non-sendable | Evidence identity | No current configuration permitted | Active / Quality pending | No runtime send path | Not wired; evidence-only legacy | Remain retired | WhatsApp / Meta |
| 14 | `appointment_followup`; Utility/en; legacy provider contract, deliberately non-sendable | Evidence identity | Legacy setting cannot bypass registry | Active / Quality pending | Admin test and controlled lifecycle send endpoints retired with 410 | Not wired; historical evidence only | Remain retired; use v2 naturally | WhatsApp / Meta |
| 15 | `appointment_reminder`; Utility/en; legacy provider contract, deliberately non-sendable | Evidence identity | Legacy setting cannot bypass registry | Active / Quality pending | Admin test and controlled lifecycle send endpoints retired with 410 | Not wired; historical evidence only | Remain retired; use action template naturally | WhatsApp / Meta |

**Review-blocker status:** approval resend is implemented and regression-covered on the PR branch, but is not authoritative production behavior until merge, deploy, migration, exact provider/configuration inventory, and a natural operational verification boundary. Follow-up evidence-update and experience-bookkeeping failures are both duplicate-safe after provider acceptance. Legacy evidence-manufacturing endpoints now return 410 before mutation/send work.

**Reconciliation:** Project Tracker updated for the unmerged PR delivery state. Durable Master integration behavior is intentionally unchanged pending merge, deploy, provider/configuration verification, and applicable natural evidence. Permanent provider lead-time and no-speculative-submission governance remain in force.
