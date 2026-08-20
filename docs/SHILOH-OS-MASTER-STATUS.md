# Shiloh OS — Master Project Status

Updated: 2026-08-20
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history and dated reconciliation files; do not redo accepted or superseded work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider approval, attendance, approval decisions, CRM identity, Calendar state or handset behaviour.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-20-JUVAN-PRIMARY-BACKUP-APPROVAL.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on current GitHub `main`; verify production/provider/CRM/Calendar/human evidence that could have changed; preserve newer authority; then continue only the owned controlled scope.

Earlier dated reconciliations remain durable where not superseded. Preserve in particular `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-ADMIN-BLOCK-TIME.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, the Christel service-catalogue correction, specialist-workstream and Control-routing reconciliations, booking-confirmation-v2 controlled submission, genuine Juvan #585 historical evidence, client-welcome repair, booking-update activation/stale suppression, Meta booking-update approval and all explicit fail-closed gates.

Obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved controlled unit through normal engineering/deploy/verification/reconciliation boundaries. Stop for material scope/risk expansion, contradictory authority, or a genuine fail-closed human/provider/evidence/safety/capability gate.

## Current production baseline

Current accepted **application** code is **PR #366 / `53b5e0c4027f9910291f75c05ec13d9c55528118`**, **Add Juvan Primary Backup booking approval**.

- GitHub CI run **#1164** passed the full non-mutating regression suite **796 / 796**, with zero failures and zero skipped tests.
- Render deploy **`dep-da3eiegae00c7380pa8g`** reached **LIVE** on exact #366 merge SHA in confirmed workspace **My Workspace**.
- Startup applied/checksum-verified migration `068_juvan_primary_backup_booking_approval.sql` and reverified controlled-demo migrations 065/066/067.
- Production startup verified `juvan_botha` **BOUND** to the current canonical pointer, presently client **845**, display `Juvan Botha`, controlled phone suffix **1564**, exact Jean-Pierre admin **4**, and approver WhatsApp configured.
- Production runtime reports approval contract `assigned_practitioner_primary_jean_pierre_backup_first_decision_wins`.
- Google Calendar provider health passed.
- Practitioner-approved client rescheduling remains dark/off: startup verification still reports `featureEnabled=false`; `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED` was not changed.
- The completed Dummy Test booking cleanup remains complete and `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START=false` remains the normal inert state.
- No genuine Juvan reset, contact release, new registration, rebind, new booking, approval/decline, Calendar proof or handset journey was manufactured by this controlled unit.

Relevant accepted runtime lineage remains:

- **#337** — universal client-welcome repair, genuine handset-proven.
- **#338 / merge `31d49d27a74c570fb439bee62c9647275bf97f6b`** — historical hardened multi-test-client reset safeguards used by the completed Dummy Test reassignment; reusable multi-target eligibility is superseded by #364.
- **#350** — persisted Juvan→Jean-Pierre booking-approval policy that supplied the verified pre-#364 canonical anchor.
- **#352** — genuine booking #585 proves the former JP-sole Juvan approval behavior, one final v1 confirmation after approval and matching shared/Christel Calendar mirrors. Preserve as historical evidence.
- **#353** — specialist-chat lifecycle operating convention.
- **#354** — client self-service reschedule start-boundary guard.
- **#355** — practitioner-approved reschedule success confirmation with durable retry/claim/suppression.
- **#356** — exact Meta approval-request/decline transport contracts; feature remains dark pending provider readiness.
- **#358** — historical CRM reset structured-interaction language-boundary repair used in the completed Dummy Test journey.
- **#359** — documentation/reconciliation of completed CRM Dummy Test reassignment and genuine fresh-identity handset proof.
- **#360** — guarded practitioner Block time / Blocked time workflow using canonical `calendar_blocks`.
- **#362** — exact archived/reset Dummy Test booking cleanup, default-off one-shot with CRM/Calendar proof and no client messaging.
- **#364** — reusable-demo identity authority: one exact phone-anchored Juvan controlled identity, JP-only reset, transactional UNBOUND state and normal-onboarding rebind to the current canonical client/policy pointer.
- **#366** — current Juvan Booking/Admin authority: JP-only Reset Juvan menu presentation, assigned practitioner Primary, JP Backup and exactly-one atomic first-decision-wins using the #364 current controlled identity resolver.

PR #357 and #359 were documentation/shared-authority reconciliations and did not broaden unrelated application behaviour.

## Engineering governance — 🟢 AUTHORITATIVE

Engineering Governance on current `main` includes:

- **#340** mandatory copy-ready specialist-to-specialist handoffs, direct specialist continuation when ownership/authority are clear, and preservation of fail-closed gates.
- **#353** specialist chat lifecycle convention: no fixed turn threshold; rotate based on practical chat health and preferably at controlled-unit boundaries.

Control & Reconciliation coordinates shared state, priorities, ownership, architecture/governance and reconciliation. It does not become a second implementation queue.

The controlled-work sequence remains:

`inspect authoritative state → implement → test/full applicable regression gate → repair until green → merge → verify Render/production/provider → reconcile Project Tracker → reconcile Master when durable state changed → final specialist checkpoint`

## Specialist workstream reconciliation — 🟢 ADOPTED

Reconciliation from specialist branches is part of the same controlled unit, not optional cleanup. Every owning specialist workstream must verify current authority, implement within scope, run the applicable compile/regression gate, repair until green, merge, verify production/provider truth, reconcile the Project Tracker, reconcile the Master when durable foundational state changed, and issue the final specialist checkpoint. A specialist branch must not stop merely because code was merged or deployed. Control & Reconciliation reads reconciled current `main`, not unreconciled specialist-chat narrative.

## Control checkpoint workstream routing — 🟢 ADOPTED

Control checkpoints must identify the owning workstream, exact specialist chat, why that workstream owns the next boundary, dependencies/observers, Proceed or Blocked status, and a self-contained copy-ready continuation. Routing context is never a substitute for independently re-reading authoritative state. Blocked work remains with the appropriate monitoring/provider workstream rather than being routed to implementation, and existing approved fail-closed gates remain binding.

## Juvan Primary / Backup booking approval — 🟢 VERIFIED LIVE APPLICATION/RUNTIME

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-JUVAN-PRIMARY-BACKUP-APPROVAL.md`.

