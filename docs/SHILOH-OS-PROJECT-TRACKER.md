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

New specialist chat: independently read current GitHub `main`, Master, this Tracker, latest reconciliation `docs/SHILOH-OS-RECONCILIATION-2026-08-20-JUVAN-PRIMARY-BACKUP-APPROVAL.md`, and Engineering Governance; verify changing production/provider/CRM/Calendar/human evidence; preserve newer authority; then continue only owned scope.

Durable reconciliation anchors remain valid where not superseded, including `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`, specialist-workstream reconciliation and Control-routing reconciliation.

Engineering Governance includes **#340** mandatory copy-ready specialist handoffs and **#353** specialist-chat lifecycle convention. There is no fixed turn/message threshold for chat rotation. Direct specialist continuation is allowed when ownership is clear and authority is not contradictory; all fail-closed gates remain binding.

Control & Reconciliation uses reconciled authoritative evidence, not specialist-chat narrative, for continuity. Keep ownership with the appropriate monitoring/provider workstream when work is blocked by an external/provider gate; do not route blocked work to implementation.

## Production baseline

**Current application:** PR **#366 / `53b5e0c4027f9910291f75c05ec13d9c55528118`**, *Add Juvan Primary Backup booking approval*.

**CI:** run **#1164**, full non-mutating regression suite passed **796 / 796**, zero failures and zero skipped.

**Render:** deploy **`dep-da3eiegae00c7380pa8g`** is **LIVE** on exact #366 merge SHA in confirmed workspace **My Workspace**. New-instance startup applied/checksum-verified migration 068 and reverified controlled Juvan state **BOUND** to current canonical client **845**, phone suffix **1564**, exact JP admin **4**, with runtime approval contract `assigned_practitioner_primary_jean_pierre_backup_first_decision_wins`. Google Calendar health passed. Practitioner-approved rescheduling remained `featureEnabled=false`.

PR #366 consumes the #364 phone-anchored controlled Juvan resolver. The assigned practitioner is now Primary approver, Jean-Pierre is Backup, and one valid atomic first decision wins under controlled-identity plus approval/appointment locks. Reset Juvan is presented only in the exact Jean-Pierre Admin experience and delegates to the existing #364 preview/confirmation/reset contract. Historical client 845 is current state only, not a permanent identity rule.

No genuine Juvan reset, re-registration, booking, approval/decline, Calendar mutation or handset journey was manufactured for #366 proof. Genuine #585 remains preserved historical evidence of the superseded JP-sole behavior.

The completed Dummy Test reset/cleanup remains historical evidence and is not undone; Dummy Test and Chenique remain retired from active reusable reset eligibility. `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START=false` remains the normal inert state.

