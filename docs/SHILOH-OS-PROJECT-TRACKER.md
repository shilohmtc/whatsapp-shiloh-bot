# Shiloh OS — Project Tracker

Updated: 2026-08-21
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

New specialist chat: independently read current GitHub `main`, Master, this Tracker, latest reconciliation `docs/SHILOH-OS-RECONCILIATION-2026-08-21-BOOKING-CONFIRMATION-V2-ACTIVATION.md`, and Engineering Governance; verify changing production/provider/CRM/Calendar/human evidence; preserve newer authority; then continue only owned scope.

Durable reconciliation anchors remain valid where not superseded, including `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CLIENT-COUPLES-AND-PACKAGES.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ABIGAIL-JAW-RELEASE-MAPPING.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-UX-STANDARDIZATION.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-BOOKING-ADMIN-JUVAN-PRIMARY-BACKUP-AND-MANAGE-CANCEL.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`, specialist-workstream reconciliation and Control-routing reconciliation.

Engineering Governance includes **#340** mandatory copy-ready specialist handoffs, **#353** specialist-chat lifecycle convention, and **#370** bounded execution / anti-thrashing. Direct specialist continuation is allowed when ownership is clear and authority is not contradictory; all fail-closed gates remain binding.

Control & Reconciliation uses reconciled authoritative evidence, not specialist-chat narrative, for continuity. **Keep ownership with the appropriate monitoring/provider workstream**; do not route blocked work to implementation merely to keep work moving.

## Production baseline

**Current application:** PR **#384 / `aed805842818983eb5d4e3ca50054627eea7fe0c`**, *Initialize booking confirmation evidence schema*, built on PR #383's guarded v2 activation and preserving PR #382 reschedule activation plus the #380 Couples Massage lineage.

**CI:** PR #383 run **#1204** passed **832/832**; PR #384 run **#1206** completed successfully.

**Render application baseline:** final deploy **`dep-da43g9mk1f9s73ajl33g`** reached **LIVE** on exact #384 merge SHA in confirmed workspace **My Workspace**. It retains `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE=shiloh_booking_confirmation_v2`, restores both one-shot audit/provision flags to `false`, verifies migration 071 evidence columns, returns `/health` `status=ok / database=ok`, and has no error/fatal logs. PR #382's reschedule configuration remains enabled.

Migration **070_couples_massage_self_service.sql** applied and checksum-verified. Production now has canonical service **#66 Couples Massage**, category Massage, **90 minutes**, price **R1080**, with exact active/client-bookable practitioner mappings **Abigail staff #1 + Christel staff #3**. Companion contact authority is appointment-scoped `booking_backup` with `marketingConsent=false`.

Current Juvan production resolver remains BOUND to the current canonical pointer, presently client **845**, phone suffix **1564**, Jean-Pierre admin **4**. Current approval contract is assigned practitioner **Primary** + Jean-Pierre **Backup** + exactly one atomic first decision wins. Historical client 845 is not a permanent identity key.