PR #366 consumes the #364 durable controlled Juvan identity lifecycle rather than creating another identity model.

### Identity boundary

A booking receives controlled-Juvan semantics only when its `client_id` equals the **currently BOUND** `controlled_demo_identities.current_client_id` returned by the guarded phone-anchored resolver.

The current production pointer happens to be client **845**, but that value is not a permanent Juvan key. #366 contains no `client_id=845` authority rule and no “any client named Juvan Botha” fallback. UNBOUND state or contact/policy/shared-active drift fails closed.

### Reset Juvan presentation

The Admin menu exposes **Reset Juvan** only to the exact Jean-Pierre business-admin experience. The menu delegates to the existing #364 `processAdminTestClientResetMessage` flow; it does not reproduce target resolution, preview, explicit confirmation, locking, shared-contact guards, archive/release/unbind or onboarding rebind logic.

The underlying server-side reset authority remains exact Jean-Pierre business-admin only, so a crafted/stale stable action cannot turn the presentation rule into broader reset authority.

### Approval roles

For a current controlled Juvan client booking:

- the assigned position-1 active practitioner is **Primary approver**;
- exact current Jean-Pierre policy admin is **Backup approver**;
- Primary must resolve to an active Admin WhatsApp identity;
- no observer is used for the controlled Juvan mode.

Migration 068 introduces the controlled approval mode and separate Backup delivery timestamp. The database trigger and runtime infrastructure ensure implement the same contract, preventing a restart from silently restoring the superseded JP-only behavior.