Practitioner Block time from #360 remains live and unchanged. Practitioner-approved client rescheduling remains **feature-off** with `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false`; #366 did not alter that gate.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render | 🟢 VERIFIED | #366 / `53b5e0c4027f...`; CI #1164 passed 796/796; Render `dep-da3eiegae00c7380pa8g` LIVE on exact merge SHA; migration 068 checksum-valid and Google Calendar health passed. |
| CONTROLLED-JUVAN-DEMO | CRM & Identity | 🟢 VERIFIED LIVE / FOUNDATION | #364 establishes one durable `juvan_botha` controlled identity anchored to exact phone suffix 1564 with nullable current canonical pointer. #366 consumes that resolver without hard-coding client 845 or display-name matching. JP-only reset still atomically archives/releases/unbinds; exact-phone normal WhatsApp onboarding atomically rebinds the controlled and approval-policy pointers. No real reset/re-registration was executed for proof. |
| JUVAN-JP-BOOKING-APPROVAL | Booking & Admin UX | 🟢 HISTORICAL / SUPERSEDED BEHAVIOR EVIDENCE | #350/#352 genuine #585 remains accepted proof of the former JP-sole-approver flow. #366 does not rewrite #585 or terminal historical decisions. Do not recreate #585. |
| BOOKING-JUVAN-PRIMARY-BACKUP | Booking & Admin UX | 🟢 VERIFIED LIVE / APPLICATION-RUNTIME | #366: JP-only Reset Juvan menu delegates #364; current controlled Juvan identity only; assigned practitioner Primary; JP Backup; one atomic first decision wins; Primary/Backup + client/service/time presented; separate delivery timestamps; existing idempotent client confirmation and decline/Calendar/audit safeguards preserved. Migration 068 applied/checksum-verified in production. No journey manufactured. |
| DUMMY-TEST-BOOKING-CLEANUP | Booking & Admin UX | 🟢 VERIFIED LIVE / COMPLETE | Exact archived/reset CRM #835 cleanup. #582 and #583 newly cancelled; #561/#565/#566/#574 already cancelled; #564 no-show preserved. Three lifecycle rows terminalized; no pending approval/reschedule/change-notification state required mutation. 2026-wide shared, Abigail, Marietjie and primary/Christel Calendar searches now return zero Dummy Test events. One-shot flag is back false. Do not replay merely for proof. |
| ADMIN-BLOCK-TIME | Booking & Admin UX | 🟢 VERIFIED LIVE | #360 uses canonical `calendar_blocks`; Christel→Myself/Abigail, Abigail→self, Marietjie→self, JP/others→none; overlap and authority checks fail closed; no fake appointment/client message; future Shiloh-created blocks manageable, imported Goldie blocks read-only. Natural real-block handset evidence may arise later; do not manufacture one. |
| CRM-DUMMY-RESET | CRM & Identity + Production / DevOps | 🟢 HISTORICAL COMPLETE / RETIRED AS REUSABLE | #338/#358 genuine Dummy Test reset archived CRM #835, released its former phone and proved a fresh unregistered `Hi`; #362 cleaned remaining operational bookings. Preserve this evidence and do not replay it. #364 supersedes the old reusable multi-target reset eligibility: Dummy Test and Chenique are no longer active reset targets. |
| GOVERNANCE-HANDOFF | Control + all specialists | 🟢 VERIFIED | #340 mandatory self-contained specialist handoffs; direct specialist continuation allowed when ownership/authority are clear. |
| GOVERNANCE-CHAT-LIFECYCLE | Control + all specialists | 🟢 VERIFIED | #353 lifecycle convention authoritative: practical chat-health rotation, no arbitrary turn threshold, fresh same-specialist chat independently re-reads authority. |
| CONTROL-CHECKPOINT-ROUTING | Control & Reconciliation | 🟢 VERIFIED | Owner/chat/reason/dependencies/status/copy-ready continuation remains mandatory; blocked work stays with monitoring/provider ownership. |
| SPECIALIST-RECONCILIATION | All four specialist workstreams | 🟢 VERIFIED | Verification → regression/merge → production/provider evidence → Tracker/Master reconciliation → final specialist checkpoint remains authoritative. |
| CONTROL-READONLY-BOUNDARY | Control & Reconciliation | 🟢 AUDIT RECORDED / DO NOT NORMALIZE | Earlier empty Render env-update calls caused same-commit redeploys but changed no env values. Control uses true read-only tools absent explicit override. |
| PR351-SUPERSESSION | Control & Reconciliation | 🟢 CLOSED / SUPERSEDED | PR #351 was stale after #352–#356 and remains closed. |
| META-RESCHEDULE-APPROVAL | WhatsApp / Meta Integration | 🟠 WAITING PROVIDER / NOT ACTIVE | #356 exact contracts configured for `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`; last authoritative provider state remains PENDING / UTILITY / en / exact=true / duplicateCount=0 / configured=true. #366 startup independently confirmed the application feature remains off. No resubmit merely due PENDING. |
| PROD-RESCHEDULE-ACTIVATION | Production / DevOps | 🟠 BLOCKED BY META | Do not enable `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED` until both templates independently prove complete APPROVED readiness and provider evidence is reconciled. |
| BOOKING-RESCHEDULE-HANDSET | Booking & Admin UX | 🟠 BLOCKED BY ACTIVATION | Genuine client/practitioner handset proof only after verified Production activation. No manufactured Juvan reschedule or CRM/Calendar mutation. |
| RESCHEDULE-START-BOUNDARY | Booking & Admin UX | 🟢 VERIFIED LIVE | #354 blocks self-service when appointment is starting/started and expires stale pending holds at original start boundary. |
| RESCHEDULE-APPROVED-CONFIRM | Booking & Admin UX + WhatsApp | 🟢 MERGED / DARK PATH | #355 uses exact `shiloh_reschedule_confirmation_v1` with durable retry/claim/suppression; feature remains dark pending activation. |
| META-BOOKING-CONFIRM-V1 | WhatsApp / Meta Integration | 🟢 VERIFIED LIVE / HANDSET-PROVEN | v1 provider contract remains approved/configured; #348 suppression of four redundant automatic supplemental groups is handset-proven by #352. |
| META-BOOKING-CONFIRM-V2 | WhatsApp / Meta Integration | 🟠 WAITING PROVIDER / NOT ACTIVE | Last authority: PENDING / UTILITY / en / exact / duplicateCount=0 after one controlled submission; production remains v1. Do not resubmit/activate while PENDING. |
| META-BOOKING-UPDATE | WhatsApp / Meta + Production | 🟢 VERIFIED LIVE / ENABLED | `shiloh_booking_update_v1` approved/exact/duplicate-free and production-enabled. Kill switch `WHATSAPP_BOOKING_UPDATE_ENABLED=false`. |
| CUSTOMER-CHANGE-EVIDENCE | Booking & Admin UX + WhatsApp | 🟠 WAITING GENUINE FUTURE DELIVERY | #575 / audit 674 terminally suppressed `appointment_already_ended`, `sent_at=null`; wait for a natural future appointment change. |
| GOOGLE-CALENDAR-AUTH | Booking/Admin + Production | 🟢 VERIFIED HEALTHY | #302 fail-closed provider guard remains permanent. #570 and #585 are genuine sync evidence; #362 cleanup independently verified zero Dummy Test mirrors after cancellation. #366 startup health passed without manufacturing Calendar evidence. |
| ADMIN-BOOKING-ENTITLEMENT | Booking & Admin UX | 🟢 VERIFIED LIVE | #318 fail-closed scope: Christel+Abigail shared; Marietjie only; other linked Admin own practitioner; JP explicit Christel+Abigail exception; other unlinked Admin none. Block-time authority is separate and narrower. |
| ADMIN-BOOKING-FAST-PATH | Booking & Admin UX | 🟢 VERIFIED | Existing lookup/provisional-client/typed-time/same-Admin confirm rules remain accepted. |
| CLIENT-WELCOME-JUVAN | Booking & Admin UX | 🟢 HANDSET EVIDENCE PRESERVED | #337 genuine Juvan `Hi` proved universal welcome then registered branch. #364 intentionally clears phone-level welcome-delivery state only during a future authorized controlled reset so the same physical number can genuinely re-enter the new-client journey. Do not execute/reset merely for proof. |
| CLIENT-DISCOVERY-JUVAN | Booking & Admin UX | 🟢 HANDSET-PROVEN | Genuine two-page category discovery verified accepted ordering/SQT grouping. |
| ATT-AUTH | Booking/Admin + CRM | 🟢 VERIFIED LIVE | PR #324 own-practitioner authority: Christel→Christel, Abigail→Abigail, Marietjie→Marietjie, JP→none. CI #1041 passed 662/0. |
| A1-HIST-REVIEW | Booking/Admin + CRM | 🔵 HUMAN TRUTH | Historical attendance remains explicit human truth; re-query before quoting current counts. |
| A1-558 | CRM & Identity | 🔴 HOLD | Appointment #558 historical practitioner `SHILOH MTC`; never infer practitioner. |
| CHRISTEL-CATALOGUE-CORRECTION | CRM & Identity | 🟢 VERIFIED LIVE | #328: #27 inactive/unmapped/history preserved; #34 120 min; #65 50 min/package retained; reviewed totals 60/90/90; no practitioner overrides. |
| PUBLIC-CATALOGUE | Booking & Admin UX | 🟢 VERIFIED LIVE | `/book` remains accepted CRM-backed #301 public catalogue. |
| GOLDIE-DESCRIPTIONS | Control / business approval | 🟠 WAITING APPROVAL | Phone/treatment-identity/medical-claim/misplaced-text exceptions remain gated; do not bulk publish. |
| VISUAL-CALENDAR | Booking & Admin UX | ⏸️ DEFERRED | Explicitly held off; existing Google Calendar integration unchanged. |
| GBP-PROVIDER | Production / DevOps | 🟠 WAITING PROVIDER | General Requests/min remains 0; usable GBP access is not confirmed/usable. Reopen only with a usable general request quota greater than 0 or explicit Google approval/access evidence. Existing scaffolding is not provider approval. Do not treat as quota-increase work or start OAuth/API integration. |
| GCONTACTS | CRM & Identity | ⚪ READY / LOW PRIORITY | CRM remains authoritative. |
| OZOW | Production / business | 🟠 WAITING | Merchant configuration + explicit business rules required. |
| PRIVACY-DESTRUCTIVE | Control + CRM | 🟠 WAITING | Fail closed pending authority/evidence. |

