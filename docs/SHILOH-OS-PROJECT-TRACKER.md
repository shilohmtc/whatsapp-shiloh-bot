# Shiloh OS — Project Tracker

Updated: 2026-08-19
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

New chat: read Master + Tracker + latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-19-META-BOOKING-UPDATE-APPROVAL.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on GitHub `main`; verify applicable production/provider state; give the four-part checkpoint; obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping. Stop for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Operational screenshots are diagnostic evidence by default, not image-generation requests. Production defects follow trace → evidence → root cause → guarded repair → regression/E2E → CI → deploy → production verification → reconciliation. Never manufacture appointments, provider approval, attendance truth, Calendar truth or handset evidence.

## Production baseline

Current accepted production application code is **PR #328 / `78ece8d5bcf38aaf5d01dbaaefacde253bdef6e3`**. The current governance baseline is **PR #317 / `f2a78bb33db212f759ac5bb72f1d832ca11cc104`**. Full regression CI run **#1051** passed with **688 passed / 0 failed**; Render deploy **`dep-da2ba6f10e5c73cp6l60`** reached LIVE. The guarded Christel catalogue migration and postcondition verifier completed before traffic opened, post-deployment error/fatal logs were clear, and production `/health` returned application/database OK. PR #326 is the accepted Meta integration lineage included in PR #328; PR #330 / `f7c0f21ef91d3b91f08764deb069431e2cc8651b` is the newer catalogue documentation reconciliation preserved here. Later documentation-only repository heads/deploys do not supersede the accepted application-code baseline unless runtime code changes are verified.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render production | 🟢 VERIFIED | Application #328 / `78ece8d...` passed CI #1051 (688/0); guarded DB startup passed and `/health` returned application/database OK. PR #326 Meta integration is included; later docs-only commits/deploys do not change the accepted application behaviour. Governance baseline is #317 / `f2a78bb...`. |
| CONTROL-READONLY-BOUNDARY | Control & Reconciliation | 🟢 AUDIT RECORDED / DO NOT NORMALIZE | Earlier Control verification incorrectly invoked Render's environment-update action three times with an empty merge set. No env key/value changed, but at least two same-commit API redeploys materialized (`dep-da2ope3m8hqs73e3pr7g`, `dep-da2opi9s4bfs73fstcgg`). Preserve this as a read-only control-boundary breach; do not treat it as ordinary verification. |
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
| META-TEMPLATE-AUDIT | WhatsApp / Meta Integration | 🟢 VERIFIED LIVE | PR #326 merged as `acefd0e3...`; final CI #1049 passed on `9328a89...`; centralized exact-contract/duplicate/readiness audit is durable production behaviour. Do not redo the audit implementation or manufacture evidence. |
| META-BOOKING-UPDATE | `shiloh_booking_update_v1` | 🟠 WAITING APPROVAL / PRODUCTION CONFIG | Provider gate **CLOSED**: APPROVED, `already_exists`, exact Utility/`en`, `duplicateCount=0`, quality `UNKNOWN`, not resubmitted. Delivery gate remains closed: `WHATSAPP_BOOKING_UPDATE_TEMPLATE` unsatisfied; `WHATSAPP_BOOKING_UPDATE_ENABLED` not independently readable/not reached. Production / DevOps owns any separately approved configuration/enablement decision. |
| META-CANCEL-CONFIRM | `shiloh_cancellation_confirmation_v1` | 🟢 APPROVED / PROVIDER READY | Cancellation confirmation path ready. |
| CUSTOMER-CHANGE-EVIDENCE | Genuine post-approval update delivery | 🟠 WAITING PRODUCTION DELIVERY | Appointment #575 / audit event 674 is the genuine queued unsent practitioner-change journey. It fails closed on `WHATSAPP_BOOKING_UPDATE_TEMPLATE`; do not manufacture another journey or claim delivery. |
| PUBLIC-CATALOGUE-P1 | Shiloh-owned `/book` catalogue | 🟢 VERIFIED LIVE | Accepted #301 CRM-backed catalogue; no duplicate static source of truth. |
| PUBLIC-CATALOGUE-POLISH | #282–#301 presentation lineage | 🟢 VERIFIED LIVE | #301 is accepted; #284–#300 visual/layout variants superseded. |
| PUBLIC-CATALOGUE-NEXT | Business review of current #301 page | ⚪ READY | Resume only from accepted #301 state and preserve CRM/booking semantics. |
| CHRISTEL-CATALOGUE-VERIFY | Production / DevOps read-only catalogue gate | 🟢 VERIFIED / CONSUMED | The rolled-back 16-service preflight and retained snapshot hash were consumed by #328. Startup independently repeated the full preflight before mutation and found only the same three reviewed buffers. Do not repeat this gate unless newer contradictory evidence appears. |
| CHRISTEL-CATALOGUE-CORRECTION | CRM & Identity guarded catalogue correction | 🟢 VERIFIED LIVE | PR #328 head `2f4fd605...`, merge `78ece8d...`; focused 35/0, full local 688/0, CI #1051 688/0; service #27 inactive/unmapped with history 7→7; #34 active 120 with history 17→17; #65 active 50/package unchanged; reviewed totals 60/90/90; non-retired mappings stable. Separate Goldie-description exceptions stay Control/business-approval gated; do not bulk publish. |
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