Only still-pending current-controlled-Juvan holds are upgraded. Genuine #585 and other terminal historical approval evidence are not rewritten.

### Staff presentation and delivery

The existing approved `shiloh_booking_approval_request_v1` provider contract is reused; #366 did not submit or alter a Meta template.

Primary and Backup receive independently idempotent request delivery. Staff-facing context identifies the client, treatment/service, appointment time, assigned practitioner, Primary, Backup and recipient role. The Pending approvals UX also displays Primary, Backup and viewer role and revalidates current truth before any missing-delivery refresh.

### Atomic first decision

A controlled decision transaction locks the controlled demo identity plus the approval and appointment rows before authorization. Under those locks Shiloh re-resolves the current controlled client, current position-1 practitioner and current JP policy authority and verifies that the stored approval roles still match current truth.

Only the current Primary practitioner Admin identity or current Jean-Pierre Backup may decide. The terminal write is conditional on `status='pending'`. The first valid decision records its role and becomes authoritative. A later authorized attempt sees the committed terminal state, is told which approver/role won, and does not write a second decision.

### Client and Calendar outcome

Approval continues through the established idempotent `sendCustomerBookingConfirmationForAppointment` after the decision commits, so there is no premature confirmed claim and no intentional duplicate final confirmation.

Decline preserves canonical appointment cancellation, appointment status history, CRM audit evidence, shared/practitioner Google Calendar release and existing client decline notification behavior. The other authorized approver receives an outcome notice that the first decision is final.

### Delivery evidence

Initial CI #1162 found four formatting-brittle static compatibility assertions. The branch was repaired without merging or touching production; the old safety assertions remained semantically intact and became whitespace-tolerant.

Final CI **#1164** passed **796/796**. Render auto-deploy `dep-da3eiegae00c7380pa8g` is LIVE on exact #366 merge `53b5e0c4027f9910291f75c05ec13d9c55528118`. Startup applied/checksum-verified migration 068, reported the new Primary/Backup runtime contract, reverified current BOUND identity state and passed Google Calendar provider health. Reschedule approval remained feature-off.

No genuine Juvan reset/re-registration, booking, approval/decline or Calendar/handset proof was manufactured. A future natural journey may provide handset evidence, but it is not required to claim the verified application/runtime boundary.

