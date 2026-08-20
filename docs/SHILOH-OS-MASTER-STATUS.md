# Shiloh OS — Master Project Status

Updated: 2026-08-20
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history and dated reconciliation files; do not redo accepted or superseded work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider approval, attendance, approval decisions, CRM identity, Calendar state or handset behaviour.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on current GitHub `main`; verify production/provider/CRM/Calendar/human evidence that could have changed; preserve newer authority; then continue only the owned controlled scope.

Earlier dated reconciliations remain durable where not superseded. Preserve in particular `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, the Christel service-catalogue correction, specialist-workstream and Control-routing reconciliations, booking-confirmation-v2 controlled submission, Juvan booking approval/v1 handset proof, client-welcome repair, booking-update activation/stale suppression, Meta booking-update approval and all explicit fail-closed gates.

Obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved controlled unit through normal engineering/deploy/verification/reconciliation boundaries. Stop for material scope/risk expansion, contradictory authority, or a genuine fail-closed human/provider/evidence/safety/capability gate.

## Current production baseline

Current accepted **application** code is **PR #358 / `287579510e566d9b629df51b91c4b716b5d6a4e1`**, **Fix CRM reset interactive language gate**.

- GitHub CI run **#1139** completed **773 passed / 0 failed**.
- Render deploy **`dep-da3cu21srm7s73961ir0`** reached **LIVE** on the exact #358 SHA.
- `/health` returned HTTP 200 on the new instance.
- Google Calendar provider health passed.
- Existing booking-update/cancellation, staff-finalization and booking-confirmation-v1 template checks remained `APPROVED`, `already_exists`, `submitted=false`; no provider resubmission was caused by #358.
- No Render environment/configuration change was used for #358 or its verification.
- #358 is deliberately narrow: only the six exact already-authorized CRM test-client reset Confirm/Cancel control tokens bypass natural-language classification. Arbitrary machine-like text and ordinary non-English free text remain subject to the English-only guard. The #338 destructive reset transaction was not broadened or weakened.

Relevant accepted runtime lineage remains:

- **#337** — universal client-welcome repair, genuine handset-proven.
- **#338 / merge `31d49d27a74c570fb439bee62c9647275bf97f6b`** — hardened CRM Dummy Test reassignment transaction and confirmation safety boundary.
- **#350** — canonical Juvan Botha client-ID policy to exact Jean-Pierre booking approval.
- **#352** — genuine booking #585 proves Juvan→JP approval, one final v1 confirmation after approval and matching shared/Christel Calendar mirrors.
- **#353** — specialist-chat lifecycle operating convention.
- **#354** — client self-service reschedule start-boundary guard.
- **#355** — practitioner-approved reschedule success confirmation with durable retry/claim/suppression.
- **#356** — exact Meta approval-request/decline transport contracts; feature remains dark pending provider readiness.
- **#358** — CRM reset structured-interaction language-boundary repair.

PR #357 was documentation/shared-authority reconciliation through #356. It did not change application behaviour.

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

## CRM Dummy Test number reassignment — 🟢 VERIFIED LIVE / HANDSET-PROVEN / COMPLETE

Authoritative completion reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CRM-DUMMY-RESET-COMPLETION.md`.

The #338 reset contract remains authoritative:

- eligible target names are limited to Chenique, Juvan and Dummy Test / CRM Dummy Test;
- only authorized Christel owner/business-admin or Jean-Pierre business-admin paths with the required scopes may perform the reset;
- preview shows the actual matched CRM display name, CRM ID and WhatsApp/mobile identities to release;
- a shared-active-CRM phone conflict blocks before Confirm;
- confirmation re-resolves and locks the target and repeats the shared-active-client identity guard inside the transaction;
- phone-bound booking intent, onboarding, booking-policy, optional conversation-session and legacy user-profile state is cleared where applicable;
- only WhatsApp/mobile contact bindings are released;
- zero residual WhatsApp/mobile bindings is a required pre-commit postcondition;
- the CRM client is archived/inactivated rather than deleted;
- appointments and CRM/audit history are preserved;
- an `admin.test_client_reset` audit event is written atomically.

A genuine first Confirm attempt at 11:45 SAST exposed an interactive-language routing defect and did **not** execute the reset. PR #358 repaired only that transport boundary and passed full CI 773/0.

After #358 was LIVE, a fresh authorized preview showed exactly:

- **Dummy Test**
- **CRM #835**
- **WhatsApp +27 71 674 2646 — primary**

The preview can only render after the unique-target and pre-confirm shared-active-identity checks pass.

At **11:59:23.746 SAST**, production received the genuine interactive confirmation. At **11:59:24.417 SAST**, Shiloh sent the reset-complete response after the transaction committed. The committed result archived CRM #835, released exactly one WhatsApp/mobile contact record, cleared the bounded temporary phone state, preserved appointment/audit history and wrote the reset audit event.