Practitioner-approved client rescheduling is **provider-verified and production-enabled**. Verification deploy `dep-da4331jm8hqs73dl3h60` proved both exact contracts `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true` with `submitted=false`; activation deploy `dep-da433gbncjis73aucgv0` reached LIVE with `featureEnabled=true` and the one-shot verifier restored to false. Migration 069 remains checksum-valid with service #31 active, Abigail `abigailMapped=false`, Christel the remaining active/client-bookable Jaw Release mapping and 13 linked appointments preserved. No genuine Couples Massage appointment, companion identity, booking decision, Calendar event or handset journey was manufactured for #380 proof.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| DEPLOY-CONVERGENCE | GitHub ↔ Render | 🟢 VERIFIED | Current application authority #384 / `aed805842818...`; #383 CI #1204 passed 832/832; #384 CI #1206 passed; final Render `dep-da43g9mk1f9s73ajl33g` LIVE on exact merge SHA; migration 071 verified; v2 selected; `/health` status/database ok; no error/fatal logs. |
| CONTROLLED-JUVAN-DEMO | CRM & Identity | 🟢 VERIFIED LIVE / FOUNDATION | #364 anchors `juvan_botha` to exact business-controlled phone with nullable current-client pointer and JP-only reset. Current pointer presently client 845 / suffix 1564, but downstream code must resolve the current controlled identity rather than name-match or hard-code 845. |
| BOOKING-JUVAN-PRIMARY-BACKUP | Booking & Admin UX | 🟢 VERIFIED LIVE | #366 / `53b5e0c...`; CI #1164 passed 796/796; migration 068 applied/checksum-verified. Assigned practitioner = Primary, JP = Backup, current controlled Juvan identity revalidated at decision time, first atomic terminal decision wins, already-decided state blocks a second authoritative decision. JP-only Reset Juvan presentation delegates to #364 CRM reset. |
| JUVAN-JP-BOOKING-APPROVAL-HIST | Booking & Admin UX | 🟢 HISTORICAL / SUPERSEDED | Genuine #585 remains do-not-redo evidence of the prior JP-sole behavior. #366 supersedes that runtime behavior; preserve #585 as historical evidence only. |
| ADMIN-MANAGE-BOOKING-CANCEL | Booking & Admin UX | 🟢 VERIFIED LIVE | #367 canonical reason + explicit-confirmation cancellation remains; #380 hardens it for multi-staff appointments by locking every assigned practitioner and clearing all practitioner Calendar mirrors. No real cancellation was manufactured for proof. |
| ADMIN-UX-STANDARDIZATION | Booking & Admin UX | 🟢 VERIFIED LIVE | #371-#373 standardize Admin copy without changing WhatsApp-native typography or authority. `Shiloh Admin 🌿` + personalized welcome remain; landing prompt is `What would you like to manage today?`; `New booking`, `Manage booking`, and `Cancel new booking` are standardized; existing-appointment `Cancel booking` remains canonical. Admin category `Massage & Body` is presented as `Body Treatments`, with Neo Pelvic Therapy, Vaginal Tightening & Rejuvenation, and Ozone & Far Infrared grouped there from authoritative service rows. |
| CLIENT-COUPLES-PACKAGES | Booking & Admin UX | 🟢 VERIFIED LIVE | #378 keeps `Couples & Packages` first inside `Massage Treatments`; #380 supersedes the assisted-only Couples placeholder with self-service **90 min / R1,080 / Abigail + Christel**, exact shared availability, lead client + companion backup contact, and atomic two-practitioner booking. Sports package remains canonical `sports-massage-monthly`. |
| COUPLES-MASSAGE-SELF-SERVICE | Booking & Admin UX | 🟢 VERIFIED LIVE | #380 / migration 070: service #66, exact Abigail #1 + Christel #3, joint 90-minute availability, Booking Policy acceptance, dual advisory locks, shared + practitioner Calendar rechecks/mirrors, companion `booking_backup` / no marketing. Multi-staff reschedule remains assisted/fail-closed. |
| ADMIN-CANCEL-RETURN-CONTEXT | Booking & Admin UX | ⚪ PROPOSED / NOT IMPLEMENTED | Proposed UX: when cancellation originates from a selected client's Manage Client journey, return to that same client's management screen after success; standalone Manage booking should offer bounded next actions. Requires separate explicit implementation authorization. |
| DUMMY-TEST-BOOKING-CLEANUP | Booking & Admin UX | 🟢 VERIFIED LIVE / COMPLETE | Exact archived/reset CRM #835 cleanup. #582/#583 newly cancelled; #561/#565/#566/#574 already cancelled; #564 no-show preserved. Three lifecycle rows terminalized; 2026 shared/Abigail/Marietjie/primary Calendar searches return zero Dummy Test events. One-shot flag false. |
| ADMIN-BLOCK-TIME | Booking & Admin UX | 🟢 VERIFIED LIVE | #360 uses canonical `calendar_blocks`; Christel→Myself/Abigail, Abigail→self, Marietjie→self, JP/others→none; overlap/authority fail closed; no fake appointment/client message. |
| MARIETJIE-WAXING-AUDIT | CRM & Identity | 🟢 VERIFIED READ-ONLY | Production audit found no exact/normalized canonical match for Brow Wax, Brow Tint, Upper Lip Wax, Lower Lip Wax, Lower Lip & Chin Wax or Full Face Wax. Recommended disposition is six new canonical services with the requested names/prices/durations and zero processing/extra time. No catalogue row changed. |
| MARIETJIE-WAXING-CREATE | Control & Reconciliation → CRM & Identity | 🟠 WAITING BUSINESS SCOPE | Business intent to add the six services is recorded, but controlled implementation approval remains open because Full Face Wax included areas and brow-shaping inclusion are unresolved. Hold the complete six-service creation unit; do not implement, rename, retire, replace or remap by inference. |
| PROVIDER-CREDENTIAL-ROTATION | Production / DevOps | 🔴 DEFECT / HOLD | A provider credential was exposed in historic Render logs. Rotate/revoke it through the approved secret path and verify Authorization-value redaction without printing either credential. Preserve completed PR #385 Meta contracts; Control reconciliation itself performs no Render or catalogue mutation. |
| CRM-DUMMY-RESET | CRM & Identity + Production / DevOps | 🟢 HISTORICAL COMPLETE / RETIRED AS REUSABLE | #338/#358 genuine Dummy Test reset archived CRM #835 and released its former phone; #362 cleaned remaining operational bookings. Dummy Test and Chenique are retired from reusable reset eligibility. |
| GOVERNANCE-HANDOFF | Control + all specialists | 🟢 VERIFIED | #340 mandatory self-contained specialist handoffs; direct continuation allowed when authority and ownership are clear. |
| GOVERNANCE-CHAT-LIFECYCLE | Control + all specialists | 🟢 VERIFIED | #353 practical chat-health rotation; no arbitrary turn threshold. |
| GOVERNANCE-BOUNDED-EXECUTION | Control + all specialists | 🟢 VERIFIED | #370 requires bounded execution and anti-thrashing: preserve completed inspection, stop redundant read-only loops, and move to artifact/result or a specific proven blocker. |
| CONTROL-CHECKPOINT-ROUTING | Control & Reconciliation | 🟢 VERIFIED | Owner/chat/reason/dependencies/status/copy-ready continuation remains mandatory; blocked work stays with monitoring/provider ownership. |
| SPECIALIST-RECONCILIATION | All specialist workstreams | 🟢 VERIFIED | Verification → regression/merge → production/provider evidence → Tracker/Master reconciliation → final checkpoint remains authoritative. |
| CONTROL-READONLY-BOUNDARY | Control & Reconciliation | 🟢 AUDIT RECORDED / DO NOT NORMALIZE | Earlier empty Render env-update calls caused same-commit redeploys but no env-value changes. Use true read-only Render tools absent explicit override. |
| PR351-SUPERSESSION | Control & Reconciliation | 🟢 CLOSED / SUPERSEDED | PR #351 remains stale/superseded after #352–#356. Do not reopen. |
| META-RESCHEDULE-APPROVAL | WhatsApp / Meta Integration | 🟢 VERIFIED APPROVED | Both exact templates are APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true. Verification deploy `dep-da4331jm8hqs73dl3h60` returned `submitted=false / already_exists_exact` for both; no provider mutation occurred. |
| PROD-RESCHEDULE-ACTIVATION | Production / DevOps | 🟢 VERIFIED LIVE / ENABLED | Activation deploy `dep-da433gbncjis73aucgv0` restored the one-shot verifier to false, set `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=true`, reached LIVE, logged `featureEnabled=true`, and passed `/health` with database `ok`. Kill switch remains `false`. |
| BOOKING-RESCHEDULE-HANDSET | Booking & Admin UX | 🟠 WAITING GENUINE JOURNEY | Production activation is complete. Observe client/practitioner handset delivery only through natural business use; do not manufacture a Juvan reschedule, decision or CRM/Calendar mutation. |
| RESCHEDULE-START-BOUNDARY | Booking & Admin UX | 🟢 VERIFIED LIVE | #354 blocks self-service at/after appointment start and expires stale holds at original start boundary. |
| RESCHEDULE-APPROVED-CONFIRM | Booking & Admin UX + WhatsApp | 🟢 VERIFIED ACTIVE PATH | #355 uses exact `shiloh_reschedule_confirmation_v1` with durable retry/claim/suppression; the path is now production-enabled, with genuine delivery evidence awaiting natural use. |
| META-BOOKING-CONFIRM-V1 | WhatsApp / Meta Integration | 🟢 VERIFIED APPROVED / ROLLBACK | V1 remains exact, APPROVED and duplicate-free; #348/#352 delivery polish and genuine handset proof remain do-not-redo historical evidence. It is inactive only because the single production selector now names v2; reselecting v1 is the rollback. |
| META-BOOKING-CONFIRM-V2 | WhatsApp / Meta Integration + Production / DevOps | 🟢 VERIFIED LIVE / ENABLED | Fresh provider gate APPROVED / UTILITY / en / exact / duplicateCount=0. #383 exact five-parameter + three-button routing and fail-closed selector; #384 migration 071 evidence persistence; full 18-identity audit clean; final deploy `dep-da43g9mk1f9s73ajl33g` LIVE with v2 ready=true. Genuine handset delivery remains natural-use evidence only. |
| META-BOOKING-UPDATE | WhatsApp / Meta + Production | 🟢 VERIFIED LIVE / ENABLED | `shiloh_booking_update_v1` approved/exact/duplicate-free and production-enabled. Kill switch `WHATSAPP_BOOKING_UPDATE_ENABLED=false`. |
| CUSTOMER-CHANGE-EVIDENCE | Booking & Admin UX + WhatsApp | 🟠 WAITING GENUINE FUTURE DELIVERY | #575 / audit 674 terminally suppressed `appointment_already_ended`, `sent_at=null`; wait for a natural still-future appointment change. |
| GOOGLE-CALENDAR-AUTH | Booking/Admin + Production | 🟢 VERIFIED HEALTHY | #302 fail-closed provider guard remains permanent. #570/#585 are genuine sync evidence; #362 verified Dummy Test mirror cleanup; #380 startup health passed. Couples booking commit rechecks shared + both practitioner calendars and cancellation clears all assigned mirrors. No Calendar event was manufactured for proof. |
| ADMIN-BOOKING-ENTITLEMENT | Booking & Admin UX | 🟢 VERIFIED LIVE | #318 scope: Christel+Abigail shared; Marietjie only; linked Admin own practitioner; JP explicit Christel+Abigail exception; other unlinked Admin none. Block-time authority remains separate/narrower. |
| ADMIN-BOOKING-FAST-PATH | Booking & Admin UX | 🟢 VERIFIED | Existing lookup/provisional-client/typed-time/same-Admin confirm rules remain accepted. |
| CLIENT-WELCOME-JUVAN | Booking & Admin UX | 🟢 HANDSET EVIDENCE PRESERVED | #337 genuine Juvan `Hi` proved registered-client welcome; #364 clears phone-level welcome state only during a future authorized reset. Do not reset merely for proof. |
| CLIENT-DISCOVERY-JUVAN | Booking & Admin UX | 🟢 HANDSET-PROVEN | Genuine two-page category discovery and SQT family evidence preserved; #378/#380 later client presentation/runtime changes are regression/deploy verified without manufacturing handset evidence. |
| ATT-AUTH | Booking/Admin + CRM | 🟢 VERIFIED LIVE | #324 own-practitioner authority: Christel→Christel, Abigail→Abigail, Marietjie→Marietjie, JP→none. **CI #1041 passed 662/0.** |
| A1-HIST-REVIEW | Booking/Admin + CRM | 🔵 HUMAN TRUTH | Historical attendance remains explicit human truth; re-query before quoting current counts. |
| A1-558 | CRM & Identity | 🔴 HOLD | Appointment #558 historical practitioner `SHILOH MTC`; never infer practitioner. |
| CHRISTEL-CATALOGUE-CORRECTION | CRM & Identity | 🟢 VERIFIED LIVE | #328: #27 inactive/unmapped/history preserved; #34 120 min; #65 50 min/package retained; reviewed totals 60/90/90; no practitioner overrides. |
| ABIGAIL-JAW-RELEASE-MAPPING | Booking & Admin UX | 🟢 VERIFIED LIVE | #375/#376: service #31 `Upper Back, Neck & Jaw Release` remains active; migration 069 applied/checksum-verified; Abigail staff #1 has `abigailMapped=false`; Christel staff #3 is the remaining active/client-bookable mapping; 13 linked appointments preserved. |
| PUBLIC-CATALOGUE | Booking & Admin UX | 🟢 VERIFIED LIVE | `/book` remains accepted CRM-backed #301 public catalogue. #380 adds Couples Massage as one canonical Shiloh-owned CRM service row rather than a second static catalogue; WhatsApp exposes it through Couples & Packages rather than an ordinary single-practitioner row. |
| GOLDIE-DESCRIPTIONS | Control / business approval | 🟠 WAITING APPROVAL | Phone/treatment-identity/medical-claim/misplaced-text exceptions remain gated; do not bulk publish. |
| VISUAL-CALENDAR | Booking & Admin UX | ⏸️ DEFERRED | Explicitly held; existing Google Calendar integration unchanged. |
| GBP-PROVIDER | Production / DevOps + Control & Reconciliation | 🟠 WAITING PROVIDER | General Requests/min remains 0; usable GBP read/write API access remains **not confirmed/usable**. **Do not treat as quota-increase work or start OAuth/API integration.** Production / DevOps owns provider/config verification and Control & Reconciliation tracks the dependency. Reopen only when authoritative Google evidence shows a **usable general request quota greater than 0** or equivalent explicit usable-access approval. |
| GCONTACTS | CRM & Identity | ⚪ READY / LOW PRIORITY | CRM remains authoritative. |
| OZOW | Production / business | 🟠 WAITING | Merchant configuration + explicit business rules required. |
| PRIVACY-DESTRUCTIVE | Control + CRM | 🟠 WAITING | Fail closed pending authority/evidence. |

