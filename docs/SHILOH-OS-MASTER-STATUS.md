# Shiloh OS — Master Project Status

Updated: 2026-08-20
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history and dated reconciliation files; do not redo accepted or superseded work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider approval, attendance, approval decisions, CRM identity, Calendar state or handset behaviour.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CURRENT-MAIN-356.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on current GitHub `main`; verify any production/provider/CRM/Calendar/human evidence that could have changed; then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate.

Earlier dated reconciliations remain durable evidence where not superseded. In particular preserve `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`, the specialist-workstream and Control-routing reconciliations, the booking-confirmation-v2 controlled submission, Juvan booking approval/v1 handset proof, client-welcome repair, booking-update activation/stale suppression and Meta booking-update approval. A newer current reconciliation does not erase them.

Obtain explicit approval before the first new substantial controlled action. After that approval, continue the approved controlled unit through ordinary engineering/deploy/verification/reconciliation boundaries. Stop for material scope/risk expansion, contradictory authority, or a genuine fail-closed human/provider/evidence/safety/capability gate.

## Current production baseline

Current accepted production application code is **PR #356 / `aed75d1fef36bda3d04f7ad2e0d6747e87017d88`**, **Complete reschedule approval Meta transport gate**.

- GitHub CI run **#1133** completed successfully.
- Render production is running the exact #356 merge SHA on deploy **`dep-da3bvjajnfac73c6fca0`**, verified LIVE.
- #356 freezes and registers exact Utility/`en` Meta contracts for `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`, adds targeted no-resubmit one-shot provisioning/readback, and preserves the existing approved success confirmation `shiloh_reschedule_confirmation_v1`.
- Practitioner-approved client rescheduling remains **dark / not active** behind `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false`.
- #356 did not itself activate the feature, mutate an appointment/CRM/Calendar record, or authorize a handset journey.

The accepted immediately preceding runtime lineage is:

- **#350 / `bb26eb62a719f84cbe0471aa54530e71cb104da9`** — canonical Juvan Botha booking approval routes to exact Jean-Pierre admin approval by durable client-ID policy; existing CRM Dummy Test → JP and ordinary practitioner approval remain preserved.
- **#352 / `1bb30464c68e45525e350133dc974ddcf192b6f0`** — genuine booking #585 proves Juvan→JP approval, approval-before-final-confirmation, exactly one v1 confirmation after approval, handset suppression of the four legacy supplemental groups, and matching shared/Christel Calendar mirrors. Do not recreate #585 for proof.
- **#353 / `919559bd3694263d1f93ae103bac9f4fc0ac84d0`** — specialist-chat lifecycle operating convention.
- **#354 / `a3bddd4daf47e6ba2faf143ae22b14597afb6f85`** — client self-service reschedule start-boundary guard; started/starting appointments fail closed and stale pending holds stop blocking after the original start boundary.
- **#355 / `089e76a41115c8d7451fb7e2173fc25f52afb707`** — practitioner-approved client reschedules route to the existing exact approved reschedule confirmation with durable retry/claim/suppression handling; ordinary Admin time-change notifications remain on the generic booking-update path.
- **#356 / `aed75d1fef36bda3d04f7ad2e0d6747e87017d88`** — exact reschedule approval/decline transport contracts and provider gate, feature still dark.

## Engineering governance — 🟢 AUTHORITATIVE

Engineering Governance on current `main` includes:

- **PR #340 / `aeb4e35361c34413d4310b1846c7043642a31cd2`** — mandatory copy-ready specialist-to-specialist handoffs, direct specialist continuation when ownership/authority are clear, and preservation of fail-closed gates.
- **PR #353 / `919559bd3694263d1f93ae103bac9f4fc0ac84d0`** — specialist chat lifecycle convention: no fixed message/turn threshold; rotate based on practical chat health; prefer controlled-unit boundaries; fresh same-specialist chats independently re-read current authority; a continuation checkpoint is routing context only.

Control & Reconciliation coordinates shared state, priorities, ownership, architecture/governance and reconciliation. It does not become a second implementation queue.

The standing controlled-work sequence remains:

`inspect authoritative state → implement → test/full applicable regression gate → repair until green → merge → verify Render/production/provider → reconcile Project Tracker → reconcile Master when durable state changed → final checkpoint`

## Specialist workstream reconciliation — 🟢 ADOPTED

