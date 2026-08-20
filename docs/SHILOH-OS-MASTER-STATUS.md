# Shiloh OS — Master Project Status

Updated: 2026-08-20
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history and dated reconciliation files; do not redo accepted or superseded work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider approval, attendance, approval decisions, CRM identity, Calendar state or handset behaviour.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CLIENT-COUPLES-AND-PACKAGES.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on current GitHub `main`; verify production/provider/CRM/Calendar/human evidence that could have changed; preserve newer authority; then continue only the owned controlled scope.

Earlier dated reconciliations remain durable where not superseded. Preserve in particular `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ABIGAIL-JAW-RELEASE-MAPPING.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-UX-STANDARDIZATION.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-BOOKING-ADMIN-JUVAN-PRIMARY-BACKUP-AND-MANAGE-CANCEL.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, the Christel service-catalogue correction, specialist-workstream and Control-routing reconciliations, booking-confirmation-v2 controlled submission, Juvan booking approval/v1 handset proof, client-welcome repair, booking-update activation/stale suppression, Meta booking-update approval and all explicit fail-closed gates.

Obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved controlled unit through normal engineering/deploy/verification/reconciliation boundaries. Stop for material scope/risk expansion, contradictory authority, or a genuine fail-closed human/provider/evidence/safety/capability gate.

## Current production baseline

Current accepted **application** code is **PR #378 / `aa7f692b35bc7acaafbea74d45f752c2b99a886d`**, **Add Couples & Packages to Massage Treatments**, built on the verified #376/#375 Abigail Jaw Release correction, #373/#371/#372 Admin UX presentation authority, and existing #367/#366 booking authority.

- GitHub CI run **#1188** for #378 completed successfully. Initial #1187 exposed only a new-test package-price formatting mismatch (`R1,400` vs established `R1400`) and was repaired without changing runtime package semantics.
- Render deploy **`dep-da3kik67bikc7384a7vg`** reached **LIVE** on exact #378 merge SHA in confirmed workspace **My Workspace**.
- Render checked out exact commit `aa7f692b35bc7acaafbea74d45f752c2b99a886d`; build/startup completed normally and `npm start` explicitly preloaded `src/bootstrap/clientCouplesPackagesPatch.js`.
- Repeated `/health` probes returned HTTP 200 and Google Calendar provider health passed on the #378 instance.
- Massage package migration 061 remained checksum-valid and the canonical `sports-massage-monthly` package remained active: 4 sessions, R1400, 30-day validity, 24-hour cancellation notice, package-session service #65.
- Migration 069 remained checksum-valid; service #31 `Upper Back, Neck & Jaw Release` remains active, Abigail remains `abigailMapped=false`, Christel remains the active/client-bookable mapping, and 13 linked appointments remain preserved.
- Startup reverified migrations 065/066/067/068 as checksum-valid and Juvan controlled identity as **BOUND** to the current canonical pointer, presently client **845**, display `Juvan Botha`, controlled phone suffix **1564**, Jean-Pierre admin **4**.
- Current Juvan approval contract remains `assigned_practitioner_primary_jean_pierre_backup_first_decision_wins`.
- Practitioner-approved client rescheduling remains dark/off with `featureEnabled=false`; #378 did not alter that provider gate.
- The previously completed Dummy Test booking cleanup remains complete and `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START=false` remains the normal inert state.
- No appointment, Calendar event, CRM service/client row, package entitlement, provider template, Juvan reset/re-registration, booking decision, cancellation or genuine WhatsApp journey was manufactured merely to prove #378 presentation behavior.

Relevant accepted runtime lineage remains:

- **#337** — universal client-welcome repair, genuine handset-proven.
- **#338 / merge `31d49d27a74c570fb439bee62c9647275bf97f6b`** — historical hardened multi-test-client reset safeguards used by the completed Dummy Test reassignment; reusable multi-target eligibility is superseded by #364.
- **#350** — persisted Juvan→Jean-Pierre booking-approval policy that supplied the verified pre-#364 canonical anchor.
- **#352** — genuine booking #585 proves the historical JP-sole Juvan approval behavior, one final v1 confirmation after approval and matching shared/Christel Calendar mirrors.
- **#353** — specialist-chat lifecycle operating convention.
- **#354** — client self-service reschedule start-boundary guard.
- **#355** — practitioner-approved reschedule success confirmation with durable retry/claim/suppression.
- **#356** — exact Meta approval-request/decline transport contracts; feature remains dark pending provider readiness.
- **#358** — historical CRM reset structured-interaction language-boundary repair used in the completed Dummy Test journey.
- **#359** — documentation/reconciliation of completed CRM Dummy Test reassignment and genuine fresh-identity handset proof.
- **#360** — guarded practitioner Block time / Blocked time workflow using canonical `calendar_blocks`.
- **#362** — exact archived/reset Dummy Test booking cleanup, default-off one-shot with CRM/Calendar proof and no client messaging.
- **#364** — reusable-demo identity authority: exact phone-anchored Juvan controlled identity, JP-only reset, transactional UNBOUND state and normal-onboarding rebind to the current canonical client/policy pointer.
- **#366 / `53b5e0c4027f9910291f75c05ec13d9c55528118`** — current Juvan booking approval semantics: assigned practitioner Primary, Jean-Pierre Backup, atomic first decision wins; JP-only Reset Juvan menu presentation; CI #1164 passed 796/796; migration 068 production-applied/checksum-verified.
- **#367 / `9219bdef30e5452bc225a86d4f644d76149b528d`** — first-class guarded Cancel booking action inside Manage booking, delegated to the canonical cancellation state machine; CI #1166 passed 800/800; cancellation authority remains current beneath later presentation changes.
- **#370 / `b6a72b1e1bc02cc484805285b3b7cb2d3961088c`** — bounded execution / anti-thrashing governance: preserve completed inspection, stop redundant read-only cycles, and move to an artifact/result or a specific proven blocker.
- **#371 / `75f58950c86b2afbcc0bdb25240c4b4eeac1a188`** — Admin UX standardization layer, Body Treatments presentation grouping, concise action/section copy and `Cancel new booking` for the new-booking escape path.
- **#372 / `3e945a1d7ede45b82bb16c92cc5c8c73b11381c0`** — completes `Cancel new booking` presentation at the final pending-new-booking confirmation without changing existing-appointment cancellation.
- **#373 / `afbd6cde6bd338422bca6a9223c7a2a023b660d9`** — keeps `Shiloh Admin 🌿` and personalized welcome while replacing redundant landing prompts with `What would you like to manage today?`; CI #1177 successful; presentation authority remains current beneath later catalogue/navigation changes.
- **#375 / `6337ba701f1bc3e534219ec20c5dd20d5dce837b`** — guarded migration 069 for the exact Abigail/service #31 practitioner-mapping correction; CI #1181 successful.
- **#376 / `5e187c6b531881d82ea1bfe1840b0b891d11518f`** — checksum-tracked startup application and explicit post-state verification of migration 069; CI #1183 successful.
- **#378 / `aa7f692b35bc7acaafbea74d45f752c2b99a886d`** — current application: client Massage Treatments presents Couples & Packages first; Couples Massage remains assisted-only; Sports Massage Package reuses canonical package/entitlement/session authority; CI #1188 successful; Render `dep-da3kik67bikc7384a7vg` LIVE.

PR #357 and #359 were documentation/shared-authority reconciliations and did not broaden unrelated application behaviour.

## Engineering governance — 🟢 AUTHORITATIVE

Engineering Governance on current `main` includes:

- **#340** mandatory copy-ready specialist-to-specialist handoffs, direct specialist continuation when ownership/authority are clear, and preservation of fail-closed gates.
- **#353** specialist chat lifecycle convention: no fixed turn threshold; rotate based on practical chat health and preferably at controlled-unit boundaries.
- **#370** bounded execution / anti-thrashing: preserve already completed inspection, stop redundant read-only loops, and move directly to the artifact/result or a specific proven blocker unless a concrete dependency requires further inspection.

Control & Reconciliation coordinates shared state, priorities, ownership, architecture/governance and reconciliation. It does not become a second implementation queue.

The controlled-work sequence remains:

`inspect authoritative state → implement → test/full applicable regression gate → repair until green → merge → verify Render/production/provider → reconcile Project Tracker → reconcile Master when durable state changed → final specialist checkpoint`

## Specialist workstream reconciliation — 🟢 ADOPTED

Reconciliation from specialist branches is part of the same controlled unit, not optional cleanup. Every owning specialist workstream must verify current authority, implement within scope, run the applicable compile/regression gate, repair until green, merge, verify production/provider truth, reconcile the Project Tracker, reconcile the Master when durable foundational state changed, and issue the final specialist checkpoint. A specialist branch must not stop merely because code was merged or deployed. Control & Reconciliation reads reconciled current `main`, not unreconciled specialist-chat narrative.

## Control checkpoint workstream routing — 🟢 ADOPTED

Control checkpoints must identify the owning workstream, exact specialist chat, why that workstream owns the next boundary, dependencies/observers, Proceed or Blocked status, and a self-contained copy-ready continuation. Routing context is never a substitute for independently re-reading authoritative state. Blocked work remains with the appropriate monitoring/provider workstream rather than being routed to implementation, and existing approved fail-closed gates remain binding.

## Admin practitioner Block time — 🟢 VERIFIED LIVE

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`.