## Couples Massage self-service — verified live

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-COUPLES-MASSAGE-SELF-SERVICE.md`.

- #380 supersedes only the earlier assisted-only Couples Massage placeholder. **Couples & Packages** remains the first special option inside **Massage Treatments**; submenu order remains **Couples Massage → Sports Massage Package → Back**.
- Production migration 070 established canonical Shiloh-owned service **#66 Couples Massage**: Massage category, active, 90 minutes, R1080, exact active/client-bookable mappings Abigail #1 + Christel #3.
- Client presentation is `90 min • R1,080 • Abigail & Christel`.
- Date/time discovery computes the exact future intersection of Abigail + Christel availability for the full 90 minutes using existing clinic-hours, schedules/exceptions, CRM appointment conflicts, `calendar_blocks`, shared Google Calendar and each practitioner Calendar.
- One registered lead client supplies companion name + South African mobile. The companion number is stored appointment-scoped as `booking_backup`, with `marketing_consent=false`; it is not inserted into `client_contacts` and does not itself create a CRM client identity.
- Review + existing Shiloh Booking Policy acceptance are required before mutation.
- Final commit locks both practitioners in stable order, rechecks both, then creates one parent appointment + one service snapshot + Abigail position 1 + Christel position 2. Shared/practitioner Calendar side effects are compensated if the guarded transaction fails.
- Existing booking approval authority remains in place after creation; position-1 practitioner remains the ordinary Primary and standing Juvan Primary/JP Backup/first-decision-wins rules remain unchanged.
- Admin and client cancellation paths now handle multi-staff bookings by locking all assigned practitioners and clearing all practitioner Calendar mirrors. Existing client self-service reschedule remains fail-closed for `staff_count != 1`, so Couples Massage reschedule is assisted until separately designed.
- #380 does **not** claim automatic WhatsApp fallback messaging to the companion. It establishes booking-specific backup-contact storage; any automatic fallback-send trigger requires separate authority.
- Final CI #1196 passed. Render `dep-da3l8gtbedkc73dn51e0` reached LIVE on exact #380 merge SHA `2e387e5f1000774d97046a516c1c7d19e93cd947`; migration 070 applied/checksum-verified, Google Calendar health passed and repeated `/health` returned 200.
- No genuine Couples Massage appointment, companion, Calendar event or handset journey was manufactured for proof.

## Client Couples & Packages — verified live lineage

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CLIENT-COUPLES-AND-PACKAGES.md`.

