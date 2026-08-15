# Shiloh OS — Master Project Status

Updated: 2026-08-15
Purpose: permanent current-state project-management source of truth. Historical detail remains in Git history/archive; do not redo accepted work.

## Authority and production baseline

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar, Meta/WhatsApp provider evidence and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or Calendar state.

Current application-code baseline: **PR #236** squash merge `44cdd7bf9ae2fbef03f4f93c8b6abab4bf9e2e90`. Render production deploy **`dep-da03ab1t0dsc738pm16g`** is verified **live** on 2026-08-15 with `META_LIFECYCLE_PROVISION_ON_START=false` after the approved one-shot provider submission.

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

### Client lifecycle package — submitted, provider review pending

PR #234 added a fail-closed lifecycle-template package and authenticated status/submission surface for:
- `shiloh_appointment_reminder_actions_v1`;
- `shiloh_reschedule_confirmation_v1`;
- `shiloh_cancellation_confirmation_v1`.

PR #236 added an explicit one-shot startup provisioning gate because the available Render connector could not call the authenticated admin endpoint without exposing credentials. During controlled production deploy `dep-da039njvctds73b1laqg`, Meta returned **PENDING** for all three newly submitted templates. The trigger was then reset to `META_LIFECYCLE_PROVISION_ON_START=false`; final production deploy `dep-da03ab1t0dsc738pm16g` is live and no further startup submission occurs.

Current provider truth:
- `shiloh_appointment_reminder_actions_v1` — **PENDING**;
- `shiloh_reschedule_confirmation_v1` — **PENDING**;
- `shiloh_cancellation_confirmation_v1` — **PENDING**.

All three remain fail-closed. Do not configure/enable lifecycle delivery until Meta reports the exact expected template **APPROVED** and production configuration exactly matches. Real WhatsApp delivery evidence is still required before provider/evidence-gated lifecycle controls are promoted to verified.

Birthday template status remains unproven in the current audit; do not infer approval from older evidence.

## Google integration status

- Google Calendar integration is operational through existing OAuth credentials, but operation alone does not prove OAuth-consent verification approval.
- Google Business Profile API access remains parked. Direct Google Cloud Console evidence on 2026-08-15 showed the Business Information API enabled but **0 QPM**, which means GBP API access approval is not yet evidenced. Revisit when Google sends the follow-up approval email or quota changes to the approved level.
- Google Contacts synchronization remains lower priority; CRM remains authoritative.

## Presentation and customer-experience workstreams

- PR #219 decline CTA / friendly policy-date polish — 🟠 WAITING for the next genuine applicable journey; do not manufacture a booking solely for proof.
- PR #222 Calendar staff-contact presentation — 🟢 VERIFIED.
- PR #225 MediHeel/pedicure Calendar icon specificity — 🟢 VERIFIED; foot/pedicure specificity wins over generic massage.
- Post-confirmation client UX package (**Book another treatment / My appointments / Main menu** plus natural-language equivalents) — ⚪ READY, but remains behind the current Meta lifecycle/provider review gate.

## Provider/template and other gated items

- Reminder native Reschedule/Cancel buttons — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Reschedule confirmation lifecycle template — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Cancellation confirmation lifecycle template — 🟠 WAITING for Meta approval + config + real-delivery evidence.
- Google Contacts synchronization — ⚪ READY, lower priority; CRM remains authoritative.
- Google Business Profile API — ⏸️ DEFERRED until Google approval/quota evidence changes from 0 QPM.
- Ozow — 🟠 WAITING for merchant configuration and explicit business rules.
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
- PR #236 one-shot Meta provisioning gate merged; final production flag is false.
- Three lifecycle templates are currently **PENDING** at Meta and must remain fail-closed.
- GBP API remains parked at last-authoritative **0 QPM** pending Google follow-up evidence.

**Authoritative current state:** GitHub `main` application baseline is PR #236 / `44cdd7bf...`; Render `dep-da03ab1t0dsc738pm16g` is live; booking/staff templates are APPROVED; reminder-actions/reschedule/cancellation lifecycle templates are PENDING; #567 is confirmed and evidence-gated before cancellation.

**Highest-priority genuinely actionable item:** 🟠 **WAITING — Meta review of the three newly submitted lifecycle templates.** While waiting, read-only provider-status checks may proceed. Do not enable them until exact provider approval is proven.

**Next non-provider-blocked product item:** ⚪ **READY — post-confirmation client UX package**, subject to preserving all current evidence gates and without using unapproved lifecycle templates.

**Authorization state:** apply the new-chat authorization model above. Evidence gates remain fail-closed regardless of chat authorization.
