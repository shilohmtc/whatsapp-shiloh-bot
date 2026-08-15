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

**Rule:** state and evidence maturity are separate. Code/CI/deploy references belong in evidence/action text, not in State.

## Mandatory execution checkpoint

Before substantial engineering or any new controlled production mutation:

1. State the authoritative current state.
2. Identify the single highest-priority genuinely actionable item.
3. Explain why it is next.
4. Stop for explicit user approval.

Read-only verification, diagnostics, reconciliation, status/document maintenance and minor housekeeping may proceed without another approval gate.

## Current Product-Critical Gate

🔵 **ACTIVE — attendance-finalization Admin workflow real-WhatsApp verification.**

Two real visits from clinic date **2026-08-14** require explicit finalization. Attendance is never inferred. PR #226 repaired stale-session interception, finalization discoverability and unsafe section refresh. PR #227 repaired literal `Admin` entry routing. Current production baseline is PR #227 squash merge `4253f3404afca8e8245e2a4f6413d0aedf5c599f`; Render deploy **`dep-d9vvvgh42hec739k6k60`** is verified live with fresh `/health` 200.

**Next action:** real WhatsApp `Admin → Appointments → Finalize past visits`; stop before choosing Completed/No-show and verify the pending visits shown.

**Attendance decision gate:** 🟠 **WAITING** for explicit authorized human Completed/No-show truth.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| A1-NAV | Attendance finalization Admin UX | 🔵 ACTIVE | PR #226 red #635 → green #638; PR #227 red #640 → green #642; prod `dep-d9vvvgh42hec739k6k60` live. Real WhatsApp verification next. |
| A1 | Attendance finalizations | 🟠 WAITING | 2 visits from 2026-08-14 require explicit Completed/No-show truth; never infer. |
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 VERIFIED | #564 lifecycle accepted; preserve semantics. |
| C1-APP-DUMMY-DECLINE | Dummy Test JP decline | 🟢 VERIFIED | #566 declined/released; do not recreate. |
| C1-RESCHEDULE | Canonical reschedule lifecycle | 🟢 VERIFIED | #565 accepted before later cancellation. |
| C1-CANCEL | Canonical cancellation | 🟢 VERIFIED | #565 cancelled; never recreate merely for proof. |
| C1-CALENDAR-CONTACT | Calendar staff contact presentation | 🟢 VERIFIED | PR #222 red #627 → green #628; #564 normalized/read back with Mobile + WhatsApp + native Location. |
| C1-CALENDAR-ICON | MediHeel/pedicure Calendar icon specificity | ⚪ READY | PR #225 already open from approved self-test-first work; resume, do not duplicate, after attendance operational gate. |
| C1-POSTBOOK-UX | Post-confirmation client actions | ⚪ READY | Explicitly approved: Book another treatment / My appointments / Main menu + natural-language fallbacks. Queued behind active higher-priority work. |
| C1-APP-ORD | Ordinary approval rules | ⚪ READY | Marietjie self, Christel self, then Abigail dual-authority/first-valid-decision genuine acceptance. |
| C1-DECLINE-CTA | Decline `Book another time` button | 🟠 WAITING | Implementation live; observe on next genuine decline only. |
| C1-POLICY-DISPLAY | Friendly policy updated date | 🟠 WAITING | Implementation live; observe on next genuine policy presentation. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule controls | 🟠 WAITING | Future genuine reschedule delivery only. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 WAITING | Provider/config/real-delivery evidence as applicable. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Separate lower-priority workstream; CRM remains authoritative. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail-closed; authority + evidence required. |

## Verified client evidence

- 🟢 MediHeel practitioner truth: Christel only.
- 🟢 #564 positive Dummy Test JP approval and indefinite hold lifecycle.
- 🟢 #565 canonical reschedule and later cancellation.
- 🟢 #566 explicit JP decline, no Calendar event, released capacity.
- 🟢 #564 Calendar presentation normalized without changing booking semantics.

## Active attendance evidence

- Real end-of-day staff reminder on 2026-08-14 identified 2 pending finalizations for clinic date 2026-08-14.
- Reminder wording `from today` was correct at the original send time; this was not the defect.
- First real Admin attempt exposed stale Manage-booking interception and missing/unsafe finalization navigation.
- PR #226 repaired that defect chain and deployed successfully.
- Second real Admin attempt proved literal `Admin` still fell through to the legacy assistant.
- PR #227 repaired literal `Admin` as canonical Admin/home entry; full green CI #642; current Render deploy live/healthy.
- No attendance value has been inferred or written during this repair.

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed 15 Aug 2026 10:45–12:15 Christel + MediHeel — preserve semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.

**Authoritative current state:** application baseline PR #227 / `4253f340...`; Render `dep-d9vvvgh42hec739k6k60` live; attendance truth untouched.

**Highest-priority actionable item:** 🔵 **ACTIVE — real WhatsApp verification of `Admin → Appointments → Finalize past visits`**, stopping before any attendance choice.

**Why this is next:** it closes the currently active operational defect and safely exposes the two real pending visits for human truth. Ordinary approval, icon polish and post-confirmation UX remain queued and must not be started in parallel.

**Approval gate:** read-only verification already authorized. Completed/No-show requires explicit human truth. Any newly proven substantial defect requires a new repair approval.

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative. Preserve all provider-template, attendance, payment and privacy WAITING items fail-closed. Never recreate cancelled test appointments merely for proof.
