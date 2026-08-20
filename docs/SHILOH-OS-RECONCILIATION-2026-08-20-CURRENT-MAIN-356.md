# Shiloh OS — Reconciliation — current main through PR #356

Date: 2026-08-20
Owning workstream: Control & Reconciliation
Status: SHARED AUTHORITY RECONCILIATION / PROVIDER GATE PRESERVED

## Scope

Bring the shared Master Status and Project Tracker forward from their stale #348/#340 snapshot to the actual current repository/runtime state through PR #356, preserve newer authoritative evidence, supersede stale documentation PR #351, and record the current fail-closed Meta gate for practitioner-approved client rescheduling.

This is documentation/shared-authority work only. It does not activate practitioner-approved rescheduling, submit a Meta template, alter a Render environment variable, mutate CRM/appointment/Calendar data, or manufacture handset/provider evidence.

## Authoritative repository/runtime baseline

At controlled-unit inspection:

- GitHub `main`: PR #356 / `aed75d1fef36bda3d04f7ad2e0d6747e87017d88`, **Complete reschedule approval Meta transport gate**.
- GitHub CI: run #1133 completed successfully.
- Render exact-sha runtime: deploy `dep-da3bvjajnfac73c6fca0`, status LIVE.
- Engineering Governance on `main` contains both PR #340 mandatory specialist handoffs and PR #353 specialist-chat lifecycle convention.

The previous Master/Tracker were materially stale: they still called PR #348 the production application baseline, PR #340 the current governance baseline, and the client-reschedule practitioner-approval path only the #346/#347 state with approval/decline templates unconfigured.

## Preserved newer lineage

This reconciliation records, without reopening completed work:

- #350 / `bb26eb62a719f84cbe0471aa54530e71cb104da9` — canonical Juvan Botha client-ID booking approval policy to exact Jean-Pierre admin approval.
- #352 / `1bb30464c68e45525e350133dc974ddcf192b6f0` — genuine Juvan booking #585 approval + booking-confirmation-v1 handset proof and matching Calendar mirrors.
- #353 / `919559bd3694263d1f93ae103bac9f4fc0ac84d0` — specialist-chat lifecycle convention.
- #354 / `a3bddd4daf47e6ba2faf143ae22b14597afb6f85` — client reschedule appointment-start boundary guard and stale hold expiry.
- #355 / `089e76a41115c8d7451fb7e2173fc25f52afb707` — exact approved-reschedule client confirmation routing with durable retry/claim/suppression.
- #356 / `aed75d1fef36bda3d04f7ad2e0d6747e87017d88` — exact Meta approval-request/decline transport contracts, duplicate/drift/readiness gates and targeted no-resubmit one-shot provisioning/readback, while preserving feature-off state.

## Juvan booking approval evidence preserved

The #352 reconciliation remains durable evidence for genuine booking #585:

- Juvan booking held pending Jean-Pierre approval;
- `shiloh_booking_approval_request_v1` shown to JP with Approve/Decline;
- authorized JP approval occurred;
- exactly one `shiloh_booking_confirmation_v1` followed approval;
- the four legacy automatic supplemental groups suppressed by #348 did not appear;
- shared `Shiloh — Bookings` and Christel production Calendar mirrors matched Friday 21 August 2026 16:00–17:00.

Do not create/cancel/recreate #585 merely to repeat evidence.

## Practitioner-approved client reschedule provider gate

Application-side engineering is present through #356, but the feature remains **dark / not active** with `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false`.

Last authoritative controlled Meta evidence for both new transport templates remains:

| Template | Status | Category | Language | Exact | duplicateCount | Configured |
|---|---|---|---|---|---:|---|
| `shiloh_reschedule_approval_request_v1` | **PENDING** | UTILITY | `en` | true | 0 | true |
| `shiloh_reschedule_declined_v1` | **PENDING** | UTILITY | `en` | true | 0 | true |

A later read-only WhatsApp / Meta checkpoint found no newer provider-read event and could not perform a fresh authorized provider read without crossing the runtime-only audit authentication boundary. It did not re-enable provisioning, redeploy for evidence, resubmit, alter configuration, or bypass authentication.

Therefore fail-closed current state remains PENDING. Required activation readiness for each template is `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true`.

Until BOTH satisfy that gate:

- WhatsApp / Meta Integration owns read-only provider monitoring;
- Production / DevOps activation is blocked;
- Booking & Admin UX genuine reschedule/approval handset proof is blocked;
- no resubmission merely because PENDING;
- no `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED` activation;
- no manufactured appointment, practitioner decision, CRM/Calendar mutation or handset evidence.

## Stale PR #351 superseded

PR #351 was prepared against #350 and attempted to reconcile Master/Tracker only through that older state. Newer merged authority #352–#356 made it unsafe as a current snapshot.

Control closed PR #351 as **superseded**, rather than force-merging stale documentation. Historical #350 evidence remains preserved in Git history and #352.

## Other durable state preserved

- `shiloh_booking_confirmation_v1` remains approved/configured/live; #348 supplemental suppression is handset-proven by #352.
- `shiloh_booking_confirmation_v2` remains last-authoritatively PENDING / Utility / `en` / exact / duplicate-free / inactive after one controlled submission; do not resubmit or activate while PENDING.
- `shiloh_booking_update_v1` remains approved/exact/duplicate-free/LIVE/ENABLED; #575/audit 674 remains terminally suppressed historical evidence, not successful delivery proof.
- Google Calendar provider guard/health remains permanent and healthy; canonical Shiloh CRM/appointment state remains authoritative.
- #318 Admin booking entitlement remains fail-closed; JP has only the explicit Christel+Abigail booking exception and no attendance finalization.
- attendance finalization remains Christel→Christel, Abigail→Abigail, Marietjie→Marietjie, JP→none; #558 remains fail-closed with historical practitioner `SHILOH MTC`.
- #338 CRM Dummy Test reassignment guard remains live; genuine reset/reassignment evidence remains separate.
- #337 universal welcome repair remains handset-proven; do not reset/replay welcome state for proof.
- #328 Christel catalogue correction remains authoritative; do not reactivate/remap #27, merge #27/#34, restore reviewed buffers, alter #34/#65 duration, or bulk-publish Goldie wording.
- GBP remains external/provider gated with general Requests/min at 0.
- earlier Control Render read-only boundary breach remains preserved in the audit trail; no Render mutation is normalized as ordinary verification.

## Shiloh Visual Calendar

The proposed Shiloh Visual Calendar is explicitly **DEFERRED** by business decision. It is not an active implementation item. Existing Google Calendar integration remains unchanged. A future explicit controlled decision is required to reactivate it.

## Reconciliation result

Master Status and Project Tracker now point to this reconciliation and reflect current #356 production/runtime/governance state rather than the stale #348/#340 snapshot.

No application/runtime/provider/business data is changed by this documentation unit.

## Next controlled action

There is no executable Booking or Production implementation while the reschedule approval/decline templates remain PENDING.

**Current owner:** Shiloh OS — WhatsApp / Meta Integration.

**Status:** 🟠 WAITING PROVIDER.

Next valid action is a genuinely read-only Meta provider refresh when an authorized read surface is available. If and only if both templates independently prove the full APPROVED readiness gate, reconcile that evidence and hand a separate guarded activation to Shiloh OS — Production / DevOps. Booking & Admin UX resumes genuine handset proof only after verified activation.