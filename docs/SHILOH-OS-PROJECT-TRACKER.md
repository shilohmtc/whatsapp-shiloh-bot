# Shiloh OS — Project Tracker

Updated: 2026-08-20
Purpose: concise operational dashboard. Master is the detailed current ledger; historical implementation detail remains in Git history/reconciliation files. Do not redo completed or superseded work.

## Canonical status system

| State | Meaning |
|---|---|
| 🟢 VERIFIED | Completed with sufficient authoritative evidence. |
| 🔵 ACTIVE | Work currently being executed. |
| ⚪ READY | Actionable now, but not currently being executed. |
| 🟠 WAITING | Requires human/provider/external/genuine-journey truth before advancing. |
| 🔴 DEFECT / HOLD | Proven problem or unsafe state; fail closed until repaired/re-verified. |
| ⏸️ DEFERRED | Deliberately postponed by explicit project decision. |

## Governance

New specialist chat: independently read current GitHub `main`, Master, this Tracker, latest reconciliation `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, and Engineering Governance; verify changing production/provider/CRM/Calendar/human evidence; preserve newer authority; then continue only owned scope.

Durable reconciliation anchors remain valid where not superseded, including `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`, the specialist-workstream reconciliation and Control-routing reconciliation.

Engineering Governance includes **#340** mandatory copy-ready specialist handoffs and **#353** specialist-chat lifecycle convention. There is no fixed turn/message threshold for chat rotation. Direct specialist continuation is allowed when ownership is clear and authority is not contradictory; all fail-closed gates remain binding.

Control & Reconciliation uses reconciled authoritative evidence, not specialist-chat narrative, for continuity.

If an item is blocked by a provider, approval, human-truth, genuine-journey or other external gate, implementation must not proceed. **Keep ownership with the appropriate monitoring/provider workstream** and have Control & Reconciliation track the dependency instead of routing implementation prematurely.

## Production baseline

**Current application:** PR **#356 / `aed75d1fef36bda3d04f7ad2e0d6747e87017d88`**, *Complete reschedule approval Meta transport gate*.

**CI:** run **#1133** successful.

**Render:** `dep-da3bvjajnfac73c6fca0` **LIVE** on exact #356 SHA.

Practitioner-approved client rescheduling remains **feature-off** with `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false`. #356 registers exact approval/decline Meta contracts and provider readiness/no-resubmit guards; it does not authorize activation.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render | 🟢 VERIFIED | #356 / `aed75d1f...`; CI #1133 success; Render `dep-da3bvjajnfac73c6fca0` LIVE on exact SHA. |
| GOVERNANCE-HANDOFF | Control + all specialists | 🟢 VERIFIED | #340 mandatory self-contained specialist handoffs; direct specialist continuation allowed when ownership/authority are clear. |
| GOVERNANCE-CHAT-LIFECYCLE | Control + all specialists | 🟢 VERIFIED | #353 lifecycle convention authoritative: practical chat-health rotation, no arbitrary turn threshold, fresh same-specialist chat independently re-reads authority. |
| CONTROL-CHECKPOINT-ROUTING | Control & Reconciliation | 🟢 VERIFIED | Durable Control checkpoint routing contract remains adopted: owner/chat/reason/dependencies/status/copy-ready continuation; blocked work stays with monitoring/provider ownership. |
| SPECIALIST-RECONCILIATION | All four specialist workstreams | 🟢 VERIFIED | Mandatory specialist verification → applicable regression/merge/production-provider verification → Tracker/Master reconciliation → final specialist checkpoint remains authoritative. |
| CONTROL-READONLY-BOUNDARY | Control & Reconciliation | 🟢 AUDIT RECORDED / DO NOT NORMALIZE | Earlier Control Render verification incorrectly invoked env-update with empty merge set and caused same-commit redeploys including `dep-da2ope3...` / `dep-da2opi9...`; no env values changed. Control uses true read-only Render tools absent explicit override. |
| PR351-SUPERSESSION | Control & Reconciliation | 🟢 CLOSED / SUPERSEDED | PR #351 was based on #350 and became stale after #352–#356. Closed rather than force-merged; current reconciliation supersedes it. |
| JUVAN-JP-BOOKING-APPROVAL | Booking & Admin UX | 🟢 VERIFIED LIVE / HANDSET-PROVEN | #350 canonical client-ID policy routes Juvan client 845 to exact JP admin 4; #352 genuine #585 proves pending-before-approval, authorized JP approval, final v1 confirmation only after approval, and matching Calendar mirrors. Do not recreate #585. |
| META-RESCHEDULE-APPROVAL | WhatsApp / Meta Integration | 🟠 WAITING PROVIDER / NOT ACTIVE | #356 exact contracts configured for `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`; last authoritative read: both **PENDING / UTILITY / en / exact=true / duplicateCount=0 / configured=true**. Next: genuinely read-only provider refresh when authorized surface exists. No resubmit merely due PENDING. |
| PROD-RESCHEDULE-ACTIVATION | Production / DevOps | 🟠 BLOCKED BY META | Do not enable `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED` until BOTH approval/decline templates prove complete APPROVED readiness and provider evidence is reconciled. |
| BOOKING-RESCHEDULE-HANDSET | Booking & Admin UX | 🟠 BLOCKED BY ACTIVATION | Genuine client/practitioner handset proof only after verified Production activation. No manufactured Juvan reschedule, practitioner decision, CRM or Calendar mutation. |
| RESCHEDULE-START-BOUNDARY | Booking & Admin UX | 🟢 VERIFIED LIVE | #354 blocks client self-service when appointment is starting/started and expires stale pending holds at original start boundary; preserve. |
| RESCHEDULE-APPROVED-CONFIRM | Booking & Admin UX + WhatsApp | 🟢 MERGED / DARK PATH | #355 routes practitioner-approved client reschedules to existing exact `shiloh_reschedule_confirmation_v1` with durable retry/claim/suppression; feature remains dark until activation gate closes. |
| META-BOOKING-CONFIRM-V1 | WhatsApp / Meta Integration | 🟢 VERIFIED LIVE / HANDSET-PROVEN | v1 provider contract remains approved/configured; #348 suppresses four redundant automatic supplemental groups; #352 handset proof confirms suppression. |
| META-BOOKING-CONFIRM-V2 | WhatsApp / Meta Integration | 🟠 WAITING PROVIDER / NOT ACTIVE | Last authority: `shiloh_booking_confirmation_v2` **PENDING / UTILITY / en / exact / duplicateCount=0** after one controlled submission; production remains v1. Do not resubmit/activate while PENDING. |
| META-BOOKING-UPDATE | WhatsApp / Meta + Production | 🟢 VERIFIED LIVE / ENABLED | `shiloh_booking_update_v1` approved/exact/duplicate-free and production-enabled. Kill switch `WHATSAPP_BOOKING_UPDATE_ENABLED=false`. |
| CUSTOMER-CHANGE-EVIDENCE | Booking & Admin UX + WhatsApp | 🟠 WAITING GENUINE FUTURE DELIVERY | #575 / audit 674 terminally suppressed `appointment_already_ended`, `sent_at=null`; historical only. Wait for natural future appointment change; do not manufacture. |
| GOOGLE-CALENDAR-AUTH | Booking/Admin + Production | 🟢 VERIFIED HEALTHY | #302 fail-closed provider guard/health probe permanent. #570 and #585 are genuine sync evidence; do not mutate for proof. |
| ADMIN-BOOKING-ENTITLEMENT | Booking & Admin UX | 🟢 VERIFIED LIVE | #318 fail-closed scope: Christel+Abigail shared; Marietjie only; other linked Admin own practitioner; JP explicit Christel+Abigail exception; other unlinked Admin none. |
| ADMIN-BOOKING-FAST-PATH | Booking & Admin UX | 🟢 VERIFIED | Existing client lookup, Goldie bridge, provisional new-client reserve/cleanup, typed-time and same-Admin prepare→confirm rules accepted; do not redo. |
| CRM-DUMMY-RESET | CRM & Identity | 🟢 RUNTIME GUARD LIVE / 🟠 GENUINE RESET EVIDENCE OPEN | #338 guarded reassignment workflow merged. Genuine authorized reset/post-reset first-contact evidence remains separate; do not manufacture. |
| CLIENT-WELCOME-JUVAN | Booking & Admin UX | 🟢 REPAIRED / HANDSET-PROVEN | #337 genuine Juvan `Hi` proved universal welcome then registered branch; do not reset/replay state. |
| CLIENT-DISCOVERY-JUVAN | Booking & Admin UX | 🟢 HANDSET-PROVEN | Genuine two-page category discovery verified accepted ordering/SQT grouping; no need to redo. |
| ATT-AUTH | Booking/Admin + CRM | 🟢 VERIFIED LIVE | PR #324 own-practitioner authority: Christel→Christel, Abigail→Abigail, Marietjie→Marietjie, JP→none. CI #1041 passed 662/0; exact active linked identity required; conflicts fail closed. |
| A1-HIST-REVIEW | Booking/Admin + CRM | 🔵 HUMAN TRUTH | Historical attendance remains explicit human truth; re-query before quoting current counts. |
| A1-558 | CRM & Identity | 🔴 HOLD | Appointment #558 historical practitioner `SHILOH MTC`; never infer practitioner. Establish authoritative/human truth first. |
| CHRISTEL-CATALOGUE-CORRECTION | CRM & Identity | 🟢 VERIFIED LIVE | #328: #27 inactive/unmapped/history preserved; #34 120 min; #65 50 min/package retained; reviewed totals 60/90/90; no practitioner overrides. Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`. Do not redo/bulk-publish Goldie wording. |
| PUBLIC-CATALOGUE | Booking & Admin UX | 🟢 VERIFIED LIVE | `/book` remains accepted CRM-backed #301 public catalogue; no duplicate static source. |
| GOLDIE-DESCRIPTIONS | Control / business approval | 🟠 WAITING APPROVAL | Phone-number/treatment-identity/medical-claim/misplaced-text exceptions remain gated; do not bulk publish. |
| VISUAL-CALENDAR | Booking & Admin UX | ⏸️ DEFERRED | Shiloh Visual Calendar explicitly held off for now. Do not implement/prototype/add to active queue unless later reactivated. Existing Google Calendar integration unchanged. |
| GBP-PROVIDER | Production / DevOps | 🟠 WAITING PROVIDER | Business Information API enabled/application submitted/API-specific quotas visible; general Requests/min remains 0; access is **not confirmed/usable**. Do not treat as quota-increase work or start OAuth/API integration. Reopen only when usable Google access or a usable general request quota greater than 0 is authoritatively established; Control & Reconciliation tracks the dependency. |
| GCONTACTS | CRM & Identity | ⚪ READY / LOW PRIORITY | CRM remains authoritative. |
| OZOW | Production / business | 🟠 WAITING | Merchant configuration + explicit business rules required. |
| PRIVACY-DESTRUCTIVE | Control + CRM | 🟠 WAITING | Fail closed pending authority/evidence. |

