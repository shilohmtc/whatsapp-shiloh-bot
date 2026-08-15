# Shiloh OS — Master Project Status

Updated: 2026-08-15
Purpose: permanent current-state project-management source of truth. Historical detail remains in Git history/archive; do not redo accepted work.

## Authority and production baseline

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar, Meta/WhatsApp provider evidence and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or Calendar state.

Current application-code baseline: **PR #238** squash merge `0d5f091fb37a7e49166096db1db65642e0d28bf9`, with later governance-only PR #239 on `main`. Render production deploy **`dep-da03ub9t0dsc738r5h20`** is verified **live** on 2026-08-15 with `META_LIFECYCLE_PROVISION_ON_START=false` after the second controlled one-shot Meta submission.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test uses JP admin account alone. Pending holds have no automatic expiry. MediHeel remains Christel only.

## Canonical project status taxonomy

- 🟢 **VERIFIED** — completed with sufficient authoritative evidence.
- 🔵 **ACTIVE** — work currently being executed.
- ⚪ **READY** — genuinely actionable now, but not currently being executed.
- 🟠 **WAITING** — requires human, provider, external or genuine-journey evidence before it can advance.
- 🔴 **DEFECT / HOLD** — a proven problem or unsafe state; fail closed until repaired and re-verified.
- ⏸️ **DEFERRED** — deliberately postponed by explicit project decision.

## Execution Protocol — new-chat authorization model

At the beginning of each new Shiloh OS chat, first read Master + Tracker on GitHub `main`, reconcile the applicable authoritative systems, state the authoritative current state, identify the single highest-priority genuinely actionable item, explain why it is next, and obtain explicit user approval before beginning substantial work.

Once that initial approval is given, it authorizes continued execution of the approved workstream for the remainder of that chat, including normal engineering, PRs, merges, deployments, controlled production/provider configuration, verification, repairs and housekeeping. Do not repeatedly request approval at ordinary implementation boundaries.

Stop and request fresh approval only if the proposed action materially exceeds the approved workstream, introduces materially greater or unexpected destructive/irreversible risk, encounters contradictory authoritative evidence that makes continued execution unsafe, or would violate an existing fail-closed/evidence gate.

Human-truth and external-evidence gates remain unchanged. Initial chat authorization never permits Shiloh to infer missing evidence, manufacture appointments for proof, override provider gates, or bypass explicit real-human evidence requirements.

Read-only verification, diagnostics, reconciliation, documentation/status maintenance and minor housekeeping may proceed before the initial approval gate where needed to establish the authoritative checkpoint.

### Automatic continuation across short external waits

When an already-approved Shiloh OS workstream is blocked only by a future external condition—such as a Render deploy becoming live, GitHub CI completing, Meta/provider review changing state, or another authoritative provider dependency—the default is to preserve momentum rather than require the user to manually send `continue`.

If the expected wait is only a few minutes and the chat remains active, re-check the authoritative system directly and continue immediately once the condition is satisfied.

If the wait may be materially longer, create a scoped condition-watch automation for the exact dependency when useful. The automation must: (1) check only the authoritative condition needed to unblock the current workstream; (2) continue only the already-approved next safe steps when the success condition is proven; (3) remain fail-closed on failure, ambiguity, contradiction or unexpected state; (4) never broaden scope, infer missing evidence, or cross a human/provider evidence gate; and (5) notify and stop rather than improvise if the dependency fails or materially changes risk.

Automation cadence must respect platform limits. When the available automation frequency is slower than the expected wait—for example, hourly automation for a deploy expected within minutes—direct in-chat re-check remains the preferred method.

## Provider lead-time rule

Whenever a planned Shiloh feature may require externally approved WhatsApp templates, identify the complete foreseeable template set during feature planning and submit that provider work early enough to run in parallel with engineering. Do not wait until implementation reaches the send step. Before calling a template submission batch complete, explicitly ask whether any other foreseeable business-initiated WhatsApp message in the current roadmap would require provider approval.

Do not submit speculative templates for flows whose business rules or message semantics are not yet approved.

## Attendance finalization — 🟢 VERIFIED for the 2026-08-14 reminder cohort

PR #226, #227 and #229 repaired the real WhatsApp/Admin defect chain. Real production evidence then proved:
- **#562 Zane Maree — Completed** from explicit human truth;
- **#357 Buhle Zulu — No-show** from explicit human truth;
- duplicate #357 replay was rejected with no second update.

Older unresolved historical visits remain 🟠 WAITING and must never be bulk-finalized or inferred. Direct connector-level CRM row read-back remains unavailable while the Render Postgres connector cannot negotiate the required SSL/TLS connection; do not fabricate row-level evidence.

## Real Client Perspective acceptance

- **#564 Dummy Test positive JP approval — 🟢 VERIFIED.** Preserve confirmed booking semantics; Calendar presentation was normalized with Mobile + WhatsApp + Service + Practitioner + native Location and MediHeel 🦶 icon.
- **#565 reschedule + cancellation — 🟢 VERIFIED.** Cancelled; never recreate merely for proof.
- **#566 Dummy Test JP decline — 🟢 VERIFIED.** Declined/released; never recreate merely for proof.
- **#561 historical test — cancelled.** Never recreate.
- **#567 Pa Derik — confirmed test appointment.** Christel approval is complete. Preserve #567 until Pa Derik's actual handset evidence is captured; only then cancel #567 through the normal Shiloh cancellation workflow. Do not modify/cancel it merely for proof.

## Booking approval delivery resilience — 🟢 VERIFIED

PR #232 repaired approval-delivery observability/recovery with `Admin → Appointments → Pending approvals`, authorized pending-only resend, durable notification-attempt/message-id evidence and unchanged first-valid-decision semantics.