## Controlled Juvan reusable demo identity — 🟢 VERIFIED LIVE FOUNDATION

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md`.

PR #364 makes **Juvan Botha the only reusable controlled CRM demo identity**. The business-controlled physical WhatsApp/mobile number is the durable identity anchor; a display name is not an identity key.

The canonical structure is:

- one active `controlled_demo_identities.demo_key='juvan_botha'`;
- one exact normalized controlled phone identity;
- nullable `current_client_id` pointing at the **current** canonical Juvan CRM client while registered;
- persisted Juvan booking-approval policy whose nullable `client_id` must move with the same current pointer;
- exact Jean-Pierre business-admin authority as the reset operator.

Production startup after #366 reverified:

- binding state **BOUND**;
- current canonical pointer **845**;
- display `Juvan Botha`;
- controlled phone suffix **1564**;
- Jean-Pierre admin **4**;
- migrations 065/066/067 checksum-valid, with 068 newly applied/checksum-verified.

The reset contract remains Juvan-only and JP-only. Preview resolves the durable current pointer and displays actual client name, CRM ID and controlled phone. UNBOUND state, pointer drift, extra phone identity and shared-active-client conflict fail closed. Confirmation re-resolves/locks the demo row, client, contacts and policy and repeats the identity checks.

A successful reset clears bounded phone-linked booking intent/onboarding/booking-policy/conversation/legacy-profile/universal-welcome delivery state, releases only WhatsApp/mobile contacts, requires zero residual bindings, archives the old client, preserves appointments/audit history, writes `admin.controlled_demo_reset`, and atomically sets both the controlled current-client pointer and Juvan policy `client_id` to `NULL`. The controlled identity is then intentionally **UNBOUND**.

Fresh registration is deliberately the normal real WhatsApp onboarding path. A database trigger recognizes only the exact controlled phone; while UNBOUND it permits binding only to an active `whatsapp_onboarding` client and only when no other CRM binding exists. Contact attachment, controlled current-client pointer, Juvan policy pointer and `controlled_demo_identity.rebound` audit commit/rollback atomically. Ambiguous or competing identity fails closed.

The read-only resolver exposes only the current phone-anchored Juvan canonical client and fails closed on client/contact/policy/shared-active drift. **Downstream code must not permanently hard-code historical client 845 or fall back to “any client named Juvan Botha”.** #366 follows this rule.

No genuine Juvan reset/re-registration occurred in #364 or #366. Production remains BOUND to the current pointer until a separately authorized real device lifecycle. The reset→registration transition is intentionally not claimed as handset-proven here.

The sanctioned Render read-only Postgres connector previously failed before SQL execution at the known SSL/TLS boundary. No write-capable workaround was used and no direct SQL row result is claimed from that connector.

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

The Render read-only Postgres connector still fails before SQL execution at its SSL/TLS boundary. Do not infer direct row evidence from that failed connector; the accepted completion evidence is the guarded transactional runtime semantics, post-commit success response, genuine post-reset first-contact behaviour and the later guarded #362 cleanup startup evidence.

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

## Juvan Botha booking approval historical evidence — 🟢 PRESERVED / SUPERSEDED SEMANTICS

Genuine pre-#364 production identity evidence established one active canonical Juvan Botha client then numbered 845, one canonical WhatsApp/mobile identity, zero shared-active-client contact conflicts and Jean-Pierre admin 4.

Policy `juvan_botha_jp_booking_approval` is now a moving policy pointer whose nullable `client_id` must equal `controlled_demo_identities.current_client_id` while BOUND and be NULL while UNBOUND. Registration from the exact controlled phone atomically moves both pointers to the newly created canonical client.

Genuine booking **#585**, Upper Back, Neck & Jaw Release with Christel, Friday 21 August 2026 16:00–17:00, proved the **former JP-sole-approver behavior**, held/pending state, JP approval request, authorized JP approval, exactly one v1 confirmation after approval and matching shared/Christel Calendar mirrors.

#366 supersedes the approval semantics for future current-controlled-Juvan bookings but deliberately does not rewrite #585 or other terminal historical decisions. Do not create/cancel/recreate #585 merely for evidence.

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

#362 separately verified deterministic cleanup of archived Dummy Test mirrors; post-cleanup 2026 searches returned zero Dummy Test events on shared, Abigail, Marietjie and primary/Christel surfaces. #366 startup again passed the Google Calendar provider health probe.

Google Calendar remains a synchronized provider/mirror; canonical Shiloh CRM/appointment state remains authoritative.

## Booking/Admin durable rules — preserve

- #318 booking entitlement remains fail-closed: Christel+Abigail shared scope; Marietjie only; other linked Admins own practitioner; JP explicit unlinked business-admin exception for Christel+Abigail only; other unlinked Admins no booking catalogue.
- Controlled Juvan approval is a separate authority rule: current assigned practitioner Primary, Jean-Pierre Backup, first valid atomic decision wins. It applies only to the currently BOUND controlled Juvan client.
- Block time authority is separate and narrower: Christel→Myself/Abigail; Abigail→self; Marietjie→self; JP/others→none.
- Reset Juvan presentation is JP-only and the underlying #364 reset handler remains exact JP-only. Menu authority does not replace the server-side reset guard.
- Dummy Test cleanup is an exact-client maintenance one-shot only; `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START=false` is the normal state. Do not generalize it into a broad name-based purge or re-enable it merely for proof.
- Ordinary non-controlled booking approval behavior remains unchanged, including the existing Abigail/Christel first-decision observer rule and normal self-approval behavior where applicable.
- Typed-time, clinic-hours, practitioner schedule, CRM conflicts, pending holds, shared/practitioner Google Calendar conflicts and final confirmation guards remain authoritative.
- Provisional new-client fast path remains name + South African mobile → duplicate check → provisional canonical client → review → explicit confirm; abandoned provisional clients are removed only when no appointment exists.
- Existing full-label/hybrid WhatsApp choice presentation remains accepted.

## CRM & identity durable state

CRM is authoritative for canonical client/practitioner/staff identity. Ambiguous identity, duplicate/conflicting contact ownership, unresolved practitioner/staff identity and destructive changes lacking authority fail closed.

**Juvan is the only reusable controlled demo identity.** The exact normalized business-controlled phone is the durable anchor; `controlled_demo_identities.current_client_id` is the current canonical client pointer. A successful authorized reset intentionally makes that pointer and the Juvan approval-policy client pointer NULL; normal exact-phone WhatsApp onboarding atomically binds both to the new canonical client. Chenique and Dummy Test / CRM Dummy Test are retired from reusable reset eligibility.

#366 consumes this identity resolver for booking approval and does not create a second identity source. Historical client 845 is not permanent authority.

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

## Client welcome and discovery — 🟢 HANDSET EVIDENCE PRESERVED

Universal welcome routing remains repaired through #337. A real Juvan `Hi` proved welcome then registered-client branch; subsequent Browse treatments evidence proved accepted two-page category presentation and SQT virtual family. The completed CRM Dummy reset adds separate genuine evidence that a released number correctly enters the unregistered/new-client branch.

For the controlled Juvan demo lifecycle, #364 deliberately includes phone-level universal-welcome delivery state in bounded reset cleanup so a future explicitly authorized reset can make the exact physical number genuinely new again. This does not invalidate the earlier Juvan welcome proof and is not permission to reset/replay merely for evidence.

## Christel reviewed service catalogue — 🟢 VERIFIED LIVE through #328

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`.

