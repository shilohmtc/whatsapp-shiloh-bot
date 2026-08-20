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

New specialist chat: independently read current GitHub `main`, Master, this Tracker, latest reconciliation `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`, and Engineering Governance; verify changing production/provider/CRM/Calendar/human evidence; preserve newer authority; then continue only owned scope.

Durable reconciliation anchors remain valid where not superseded, including `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`, specialist-workstream reconciliation and Control-routing reconciliation.

Engineering Governance includes **#340** mandatory copy-ready specialist handoffs and **#353** specialist-chat lifecycle convention. There is no fixed turn/message threshold for chat rotation. Direct specialist continuation is allowed when ownership is clear and authority is not contradictory; all fail-closed gates remain binding.

Control & Reconciliation uses reconciled authoritative evidence, not specialist-chat narrative, for continuity. Keep ownership with the appropriate monitoring/provider workstream when work is blocked by an external/provider gate; do not route blocked work to implementation.

## Production baseline

**Current application:** PR **#360 / `1090c284e3971e159ea740dbb3388d0e2f7431ec`**, *Add guarded practitioner block-time workflow*.

**CI:** run **#1148**, complete non-mutating regression test step passed.

**Render:** `dep-da3dbm1srm7s7396eop0` **LIVE** on exact #360 SHA in confirmed workspace **My Workspace**. Service is `main` auto-deploy, health-check path `/health`; post-deploy Render metrics showed one running instance and an HTTP 200 response in the verification window. No manual deploy or environment/configuration mutation was used for #360 verification.

PR #360 adds a dedicated practitioner Block time workflow backed by canonical `calendar_blocks`, not fake appointments. Christel may block Myself/Abigail; Abigail and Marietjie are own-only; Jean-Pierre and other Admin identities have no Block time authority. Existing authoritative availability already excludes `calendar_blocks`.

Practitioner-approved client rescheduling remains **feature-off** with `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false`; #360 did not alter that gate.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render | 🟢 VERIFIED | #360 / `1090c284e397...`; CI #1148 regression step passed; Render `dep-da3dbm1srm7s7396eop0` LIVE on exact SHA. |
| ADMIN-BLOCK-TIME | Booking & Admin UX | 🟢 VERIFIED LIVE | #360 uses canonical `calendar_blocks`; Christel→Myself/Abigail, Abigail→self, Marietjie→self, JP/others→none; overlap and authority checks fail closed; no fake appointment/client message; future Shiloh-created blocks manageable, imported Goldie blocks read-only. Natural real-block handset evidence may arise later; do not manufacture one. |
| CRM-DUMMY-RESET | CRM & Identity + Production / DevOps | 🟢 VERIFIED LIVE / HANDSET-PROVEN | #338 guarded reset contract + #358 interactive-language repair. Genuine preview proved Dummy Test / CRM #835 / +27 71 674 2646 with no pre-confirm shared-active conflict; genuine Confirm committed archive + one WhatsApp/mobile release + temporary-state cleanup + preserved appointment/audit history; real post-reset `Hi` from suffix `2646` entered brand-new registration with no inherited Dummy Test identity. Do not replay/reset merely for proof. |
| GOVERNANCE-HANDOFF | Control + all specialists | 🟢 VERIFIED | #340 mandatory self-contained specialist handoffs; direct specialist continuation allowed when ownership/authority are clear. |
| GOVERNANCE-CHAT-LIFECYCLE | Control + all specialists | 🟢 VERIFIED | #353 lifecycle convention authoritative: practical chat-health rotation, no arbitrary turn threshold, fresh same-specialist chat independently re-reads authority. |
| CONTROL-CHECKPOINT-ROUTING | Control & Reconciliation | 🟢 VERIFIED | Owner/chat/reason/dependencies/status/copy-ready continuation remains mandatory; blocked work stays with monitoring/provider ownership. |
| SPECIALIST-RECONCILIATION | All four specialist workstreams | 🟢 VERIFIED | Verification → regression/merge → production/provider evidence → Tracker/Master reconciliation → final specialist checkpoint remains authoritative. |
| CONTROL-READONLY-BOUNDARY | Control & Reconciliation | 🟢 AUDIT RECORDED / DO NOT NORMALIZE | Earlier empty Render env-update calls caused same-commit redeploys but changed no env values. Control uses true read-only tools absent explicit override. |
| PR351-SUPERSESSION | Control & Reconciliation | 🟢 CLOSED / SUPERSEDED | PR #351 was stale after #352–#356 and remains closed. |
| JUVAN-JP-BOOKING-APPROVAL | Booking & Admin UX | 🟢 VERIFIED LIVE / HANDSET-PROVEN | #350 canonical client-ID policy routes Juvan client 845 to exact JP admin 4; #352 genuine #585 proves approval-before-final-confirmation and matching Calendar mirrors. Do not recreate #585. |
| META-RESCHEDULE-APPROVAL | WhatsApp / Meta Integration | 🟠 WAITING PROVIDER / NOT ACTIVE | #356 exact contracts configured for `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`; last authoritative state remains PENDING / UTILITY / en / exact=true / duplicateCount=0 / configured=true. No resubmit merely due PENDING. |
| PROD-RESCHEDULE-ACTIVATION | Production / DevOps | 🟠 BLOCKED BY META | Do not enable `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED` until both templates independently prove complete APPROVED readiness and provider evidence is reconciled. |
| BOOKING-RESCHEDULE-HANDSET | Booking & Admin UX | 🟠 BLOCKED BY ACTIVATION | Genuine client/practitioner handset proof only after verified Production activation. No manufactured Juvan reschedule or CRM/Calendar mutation. |
| RESCHEDULE-START-BOUNDARY | Booking & Admin UX | 🟢 VERIFIED LIVE | #354 blocks self-service when appointment is starting/started and expires stale pending holds at original start boundary. |
| RESCHEDULE-APPROVED-CONFIRM | Booking & Admin UX + WhatsApp | 🟢 MERGED / DARK PATH | #355 uses exact `shiloh_reschedule_confirmation_v1` with durable retry/claim/suppression; feature remains dark pending activation. |
| META-BOOKING-CONFIRM-V1 | WhatsApp / Meta Integration | 🟢 VERIFIED LIVE / HANDSET-PROVEN | v1 provider contract remains approved/configured; #348 suppression of four redundant automatic supplemental groups is handset-proven by #352. |
| META-BOOKING-CONFIRM-V2 | WhatsApp / Meta Integration | 🟠 WAITING PROVIDER / NOT ACTIVE | Last authority: PENDING / UTILITY / en / exact / duplicateCount=0 after one controlled submission; production remains v1. Do not resubmit/activate while PENDING. |
| META-BOOKING-UPDATE | WhatsApp / Meta + Production | 🟢 VERIFIED LIVE / ENABLED | `shiloh_booking_update_v1` approved/exact/duplicate-free and production-enabled. Kill switch `WHATSAPP_BOOKING_UPDATE_ENABLED=false`. |
| CUSTOMER-CHANGE-EVIDENCE | Booking & Admin UX + WhatsApp | 🟠 WAITING GENUINE FUTURE DELIVERY | #575 / audit 674 terminally suppressed `appointment_already_ended`, `sent_at=null`; wait for a natural future appointment change. |
| GOOGLE-CALENDAR-AUTH | Booking/Admin + Production | 🟢 VERIFIED HEALTHY | #302 fail-closed provider guard remains permanent. #570 and #585 are genuine sync evidence; do not mutate for proof. |
| ADMIN-BOOKING-ENTITLEMENT | Booking & Admin UX | 🟢 VERIFIED LIVE | #318 fail-closed scope: Christel+Abigail shared; Marietjie only; other linked Admin own practitioner; JP explicit Christel+Abigail exception; other unlinked Admin none. Block-time authority is separate and narrower. |
| ADMIN-BOOKING-FAST-PATH | Booking & Admin UX | 🟢 VERIFIED | Existing lookup/provisional-client/typed-time/same-Admin confirm rules remain accepted. |
| CLIENT-WELCOME-JUVAN | Booking & Admin UX | 🟢 REPAIRED / HANDSET-PROVEN | #337 genuine Juvan `Hi` proved universal welcome then registered branch; do not reset/replay. |
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
- Render deploy `dep-da3dbm1srm7s7396eop0` is LIVE on exact #360 SHA. Verification used only read-only Render evidence.
- No real block was manufactured for proof.