PR #360 establishes a dedicated WhatsApp Admin availability-blocking capability using the existing canonical `calendar_blocks` primitive rather than manufacturing appointments.

The authority contract is explicit and separate from broad booking entitlement:

- Christel may block **Myself** or **Abigail**.
- Abigail may block **herself only**.
- Marietjie may block **herself only**.
- Jean-Pierre and other Admin identities have **no Block time authority**.
- Missing or ambiguous practitioner identity fails closed. Christel must not guess Abigail when canonical Abigail identity is ambiguous.

The workflow requires date, start time, duration, reason and final review before create. At mutation time it re-resolves authority and rejects overlap with an existing canonical appointment or `calendar_blocks` interval before write. Future Shiloh-created blocks can be viewed, edited and removed; imported/Goldie blocks are not opened to this edit/remove UI.

Existing authoritative availability already excludes overlapping `calendar_blocks`, so committed blocks automatically remove those intervals from both client and Admin slot discovery. Block time does not create or mutate client identity, treatment, appointment, attendance, payment or revenue truth and does not send a client WhatsApp message.

The initial #360 CI run exposed a stale parity regression that assumed Jean-Pierre must always match Christel's Appointments menu except finalization. That test was corrected to preserve the new explicit second exception: Jean-Pierre has neither finalization nor Block time authority. Final CI #1148 passed.

