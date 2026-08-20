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

New specialist chat: independently read current GitHub `main`, Master, this Tracker, latest reconciliation `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-UX-STANDARDIZATION.md`, and Engineering Governance; verify changing production/provider/CRM/Calendar/human evidence; preserve newer authority; then continue only owned scope.

Durable reconciliation anchors remain valid where not superseded, including `docs/SHILOH-OS-RECONCILIATION-2026-08-20-BOOKING-ADMIN-JUVAN-PRIMARY-BACKUP-AND-MANAGE-CANCEL.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`, specialist-workstream reconciliation and Control-routing reconciliation.

Engineering Governance includes **#340** mandatory copy-ready specialist handoffs, **#353** specialist-chat lifecycle convention, and **#370** bounded execution / anti-thrashing. Direct specialist continuation is allowed when ownership is clear and authority is not contradictory; all fail-closed gates remain binding.

Control & Reconciliation uses reconciled authoritative evidence, not specialist-chat narrative, for continuity. **Keep ownership with the appropriate monitoring/provider workstream**; do not route blocked work to implementation merely to keep work moving.

## Production baseline

**Current application:** PR **#373 / `afbd6cde6bd338422bca6a9223c7a2a023b660d9`**, *Polish Shiloh Admin welcome prompt*, built on #371/#372 Admin UX standardization and the previously verified #367/#366 booking authority.

**CI:** PR #373 run **#1177** completed successfully. Earlier #371 and #372 CI gates also completed successfully before merge.

**Render:** deploy **`dep-da3jr7hsrm7s739dhvk0`** is **LIVE** on exact #373 merge SHA in confirmed workspace **My Workspace**. Startup completed normally, repeated `/health` returned 200, Google Calendar health passed, and migrations 065/066/067/068 were checksum-valid.

Current Juvan production resolver remains BOUND to the current canonical pointer, presently client **845**, phone suffix **1564**, Jean-Pierre admin **4**. Current approval contract is assigned practitioner **Primary** + Jean-Pierre **Backup** + exactly one atomic first decision wins. Historical client 845 is not a permanent identity key.