- #378 made **Couples & Packages** the first special option inside client **Massage Treatments** and preserved Sports Massage Package under canonical package authority.
- #380 supersedes the earlier assisted-only Couples Massage behavior with the self-service contract documented above; do not restore the assisted-only placeholder unless later authority requires it.
- Sports Massage Package still reuses canonical package slug `sports-massage-monthly`, existing entitlement/enquiry/status/session booking flows and package-session service #65.
- Current canonical package rule remains 4 sessions / R1400 / 30 days / 24-hour cancellation notice / active.

## Abigail Jaw Release practitioner mapping — verified live

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ABIGAIL-JAW-RELEASE-MAPPING.md`.

- #375 introduced exact guarded migration 069 for Goldie service `b5c96105-f534-406d-89ec-68e78c65cf8b` / service #31 `Upper Back, Neck & Jaw Release`; CI #1181 succeeded.
- #376 added the established checksum-tracked startup application/verification path; CI #1183 succeeded and merge SHA is `5e187c6b531881d82ea1bfe1840b0b891d11518f`.
- Production applied migration 069 with checksum verification and proved `abigailMapped=false` for Abigail staff #1.
- The service remains active and Christel staff #3 is the remaining active/client-bookable practitioner mapping.
- Linked appointment count is 13 and was preserved; the correction does not delete/rewrite appointment history or alter service metadata.
- #380 startup reverified this authority unchanged.

## Admin UX standardization — verified live

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-UX-STANDARDIZATION.md`.