## CRM Dummy Test reassignment — complete / do not redo

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`.

- #338 established the destructive reset safeguards.
- A first genuine confirmation attempt exposed an interactive-language routing defect and did **not** execute the reset.
- #358 repaired that narrow transport boundary; CI #1139 passed 773/0 and Render converged LIVE.
- Fresh repaired preview showed exactly Dummy Test / CRM #835 / +27 71 674 2646 and only rendered after the pre-confirm shared-active-identity check passed.
- Genuine Confirm completed at 11:59 SAST. The success response is post-commit evidence: #835 archived, one WhatsApp/mobile record released, temporary state cleared, appointment/audit history preserved, audit event written.
- Genuine post-reset `Hi` from suffix `2646` at 12:01 SAST received the unregistered/new-client branch with no inherited Dummy Test identity.
- No appointment or booking was manufactured.
- The external Render Postgres connector still fails before SQL execution at the SSL/TLS boundary; do not infer direct row evidence from it.

## Practitioner-approved client reschedule gate

Application engineering remains present through #356, but activation is not authorized. Both required Meta templates must independently prove `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true` before Production activation. Current owner remains `Shiloh OS — WhatsApp / Meta Integration` for genuinely read-only provider monitoring.

## Other preserved state

Juvan booking #585 remains do-not-redo evidence. Booking confirmation v1 remains live; v2 remains provider-gated. Booking update activation is complete but natural delivery evidence remains open. Google Calendar remains synchronized/fail-closed. Attendance stays own-practitioner only and #558 stays HOLD. Christel catalogue correction remains authoritative. GBP, Ozow, privacy and Goldie-description gates remain unchanged.

## Exact continuation

**Authoritative current state:** PR #360 / `1090c284e3971e159ea740dbb3388d0e2f7431ec` is current production application code; CI #1148 regression step passed; Render `dep-da3dbm1srm7s7396eop0` is LIVE. Admin practitioner Block time is verified live at the application/deployment boundary.

**Highest-priority next item:** no further Block time implementation action remains. The standing executable priority remains blocked by external Meta review of the practitioner-approved reschedule approval/decline templates.

**Why next:** the Block time controlled unit is closed without manufactured business data. The remaining reschedule dependency is provider approval, not additional Booking/Admin implementation.

**Remaining gate:** both reschedule templates must prove the full APPROVED readiness gate before a separate production activation; all other standing fail-closed gates remain preserved.