Booking & Admin UX, WhatsApp / Meta Integration, CRM & Identity, and Production / DevOps independently verify applicable GitHub `main`, Master, Project Tracker, latest reconciliation and changing production/provider/human evidence before controlled work. A specialist unit is not complete merely because implementation, tests, a PR, merge or deployment exists: applicable production/provider verification, Tracker reconciliation, durable Master reconciliation when required and the final specialist checkpoint remain part of completion.

Proposed, in-progress or unmerged work is never written as completed Master state. Blocked work stays fail-closed with its dependency. Control & Reconciliation uses reconciled authoritative evidence—not specialist-chat narrative—for cross-workstream continuity.

## Control checkpoint workstream routing — 🟢 ADOPTED

Every Control & Reconciliation checkpoint that recommends a next controlled action records the owning workstream, exact specialist chat, why that workstream owns it, dependencies/observers, implementation status and a ready-to-copy continuation instruction. Routing context never replaces independent authoritative-state verification.

PR #340 does not make Control an intermediate stop between clear specialist owners. When ownership and shared authority are clear, the outgoing specialist's mandatory self-contained handoff is sufficient for direct continuation; Control remains the escalation point for unclear ownership, conflicting authority, cross-workstream prioritisation, governance/architecture and reconciliation disputes.

If a provider, approval, human-truth, genuine-journey or other external gate blocks the item, implementation remains blocked and ownership stays with the appropriate monitoring/provider workstream. It must not be routed prematurely merely to keep work moving.

## Current highest-priority external gate — practitioner-approved client reschedule

The application-side engineering through #356 is present in production, but the feature is **🟠 WAITING PROVIDER / NOT ACTIVE**.

Last authoritative controlled Meta evidence for both required templates is:

| Template | Status | Category | Language | Exact | duplicateCount | App configured |
|---|---|---|---|---|---:|---|
| `shiloh_reschedule_approval_request_v1` | **PENDING** | UTILITY | `en` | true | 0 | true |
| `shiloh_reschedule_declined_v1` | **PENDING** | UTILITY | `en` | true | 0 | true |

The successful-reschedule customer confirmation remains the existing `shiloh_reschedule_confirmation_v1` contract.

Required activation gate for **each** approval/decline template is: `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true`.

While either template remains PENDING or otherwise fails readiness:

- do not resubmit merely because it is PENDING;
- do not enable `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED`;
- do not route activation to Production / DevOps;
- do not run a Juvan reschedule journey or manufacture an appointment, practitioner decision, CRM/Calendar mutation or handset proof;
- WhatsApp / Meta Integration remains the monitoring owner for a genuinely read-only provider refresh when an authorized read surface is available.

Only after **both** templates independently satisfy the complete provider gate may provider approval be reconciled and a separate controlled activation be handed to Production / DevOps. Booking & Admin UX becomes actionable for genuine handset proof only after verified production activation.

## Juvan Botha booking approval — 🟢 VERIFIED LIVE / HANDSET-PROVEN

Canonical production identity evidence established one active canonical **Juvan Botha / client ID 845**, one canonical WhatsApp/mobile identity, zero shared-active-client contact conflicts, and exact approver **Jean-Pierre admin ID 4** under the guarded business-admin/all-business/all-services/WhatsApp contract.

Durable policy `juvan_botha_jp_booking_approval` matches by canonical `client_id=845`, never by display-name pattern. Duplicate/ambiguous Juvan identity, shared contact identity, missing policy or JP contract drift fails closed. Existing CRM Dummy Test → JP approval and ordinary practitioner approval behaviour remain unchanged.

Genuine booking **#585**, Upper Back, Neck & Jaw Release with Christel, Friday 21 August 2026 16:00–17:00, proved the held/pending state, JP approval request, authorized JP approval, final v1 confirmation only after approval, and matching Google Calendar mirrors. Do not create/cancel/recreate #585 merely for evidence.

## Booking confirmation templates

### v1 — 🟢 LIVE / APPROVED / HANDSET-PROVEN POLISH

`shiloh_booking_confirmation_v1` remains the production booking-confirmation selector and approved fallback. PR #348 suppresses only four redundant automatic post-template groups: separate Google Calendar CTA, Apple/Outlook CTA, Reschedule/Cancel block, and Book another/My appointments/Main menu block. The approved provider contract itself is unchanged. #352 handset evidence proved the intended reduced delivery after genuine booking #585.