## Juvan Primary / Backup booking approval — verified live application/runtime

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-JUVAN-PRIMARY-BACKUP-APPROVAL.md`.

- #366 merged as `53b5e0c4027f9910291f75c05ec13d9c55528118`; final CI #1164 passed 796/796 after repairing formatting-brittle compatibility assertions without weakening their safety semantics.
- Migration 068 adds controlled approval mode and separate Backup delivery evidence. Production startup applied/checksum-verified 068.
- Controlled Juvan matching consumes only the current phone-anchored `controlled_demo_identities.current_client_id`; there is no permanent client 845 or Juvan display-name shortcut.
- Assigned position-1 practitioner is Primary; exact current Jean-Pierre policy admin is Backup. Primary must have active Admin WhatsApp identity.
- Staff approval requests use the existing approved transport, identify client/service/time plus Primary/Backup/recipient role, and independently track Primary/Backup delivery.
- Decisions lock current controlled identity plus approval/appointment truth, revalidate current client/practitioner/JP authority, and terminalize only a still-pending row. The first valid decision wins; later authorized attempts receive already-decided state and do not write a second decision.
- Approval preserves the existing idempotent client confirmation path; decline preserves canonical cancellation, status history, CRM audit and shared/practitioner Calendar release.
- Reset Juvan appears only for the exact Jean-Pierre Admin experience and delegates to #364. The menu layer does not duplicate reset logic.
- Render `dep-da3eiegae00c7380pa8g` is LIVE on exact #366 SHA. Startup reports current BOUND client 845 / suffix 1564 / JP admin 4 and the new Primary/Backup contract; these are current values, not permanent identity rules.
- No genuine reset, re-registration, booking, decision or Calendar journey was manufactured. #585 remains historical old-behavior evidence.

## Controlled Juvan reusable demo identity — verified live foundation

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`.