Practitioner-approved client rescheduling remains **feature-off**. No CRM row, Calendar event, appointment, provider template or genuine WhatsApp journey was manufactured for the #371-#373 presentation-only unit.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render | 🟢 VERIFIED | #373 / `afbd6cde6bd3...`; CI #1177 success; Render `dep-da3jr7hsrm7s739dhvk0` LIVE on exact merge SHA; repeated `/health` 200 and Google Calendar health passed. |
| CONTROLLED-JUVAN-DEMO | CRM & Identity | 🟢 VERIFIED LIVE / FOUNDATION | #364 anchors `juvan_botha` to exact business-controlled phone with nullable current-client pointer and JP-only reset. Current pointer presently client 845 / suffix 1564, but downstream code must resolve the current controlled identity rather than name-match or hard-code 845. |
| BOOKING-JUVAN-PRIMARY-BACKUP | Booking & Admin UX | 🟢 VERIFIED LIVE | #366 / `53b5e0c...`; CI #1164 passed 796/796; migration 068 applied/checksum-verified. Assigned practitioner = Primary, JP = Backup, current controlled Juvan identity revalidated at decision time, first atomic terminal decision wins, already-decided state blocks a second authoritative decision. JP-only Reset Juvan presentation delegates to #364 CRM reset. |
| JUVAN-JP-BOOKING-APPROVAL-HIST | Booking & Admin UX | 🟢 HISTORICAL / SUPERSEDED | Genuine #585 remains do-not-redo evidence of the prior JP-sole behavior. #366 supersedes that runtime behavior; preserve #585 as historical evidence only. |
| ADMIN-MANAGE-BOOKING-CANCEL | Booking & Admin UX | 🟢 VERIFIED LIVE | #367 adds appointment-scoped `Cancel booking — Cancel this appointment safely` before Back. It delegates to canonical Admin cancellation; reason and explicit confirmation remain required; no duplicated cancellation SQL. No real cancellation was manufactured for proof. |
| ADMIN-UX-STANDARDIZATION | Booking & Admin UX | 🟢 VERIFIED LIVE | #371-#373 standardize Admin copy without changing WhatsApp-native typography or authority. `Shiloh Admin 🌿` + personalized welcome remain; landing prompt is `What would you like to manage today?`; `New booking`, `Manage booking`, and `Cancel new booking` are standardized; existing-appointment `Cancel booking` remains canonical. Admin category `Massage & Body` is presented as `Body Treatments`, with Neo Pelvic Therapy, Vaginal Tightening & Rejuvenation, and Ozone & Far Infrared grouped there from authoritative service rows. |
| ADMIN-CANCEL-RETURN-CONTEXT | Booking & Admin UX | ⚪ PROPOSED / NOT IMPLEMENTED | Proposed UX: when cancellation originates from a selected client's Manage Client journey, return to that same client's management screen after success; standalone Manage booking should offer bounded next actions. Requires separate explicit implementation authorization. |
| DUMMY-TEST-BOOKING-CLEANUP | Booking & Admin UX | 🟢 VERIFIED LIVE / COMPLETE | Exact archived/reset CRM #835 cleanup. #582/#583 newly cancelled; #561/#565/#566/#574 already cancelled; #564 no-show preserved. Three lifecycle rows terminalized; 2026 shared/Abigail/Marietjie/primary Calendar searches return zero Dummy Test events. One-shot flag false. |
| ADMIN-BLOCK-TIME | Booking & Admin UX | 🟢 VERIFIED LIVE | #360 uses canonical `calendar_blocks`; Christel→Myself/Abigail, Abigail→self, Marietjie→self, JP/others→none; overlap/authority fail closed; no fake appointment/client message. |
| CRM-DUMMY-RESET | CRM & Identity + Production / DevOps | 🟢 HISTORICAL COMPLETE / RETIRED AS REUSABLE | #338/#358 genuine Dummy Test reset archived CRM #835 and released its former phone; #362 cleaned remaining operational bookings. Dummy Test and Chenique are retired from reusable reset eligibility. |
| GOVERNANCE-HANDOFF | Control + all specialists | 🟢 VERIFIED | #340 mandatory self-contained specialist handoffs; direct continuation allowed when authority and ownership are clear. |
| GOVERNANCE-CHAT-LIFECYCLE | Control + all specialists | 🟢 VERIFIED | #353 practical chat-health rotation; no arbitrary turn threshold. |
| GOVERNANCE-BOUNDED-EXECUTION | Control + all specialists | 🟢 VERIFIED | #370 requires bounded execution and anti-thrashing: preserve completed inspection, stop redundant read-only loops, and move to artifact/result or a specific proven blocker. |
| CONTROL-CHECKPOINT-ROUTING | Control & Reconciliation | 🟢 VERIFIED | Owner/chat/reason/dependencies/status/copy-ready continuation remains mandatory; blocked work stays with monitoring/provider ownership. |
| SPECIALIST-RECONCILIATION | All specialist workstreams | 🟢 VERIFIED | Verification → regression/merge → production/provider evidence → Tracker/Master reconciliation → final checkpoint remains authoritative. |
| CONTROL-READONLY-BOUNDARY | Control & Reconciliation | 🟢 AUDIT RECORDED / DO NOT NORMALIZE | Earlier empty Render env-update calls caused same-commit redeploys but no env-value changes. Use true read-only Render tools absent explicit override. |
| PR351-SUPERSESSION | Control & Reconciliation | 🟢 CLOSED / SUPERSEDED | PR #351 remains stale/superseded after #352–#356. Do not reopen. |
| META-RESCHEDULE-APPROVAL | WhatsApp / Meta Integration | 🟠 WAITING PROVIDER / NOT ACTIVE | #356 exact contracts configured for `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`; last controlled state remains PENDING / UTILITY / en / exact=true / duplicateCount=0 / configured=true. No resubmit merely due PENDING. |
| PROD-RESCHEDULE-ACTIVATION | Production / DevOps | 🟠 BLOCKED BY META | Do not enable `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED` until both templates independently prove complete APPROVED readiness and provider evidence is reconciled. |
| BOOKING-RESCHEDULE-HANDSET | Booking & Admin UX | 🟠 BLOCKED BY ACTIVATION | Genuine client/practitioner handset proof only after verified Production activation. No manufactured Juvan reschedule or CRM/Calendar mutation. |
| RESCHEDULE-START-BOUNDARY | Booking & Admin UX | 🟢 VERIFIED LIVE | #354 blocks self-service at/after appointment start and expires stale holds at original start boundary. |
| RESCHEDULE-APPROVED-CONFIRM | Booking & Admin UX + WhatsApp | 🟢 MERGED / DARK PATH | #355 uses exact `shiloh_reschedule_confirmation_v1` with durable retry/claim/suppression; remains dark pending activation. |
| META-BOOKING-CONFIRM-V1 | WhatsApp / Meta Integration | 🟢 VERIFIED LIVE / HANDSET-PROVEN | v1 remains approved/configured; #348 reduced automatic supplements and #352 genuine handset evidence proved the intended delivery. |
| META-BOOKING-CONFIRM-V2 | WhatsApp / Meta Integration | 🟠 WAITING PROVIDER / NOT ACTIVE | Last authority remains PENDING / UTILITY / en / exact / duplicateCount=0 after one controlled submission; production stays v1. |
| META-BOOKING-UPDATE | WhatsApp / Meta + Production | 🟢 VERIFIED LIVE / ENABLED | `shiloh_booking_update_v1` approved/exact/duplicate-free and production-enabled. Kill switch `WHATSAPP_BOOKING_UPDATE_ENABLED=false`. |
| CUSTOMER-CHANGE-EVIDENCE | Booking & Admin UX + WhatsApp | 🟠 WAITING GENUINE FUTURE DELIVERY | #575 / audit 674 terminally suppressed `appointment_already_ended`, `sent_at=null`; wait for a natural still-future appointment change. |
| GOOGLE-CALENDAR-AUTH | Booking/Admin + Production | 🟢 VERIFIED HEALTHY | #302 fail-closed provider guard remains permanent. #570/#585 are genuine sync evidence; #362 verified Dummy Test mirror cleanup; #373 startup health passed. No fake cancellation or booking was manufactured for #371-#373 proof. |
| ADMIN-BOOKING-ENTITLEMENT | Booking & Admin UX | 🟢 VERIFIED LIVE | #318 scope: Christel+Abigail shared; Marietjie only; linked Admin own practitioner; JP explicit Christel+Abigail exception; other unlinked Admin none. Block-time authority remains separate/narrower. |
| ADMIN-BOOKING-FAST-PATH | Booking & Admin UX | 🟢 VERIFIED | Existing lookup/provisional-client/typed-time/same-Admin confirm rules remain accepted. |
| CLIENT-WELCOME-JUVAN | Booking & Admin UX | 🟢 HANDSET EVIDENCE PRESERVED | #337 genuine Juvan `Hi` proved registered-client welcome; #364 clears phone-level welcome state only during a future authorized reset. Do not reset merely for proof. |
| CLIENT-DISCOVERY-JUVAN | Booking & Admin UX | 🟢 HANDSET-PROVEN | Genuine two-page category discovery and SQT family evidence preserved. |
| ATT-AUTH | Booking/Admin + CRM | 🟢 VERIFIED LIVE | #324 own-practitioner authority: Christel→Christel, Abigail→Abigail, Marietjie→Marietjie, JP→none. **CI #1041 passed 662/0.** |
| A1-HIST-REVIEW | Booking/Admin + CRM | 🔵 HUMAN TRUTH | Historical attendance remains explicit human truth; re-query before quoting current counts. |
| A1-558 | CRM & Identity | 🔴 HOLD | Appointment #558 historical practitioner `SHILOH MTC`; never infer practitioner. |
| CHRISTEL-CATALOGUE-CORRECTION | CRM & Identity | 🟢 VERIFIED LIVE | #328: #27 inactive/unmapped/history preserved; #34 120 min; #65 50 min/package retained; reviewed totals 60/90/90; no practitioner overrides. |
| PUBLIC-CATALOGUE | Booking & Admin UX | 🟢 VERIFIED LIVE | `/book` remains accepted CRM-backed #301 public catalogue. |
| GOLDIE-DESCRIPTIONS | Control / business approval | 🟠 WAITING APPROVAL | Phone/treatment-identity/medical-claim/misplaced-text exceptions remain gated; do not bulk publish. |
| VISUAL-CALENDAR | Booking & Admin UX | ⏸️ DEFERRED | Explicitly held; existing Google Calendar integration unchanged. |
| GBP-PROVIDER | Production / DevOps + Control & Reconciliation | 🟠 WAITING PROVIDER | General Requests/min remains 0; usable GBP read/write API access remains **not confirmed/usable**. **Do not treat as quota-increase work or start OAuth/API integration.** Production / DevOps owns provider/config verification and Control & Reconciliation tracks the dependency. Reopen only when authoritative Google evidence shows a **usable general request quota greater than 0** or equivalent explicit usable-access approval. |
| GCONTACTS | CRM & Identity | ⚪ READY / LOW PRIORITY | CRM remains authoritative. |
| OZOW | Production / business | 🟠 WAITING | Merchant configuration + explicit business rules required. |
| PRIVACY-DESTRUCTIVE | Control + CRM | 🟠 WAITING | Fail closed pending authority/evidence. |