The original Pa Derik pending/recovery incident is no longer the current state: explicit later human evidence confirms **#567 was approved by Christel and is confirmed**. The remaining Pa Derik task is handset delivery evidence for #567 followed by normal cancellation after that evidence is captured.

## Meta / WhatsApp lifecycle templates

### Provider-verified approved templates

- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- Direct Meta UI evidence also shows `shiloh_birthday_wish_v1`, `shiloh_birthday_wish_v2`, `appointment_followup`, and `appointment_reminder` as Active. Do not infer production configuration from provider status alone.

### Foreseeable core lifecycle package — provider review pending

PR #234 introduced the fail-closed lifecycle package. PR #238 completed the foreseeable core inventory and made provisioning inventory-driven.

Current provider truth from the controlled one-shot submissions:
- `shiloh_appointment_reminder_actions_v1` — **PENDING**;
- `shiloh_reschedule_confirmation_v1` — **PENDING**;
- `shiloh_cancellation_confirmation_v1` — **PENDING**;
- `shiloh_booking_approval_request_v1` — **PENDING**;
- `shiloh_booking_declined_v1` — **PENDING**;
- `shiloh_booking_approval_outcome_v1` — **PENDING**.

The second controlled one-shot deploy **`dep-da03tq5g1s2s73c9buag`** submitted only the three genuinely missing templates (`booking_approval_request`, `booking_declined`, `booking_approval_outcome`) and skipped the original three as already existing. Meta returned **PENDING** for all three new submissions. The trigger was immediately reset; **`dep-da03ub9t0dsc738r5h20`** is live with `META_LIFECYCLE_PROVISION_ON_START=false`, and no repeat provisioning occurred on the false-state restart.

All six remain fail-closed. Do not configure/enable their production delivery until Meta reports the exact expected template **APPROVED** and production configuration exactly matches. Real WhatsApp delivery evidence is still required before provider/evidence-gated lifecycle controls are promoted to verified.

The Meta Lifecycle Approval condition-watch now covers all six exact template names and notifies only when all six are approved or when a rejection/action-required state appears.

## Google integration status

- Google Calendar integration is operational through existing OAuth credentials, but operation alone does not prove OAuth-consent verification approval.
- Google Business Profile API access remains parked. Direct Google Cloud Console evidence on 2026-08-15 showed the Business Information API enabled but **0 QPM**, which means GBP API access approval is not yet evidenced. Revisit when Google sends the follow-up approval email or quota changes to the approved level.
- Google Contacts synchronization remains lower priority; CRM remains authoritative.

## Presentation and customer-experience workstreams

- PR #219 decline CTA / friendly policy-date polish — 🟠 WAITING for the next genuine applicable journey; do not manufacture a booking solely for proof.
- PR #222 Calendar staff-contact presentation — 🟢 VERIFIED.
- PR #225 MediHeel/pedicure Calendar icon specificity — 🟢 VERIFIED; foot/pedicure specificity wins over generic massage.
- Post-confirmation client UX package (**Book another treatment / My appointments / Main menu** plus natural-language equivalents) — ⚪ READY and can proceed while Meta review is externally blocked, provided no unapproved template is enabled or assumed.

## Provider/template and other gated items

- Reminder native Reschedule/Cancel buttons — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Reschedule confirmation lifecycle template — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Cancellation confirmation lifecycle template — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Practitioner approval-request template — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Client decline template — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Dual-authority approval outcome template — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Google Contacts synchronization — ⚪ READY, lower priority; CRM remains authoritative.
- Google Business Profile API — ⏸️ DEFERRED until Google approval/quota evidence changes from 0 QPM.
- Ozow — 🟠 WAITING for merchant configuration and explicit business rules. Do not submit payment templates until those semantics are approved.
- Destructive privacy execution — 🟠 WAITING; fail closed pending authority/evidence.

## Ordinary approval acceptance

Production ordinary approval rules still need genuine future evidence for the remaining practitioner approval combinations. Do not create appointments merely to manufacture proof.

Lifecycle state: 🟠 WAITING for genuine applicable journeys.

## Exact continuation state

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #567 Pa Derik confirmed after Christel approval — preserve until actual handset evidence is captured, then cancel through the normal Shiloh workflow.
- #562 Completed and #357 No-show are resolved from explicit human truth.
- Older attendance backlog remains human-truth-gated.
- PR #232 approval resilience complete; do not redo.
- PR #234 lifecycle template package merged.
- PR #238 complete foreseeable lifecycle-template inventory merged and production-live.
- PR #239 automatic-continuation governance merged.
- Final production flag `META_LIFECYCLE_PROVISION_ON_START=false` on live deploy `dep-da03ub9t0dsc738r5h20`.
- Six foreseeable core lifecycle templates are currently **PENDING** at Meta and must remain fail-closed.
- GBP API remains parked at last-authoritative **0 QPM** pending Google follow-up evidence.

**Authoritative current state:** GitHub `main` includes PR #238 application changes and PR #239 governance; Render `dep-da03ub9t0dsc738r5h20` is live with the provisioning flag false; booking/staff templates are APPROVED; all six foreseeable core lifecycle templates are PENDING; #567 is confirmed and evidence-gated before cancellation.

**Highest-priority state:** 🟠 **WAITING — Meta review of the six submitted lifecycle templates.** Read-only provider-status checks may proceed automatically. Do not enable them until exact provider approval is proven.

**Highest-priority genuinely actionable item while Meta is blocked:** ⚪ **READY — post-confirmation client UX package**, without enabling or depending on unapproved lifecycle templates.

**Authorization state:** apply the new-chat authorization model and automatic-continuation rule above. Evidence gates remain fail-closed regardless of chat authorization.
