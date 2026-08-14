# Shiloh OS — Project Tracker

Updated: 2026-08-14
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

**Rule:** State and evidence maturity are separate. `Code/CI + prod live`, PR/deploy references and test results belong in evidence/action text, not in State. Do not use legacy 🟡 or ad-hoc compound status labels in current rows. Legacy ⬜ maps to ⚪ READY.

## Mandatory execution checkpoint

Before substantial engineering or any new controlled production mutation, always stop and state:

1. **Authoritative current state** — verified from GitHub `main`, Render production, Shiloh CRM, Google Calendar and/or explicit real WhatsApp/human evidence as applicable.
2. **Highest-priority actionable item** — the single genuinely unfinished item that can be acted on now.
3. **Why it is next** — why this item outranks alternatives, including which alternatives are completed, blocked or evidence-gated.
4. **Approval gate** — ask for explicit user approval before substantial engineering, schema/data changes, migrations, production mutations, new controlled bookings or material workflow changes.

Read-only verification, diagnostics, reconciliation, status/document maintenance and clearly requested minor housekeeping may proceed without another approval gate.

## Current Product-Critical Gate

⚪ **READY — ordinary approval acceptance.** Dummy Test JP approval (#564), JP decline/release (#566), reschedule/cancellation (#565), and Calendar contact presentation are VERIFIED. Production ordinary rules still need genuine controlled evidence: Marietjie self; Christel self; Abigail approved by Abigail or Christel, first valid decision authoritative.

**Why this is next:** ordinary approval remains genuinely unfinished and is not externally blocked. Reminder-template, genuine-journey presentation evidence, attendance, payment and privacy work are WAITING. Google Contacts is READY but lower priority.

**Approval state:** **WAITING FOR USER APPROVAL TO PROCEED WITH ORDINARY APPROVAL ACCEPTANCE.**

Current application-code baseline: PR **#222** squash merge `5c856745f7ba4eb39fb363071a49418c09fd672e`. Functional deploy **`dep-d9vh9sm7bikc73c40avg`** was verified live with post-deploy `/health` 200. Documentation-only auto-deploys do not change the application-code baseline; verify Render directly for the exact current deploy ID.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 VERIFIED | #564 booking lifecycle accepted; preserve semantics. |
| C1-APP-DUMMY-DECLINE | Dummy Test JP decline | 🟢 VERIFIED | #566 declined/released; do not recreate. |
| C1-RESCHEDULE | Canonical reschedule lifecycle | 🟢 VERIFIED | #565 accepted before later cancellation. |
| C1-CANCEL | Canonical cancellation | 🟢 VERIFIED | #565 cancelled; Calendar absent. |
| C1-CALENDAR-CONTACT | Calendar staff contact presentation | 🟢 VERIFIED | PR #222 red #627 → green #628; #564 normalized in place and Calendar read-back verifies Mobile + WhatsApp + native Location. |
| C1-APP-ORD | Ordinary approval rules | ⚪ READY | Highest-priority next controlled acceptance after explicit user approval. |
| C1-DECLINE-CTA | Decline `Book another time` button | 🟠 WAITING | Code/CI/prod live; observe on next genuine decline only. |
| C1-POLICY-DISPLAY | Friendly policy updated date | 🟠 WAITING | Code/CI/prod live; observe on next genuine policy presentation; internal `2026-08-11-v1` unchanged. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule calendar/change controls | 🟠 WAITING | Code/CI/prod live; future genuine reschedule delivery only. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 WAITING | Meta approval → explicit env config → real delivery. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Separate lower-priority workstream; not implemented; CRM remains authoritative. |
| A1 | Attendance finalizations | 🟠 WAITING | Genuine Completed/No-show truth only. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail-closed; authority + evidence required. |

No current workstream is 🔴 DEFECT / HOLD or ⏸️ DEFERRED. Introduce those states only when authoritative project truth warrants them.

## Verified client evidence

- 🟢 MediHeel presentation and practitioner truth: Christel only.
- 🟢 #564 positive Dummy Test JP approval and indefinite hold lifecycle.
- 🟢 #565 canonical reschedule and later cancellation.
- 🟢 #566 explicit JP decline, no Calendar event, released capacity proven available again.
- 🟢 #564 Calendar presentation normalized after explicit approval without changing event identity, time, service, practitioner or booking state. Read-back verifies `+27 71 674 2646`, `https://wa.me/27716742646`, and native clinic Location.

## Implementation evidence still waiting for genuine journey acceptance

### PR #219

- Declined-booking CTA uses **Book another time** with stable `BOOKING` payload and typed fallback.
- Client policy display is **Policy updated: 11 August 2026**.
- Internal immutable/audit policy version remains `2026-08-11-v1`; terms and explicit acceptance semantics unchanged.
- Self-test-first: red CI #617; final green CI #621; production live.
- Lifecycle state remains 🟠 WAITING for next genuine applicable WhatsApp evidence.

### PR #222

- Calendar description contract: **Client, Mobile, WhatsApp, Service, Practitioner**.
- WhatsApp: `https://wa.me/<digits>` derived from stored mobile.
- Clinic: native Google Calendar **Location**.
- Visible CRM appointment-number and source lines removed.
- Private sync metadata preserved.
- Creation and legitimate update/reschedule paths share the same contract.
- Self-test-first: red CI #627; green CI #628; functional production deploy verified healthy.
- Real Calendar presentation is now 🟢 VERIFIED through approved #564 normalization/read-back.

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed 15 Aug 2026 10:45–12:15 Christel + MediHeel — booking semantics preserved; Calendar presentation normalized and verified.
- #565 cancelled — never recreate merely for proof.
- #566 declined by JP; no Calendar event; held Abigail/Bamboo 12:15 slot proven released — never recreate merely for proof.

**Authoritative current state:** PR #222 is the application-code baseline; #564 Calendar presentation is normalized and verified; controlled appointment truth above remains authoritative. Verify Render directly for the exact current deploy because documentation-only commits also auto-deploy.

**Highest-priority actionable item:** ⚪ **READY — controlled ordinary approval acceptance**, starting with one self-approval path and then Abigail's dual-authority/first-valid-decision rule.

**Why this is next:** ordinary approval is the highest-value unfinished workstream that is actionable now. Competing provider/evidence items are WAITING; Google Contacts is lower-priority READY work.

**Approval gate:** **WAITING FOR USER APPROVAL TO PROCEED WITH ORDINARY APPROVAL ACCEPTANCE.**

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative. Pending holds remain indefinite until explicit decision. Preserve all provider-template, attendance, payment and privacy WAITING items fail-closed.
