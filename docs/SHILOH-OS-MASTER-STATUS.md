# Shiloh OS — Master Project Status

Updated: 2026-08-15
Purpose: permanent current-state project-management source of truth. Historical detail remains in Git history/archive; do not redo accepted work.

## Authority and production baseline

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or Calendar state.

Current application-code baseline: **PR #232** squash merge `f611b73f0310b9b493209492195bf91e61df20ea`. Render production deploy **`dep-da012qad0e5s73a9a1u0`** is verified **live** on 2026-08-15.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test uses JP admin account alone. Pending holds have no automatic expiry. MediHeel remains Christel only.

## Canonical project status taxonomy

- 🟢 **VERIFIED** — completed with sufficient authoritative evidence.
- 🔵 **ACTIVE** — work currently being executed.
- ⚪ **READY** — genuinely actionable now, but not currently being executed.
- 🟠 **WAITING** — requires human, provider, external or genuine-journey evidence before it can advance.
- 🔴 **DEFECT / HOLD** — a proven problem or unsafe state; fail closed until repaired and re-verified.
- ⏸️ **DEFERRED** — deliberately postponed by explicit project decision.

## Execution Protocol — mandatory checkpoint before substantial work

Before substantial engineering or any new controlled production mutation:
1. state authoritative current state;
2. identify the single highest-priority genuinely actionable item;
3. explain why it is next;
4. stop for explicit user approval.

Read-only verification, diagnostics, reconciliation, documentation/status maintenance and minor housekeeping may proceed without another approval gate.

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

## Booking approval delivery resilience — PR #232

### Trigger / production evidence

Pa Derik / CRM #48 exposed a critical observability/recovery gap: one canonical Christel booking existed, Meta had accepted the outbound practitioner approval request, but real handset receipt/display was not proven and there was no practical recovery path after `approver_notified_at` had been set. Evidence did **not** support two successfully committed appointments; only one canonical Calendar booking was present, while a later second-service interaction never reached canonical appointment creation.

### Repair — 🟢 VERIFIED at code/CI/deploy level

**PR #232** is merged and production-live.

Self-test-first evidence:
- intentional red **CI #656**: 424 pass / exactly 4 new resilience assertions fail;
- implementation green **CI #661**;
- squash merge `f611b73f0310b9b493209492195bf91e61df20ea`;
- Render deploy `dep-da012qad0e5s73a9a1u0` verified live.

The additive recovery surface now provides:
- `Admin → Appointments → Pending approvals` discoverability for authorized pending booking requests;
- explicit pending-only resend using the original Approve / Decline decision IDs;
- no appointment creation, reschedule, cancellation or decision mutation during resend;
- durable resend evidence: `approver_notification_attempts`, `approver_message_id`, and `last_approver_notification_attempt_at`;
- audit action `client.booking_approval.notification_attempted` for explicit resend attempts;
- authorization remains scoped to existing appointment approval authority; approval/decline first-valid-decision semantics are unchanged.

Important evidence boundary: the repair is **production-live but the new real WhatsApp recovery journey has not yet been exercised on Pa Derik**. Pa Derik's existing booking was deliberately left untouched during engineering. Therefore code/CI/deploy is VERIFIED, while real handset resend receipt remains evidence-gated until an explicitly approved production action is performed.

## Presentation and customer-experience workstreams

- PR #219 decline CTA / friendly policy-date polish — 🟠 WAITING for the next genuine applicable journey; do not manufacture a booking solely for proof.
- PR #222 Calendar staff-contact presentation — 🟢 VERIFIED.
- PR #225 MediHeel/pedicure Calendar icon specificity — 🟢 VERIFIED; red CI #634 → green #652; foot/pedicure specificity wins over generic massage.
- Post-confirmation client UX package (**Book another treatment / My appointments / Main menu** plus natural-language equivalents) — ⚪ READY and already approved conceptually, but paused behind the current approval-recovery production verification.

## Provider/template and other gated items

- Post-reschedule Google/Apple CTAs + Reschedule/Cancel controls — 🟠 WAITING for future genuine delivery.
- Reminder native Reschedule/Cancel buttons — 🟠 WAITING for Meta/provider/config/real-delivery evidence.
- Google Contacts synchronization — ⚪ READY, lower priority; CRM remains authoritative.
- Ozow — 🟠 WAITING for merchant configuration and explicit business rules.
- Destructive privacy execution — 🟠 WAITING; fail closed pending authority/evidence.

## Ordinary approval acceptance

Production ordinary approval rules still need genuine controlled evidence: Marietjie self-approval; Christel self-approval; Abigail approved by Abigail or Christel with first valid decision authoritative.

Lifecycle state: ⚪ READY.

## Exact continuation state

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #562 Completed and #357 No-show are resolved from explicit human truth.
- Older attendance backlog remains human-truth-gated.
- PR #225 is completed and must not be redone.
- **PR #232 is merged, green and production-live.**
- **Pa Derik / CRM #48 existing canonical booking remains untouched.** No resend, approval, decline or replacement booking has been performed during the repair.

**Authoritative current state:** GitHub `main` application baseline is PR #232 / `f611b73f...`; Render `dep-da012qad0e5s73a9a1u0` is live; approval recovery/discoverability code is production-live; Pa Derik's real recovery action remains unexecuted.

**Highest-priority genuinely actionable item:** ⚪ **READY — perform a read-only check of the new Pending approvals surface for Christel, then, only if Pa Derik appears pending and the user explicitly approves the production mutation, resend that existing approval request.**

**Why this is next:** the engineering defect is repaired, but the real operational problem that triggered it is not fully closed until the pending state is observed and—if still pending—the recovery action is exercised. This outranks returning to post-confirmation UX because it concerns an existing real booking and approval gate.

**Approval state:** read-only verification of the Pending approvals surface may proceed without another gate. Any actual resend to Christel is a controlled production messaging mutation and requires explicit approval immediately before execution.