## Practitioner-approved client reschedule gate

Application engineering is complete through #356 but **activation is not authorized**.

Provider gate required independently for both:

| Requirement | Approval request | Declined |
|---|---|---|
| Exact template name configured | ✅ | ✅ |
| Category UTILITY | ✅ | ✅ |
| Language `en` | ✅ | ✅ |
| Exact contract | ✅ | ✅ |
| duplicateCount = 0 | ✅ | ✅ |
| Provider status APPROVED | **❌ PENDING** | **❌ PENDING** |

**Current owner:** `Shiloh OS — WhatsApp / Meta Integration` for read-only provider monitoring.

**Production / DevOps:** blocked until both templates pass the full gate.

**Booking & Admin UX:** blocked until production activation is verified.

## Juvan approval evidence — complete / do not redo

#350 establishes the canonical `juvan_botha_jp_booking_approval` policy keyed to client ID 845 and exact JP admin ID 4. #352 records genuine appointment #585 proof: Juvan held pending JP approval, JP handset displayed Approve/Decline, authorized approval occurred, exactly one v1 confirmation followed approval, the four legacy supplemental groups were absent, and shared/Christel Google Calendar mirrors matched 16:00–17:00.

Do not create/cancel/recreate #585, broaden the policy by display name, manufacture a duplicate identity, or alter JP authority for proof.

