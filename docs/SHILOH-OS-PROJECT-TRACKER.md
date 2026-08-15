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

🟢 **VERIFIED — attendance-finalization Admin workflow and 2026-08-14 reminder cohort.**

PR #226, #227 and #229 repaired the real production defect chain. Current application baseline is PR #229 squash merge `36bf3687c8393bbc03e9406367f8afcbf15fa080`; Render deploy **`dep-da004j8u01pc73epn00g`** is live.

Real WhatsApp evidence proves the workflow and explicit decisions:
- #562 Zane Maree — **Completed**, explicitly confirmed by Christel and acknowledged by Shiloh.
- #357 Buhle Zulu — **No-show**, intentionally selected/explicitly confirmed by Christel and acknowledged by Shiloh.
- Duplicate #357 No-show replay was rejected without a second update.

Older historical unresolved visits remain 🟠 **WAITING** individually for explicit human truth. Never infer or bulk-finalize attendance.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| A1-NAV | Attendance finalization Admin UX | 🟢 VERIFIED | PR #226 red #635 → green #638; PR #227 red #640 → green #642; PR #229 green #648; real WhatsApp navigation/list/decision flow verified. |
| A1-20260814 | 14 Aug reminder finalizations | 🟢 VERIFIED | #562 Completed; #357 No-show; both based on explicit human truth + Shiloh canonical-write confirmation. |
| A1-HIST | Older attendance backlog | 🟠 WAITING | Historical unresolved visits visible in Finalize past visits; each requires explicit authorized human truth. Do not infer/bulk-finalize. |
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 VERIFIED | #564 lifecycle accepted; preserve semantics. |
| C1-APP-DUMMY-DECLINE | Dummy Test JP decline | 🟢 VERIFIED | #566 declined/released; do not recreate. |
| C1-RESCHEDULE | Canonical reschedule lifecycle | 🟢 VERIFIED | #565 accepted before later cancellation. |
| C1-CANCEL | Canonical cancellation | 🟢 VERIFIED | #565 cancelled; never recreate merely for proof. |
| C1-CALENDAR-CONTACT | Calendar staff contact presentation | 🟢 VERIFIED | PR #222 red #627 → green #628; #564 normalized/read back with Mobile + WhatsApp + native Location. |
| C1-CALENDAR-ICON | MediHeel/pedicure Calendar icon specificity | ⚪ READY | PR #225 already open from approved self-test-first work; finish from existing state, do not duplicate. |
| C1-POSTBOOK-UX | Post-confirmation client actions | ⚪ READY | Explicitly approved: Book another treatment / My appointments / Main menu + natural-language fallbacks. Queue behind already-started PR #225. |
| C1-APP-ORD | Ordinary approval rules | ⚪ READY | Marietjie self, Christel self, then Abigail dual-authority/first-valid-decision genuine acceptance. |
| C1-DECLINE-CTA | Decline `Book another time` button | 🟠 WAITING | Implementation live; observe on next genuine decline only. |
| C1-POLICY-DISPLAY | Friendly policy updated date | 🟠 WAITING | Implementation live; observe on next genuine policy presentation. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule controls | 🟠 WAITING | Future genuine reschedule delivery only. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 WAITING | Provider/config/real-delivery evidence as applicable. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Separate lower-priority workstream; CRM remains authoritative. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail-closed; authority + evidence required. |

## Verified attendance evidence

- End-of-day reminder on 2026-08-14 identified two pending visits for that clinic date.
- Real Admin attempts exposed three separate defects; each was repaired without inferring attendance.
- Pagination repair reserves WhatsApp's 10-row budget: maximum 8 visits + More + Back.
- Real list showed #562 and #357 as the two newest 14 Aug unresolved visits.
- #562 decision screen showed Zane Maree / Full Body Swedish / Abigail / Fri 14 Aug 15:00; Christel explicitly confirmed Completed; Shiloh confirmed the canonical status write.
- #357 was intentionally selected No-show by Christel; Shiloh confirmed the canonical status write. A duplicate replay was rejected safely.
- Direct connector-level CRM row read-back remains unavailable due Render Postgres SSL/TLS negotiation; do not fabricate that evidence.

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed 15 Aug 2026 10:45–12:15 Christel + MediHeel — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #562 Completed and #357 No-show are resolved from explicit human truth.
- Older attendance backlog remains human-truth-gated.

**Authoritative current state:** application baseline PR #229 / `36bf3687...`; Render `dep-da004j8u01pc73epn00g` live; attendance Admin UX and the two 14 Aug reminder finalizations are verified.

**Highest-priority genuinely actionable item:** ⚪ **READY — finish open PR #225 MediHeel/pedicure Calendar icon specificity** from its existing self-test-first state.

**Why this is next:** attendance's higher-priority live operational defect chain is closed. PR #225 was already approved and started before the interruption, so it should be completed before starting the separately approved post-confirmation UX package.

**Approval gate:** substantial engineering still requires the explicit four-part checkpoint and fresh approval before resuming PR #225.

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative. Preserve all provider-template, historical attendance, payment and privacy WAITING items fail-closed. Never recreate cancelled test appointments merely for proof.