## Admin UX standardization — verified live

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-UX-STANDARDIZATION.md`.

- #371 established the Admin copy-standardization layer and Body Treatments presentation grouping without altering CRM service authority or booking mutation semantics.
- #372 completed `Cancel new booking` presentation for the final pending-new-booking confirmation while preserving existing-appointment `Cancel booking`.
- #373 keeps `Shiloh Admin 🌿` and the personalized greeting, replacing the redundant landing prompts with `What would you like to manage today?`.
- Final #373 CI #1177 completed successfully; Render `dep-da3jr7hsrm7s739dhvk0` is LIVE on exact merge SHA `afbd6cde6bd338422bca6a9223c7a2a023b660d9`.
- Startup passed Google Calendar health, reverified Juvan BOUND Primary/Backup authority and checksum-valid migrations, preserved reschedule feature-off state, and repeated `/health` returned 200.
- No CRM, Calendar, provider-template or genuine handset mutation was manufactured for this presentation unit.

## Booking/Admin Juvan Primary/Backup + Manage booking cancellation — verified live

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-BOOKING-ADMIN-JUVAN-PRIMARY-BACKUP-AND-MANAGE-CANCEL.md`.

- #366 merged as `53b5e0c4027f9910291f75c05ec13d9c55528118`; CI #1164 passed 796/796; migration 068 production-applied/checksum-verified.
- Current Juvan approval is assigned practitioner Primary + JP Backup, revalidated from current controlled identity/appointment truth, with exactly one atomic first terminal decision.
- `Reset Juvan` is JP-only in Admin presentation and delegates to the existing #364 CRM reset contract.
- Genuine #585 remains historical evidence of prior JP-sole behavior and was not recreated.
- #367 merged as `9219bdef30e5452bc225a86d4f644d76149b528d`; CI #1166 passed 800/800; its guarded Manage booking cancellation authority remains current beneath the later presentation-only Admin UX changes.
- Manage booking exposes an appointment-scoped, restart-safe Cancel booking action before Back.
- The action delegates to canonical Admin cancellation; selecting it is non-destructive, reason is required, and explicit confirmation remains mandatory before mutation.
- Existing status/history/audit/Google Calendar cancellation safeguards remain owned by the canonical cancellation service.
- No genuine appointment cancellation was manufactured for #367 proof.