No real block was manufactured for proof; future natural business use may provide handset/CRM evidence without creating artificial operational data.

## Admin Manage booking cancellation — 🟢 VERIFIED LIVE

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-BOOKING-ADMIN-JUVAN-PRIMARY-BACKUP-AND-MANAGE-CANCEL.md`.

PR #367 adds **Cancel booking — Cancel this appointment safely** to the canonical Manage booking menu immediately before Back.

The action is appointment-scoped and restart-safe. It delegates to the established `adminAppointmentCancellation` owner and does not duplicate cancellation SQL, authorization, audit/history, or Google Calendar synchronization in the Manage booking bridge.

Selecting Cancel booking does **not** cancel immediately. The canonical flow still requires a reason and explicit `Confirm cancellation` before mutation. While a cancellation intent is pending, its reason/Confirm/Back continuation takes precedence over the still-open Manage booking session.

The new-booking presentation now calls its separate discard action **Cancel new booking** through #371/#372. That presentation distinction does not change the underlying pending-booking cancellation command/state machine and does not overload the existing-appointment action.

CI #1166 passed 800/800 and includes regression coverage for row presence/order, appointment scoping, canonical delegation, absence of duplicated cancellation SQL, pending-intent precedence, confirmation gating and command-collision protection. No genuine appointment was cancelled merely for implementation proof.

A proposed context-aware post-cancellation return to the same selected Manage Client screen is **not part of #367/#371-#373/#378** and is not current production behavior unless separately authorized and implemented.

## Admin UX presentation standardization — 🟢 VERIFIED LIVE

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-UX-STANDARDIZATION.md`.

PRs #371-#373 standardize only Shiloh-owned WhatsApp Admin presentation while preserving provider-native typography, role/permission boundaries, menu/action IDs and booking mutation semantics.

Current presentation authority:

- stable header: **Shiloh Admin 🌿**;
- personalized greeting: **Welcome back, <Admin> 👋**;
- landing prompt: **What would you like to manage today?**;
- `New booking` instead of `Make a booking`;
- `Manage booking` instead of `Manage a booking`;
- concise standardized section/action descriptions and back-navigation copy;
- `Cancel new booking` for abandoning a pending new-booking journey;
- existing-appointment `Cancel booking` remains the canonical #367 reason + explicit confirmation flow.

The Admin new-booking category previously presented as `Massage & Body` is now presented as **Body Treatments**. `Neo Pelvic Therapy`, `Vaginal Tightening & Rejuvenation`, and `Ozone & Far Infrared` are explicitly grouped into Body Treatments using the authoritative service rows already loaded for the Admin booking scope. Existing massage/body services remain in that presentation family. No CRM service rows, service IDs, prices, durations, practitioner mappings, entitlements or public-catalogue authority were changed by #371-#373, and no second catalogue source was created.

Final #373 presentation convergence was Render deploy `dep-da3jr7hsrm7s739dhvk0` on exact SHA `afbd6cde6bd338422bca6a9223c7a2a023b660d9`; that Admin presentation authority remains current beneath #378.

## Client Couples & Packages presentation — 🟢 VERIFIED LIVE

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CLIENT-COUPLES-AND-PACKAGES.md`.

PR #378 adds a bounded client navigation layer inside **Massage Treatments**. The first special option is now **Couples & Packages**, whose submenu order is **Couples Massage**, **Sports Massage Package**, then **Back**. Existing ordinary massage treatments remain on their established Massage Treatments pages.

**Couples Massage is not represented as an ordinary canonical service.** No accepted multi-client/simultaneous-resource booking contract was established by the inspected architecture. Selecting Couples Massage therefore creates no appointment and explicitly routes the client to contact Shiloh for coordinated practitioner/treatment-space availability. Do not invent a Couples Massage service ID, price, duration, practitioner mapping or self-service appointment type merely to make this path transactional.

Sports Massage Package continues to use the established canonical package owner:

- slug `sports-massage-monthly`;
- package-session service #65;
- 4 sessions;
- R1400 package price;
- 30-day validity;
- 24-hour cancellation notice;
- existing entitlement, enquiry/status and package-session booking flows.

The submenu derives package summary data from the active canonical package record. If the package is missing/inactive, the Sports package row is omitted rather than fabricated. #378 creates no second package/service ledger and does not alter ordinary massage service IDs, prices, durations or practitioner mappings.

Final CI #1188 passed after #1187 exposed only a new-test formatting expectation mismatch. Render `dep-da3kik67bikc7384a7vg` is LIVE on exact #378 SHA; startup loaded the new presentation patch, Google Calendar health passed, and repeated `/health` returned 200. No genuine Couples booking or handset journey was manufactured for proof.

## Abigail Jaw Release practitioner mapping — 🟢 VERIFIED LIVE

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ABIGAIL-JAW-RELEASE-MAPPING.md`.