Do not restore those automatic groups without a new explicit Booking & Admin UX decision.

### v2 — 🟠 WAITING META / NOT ACTIVE

`shiloh_booking_confirmation_v2` was submitted exactly once under the controlled #343/#344 path. Last authoritative provider evidence remains **PENDING / UTILITY / `en` / exact / `duplicateCount=0`**. It remains non-sendable/inactive and production remains on v1. Do not resubmit or activate while PENDING. Synthetic CI fixture approval is not provider evidence.

## Booking-update customer confirmations — 🟢 LIVE / ENABLED / 🟠 NATURAL DELIVERY EVIDENCE OPEN

`shiloh_booking_update_v1` remains provider APPROVED, exact, duplicate-free, and production-enabled. The deterministic kill switch remains `WHATSAPP_BOOKING_UPDATE_ENABLED=false`.

PR #332 terminally suppresses stale ended update rows with `appointment_already_ended` while preserving audit/history. Appointment #575 / audit 674 remains terminally suppressed historical evidence with `sent_at=null`; never release, delete, mark sent or reuse it as delivery proof. Successful delivery evidence must arise naturally from a genuine change to a still-future appointment.

## Google Calendar — 🟢 VERIFIED HEALTHY / PERMANENT FAIL-CLOSED GUARD

PR #302's Google Calendar provider guard and health probe remain permanent. Provider failure blocks booking writes cleanly. The production OAuth chain was reconciled and subsequent production restarts have verified Calendar health.

Real booking #570 previously proved practitioner-change Calendar synchronization. Genuine #585 proved the same deterministic booking event across the shared `Shiloh — Bookings` calendar and Christel's production mirror. Do not mutate either appointment merely for proof.

Google Calendar remains a synchronized provider/mirror; canonical Shiloh appointment/CRM state remains authoritative.

## Booking/Admin durable rules — preserve

- Booking entitlement is fail-closed and remains the #318 contract: Christel+Abigail shared scope; Marietjie only; other linked Admins own practitioner only; JP is the explicit unlinked business-admin exception for Christel+Abigail only; other unlinked Admins have no booking catalogue.
- The Admin who prepares a pending booking confirms it; do not reintroduce the superseded Christel↔Abigail cross-confirm handoff without a new explicit requirement.
- Typed-time, clinic hours, practitioner schedule, CRM conflicts, pending holds, shared/practitioner Google Calendar conflicts and final confirmation guards remain authoritative.
- Provisional new-client fast path remains name + South African mobile → duplicate check → provisional canonical client → review → explicit confirm; abandoned provisional clients are removed only when no appointment exists.
- Existing full-label/hybrid WhatsApp choice presentation from #320/#322 remains accepted.

## CRM & identity durable state

CRM is authoritative for canonical client/practitioner/staff identity. Ambiguous canonical identity, duplicate/conflicting contact ownership, unresolved practitioner/staff identity and destructive changes lacking authority fail closed.

CRM Dummy Test reassignment hardening from #338 remains live: exact target resolution, preview of CRM ID/identities, shared-active check, re-resolution/locking on confirm, bounded temporary state cleanup, WhatsApp/mobile release only, archival with appointment/audit history preserved. Genuine reset/reassignment evidence remains separate and must not be manufactured.

The historical #558 attendance exception remains unresolved with historical practitioner `SHILOH MTC`. Never infer Christel, Marietjie or another practitioner; establish human/authoritative truth before correction/finalization.

## Attendance finalization authority — 🟢 VERIFIED LIVE

PR #324 is the accepted own-practitioner finalization authority and remains preserved by its dated reconciliation.

- Christel finalizes Christel appointments only.
- Abigail finalizes Abigail appointments only.
- Marietjie finalizes Marietjie appointments only.
- Jean-Pierre has no attendance/finalization authority.

Exact active linked identity is required and conflicts fail closed. Historical attendance truth remains human-controlled; re-query before quoting current counts.

## Client welcome and discovery — 🟢 REPAIRED / HANDSET-PROVEN

Universal welcome routing remains repaired through #337. A real Juvan `Hi` proved universal welcome first, then the registered-client branch. Subsequent genuine Browse treatments evidence proved the accepted two-page category presentation and SQT virtual family. Do not reset/replay welcome state or infer unrelated CRM/consent truth merely for evidence.