## Final Meta production reconciliation — provider approved / delivery gated

**Authoritative now:** PR #326 remains the accepted Meta integration lineage included in the current application baseline. Fresh 19 August 2026 post-approval verification supersedes the PR #329 PENDING snapshot for `shiloh_booking_update_v1`: provider status is **APPROVED**, the identity is `already_exists`, exact Utility / `en`, `duplicateCount=0`, quality `UNKNOWN`, and was not resubmitted. The provider gate is closed.

**Complete — do not redo:** the centralized inventory, exact-contract fail-closed enforcement, approval-resend evidence persistence, duplicate-safe post-acceptance handling, legacy evidence-endpoint retirement, and exact provider contract reconciliation are delivered. Do not resubmit the booking-update template, create a duplicate, manufacture another booking change, or treat approval as permission to configure/send.

**Remaining gates and owners:**

| Dependency | Gate | Owner | Control / observer |
|---|---|---|---|
| `shiloh_booking_update_v1` | Provider gate **closed**: APPROVED, exact Utility/`en`, `duplicateCount=0`, quality `UNKNOWN`. Production delivery gate **closed**: `WHATSAPP_BOOKING_UPDATE_TEMPLATE` unsatisfied; `WHATSAPP_BOOKING_UPDATE_ENABLED` not independently readable and not reached. Appointment #575 / audit event 674 remains queued and unsent. | **Production / DevOps** owns any separately approved configuration/enablement decision. | **Control & Reconciliation** tracks; **WhatsApp / Meta Integration** observes provider contract; **Booking & Admin UX** observes the genuine #575 business journey. |
| Approval-outcome, decline, cancellation and reschedule route evidence | Provider-ready, but delivery evidence must arise from the corresponding genuine business journey. | **Booking & Admin UX** owns the genuine journeys; **WhatsApp / Meta Integration** verifies provider/send evidence. | **Control & Reconciliation** tracks. |
| Follow-up rating response | Await a genuine completed-visit follow-up and real client response. | **Customer Care** owns journey truth; **WhatsApp / Meta Integration** owns delivery verification. | **Control & Reconciliation** tracks. |
| Birthday v2 | Await genuine eligible CRM DOB, opt-in and business timing. | **Customer Care** owns eligibility/journey truth; **WhatsApp / Meta Integration** owns delivery verification. | **CRM & Identity** observes source truth; **Control & Reconciliation** tracks. |
| Existing accepted-send templates | Preserve existing evidence; any additional handset observation must be natural. | Owning operational workstream for the journey; **WhatsApp / Meta Integration** for provider evidence. | **Control & Reconciliation** tracks only unresolved routes. |
| Three legacy identities | `shiloh_birthday_wish_v1`, `appointment_followup`, and `appointment_reminder` are APPROVED with quality `UNKNOWN`, `duplicateCount=0`, configured (`configuredName` equals each identity and `configured=true`) but fail-closed with `sendable=false` and `ready=false`; their full contracts remain non-authoritative. | **WhatsApp / Meta Integration** keeps them retired and fail-closed. | **Control & Reconciliation** guards against reactivation/speculation. |
| Provider quality | API quality remains `UNKNOWN` for all templates; retain the separate WhatsApp Manager **Active – Quality pending** screenshot evidence without conflating the two surfaces. | **WhatsApp / Meta Integration** monitors Meta. | **Production / DevOps** may perform read-only verification; **Control & Reconciliation** tracks material change. |

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