The business-approved correction is practitioner-scoped: **Upper Back, Neck & Jaw Release must not be offered under Abigail's services**. The canonical treatment itself remains active.

PR #375 added exact guarded migration 069 targeting Goldie external ID `b5c96105-f534-406d-89ec-68e78c65cf8b` and exact canonical name `Upper Back, Neck & Jaw Release`. PR #376 added the checksum-tracked startup application/verification path after the established Christel catalogue bootstrap.

Production evidence from exact #376 deploy `dep-da3k4m2jobas73ctkp10` establishes:

- migration `069_remove_abigail_jaw_release_mapping.sql` applied and checksum-verified;
- service ID **31** remains active;
- Abigail staff ID **1** has `abigailMapped=false`;
- Christel staff ID **3** is the remaining active/client-bookable practitioner mapping;
- linked appointment count remains **13**;
- canonical service metadata, non-Abigail mappings and appointment-history count were verified unchanged across the correction transaction.

This correction is not service deletion, deactivation, treatment renaming, pricing/duration editing or history rewriting. Do not re-add Abigail to service #31 unless a later explicit business decision supersedes this authority.

The sanctioned Render Postgres read-only connector remains blocked by its known SSL/TLS transport defect. No direct pre-change SQL row state is inferred from that failed surface; the guarded production startup transaction and explicit post-state are the accepted authoritative evidence.

## Dummy Test operational booking cleanup — 🟢 VERIFIED LIVE / COMPLETE

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`.

The earlier CRM #835 number-reset deliberately preserved appointment history. The later user-authorized cleanup therefore used a separate exact-client one-shot rather than deleting rows or replaying the reset.

Before any mutation, #362 requires exact client ID **835**, accepted Dummy Test name, inactive status, completed `test_client_reset=true` marker and zero WhatsApp/mobile bindings. The one-shot is default-off behind `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START`.

Production execution established:

- newly cancelled: **appointment #582** (Abigail) and **appointment #583** (Marietjie);
- preserved as already cancelled: **#561, #565, #566, #574**;
- preserved finalized historical truth: **#564 remains `no_show`**;
- **3** appointment lifecycle rows were terminalized;
- pending booking approvals changed: **0**;
- pending/failed reschedule requests changed: **0**;
- pending/failed customer-change notifications suppressed: **0**;
- all shared/practitioner Calendar cleanup operations completed with `unresolvedCalendarIds=[]`.

Independent 2026-wide searches after execution returned **zero `Dummy Test` events** on the shared booking calendar, Abigail calendar, Marietjie calendar and primary/Christel calendar.

The one-shot flag is now **false** and final #362 deploy `dep-da3dk36k1f9s73em616g` completed the cleanup lineage. Do not re-enable the cleanup merely to reproduce evidence. No client cancellation message was created by this controlled unit.

## CRM Dummy Test number reassignment — 🟢 VERIFIED HISTORICAL / HANDSET-PROVEN / COMPLETE

Authoritative completion reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`.

The #338/#358 safeguards remain authoritative **historical evidence for the completed Dummy Test reset**, but #364 supersedes the old reusable multi-target reset eligibility. Chenique and Dummy Test / CRM Dummy Test are no longer active reusable reset identities.

The completed Dummy journey proved:

- pre-confirm actual CRM display name, CRM ID and phone presentation;
- shared-active-client conflict checking before Confirm and transaction-time recheck;
- phone-bound temporary state cleanup;
- WhatsApp/mobile-only release with zero-residual postcondition;
- archive/inactivate rather than delete;
- preservation of appointments and CRM/audit history;
- atomic reset audit;
- genuine post-reset fresh/new-client handset behavior.

A genuine first Confirm attempt at 11:45 SAST exposed an interactive-language routing defect and did **not** execute the reset. PR #358 repaired only that transport boundary and passed full CI 773/0.

After #358 was LIVE, a fresh authorized preview showed exactly:

- **Dummy Test**
- **CRM #835**
- **WhatsApp +27 71 674 2646 — primary**

At **11:59:23.746 SAST**, production received the genuine interactive confirmation. At **11:59:24.417 SAST**, Shiloh sent the reset-complete response after the transaction committed. The committed result archived CRM #835, released exactly one WhatsApp/mobile contact record, cleared the bounded temporary phone state, preserved appointment/audit history and wrote the reset audit event.