Preserve #328:

- service #27 Full Body Sports Massage inactive/unmapped, history preserved;
- distinct #34 Sports Massage Full Body active at 120 minutes;
- #65 Sports Massage — Package Session active at 50 minutes with existing package contract;
- reviewed canonical totals 60 / 90 / 90 for the approved three services;
- no practitioner-specific duration override.

Do not reactivate/remap #27, merge #27/#34, restore reviewed buffers, delete history, alter #34/#65 duration or bulk-publish Goldie wording.

## Public catalogue — 🟢 VERIFIED LIVE

`/book` remains the Shiloh-owned CRM-backed public service catalogue through accepted #301 state. Do not create a second static source of truth.

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

**Authoritative current application state:** PR #366 / `53b5e0c4027f9910291f75c05ec13d9c55528118`; CI #1164 passed 796/796; Render deploy `dep-da3eiegae00c7380pa8g` LIVE on exact merge SHA; migration 068 applied/checksum-verified; Google Calendar health passed. Controlled Juvan identity is production-verified BOUND to the current canonical pointer, presently client 845 / phone suffix 1564 / JP admin 4. The current approval contract is assigned practitioner Primary + Jean-Pierre Backup + exactly-one atomic first-decision-wins.

**Controlled Juvan Booking/Admin unit:** complete and verified live at the application/runtime boundary. Reset Juvan is JP-only presentation delegating to #364. Do not name-match Juvan, permanently hard-code client 845, or manufacture reset/booking/approval evidence.

**Highest-priority standing gate:** WhatsApp / Meta Integration remains monitoring owner for a future genuinely read-only provider refresh of `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`.

**Why next:** the #366 Booking/Admin redesign is live without a manufactured business journey; the remaining reschedule dependency is external Meta approval rather than further Booking/Admin implementation.

**Remaining gates:** both reschedule templates must independently prove `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true` before Production activation. A real Juvan reset→new registration→new canonical rebind or a genuine new Primary/Backup booking approval journey must occur only under future genuine business use / explicit authorization and is intentionally not manufactured for proof. All other standing fail-closed gates remain preserved.