- #364 merged as `727b7c335ce9008daa9173206aa4abfd975decf9`; CI #1158 passed 791/791.
- `controlled_demo_identities` anchors `juvan_botha` to the exact normalized business-controlled phone, not a display-name query.
- Production migrations 066 and 067 applied/checksum-verified; #366 startup reverified BOUND client 845, display `Juvan Botha`, phone suffix 1564 and JP admin 4.
- Reset is exact Jean-Pierre business-admin only. The transaction re-resolves/locks identity and policy, clears bounded phone state, releases only WhatsApp/mobile contacts, requires zero residual bindings, archives the old client, preserves appointments/audit history, writes a reset audit, and atomically leaves the controlled identity and Juvan approval-policy client pointers UNBOUND.
- When UNBOUND, only normal `whatsapp_onboarding` attachment of the exact controlled phone may atomically bind the newly created active canonical client; any other binding/ambiguity fails closed. The controlled pointer, approval-policy pointer and rebind audit move in the same transaction as contact attachment.
- The read-only resolver fails closed on client/contact/policy/shared-active drift and is the required downstream identity source.
- No genuine Juvan reset, new registration or rebind was executed. Production remains BOUND to client 845 until an explicitly authorized genuine device lifecycle occurs.
- The sanctioned Render Postgres read-only connector still fails before SQL execution at SSL/TLS negotiation; no direct-query row result is claimed.