At **12:01:27.486 SAST**, the legitimately reassigned number sent a real `Hi` from masked suffix `2646`; at **12:01:28.537 SAST** Shiloh responded with the unregistered/new-client registration branch. The handset response carried no inherited Dummy Test name, CRM #835 identity, booking intent, onboarding continuation, policy state or prior conversation-session context.

No appointment or booking was manufactured. **Do not reset CRM #835 again or replay the reassigned number merely to reproduce proof.** #362 subsequently cleaned only the preserved operational bookings while retaining appointment/audit history and #564 no-show truth.

The Render read-only Postgres connector still fails before SQL execution at the known SSL/TLS boundary. Do not infer direct row evidence from that failed connector; the accepted completion evidence is the guarded transactional runtime semantics, post-commit success response, genuine post-reset first-contact behaviour and the later guarded #362 cleanup startup evidence.

## Controlled Juvan reusable demo identity — 🟢 VERIFIED LIVE FOUNDATION

Authoritative foundation reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`. Current Booking/Admin approval semantics are reconciled separately in the Booking/Admin reconciliation and remain preserved through #378.

PR #364 makes **Juvan Botha the only reusable controlled CRM demo identity**. The business-controlled physical WhatsApp/mobile number is the durable identity anchor; a display name is not an identity key.

The canonical structure is:

- one active `controlled_demo_identities.demo_key='juvan_botha'`;
- one exact normalized controlled phone identity;
- nullable `current_client_id` pointing at the **current** canonical Juvan CRM client while registered;
- persisted Juvan booking-approval policy whose nullable `client_id` must move with the same current pointer;
- exact Jean-Pierre business-admin authority as the reset operator.

Production migration bootstrap deliberately started from the already-persisted and previously verified Juvan approval-policy/client relationship, then required one exact phone and zero shared-active-client conflict. New-instance startup after #378 reverified:

- binding state **BOUND**;
- current canonical pointer presently **845**;
- display `Juvan Botha`;
- controlled phone suffix **1564**;
- backup/admin authority **Jean-Pierre admin 4**;
- migrations 065/066/067/068 checksum verified;
- approval contract **assigned practitioner Primary + Jean-Pierre Backup + first decision wins**.

The reset contract remains Juvan-only and JP-only. Preview resolves the durable current pointer and displays actual client name, CRM ID and controlled phone. UNBOUND state, pointer drift, extra phone identity and shared-active-client conflict fail closed. Confirmation re-resolves/locks the demo row, client, contacts and policy and repeats the identity checks.

A successful reset clears bounded phone-linked booking intent/onboarding/booking-policy/conversation/legacy-profile/universal-welcome delivery state, releases only WhatsApp/mobile contacts, requires zero residual bindings, archives the old client, preserves appointments/audit history, writes `admin.controlled_demo_reset`, and atomically sets both the controlled current-client pointer and Juvan policy `client_id` to `NULL`. The controlled identity is then intentionally **UNBOUND**.

Fresh registration is deliberately the normal real WhatsApp onboarding path. A database trigger recognizes only the exact controlled phone; while UNBOUND it permits binding only to an active `whatsapp_onboarding` client and only when no other CRM binding exists. Contact attachment, controlled current-client pointer, Juvan policy pointer and `controlled_demo_identity.rebound` audit commit/rollback atomically. Ambiguous or competing identity fails closed.

The read-only resolver exposes only the current phone-anchored Juvan canonical client and fails closed on client/contact/policy/shared-active drift. **Downstream code must not permanently hard-code historical client 845 or fall back to “any client named Juvan Botha”.**

No genuine Juvan reset/re-registration occurred merely for #378 proof. Production remains BOUND to the current pointer until a separately authorized real device lifecycle. The live foundation is proven; the future reset→registration transition is intentionally not claimed as handset-proven here.

The sanctioned Render read-only Postgres connector has previously failed before SQL execution at the known SSL/TLS boundary. No write-capable workaround is authorized merely for read evidence.

## Current highest-priority external gate — practitioner-approved client reschedule

The application-side engineering through #356 is present, but the feature remains **🟠 WAITING PROVIDER / NOT ACTIVE** behind `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false`.

Last authoritative controlled Meta evidence remains:

| Template | Status | Category | Language | Exact | duplicateCount | App configured |
|---|---|---|---|---|---:|---|
| `shiloh_reschedule_approval_request_v1` | **PENDING** | UTILITY | `en` | true | 0 | true |
| `shiloh_reschedule_declined_v1` | **PENDING** | UTILITY | `en` | true | 0 | true |

Required activation readiness for **each** is `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true`.

While either fails that gate:

- do not resubmit merely because it is PENDING;
- do not enable `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED`;
- do not route activation to Production / DevOps;
- do not manufacture a Juvan reschedule, practitioner decision, CRM/Calendar mutation or handset proof;
- WhatsApp / Meta Integration remains the monitoring owner for a genuinely read-only provider refresh when an authorized surface is available.

Only after both templates independently satisfy the complete provider gate may approval be reconciled and a separate controlled Production / DevOps activation begin.

## Juvan Botha booking approval — 🟢 VERIFIED LIVE PRIMARY / BACKUP

Genuine pre-#364 production identity evidence established one active canonical Juvan controlled identity, and #364 moved durable identity authority to the phone-anchored controlled resolver/current-client pointer. #366 replaced the old JP-sole runtime behavior without weakening that identity model.

Current behavior:

- assigned position-1 practitioner = **Primary approver**;
- Jean-Pierre = **Backup approver**;
- current controlled Juvan identity is resolved from the #364 controlled phone/current-client pointer;
- no permanent `client_id=845` rule and no display-name shortcut;
- Primary and Backup are authorized against current canonical identity/appointment truth at decision time;
- approval state is locked/revalidated transactionally and the first terminal decision wins;
- a second authorized decision cannot commit and receives already-decided state;
- staff-facing presentation identifies Primary, Backup and the appointment/client/service/time context;
- normal client-facing approval/decline outcome retains existing confirmation, CRM, Calendar, notification and audit safeguards.

JP-only **Reset Juvan** Admin presentation is live and delegates to the existing #364 CRM reset contract. Booking/Admin does not recreate the identity lifecycle.

Genuine booking **#585** remains historical evidence of the superseded JP-sole behavior and must not be recreated/cancelled/rebooked merely for evidence.

## Booking confirmation templates

### v1 — 🟢 LIVE / APPROVED / HANDSET-PROVEN

`shiloh_booking_confirmation_v1` remains production selector and approved fallback. #348 suppresses four redundant automatic post-template groups without altering the approved provider contract; #352 handset evidence proved the intended reduced delivery.

### v2 — 🟠 WAITING META / NOT ACTIVE

`shiloh_booking_confirmation_v2` was submitted exactly once under the controlled #343/#344 path. Last authoritative provider evidence remains **PENDING / UTILITY / en / exact / duplicateCount=0**. It is inactive/non-sendable and production stays on v1. Do not resubmit or activate while PENDING.

## Booking-update customer confirmations — 🟢 LIVE / ENABLED / 🟠 NATURAL DELIVERY EVIDENCE OPEN

`shiloh_booking_update_v1` remains provider APPROVED, exact, duplicate-free and production-enabled. Deterministic kill switch: `WHATSAPP_BOOKING_UPDATE_ENABLED=false`.

#332 terminally suppresses stale ended update rows. Appointment #575 / audit 674 remains terminally suppressed with `appointment_already_ended` and `sent_at=null`; never release, delete, mark sent or reuse it as delivery proof. Successful delivery evidence must arise naturally from a genuine still-future appointment change.

## Google Calendar — 🟢 VERIFIED HEALTHY / PERMANENT FAIL-CLOSED GUARD

#302's provider guard and proactive health probe remain permanent. Provider failure blocks booking writes cleanly. Genuine #570 and #585 are accepted Calendar synchronization evidence. Do not mutate them merely for proof.

#362 separately verified deterministic cleanup of archived Dummy Test mirrors; post-cleanup 2026 searches returned zero Dummy Test events on shared, Abigail, Marietjie and primary/Christel surfaces. #378 startup again passed the Google Calendar provider health probe.

#367 does not claim a genuine cancellation mirror proof because no appointment was cancelled merely for implementation evidence. #371-#373 and #378 are presentation/navigation-only; #375/#376 are practitioner-mapping-only. None manufactured a booking or Calendar event for proof. Canonical Admin cancellation continues to own Calendar cleanup when a real cancellation occurs.

Google Calendar remains a synchronized provider/mirror; canonical Shiloh CRM/appointment state remains authoritative.

## Booking/Admin durable rules — preserve

- #318 booking entitlement remains fail-closed: Christel+Abigail shared scope; Marietjie only; other linked Admins own practitioner; JP explicit unlinked business-admin exception for Christel+Abigail only; other unlinked Admins no booking catalogue.
- Block time authority is separate and narrower: Christel→Myself/Abigail; Abigail→self; Marietjie→self; JP/others→none.
- Dummy Test cleanup is an exact-client maintenance one-shot only; `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START=false` is the normal state. Do not generalize it into a broad name-based purge or re-enable it merely for proof.
- Current controlled-Juvan approval is assigned practitioner Primary + JP Backup + atomic first terminal decision wins. Historical #585 is prior-behavior evidence only.
- Manage booking cancellation must delegate to the canonical reason/confirmation cancellation state machine; do not duplicate cancellation SQL or bypass explicit confirmation.
- Admin presentation standardization from #371-#373 must remain presentation-only: `Shiloh Admin 🌿`, personalized welcome, `What would you like to manage today?`, `New booking`, `Manage booking`, `Cancel new booking`, and `Body Treatments` may not be used to alter underlying CRM/service/permission/booking authority.
- Existing-appointment cancellation remains `Cancel booking`; do not collapse it into the new-booking discard action.
- Client Massage Treatments must present `Couples & Packages` first, with `Couples Massage`, `Sports Massage Package`, then `Back`. Couples Massage remains assisted-only until separately authorized canonical two-client/coordinated-resource semantics exist. Sports Massage Package must resolve the canonical package owner rather than duplicate package data.
- Service #31 `Upper Back, Neck & Jaw Release` remains active, but Abigail is not an eligible practitioner; Christel is the verified current active/client-bookable mapping. Do not re-add Abigail without a later explicit business decision.
- The Admin who prepares an ordinary pending booking confirms it; do not reintroduce superseded Christel↔Abigail cross-confirm behaviour without a new requirement.
- Typed-time, clinic-hours, practitioner schedule, CRM conflicts, pending holds, shared/practitioner Google Calendar conflicts and final confirmation guards remain authoritative.
- Provisional new-client fast path remains name + South African mobile → duplicate check → provisional canonical client → review → explicit confirm; abandoned provisional clients are removed only when no appointment exists.
- Existing full-label/hybrid WhatsApp choice presentation remains accepted.

## CRM & identity durable state

CRM is authoritative for canonical client/practitioner/staff identity. Ambiguous identity, duplicate/conflicting contact ownership, unresolved practitioner/staff identity and destructive changes lacking authority fail closed.

**Juvan is the only reusable controlled demo identity.** The exact normalized business-controlled phone is the durable anchor; `controlled_demo_identities.current_client_id` is the current canonical client pointer. A successful authorized reset intentionally makes that pointer and the Juvan approval-policy client pointer NULL; normal exact-phone WhatsApp onboarding atomically binds both to the new canonical client. Chenique and Dummy Test / CRM Dummy Test are retired from reusable reset eligibility.

The completed CRM Dummy Test reassignment remains do-not-redo historical evidence. CRM #835 remains archived/reset and without its former WhatsApp/mobile identity. The #362 booking cleanup did not delete the client or appointment rows; #582/#583 are cancelled, #561/#565/#566/#574 were already cancelled and #564 remains no-show historical truth.

A future controlled Juvan reset requires exact Jean-Pierre business-admin authority, current pointer/contact/policy consistency, exact phone verification, explicit confirmation and all transaction-time fail-closed guards. Do not perform one merely for proof. After reset the genuine controlled phone must complete normal new-client registration before the demo identity becomes BOUND again.

The historical #558 attendance exception remains unresolved with historical practitioner `SHILOH MTC`. Never infer Christel, Marietjie or another practitioner; establish human/authoritative truth before correction/finalization.

## Attendance own-practitioner-only authority — 🟢 VERIFIED LIVE through #324

PR #324 remains authoritative:

- Christel finalizes Christel appointments only.
- Abigail finalizes Abigail appointments only.
- Marietjie finalizes Marietjie appointments only.
- Jean-Pierre has no attendance/finalization authority.

Exact active linked identity is required and conflicts fail closed. Historical attendance truth remains human-controlled.

## Client welcome and discovery — 🟢 HANDSET EVIDENCE PRESERVED / CURRENT PRESENTATION #378

Universal welcome routing remains repaired through #337. A real Juvan `Hi` proved welcome then registered-client branch; subsequent Browse treatments evidence proved accepted two-page category presentation and SQT virtual family. The completed CRM Dummy reset adds separate genuine evidence that a released number correctly enters the unregistered/new-client branch.

#378 adds current client navigation authority under Massage Treatments: Couples & Packages is first, Couples Massage is assisted-only, and Sports Massage Package reuses canonical package authority. This production presentation was regression/deploy verified but was not replayed on a genuine handset merely for proof.

For the controlled Juvan demo lifecycle, #364 deliberately includes phone-level universal-welcome delivery state in bounded reset cleanup so a future explicitly authorized reset can make the exact physical number genuinely new again. This does not invalidate the earlier Juvan welcome proof and is not permission to reset/replay merely for evidence.

## Christel reviewed service catalogue — 🟢 VERIFIED LIVE through #328 + #376 mapping correction

Authoritative reconciliations: `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md` and `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ABIGAIL-JAW-RELEASE-MAPPING.md`.

Preserve #328:

- service #27 Full Body Sports Massage inactive/unmapped, history preserved;
- distinct #34 Sports Massage Full Body active at 120 minutes;
- #65 Sports Massage — Package Session active at 50 minutes with existing package contract;
- reviewed canonical totals 60 / 90 / 90 for the approved three services;
- no practitioner-specific duration override.

Later #375/#376 does not supersede those service corrections. It changes only service #31 practitioner eligibility: `Upper Back, Neck & Jaw Release` remains active and Christel remains mapped, while Abigail is no longer mapped. Historical appointment links remain preserved.

#378 does not change this catalogue authority. It presents the existing Sports Massage package under Couples & Packages and does not alter #65 or ordinary massage service identities/durations/mappings.

Do not reactivate/remap #27, merge #27/#34, restore reviewed buffers, delete history, alter #34/#65 duration, re-add Abigail to #31 without explicit business authority, or bulk-publish Goldie wording.

## Public catalogue — 🟢 VERIFIED LIVE

`/book` remains the Shiloh-owned CRM-backed public service catalogue through accepted #301 state. #371's Admin Body Treatments presentation and #378's client Couples & Packages navigation do not create a second source of truth. Practitioner eligibility for service #31 follows canonical `staff_services` authority established by #376. Sports package data/entitlements remain owned by the canonical package service. Do not create a second static source of truth.

## Control audit boundary — preserve

An earlier Control read-only verification mistakenly invoked Render environment update three times with an empty merge set, causing same-commit API redeploys without changing env key/value state. Preserve this as a governance/audit breach. Control must use true read-only Render tools absent explicit override.

## Google Business Profile provider access — 🟠 EXTERNAL / PROVIDER GATE

Last authoritative provider evidence remains: Google Business Profile Business Information API is enabled, the API-access application was submitted, and API-specific quota surfaces are visible. The general **Requests per minute = 0** means usable GBP read/write API access remains **not confirmed/usable** and provider approval/access is **not positively established**.

This is **not an ordinary capacity/quota-increase task**; it remains the provider API-access approval/review pathway. Existing earlier GBP scaffolding is **not evidence of provider approval** and does not authorize integration.

Do not begin or resume GBP OAuth/API integration until authoritative Google evidence establishes usable access, including a **usable general request quota greater than 0**, or another explicit Google approval/access result that proves usable API calls. Production / DevOps owns provider/config verification; Control tracks the dependency.

## Other standing gates

- Google Contacts sync remains lower priority; CRM remains authoritative.
- Ozow remains waiting for merchant configuration and explicit business rules.
- Destructive privacy execution remains fail-closed pending authority/evidence.
- Follow-up/rating and birthday delivery evidence remain genuine-journey/eligibility gated.
- Goldie description exceptions remain a separate Control/business-approval gate.

## Shiloh Visual Calendar — ⏸️ DEFERRED

A future Shiloh Visual Calendar remains deliberately held. Do not implement/prototype/add it to active queue until a later explicit controlled decision. Existing Google Calendar integration remains unchanged.

## Superseded reconciliation branch

PR #351 remains superseded/closed because newer authority #352–#356 overtook it. Do not reopen or force-merge it.

## Exact continuation state

**Authoritative current application state:** PR #378 / `aa7f692b35bc7acaafbea74d45f752c2b99a886d`; CI #1188 completed successfully; Render deploy `dep-da3kik67bikc7384a7vg` **LIVE** on exact merge SHA. Google Calendar health passed and repeated `/health` checks returned 200.

**Client Massage Treatments:** **Couples & Packages** is the first special option. Inside: **Couples Massage**, **Sports Massage Package**, **Back**. Couples Massage is assisted-only and creates no ordinary appointment; do not make it self-service until separately authorized canonical two-client/coordinated-resource semantics exist. Sports Massage Package reuses canonical `sports-massage-monthly` authority: package-session service #65, 4 sessions, R1400, 30 days, 24-hour cancellation notice, established entitlement/enquiry/session flows.

**Abigail Jaw Release mapping:** service #31 `Upper Back, Neck & Jaw Release` remains active; Abigail staff #1 has `abigailMapped=false`; Christel staff #3 is the remaining active/client-bookable practitioner mapping; 13 linked appointments remain preserved. Do not re-add Abigail without a later explicit business decision.

**Admin UX:** #371-#373 remain verified live presentation authority beneath #378. Keep `Shiloh Admin 🌿`, personalized `Welcome back, <Admin> 👋`, `What would you like to manage today?`, `New booking`, `Manage booking`, `Cancel new booking`, and `Body Treatments`. The named Neo Pelvic Therapy, Vaginal Tightening & Rejuvenation, and Ozone & Far Infrared services are grouped into Body Treatments from existing authoritative service rows; do not mutate CRM/service authority to reproduce the presentation.

**Controlled Juvan identity/approval:** #364 phone-anchored current-client identity foundation remains authoritative; #366 is the current approval behavior — assigned practitioner Primary, Jean-Pierre Backup, exactly one atomic first terminal decision wins. Current production pointer presently resolves client 845 / suffix 1564 / JP admin 4, but 845 is not a permanent identity key. JP-only Reset Juvan presentation is live and delegates to CRM's controlled reset contract. No genuine reset/re-registration occurred.

**Manage booking cancellation:** #367 remains verified live beneath the standardized copy. Existing appointment `Cancel booking` is appointment-scoped, restart-safe, reason-required and confirm-gated through the canonical cancellation service. No real appointment was cancelled merely for proof.

**Separate unimplemented UX idea:** context-aware return to the same Manage Client screen after a successful cancellation is not part of current authority and requires separate explicit implementation approval.

**Highest-priority remaining external gate:** WhatsApp / Meta Integration owns genuinely read-only monitoring of `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`. Until both independently satisfy the complete `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true` gate, do not enable practitioner-approved rescheduling or manufacture a reschedule journey.

**Remaining evidence boundary:** a real Juvan reset→new registration→new canonical rebind is intentionally unproven and must occur only under later explicit authorization on the genuine business-controlled device. All other standing fail-closed gates remain preserved.