## Controlled Juvan reusable demo identity — verified live foundation

Durable identity evidence remains `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`.

- #364 anchors `juvan_botha` to the exact normalized business-controlled phone, not a display-name query.
- `current_client_id` is the current canonical client pointer and may change after an authorized reset/re-registration; current production presently resolves client 845.
- Reset is exact Jean-Pierre business-admin only, atomically archives/releases/unbinds and preserves appointments/audit history.
- While UNBOUND, only normal exact-phone WhatsApp onboarding may atomically bind the newly created canonical client and approval-policy pointer.
- The read-only resolver fails closed on client/contact/policy/shared-active drift and is the required downstream identity source.
- No genuine Juvan reset/new registration/rebind was executed merely for #371-#373 proof.

## Dummy Test booking cleanup — complete / do not replay

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`.

- #362 added an exact-client guarded one-shot behind `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START`.
- One authorized activation cancelled #582 and #583; existing cancellation history and #564 no-show were preserved.
- Three lifecycle rows were terminalized; no pending approval/reschedule/change-notification state required mutation.
- All shared/practitioner Calendar cleanup calls resolved, and full-2026 searches now return zero Dummy Test events on shared, Abigail, Marietjie and primary/Christel surfaces.
- The one-shot flag is false and must not be replayed merely for proof.

## Admin practitioner Block time — verified live

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`.

