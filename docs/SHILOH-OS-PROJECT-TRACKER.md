# Shiloh OS — Project Tracker

Updated: 2026-08-15
Purpose: concise operational dashboard. Master is the detailed current ledger; do not redo completed work.

## Canonical status system

| State | Meaning |
|---|---|
| 🟢 VERIFIED | Completed with sufficient authoritative evidence. |
| 🔵 ACTIVE | Work currently being executed. |
| ⚪ READY | Actionable now, but not currently being executed. |
| 🟠 WAITING | Requires human/provider/external/genuine-journey truth before advancing. |
| 🔴 DEFECT / HOLD | Proven problem or unsafe state; fail closed until repaired and re-verified. |
| ⏸️ DEFERRED | Deliberately postponed by explicit project decision. |

## Mandatory execution checkpoint

Before substantial engineering or any new controlled production mutation: state authoritative current state; identify the single highest-priority genuinely actionable item; explain why it is next; then stop for explicit user approval. Read-only verification, diagnostics, reconciliation, status/document maintenance and minor housekeeping may proceed without another approval gate.

## Current Product-Critical Gate

🟢 **VERIFIED at code/CI/deploy level — booking approval recovery/discoverability.**

PR #232 repaired the approval-delivery observability/recovery gap exposed by the Pa Derik / CRM #48 case. Current application baseline: **PR #232 / `f611b73f0310b9b493209492195bf91e61df20ea`**. Render deploy **`dep-da012qad0e5s73a9a1u0`** is live.

The real Pa Derik recovery action has **not** been executed. Existing booking truth remains untouched pending read-only confirmation and an explicit production resend approval.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| APP-RESILIENCE | Approval recovery / discoverability | 🟢 VERIFIED | PR #232; intentional red CI #656 (424 pass / 4 new fail) → green CI #661; merge `f611b73f...`; prod `dep-da012qad0e5s73a9a1u0` live. Adds Pending approvals + authorized pending-only resend + durable message-id/attempt audit. |
| APP-PADERIK | Pa Derik CRM #48 recovery | ⚪ READY | Existing canonical Christel booking preserved. Read-only verify Pending approvals first; actual resend requires fresh explicit production approval. |
| A1-NAV | Attendance finalization Admin UX | 🟢 VERIFIED | PR #226/#227/#229 + real WhatsApp navigation/list/decision flow. |
| A1-20260814 | 14 Aug reminder finalizations | 🟢 VERIFIED | #562 Completed; #357 No-show from explicit human truth + Shiloh confirmation. |
| A1-HIST | Older attendance backlog | 🟠 WAITING | Each historical visit requires explicit authorized human truth; never infer/bulk-finalize. |
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 VERIFIED | #564 lifecycle accepted; preserve semantics. |
| C1-APP-DUMMY-DECLINE | Dummy Test JP decline | 🟢 VERIFIED | #566 declined/released; do not recreate. |
| C1-RESCHEDULE | Canonical reschedule lifecycle | 🟢 VERIFIED | #565 accepted before later cancellation. |
| C1-CANCEL | Canonical cancellation | 🟢 VERIFIED | #565 cancelled; never recreate merely for proof. |
| C1-CALENDAR-CONTACT | Calendar staff contact presentation | 🟢 VERIFIED | PR #222 + #564 normalized/read back with Mobile + WhatsApp + native Location. |
| C1-CALENDAR-ICON | MediHeel/pedicure Calendar icon specificity | 🟢 VERIFIED | PR #225 red #634 → green #652; foot/pedicure specificity wins over generic massage. |
| C1-POSTBOOK-UX | Post-confirmation client actions | ⚪ READY | Book another treatment / My appointments / Main menu + natural-language fallbacks. Resume only after current approval-recovery verification is closed. |
| C1-APP-ORD | Ordinary approval rules | ⚪ READY | Marietjie self; Christel self; Abigail dual-authority/first-valid-decision genuine acceptance. |
| C1-DECLINE-CTA | Decline `Book another time` button | 🟠 WAITING | Observe on next genuine decline only. |
| C1-POLICY-DISPLAY | Friendly policy updated date | 🟠 WAITING | Observe on next genuine policy presentation. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule controls | 🟠 WAITING | Future genuine reschedule delivery only. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 WAITING | Provider/config/real-delivery evidence as applicable. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Separate lower-priority workstream; CRM remains authoritative. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed; authority + evidence required. |

## Approval resilience evidence

- Pa Derik / CRM #48 investigation found one canonical Calendar booking, not two successfully committed bookings.
- Meta acceptance of the original approval message did not prove handset receipt/display.
- PR #232 adds `Admin → Appointments → Pending approvals` for authorized requests.
- Explicit resend is pending-only, keeps the same approval/decline authority, and does not create or mutate appointment truth.
- Resend records `approver_notification_attempts`, `approver_message_id`, `last_approver_notification_attempt_at`, plus audit action `client.booking_approval.notification_attempted`.
- Pa Derik was deliberately not resent during engineering.

## Verified attendance evidence

- #562 Completed and #357 No-show were finalized from explicit human truth.
- Duplicate #357 replay failed closed.
- Older attendance remains individually human-truth-gated.
- Direct connector-level CRM row read-back remains unavailable due Render Postgres SSL/TLS negotiation; do not fabricate that evidence.

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #562 Completed and #357 No-show resolved.
- PR #225 complete; do not redo.
- PR #232 complete, merged and production-live.
- Pa Derik / CRM #48 existing booking remains untouched.

**Authoritative current state:** application baseline PR #232 / `f611b73f...`; Render `dep-da012qad0e5s73a9a1u0` live; approval recovery/discoverability is production-live; Pa Derik's real resend remains unexecuted.

**Highest-priority genuinely actionable item:** ⚪ **READY — read-only verify Christel's Pending approvals surface and determine whether Pa Derik is still pending.**

**Why this is next:** it closes the real operational incident that triggered PR #232 without mutating booking truth. If Pa Derik is still pending, an actual resend is the next controlled production mutation and must stop for explicit approval.

**Approval gate:** read-only verification may proceed automatically. Actual resend to Christel requires fresh explicit approval immediately before sending.

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative. Preserve provider-template, historical attendance, payment and privacy WAITING items fail-closed. Never recreate cancelled test appointments merely for proof.