At **12:01:27.486 SAST**, the legitimately reassigned number sent a real `Hi` from masked suffix `2646`; at **12:01:28.537 SAST** Shiloh responded with the unregistered/new-client registration branch. The handset response carried no inherited Dummy Test name, CRM #835 identity, booking intent, onboarding continuation, policy state or prior conversation-session context.

No appointment or booking was manufactured. **Do not reset CRM #835 again or replay the reassigned number merely to reproduce proof.**

The Render read-only Postgres connector still fails before SQL execution at its SSL/TLS boundary. Do not infer direct row evidence from that failed connector; the accepted completion evidence is the guarded transactional runtime semantics, post-commit success response and genuine post-reset first-contact behaviour.

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

## Juvan Botha booking approval — 🟢 VERIFIED LIVE / HANDSET-PROVEN

Canonical production identity evidence established one active canonical **Juvan Botha / client ID 845**, one canonical WhatsApp/mobile identity, zero shared-active-client contact conflicts, and exact approver **Jean-Pierre admin ID 4**.

Policy `juvan_botha_jp_booking_approval` is keyed by canonical client ID, never display-name matching. Duplicate/ambiguous Juvan identity, shared contact, missing policy or JP contract drift fails closed.

Genuine booking **#585**, Upper Back, Neck & Jaw Release with Christel, Friday 21 August 2026 16:00–17:00, proved held/pending state, JP approval request, authorized JP approval, exactly one v1 confirmation after approval and matching shared/Christel Calendar mirrors. Do not create/cancel/recreate #585 merely for evidence.

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

Google Calendar remains a synchronized provider/mirror; canonical Shiloh CRM/appointment state remains authoritative.

## Booking/Admin durable rules — preserve

- #318 booking entitlement remains fail-closed: Christel+Abigail shared scope; Marietjie only; other linked Admins own practitioner; JP explicit unlinked business-admin exception for Christel+Abigail only; other unlinked Admins no booking catalogue.
- The Admin who prepares a pending booking confirms it; do not reintroduce superseded Christel↔Abigail cross-confirm behaviour without a new requirement.
- Typed-time, clinic-hours, practitioner schedule, CRM conflicts, pending holds, shared/practitioner Google Calendar conflicts and final confirmation guards remain authoritative.
- Provisional new-client fast path remains name + South African mobile → duplicate check → provisional canonical client → review → explicit confirm; abandoned provisional clients are removed only when no appointment exists.
- Existing full-label/hybrid WhatsApp choice presentation remains accepted.

## CRM & identity durable state

CRM is authoritative for canonical client/practitioner/staff identity. Ambiguous identity, duplicate/conflicting contact ownership, unresolved practitioner/staff identity and destructive changes lacking authority fail closed.

The completed CRM Dummy Test reassignment is now do-not-redo evidence as recorded above. The same guarded reset facility remains available only for the approved test-client identities and privileged admin path; a future reset requires a new genuine business need and fresh target verification.

The historical #558 attendance exception remains unresolved with historical practitioner `SHILOH MTC`. Never infer Christel, Marietjie or another practitioner; establish human/authoritative truth before correction/finalization.

## Attendance own-practitioner-only authority — 🟢 VERIFIED LIVE through #324

PR #324 remains authoritative:

- Christel finalizes Christel appointments only.
- Abigail finalizes Abigail appointments only.
- Marietjie finalizes Marietjie appointments only.
- Jean-Pierre has no attendance/finalization authority.

Exact active linked identity is required and conflicts fail closed. Historical attendance truth remains human-controlled.

## Client welcome and discovery — 🟢 REPAIRED / HANDSET-PROVEN

Universal welcome routing remains repaired through #337. A real Juvan `Hi` proved welcome then registered-client branch; subsequent Browse treatments evidence proved accepted two-page category presentation and SQT virtual family. The CRM Dummy reset completion adds separate genuine evidence that a released number correctly enters the unregistered/new-client branch. Do not reset/replay either journey merely for proof.

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

**Authoritative current application state:** PR #358 / `287579510e566d9b629df51b91c4b716b5d6a4e1`; CI #1139 passed 773/0; Render `dep-da3cu21srm7s73961ir0` LIVE; health and Google Calendar verified; provider continuity preserved.

**CRM Dummy Test reassignment:** complete, post-commit and handset-proven. Do not redo.

**Highest-priority standing gate:** WhatsApp / Meta Integration remains monitoring owner for a future genuinely read-only provider refresh of `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`.

**Why next:** the CRM number reassignment controlled unit is closed; the remaining reschedule dependency is external Meta approval rather than further CRM or Production implementation.

**Remaining gate:** both reschedule templates must independently prove `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true`. Until then, no activation and no genuine reschedule handset journey. All other standing fail-closed gates remain preserved.