## Booking confirmation state

**v1:** approved/configured/live; #348 application-side supplemental suppression is handset-proven via #352.

**v2:** one controlled submission only; last provider state PENDING/exact/duplicate-free; production inactive. WhatsApp / Meta Integration monitors; Production activation remains blocked until APPROVED and separately controlled.

## Booking update state

`shiloh_booking_update_v1` production activation is closed/complete. Natural customer-delivery evidence remains open. Stale ended rows are terminally suppressed; #575/674 cannot be reused as success evidence.

## Google Calendar state

OAuth/provider health remains verified; #302 provider guard is permanent. Calendar is a synchronized provider/mirror, not canonical appointment truth. Existing genuine #570 and #585 evidence must not be mutated solely to reproduce proof.

## CRM / attendance state

CRM remains canonical identity authority. Ambiguity and destructive changes fail closed. #338 Dummy Test reset hardening remains live, with genuine reset evidence separate. Attendance finalization remains own-practitioner-only under PR #324; JP has none. #558 remains a fail-closed practitioner identity exception.

## Catalogue state

Public catalogue remains CRM-projected `/book` #301. Christel reviewed correction #328 and `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md` remain authoritative. Goldie wording publication is a separate approval gate and must not be conflated with catalogue correction.

## Google Business Profile provider gate