## Christel reviewed service catalogue — 🟢 VERIFIED LIVE through #328

Authoritative reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`.

Preserve the accepted #328 catalogue correction:

- service #27 Full Body Sports Massage inactive/unmapped, history preserved;
- distinct #34 Sports Massage Full Body active at 120 minutes;
- #65 Sports Massage — Package Session active at 50 minutes with existing package contract;
- reviewed canonical totals 60 / 90 / 90 for the approved three services;
- no practitioner-specific duration override.

Do not reactivate/remap #27, merge #27/#34, restore reviewed buffers, delete history, alter #34/#65 durations or bulk-publish Goldie wording. Goldie description exceptions remain a separate Control/business-approval gate.

## Public catalogue — 🟢 VERIFIED LIVE

`/book` remains the Shiloh-owned CRM-backed public service catalogue through accepted #301 state. Do not create a second static public service source of truth or redo superseded #284–#300 layout variants.

## Control audit boundary — preserve

An earlier Control read-only verification mistakenly invoked Render's environment-update action three times with an empty merge set. No environment key/value changed, but same-commit API redeploys materialized, including `dep-da2ope3m8hqs73e3pr7g` and `dep-da2opi9s4bfs73fstcgg`. Preserve this as a governance/audit boundary breach. Control must use true read-only Render tools unless a future explicit governance override authorizes mutation.

## Google Business Profile provider access — 🟠 EXTERNAL/PROVIDER GATE

Last-authoritative provider evidence remains: My Business Business Information API enabled; access/application submitted; API-specific quotas visible; general **Requests per minute** remains **0**. Google Business Profile approval and usable access are therefore **not positively established**.

Earlier PR #35 added GBP knowledge-sync scaffolding, including `src/services/googleBusinessProfileSync.js`. That scaffolding is **not evidence of provider approval** and does not authorize integration merely because code exists.

This is **not an ordinary capacity/quota-increase task**. **Do not begin or resume GBP OAuth/API integration** until authoritative Google evidence confirms usable access or a usable general request quota greater than 0. When that gate closes, reopen from current GitHub `main`, reassess the existing scaffolding, and follow the full controlled-work completion protocol.

Primary ownership is **Production / DevOps** for provider/configuration verification. **Control & Reconciliation** tracks the external dependency and protects shared authoritative state.

## Other standing gates

- Google Contacts sync remains lower priority; CRM remains authoritative.
- Ozow remains waiting for merchant configuration and explicit business rules.
- Destructive privacy execution remains fail-closed pending authority/evidence.
- Follow-up/rating and birthday delivery evidence remain genuine-journey/eligibility gated.

## Shiloh Visual Calendar — ⏸️ DEFERRED

A future Shiloh Visual Calendar was discussed as a possible Admin UX layer over canonical Shiloh appointment state with Google Calendar remaining a synchronized mirror. The business decision is to **hold off for now**. Do not implement, prototype or add it to the active queue unless a later explicit controlled decision reactivates it. Existing Google Calendar integration remains unchanged.

## Superseded reconciliation branch

PR #351, the older documentation-only “Reconcile Juvan JP booking approval” branch based on #350, is superseded and closed rather than merged because newer authoritative work #352–#356 changed the current state. Its historical #350 evidence remains preserved through Git history and #352; do not reopen/force-merge it into current authority.

## Exact continuation state

**Authoritative current state:** production code is PR #356 / `aed75d1fef36bda3d04f7ad2e0d6747e87017d88`; CI #1133 succeeded; Render `dep-da3bvjajnfac73c6fca0` is LIVE on the exact SHA. Engineering Governance includes #340 mandatory handoffs and #353 specialist-chat lifecycle convention. Juvan→JP booking approval is handset-proven through #352. Reschedule start-boundary and approved-notification protections from #354/#355 are present. #356 Meta transport contracts are present, but practitioner-approved rescheduling remains feature-off.

**Highest-priority next item:** WhatsApp / Meta Integration remains the monitoring owner for a future genuinely read-only provider refresh of `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1` when an authorized read surface is available.

**Why next:** all currently authorized application-side reschedule work is merged and production-live. The blocking dependency is external Meta approval, not more Booking & Admin UX or Production / DevOps implementation.

**Remaining gate:** both reschedule approval/decline templates must independently prove `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true`. Until then, no activation, no Production / DevOps handoff and no genuine Booking/Admin reschedule handset journey.