- #371 established the Admin copy-standardization layer and Body Treatments presentation grouping without altering CRM service authority or booking mutation semantics.
- #372 completed `Cancel new booking` presentation for the final pending-new-booking confirmation while preserving existing-appointment `Cancel booking`.
- #373 keeps `Shiloh Admin 🌿` and the personalized greeting, replacing the redundant landing prompts with `What would you like to manage today?`.
- Final #373 CI #1177 completed successfully; that presentation authority remains current beneath #380.

## Booking/Admin Juvan Primary/Backup + Manage booking cancellation — verified live

Durable evidence: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-BOOKING-ADMIN-JUVAN-PRIMARY-BACKUP-AND-MANAGE-CANCEL.md`.

- #366 merged as `53b5e0c4027f9910291f75c05ec13d9c55528118`; CI #1164 passed 796/796; migration 068 production-applied/checksum-verified.
- Current Juvan approval is assigned practitioner Primary + JP Backup, revalidated from current controlled identity/appointment truth, with exactly one atomic first terminal decision.
- `Reset Juvan` is JP-only in Admin presentation and delegates to the existing #364 CRM reset contract.
- Genuine #585 remains historical evidence of prior JP-sole behavior and was not recreated.
- #367 established reason-required/confirm-gated existing-appointment cancellation; #380 only broadens its internal staff-lock/Calendar cleanup safety for multi-staff appointments.
- No genuine appointment cancellation was manufactured for proof.

## Controlled Juvan reusable demo identity — verified live foundation

Durable identity evidence remains `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`.

- #364 anchors `juvan_botha` to the exact normalized business-controlled phone, not a display-name query.
- `current_client_id` is the current canonical client pointer and may change after an authorized reset/re-registration; current production presently resolves client 845.
- Reset is exact Jean-Pierre business-admin only, atomically archives/releases/unbinds and preserves appointments/audit history.
- While UNBOUND, only normal exact-phone WhatsApp onboarding may atomically bind the newly created canonical client and approval-policy pointer.
- The read-only resolver fails closed on client/contact/policy/shared-active drift and is the required downstream identity source.
- No genuine Juvan reset/new registration/rebind was executed merely for #380 proof.

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

## Practitioner-approved client reschedule — verified live

PR #382 remains completed/do-not-redo authority: both exact templates are APPROVED / UTILITY / en / exact / duplicate-free and production is enabled with `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=true`. The first genuine handset journey remains natural-use evidence only.

## Marietjie detailed waxing audit — verified read-only / implementation held

The completed production audit established that no exact or normalized canonical service exists for:

- **Brow Wax — R80 — 15 minutes**
- **Brow Tint — R80 — 15 minutes**
- **Upper Lip Wax — R80 — 15 minutes**
- **Lower Lip Wax — R80 — 15 minutes**
- **Lower Lip & Chin Wax — R120 — 20 minutes**
- **Full Face Wax — R500 — 60 minutes**

The recommended resolution is **create new** for each service, using exactly those client-facing names with processing time `0` and extra time `0`. Business intent to add the six services under Marietjie is recorded, but controlled implementation approval is **not closed**: Full Face Wax still requires explicit human truth for its included areas and whether brow shaping is included. The complete six-service creation unit therefore remains fail-closed on hold. No CRM implementation instruction is issued yet.

Preserve service #49 **Waxing** as inactive, unmapped and non-bookable at 60 minutes / R80–R500 with three historical and zero future appointments. Preserve service #62 **Eyebrow wax shape & Tint** as inactive, unmapped and non-bookable at 40 minutes / R150 with four historical and zero future appointments. Preserve both historical services and every linked appointment. Do not retire, rename, replace or remap broad Waxing by inference. Existing permanent-makeup brow/lip services and Lip Plump services are unrelated, and Abigail's service authority remains unchanged.

## Provider credential exposure — Production / DevOps remediation assigned

Historic Render logs exposed a provider credential. Production / DevOps owns the approved security remediation: rotate/revoke the exposed value, update only the appropriate current Render secret through the controlled path, verify provider/runtime health, and verify that Authorization values are redacted in current and future logs without printing either the old or replacement credential. This dependency must not change or reopen the completed PR #385 Meta template contracts. No credential, Render environment or production mutation occurred during this Control reconciliation.

## Other preserved state

Booking confirmation v2 is live behind the exact centralized contract gate; v1 remains the explicit rollback. Genuine v2 handset delivery is not yet evidenced and may arise only from a natural booking. Booking update activation is complete but natural delivery evidence remains open. Google Calendar remains synchronized/fail-closed. Attendance stays own-practitioner only and #558 stays HOLD. Christel catalogue correction remains authoritative. Abigail is no longer eligible for service #31 Jaw Release; Christel remains the verified current mapping. Couples & Packages remains the client navigation owner; Couples Massage is now self-service under the exact #380 dual-practitioner contract. GBP, Ozow, privacy and Goldie-description gates remain unchanged.

## Exact continuation

**Authoritative current state:** PR #384 / `aed805842818983eb5d4e3ca50054627eea7fe0c` is current production application code. PR #383 CI #1204 passed 832/832 and PR #384 CI #1206 passed. Final deploy `dep-da43g9mk1f9s73ajl33g` reached LIVE on exact merge SHA with migration 071 verified, booking-confirmation v2 selected, one-shot flags false, `/health` status/database ok and no error/fatal logs. PR #382 reschedule activation and PR #380 Couples Massage remain preserved lineage.

**Booking/Admin completed state:** #366 Primary/Backup approval and JP-only Reset Juvan presentation remain verified live; #367 Manage booking guarded cancellation remains verified live with #380 multi-staff safety; #371-#373 Admin UX presentation standardization remains verified live; #375/#376 remove service #31 `Upper Back, Neck & Jaw Release` from Abigail only; #378 established Couples & Packages navigation; #380 establishes atomic Couples Massage self-service. Current controlled Juvan identity remains phone-anchored/current-pointer based; do not name-match or permanently hard-code client 845.

**Client Massage Treatments:** keep **Couples & Packages** as the first special option, with **Couples Massage**, **Sports Massage Package**, then **Back**. Couples Massage is **90 minutes / R1,080 / Abigail + Christel**, offers only shared full-duration availability, requires lead client + companion name/mobile + Booking Policy acceptance, and commits both practitioner allocations atomically. Companion mobile is booking-only backup / no marketing; automatic fallback messaging is not claimed. Sports Massage Package continues to resolve canonical `sports-massage-monthly` authority.

**Multi-staff change safety:** client Couples Massage cancellation locks all assigned practitioners and removes all practitioner Calendar mirrors; Admin canonical cancellation does the same. Client self-service reschedule remains fail-closed for multi-staff appointments and requires clinic assistance.

**Admin presentation:** keep `Shiloh Admin 🌿`, personalized `Welcome back, <Admin> 👋`, and `What would you like to manage today?`; keep `Body Treatments`, `New booking`, `Manage booking`, and `Cancel new booking` semantics from #371-#373. Existing appointment cancellation remains `Cancel booking` through the canonical #367 flow.

**Proposed but not implemented:** context-aware post-cancellation return to the same Manage Client screen requires separate explicit authorization.

**Marietjie waxing audit:** the six-service production audit is complete/read-only and must not be repeated. No matching canonical rows exist; six new rows are recommended with exact requested names/prices/durations and zero buffers. Implementation remains held for explicit Full Face Wax included-area and brow-shaping truth. Preserve inactive historical services #49/#62, their seven linked historical appointments, unrelated services and Abigail's authority.

**Provider credential security:** Production / DevOps owns urgent rotation/revocation of the credential exposed in historic Render logs plus Authorization-value redaction verification. Preserve PR #385 template contracts and do not print credential values.

**Practitioner-approved rescheduling:** the Meta provider and Production activation gates are closed. Both exact templates are approved, exact, duplicate-free and configured; `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=true` is live and the one-shot verifier is false. Booking & Admin UX may observe the first genuine client/practitioner journey when natural business use occurs; do not manufacture a Juvan reschedule, decision or CRM/Calendar mutation for evidence.

**Remaining genuine-device gate:** a real Juvan reset→new registration→canonical rebind remains intentionally unproven and must occur only under later explicit authorization. All other standing fail-closed gates remain preserved.