- #360 uses existing `calendar_blocks`.
- Authority: Christel→Myself/Abigail; Abigail→self; Marietjie→self; JP/others→none.
- Missing/ambiguous identity and appointment/block overlap fail closed.
- Future Shiloh-created blocks are manageable; imported Goldie blocks remain outside edit/remove UI.
- Client/Admin availability already excludes blocks; no fake client appointment/message is created.

## CRM Dummy Test reassignment — complete historical evidence / reusable target retired

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`.

- Genuine Dummy Test reset archived CRM #835 and released its WhatsApp/mobile identity while preserving appointment/audit history.
- Genuine post-reset `Hi` received the unregistered/new-client branch with no inherited Dummy Test identity.
- #362 subsequently cleaned the preserved operational bookings.
- #364 retires Dummy Test, CRM Dummy Test and Chenique from active reusable reset eligibility.

## Practitioner-approved client reschedule gate

Application engineering remains present through #356, but activation is not authorized. Both required Meta templates must independently prove `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true` before Production activation. Current owner remains `Shiloh OS — WhatsApp / Meta Integration` for genuinely read-only provider monitoring.

## Other preserved state

Booking confirmation v1 remains live; v2 remains provider-gated. Booking update activation is complete but natural delivery evidence remains open. Google Calendar remains synchronized/fail-closed. Attendance stays own-practitioner only and #558 stays HOLD. Christel catalogue correction remains authoritative. GBP, Ozow, privacy and Goldie-description gates remain unchanged.

## Exact continuation

**Authoritative current state:** PR #373 / `afbd6cde6bd338422bca6a9223c7a2a023b660d9` is current production application code; CI #1177 completed successfully; Render deploy `dep-da3jr7hsrm7s739dhvk0` is LIVE on exact merge SHA. Google Calendar health passed and repeated `/health` returned 200.

**Booking/Admin completed state:** #366 Primary/Backup approval and JP-only Reset Juvan presentation remain verified live; #367 Manage booking guarded cancellation remains verified live; #371-#373 Admin UX presentation standardization is verified live. Current controlled Juvan identity remains phone-anchored/current-pointer based; do not name-match or permanently hard-code client 845.

**Admin presentation:** keep `Shiloh Admin 🌿`, personalized `Welcome back, <Admin> 👋`, and `What would you like to manage today?`; keep `Body Treatments`, `New booking`, `Manage booking`, and `Cancel new booking` semantics from #371-#373. Existing appointment cancellation remains `Cancel booking` through the canonical #367 flow.

**Proposed but not implemented:** context-aware post-cancellation return to the same Manage Client screen requires separate explicit authorization.

**Highest-priority remaining external gate:** `Shiloh OS — WhatsApp / Meta Integration` owns genuinely read-only provider monitoring for `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`. Do not enable practitioner-approved rescheduling or manufacture a journey until the complete provider gate is met and reconciled.

**Remaining genuine-device gate:** a real Juvan reset→new registration→canonical rebind remains intentionally unproven and must occur only under later explicit authorization. All other standing fail-closed gates remain preserved.