## Dummy Test booking cleanup — complete / do not replay

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`.

- #362 added an exact-client, reset-marker, zero-contact guarded one-shot behind `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START`.
- CI #1152 passed before deployment.
- Default-off #362 deployment reached LIVE before activation.
- One authorized activation cancelled **#582** and **#583**.
- Existing history was preserved: #561/#565/#566/#574 were already cancelled and #564 remains no-show.
- Three lifecycle rows were terminalized. There were zero pending booking approvals, reschedule requests or customer-change notifications requiring mutation.
- All shared/practitioner Calendar cleanup calls completed with no unresolved IDs.
- Independent full-2026 Calendar searches now return zero Dummy Test events on shared, Abigail, Marietjie and primary/Christel surfaces.
- The one-shot flag was immediately returned to **false**, and final flag-off deploy `dep-da3dk36k1f9s73em616g` reached LIVE.
- No customer cancellation message was queued or sent by the cleanup.

## Admin practitioner Block time — verified live

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`.

- #360 merged the dedicated Block time / Blocked time workflow using existing `calendar_blocks`.
- Blocking authority is explicit: Christel→Myself/Abigail; Abigail→self; Marietjie→self; Jean-Pierre/others→none.
- Missing/ambiguous practitioner identity fails closed and does not inherit broad booking authority.
- Date, start, duration, reason and final review are required before create; overlap with an appointment or calendar block fails closed.
- Future Shiloh-created blocks can be managed; imported Goldie blocks remain outside this edit/remove UI.
- Client/Admin availability already excludes `calendar_blocks`, so a committed block removes that interval from authoritative availability.
- No client identity, treatment, appointment, attendance, payment, revenue or client WhatsApp state is created by Block time.
- CI #1148 passed the complete regression step after correcting a stale JP/Christel parity assertion to preserve the new explicit authority exception.
- No real block was manufactured for proof.

## CRM Dummy Test reassignment — complete historical evidence / reusable target retired

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`.

- #338 established the destructive reset safeguards used for the completed Dummy Test journey; #358 repaired the narrow structured-interaction language boundary; CI #1139 passed 773/0.
- Genuine reset archived CRM #835 and released its WhatsApp/mobile identity while preserving appointment/audit history.
- Genuine post-reset `Hi` from the reassigned number received the unregistered/new-client branch with no inherited Dummy Test identity.
- #362 subsequently cleaned the preserved operational bookings without changing the archived identity or deleting history.
- #364 now retires Dummy Test, CRM Dummy Test and Chenique from active reusable reset eligibility. This retirement does not delete or invalidate any prior evidence.
- The external Render Postgres connector still fails before SQL execution at its SSL/TLS boundary; do not infer direct row evidence from that connector.

## Practitioner-approved client reschedule gate

Application engineering remains present through #356, but activation is not authorized. Both required Meta templates must independently prove `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true` before Production activation. Current owner remains `Shiloh OS — WhatsApp / Meta Integration` for genuinely read-only provider monitoring.

## Other preserved state

Juvan booking #585 remains do-not-redo historical evidence for the superseded JP-sole-approver behavior. Booking confirmation v1 remains live; v2 remains provider-gated. Booking update activation is complete but natural delivery evidence remains open. Google Calendar remains synchronized/fail-closed. Attendance stays own-practitioner only and #558 stays HOLD. Christel catalogue correction remains authoritative. GBP, Ozow, privacy and Goldie-description gates remain unchanged.

## Exact continuation

**Authoritative current state:** PR #366 / `53b5e0c4027f9910291f75c05ec13d9c55528118` is current production application code; CI #1164 passed 796/796; Render deploy `dep-da3eiegae00c7380pa8g` is LIVE. Migration 068 is applied/checksum-verified. Controlled Juvan identity remains production-verified BOUND to the current canonical pointer, presently client 845 / phone suffix 1564 / JP admin 4. The approval contract is assigned practitioner Primary + JP Backup + atomic first-decision-wins.

**Highest-priority standing item:** no further Booking/Admin implementation is required for this controlled unit. The executable standing priority returns to `Shiloh OS — WhatsApp / Meta Integration` for a genuinely read-only provider refresh of the two practitioner-approved reschedule templates when an authorized provider surface is available.

**Why next:** the Juvan Booking/Admin redesign is live without manufactured business evidence. The remaining reschedule dependency is external Meta approval, not additional Booking/Admin code.

**Remaining gates:** do not execute a genuine Juvan reset/re-registration or manufacture a new booking/decision merely for proof. Both reschedule templates must independently prove the full APPROVED readiness gate before Production activation; only after verified activation may a genuine reschedule handset journey occur. All other standing fail-closed gates remain preserved.
