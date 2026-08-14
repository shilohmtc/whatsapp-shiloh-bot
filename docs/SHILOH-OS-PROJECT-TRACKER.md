# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. Master is the detailed current ledger; do not redo completed work.

## Mandatory execution checkpoint

Before substantial engineering or any new controlled production mutation, always stop and state:

1. **Authoritative current state** — verified from GitHub `main`, Render production, Shiloh CRM, Google Calendar and/or explicit real WhatsApp/human evidence as applicable.
2. **Highest-priority actionable item** — the single genuinely unfinished item that can be acted on now.
3. **Why it is next** — why this item outranks alternatives, including which alternatives are completed, blocked or evidence-gated.
4. **Approval gate** — ask for explicit user approval before substantial engineering, schema/data changes, migrations, production mutations, new controlled bookings or material workflow changes.

Read-only verification, diagnostics, reconciliation, status/document maintenance and clearly requested minor housekeeping may proceed without another approval gate.

## Current Product-Critical Gate

🔵 **Highest-priority actionable Client Perspective item: ordinary approval acceptance.** Dummy Test JP approval (#564) and JP decline/release (#566) are REAL-ACCEPTED. Production ordinary rules still need genuine controlled evidence: Marietjie self; Christel self; Abigail approved by Abigail or Christel, first valid decision authoritative.

**Why this is next:** Dummy Test positive and negative approval paths are complete. Calendar staff-contact polish is already code/CI + production live and now waits only for the next genuine applicable Calendar journey. Ordinary production approval remains genuinely unaccepted and is not externally blocked. Reminder-template, attendance, payment and privacy work remains blocked or evidence-gated.

**Approval state:** **WAITING FOR USER APPROVAL TO PROCEED.** Do not start a new controlled booking or substantial engineering from this tracker state without explicit approval.

Current application baseline: PR **#222** squash merge `5c856745f7ba4eb39fb363071a49418c09fd672e`; Render deploy **`dep-d9vh9sm7bikc73c40avg` live**, post-deploy `/health` 200.

## Real-accepted client evidence

- ✅ MediHeel presentation and practitioner truth: Christel only.
- ✅ #564 positive Dummy Test JP approval, indefinite hold and canonical Calendar confirmation.
- ✅ #565 canonical reschedule and later cancellation; #564 preserved.
- ✅ Reminder/change coordination and destructive cancellation review UX.
- ✅ #566 Dummy Test JP decline: indefinite hold → JP sole-approver request → explicit Decline → client not-confirmed outcome → no #566 Calendar event → exact Abigail/Bamboo 12:15 capacity offered again.
- ✅ #564 independently remained unchanged during #566 verification and again after PR #222 deployment.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 REAL-ACCEPTED | #564 complete; leave unchanged. |
| C1-APP-DUMMY-DECLINE | Dummy Test JP decline | 🟢 REAL-ACCEPTED | #566 declined/released; do not recreate. |
| C1-RESCHEDULE | Canonical reschedule lifecycle | 🟢 REAL-ACCEPTED | #565 accepted before later cancellation. |
| C1-CANCEL | Canonical cancellation | 🟢 REAL-ACCEPTED | #565 cancelled; Calendar absent; #564 preserved. |
| C1-DECLINE-CTA | Decline `Book another time` button | 🟡 CODE/CI + PROD LIVE | Observe on next genuine decline only. |
| C1-POLICY-DISPLAY | Friendly policy updated date | 🟡 CODE/CI + PROD LIVE | Observe on next genuine policy presentation; internal `2026-08-11-v1` unchanged. |
| C1-CALENDAR-CONTACT | Calendar staff contact presentation | 🟡 CODE/CI + PROD LIVE | Next genuine create/update: confirm Client + Mobile + WhatsApp + Service + Practitioner and native Location; do not rewrite #564 merely for proof. |
| C1-APP-ORD | Ordinary approval rules | 🔵 ACTIVE NEXT / APPROVAL-GATED | Genuine controlled self/dual-authority evidence after explicit user approval. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule calendar/change controls | 🟡 CODE/CI + PROD LIVE | Future genuine reschedule delivery only. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 PROVIDER/TEMPLATE WAITING | Meta approval → env config → real delivery. |
| GCONTACTS | CRM → Google Contacts | 🟠 NOT IMPLEMENTED | Separate explicit workstream; CRM authority. |
| A1 | Attendance finalizations | 🟠 WAITING | Genuine Completed/No-show truth only. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| PRIV | Destructive privacy execution | 🟠 WAITING / FAIL-CLOSED | Authority + evidence required. |

## PR #219 presentation evidence

- Declined-booking CTA uses **Book another time** with stable `BOOKING` payload and typed fallback.
- Client policy display is **Policy updated: 11 August 2026**.
- Internal immutable/audit policy version remains **2026-08-11-v1**; terms and explicit acceptance semantics unchanged.
- Self-test-first: red CI #617; final green CI #621; production live.

## PR #222 Calendar contact evidence

- Visible Calendar description keeps **Client, Mobile, WhatsApp, Service, Practitioner**.
- WhatsApp uses `https://wa.me/<digits>` derived from client mobile.
- Clinic is written to the native Google Calendar **Location** field.
- Visible CRM appointment-number and source lines are removed.
- Private sync metadata remains unchanged for appointment id/source/staff/service/mobile.
- Creation and legitimate update/reschedule paths share the same polished contract.
- Self-test-first: red CI **#627**, green CI **#628**.
- PR #222 merged; Render deploy `dep-d9vh9sm7bikc73c40avg` live and healthy.
- #564 was intentionally left untouched; REAL presentation acceptance waits for the next genuine Calendar create/update.

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed 15 Aug 2026 10:45–12:15 Christel + MediHeel — leave unchanged.
- #565 cancelled — never recreate merely for proof.
- #566 declined by JP; no Calendar event; held Abigail/Bamboo 12:15 slot proven released — never recreate merely for proof.

**Authoritative current state:** PR #222 / deploy `dep-d9vh9sm7bikc73c40avg` is the current application baseline; controlled appointment state above remains authoritative and #564 remains unchanged.

**Highest-priority actionable item:** controlled ordinary approval acceptance, starting with one self-approval path and then Abigail's dual-authority/first-valid-decision rule.

**Why this is next:** ordinary approval is the highest-value genuinely unfinished acceptance item that is not externally blocked; Calendar contact polish is already production-live and its remaining acceptance is genuine-journey-gated.

**Approval gate:** **WAITING FOR USER APPROVAL TO PROCEED.**

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative. Pending holds remain indefinite until explicit decision. Preserve all provider-template, attendance, payment and privacy WAITING items fail-closed.