**Authoritative current state:** PR #328 remains the accepted regression-green production application baseline. Service #27 is inactive/unmapped with seven linked appointments preserved; #34/#65 remain active at 120/50; the reviewed canonical totals are 60/90/90. PR #326 Meta integration remains included. `shiloh_booking_update_v1` is now provider **APPROVED**, `already_exists`, exact Utility/`en`, duplicate-free and not resubmitted; production delivery remains fail-closed because `WHATSAPP_BOOKING_UPDATE_TEMPLATE` is unsatisfied and the enablement state is not independently established. Appointment #575 / audit event 674 remains genuine, queued and unsent. Christel, Abigail and Marietjie each still finalize only their own appointments; JP finalizes none. PR #320/#322 menu presentation and JP's #318 Christel+Abigail booking entitlement remain unchanged. Governance baseline #317 remains authoritative. Google Business Profile remains an external/provider gate with general Requests/min at 0.

**Highest-priority next item:** route the booking-update production configuration decision to **Production / DevOps**, but do not configure or enable anything until separate explicit approval is given in that workstream.

**Why next:** the provider approval/exact-contract work is complete and a genuine customer notification is already queued. The remaining boundary is production configuration/enablement and the operational consequence for #575, not further Meta submission or manufactured journey evidence.

**Remaining gates:** `shiloh_booking_update_v1` has no remaining Meta approval gate. Production configuration/enablement requires separate explicit approval. Control/business approval remains required before any Goldie-description publication. Other gates remain: Google Business Profile positive provider approval or usable Requests/min >0; historical attendance and #558 human truth; and natural handset evidence.

## Christel reviewed service catalogue correction — verified live

**Delivery:** PR #328 head `2f4fd605392c827509694d4cddb527656bb510f8` merged as `78ece8d5bcf38aaf5d01dbaaefacde253bdef6e3`. Focused regression passed 35/0; the post-rebase local suite and GitHub CI #1051 each passed 688/0. Render deploy `dep-da2ba6f10e5c73cp6l60` reached LIVE.

**Database/catalogue evidence:** checksum-tracked migration `062_christel_service_catalogue_correction.sql` applied once after querying all 16 active Christel mappings and confirming no unreviewed buffer. Postflight active Christel scope was 15 with no non-zero buffer. Service #27 is inactive/public-ineligible with zero mappings and seven linked appointments preserved. Service #34 remains active/public-eligible at 120 minutes with 17 appointments preserved. Medi-Heel No Gel, Full Body Swedish and Lower Back, Hip & Psoas are active/public-eligible at 60/90/90. Service #65 and its four-session/R1,400/30-day package rule remain unchanged at 50 minutes. Every non-retired target mapping remained byte-for-byte stable.

**Booking/public evidence:** the production sanitized audit contains the retained/corrected active rows and omits the retired duplicate. `/book` omits Full Body Sports Massage and renders Sports Massage Full Body 120 min, Medi-Heel No Gel 60 min, Full Body Swedish 90 min and Lower Back, Hip & Psoas Release 90 min. Availability and appointment end windows use the same canonical total; regression covers both Admin and client commit paths. No booking was manufactured for proof. `/health` returned application/database OK and post-deploy error/fatal logs were clear.

**Unresolved dependency / next action:** none for this correction. Do not redo it. Recovered Goldie descriptions are a separate Control/business approval gate because of phone-number, treatment-identity, medical-claim and misplaced-text exceptions. Control & Reconciliation owns approval/routing; Booking & Admin UX must not publish them before approval. Production / DevOps owns no remaining correction dependency.

## Guardrails

Preserve audit history. Never infer attendance, Calendar state, provider delivery or handset behaviour. Never silently assign #558. Never manufacture appointments or booking changes for evidence. Never create a static second public service catalogue when canonical CRM data can be projected instead. Retain #302 provider protection, #303 idempotent notification queue, and #307/#308 provisional-client duplicate/cleanup safeguards.

## PR #326 Meta template contract reconciliation — 🟢 COMPLETE

PR #326 / `acefd0e3bc5a21c6e61c656ccfd8f185339c4783` is merged, deployed and provider-verified. Final CI #1049 passed on `9328a89b84bdeeebbee9ab1d3b74af809a30e017`; original deploy `dep-da2b5ogu01pc73blgvn0` was verified LIVE and healthy. The authoritative per-template status and unchanged exact contract appendix are in `docs/META-TEMPLATE-READINESS-MATRIX.md`. Eleven configured operational identities remain exact, APPROVED, duplicate-free and ready. Booking update is now provider APPROVED/exact/duplicate-free and remains production configuration/enablement gated; the three legacy identities remain non-sendable with non-authoritative full contracts. API quality remains `UNKNOWN` separately from WhatsApp Manager **Active – Quality pending** evidence.

The implementation, CI, deploy, health, provider reconciliation, Tracker reconciliation and durable Master reconciliation for PR #326 are complete and must not be redone. Permanent provider lead-time/no-speculative-submission and no-manufactured-evidence governance remain in force.