Current state remains **🟠 WAITING PROVIDER / pending Google**. General **Requests/min** remains **0**, access is **not confirmed/usable**, and Production / DevOps owns provider verification while Control & Reconciliation tracks the dependency. **Do not treat as quota-increase work or start OAuth/API integration**. Reopen only after authoritative Google evidence establishes usable access or a usable general request quota greater than 0.

## Deferred roadmap

**Shiloh Visual Calendar:** explicitly deferred. The conceptual architecture may be revisited later as an Admin presentation/control layer over canonical Shiloh appointment state with Google Calendar remaining a synchronized mirror, but no implementation/prototype is authorized now.

## Exact continuation

**Authoritative current state:** PR #356 / `aed75d1fef36bda3d04f7ad2e0d6747e87017d88` is current production code; CI #1133 succeeded; Render `dep-da3bvjajnfac73c6fca0` is LIVE. Governance includes #340 handoffs and #353 lifecycle convention. Juvan booking approval is handset-proven through #352. Reschedule start-boundary and approved-confirmation protections from #354/#355 are present. #356 transport contracts are configured but the feature remains off.

**Highest-priority next item:** no implementation is currently executable. WhatsApp / Meta Integration should perform only a future genuinely read-only provider refresh of the two reschedule approval/decline templates when an authorized read surface is available.

**Why next:** the remaining dependency is external Meta review. Booking & Admin UX and Production / DevOps cannot safely advance while both required templates remain PENDING.

**Remaining gate:** BOTH templates must prove `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true`. Only then reconcile provider approval and route a separate Production / DevOps activation. Genuine Booking/Admin handset proof follows only after verified activation.
