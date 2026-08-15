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

PR #226, #227 and #229 repaired the real production defect chain. The current application baseline is now PR #225 squash merge `3fe028810902fe2b370f067e213f7c2633c89efb`; Render deploy **`dep-da00cjad0e5s73a8thng`** is verified live/healthy.

Real WhatsApp evidence proves the attendance workflow and explicit decisions:
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
| C1-CALENDAR-ICON | MediHeel/pedicure Calendar icon specificity | 🟢 VERIFIED | PR #225 intentional red #634 → green #652; merge `3fe02881...`; prod `dep-da00cjad0e5s73a8thng` live. Foot/pedicure specificity now wins over generic massage; ordinary massage remains 💆. |
| C1-POSTBOOK-UX | Post-confirmation client actions | ⚪ READY | Explicitly approved: Book another treatment / My appointments / Main menu + natural-language fallbacks. Highest-priority next customer-facing workstream. |
| C1-APP-ORD | Ordinary approval rules | ⚪ READY | Marietjie self, Christel self, then Abigail dual-authority/first-valid-decision genuine acceptance. |
| C1-DECLINE-CTA | Decline `Book another time` button | 🟠 WAITING | Implementation live; observe on next genuine decline only. |
| C1-POLICY-DISPLAY | Friendly policy updated date | 🟠 WAITING | Implementation live; observe on next genuine policy presentation. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule controls | 🟠 WAITING | Future genuine reschedule delivery only. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 WAITING | Provider/config/real-delivery evidence as applicable. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Separate lower-priority workstream; CRM remains authoritative. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail-closed; authority + evidence required. |

## Verified presentation evidence

- #564 Calendar presentation normalized without changing booking semantics.
- PR #222 established Client + formatted Mobile + WhatsApp + Service + Practitioner and native clinic Location.
- PR #225 permanently corrected service-icon precedence: `Medi-Heel Pedicure (With Gel Toes) & Foot Massage` resolves to 🦶 while Bamboo/Swedish massage remain 💆.
- #564's existing displayed title was already normalized to 🦶 during approved Calendar housekeeping, so no new accepted-booking mutation was needed for PR #225 proof.

## Verified attendance evidence

- End-of-day reminder on 2026-08-14 identified two pending visits for that clinic date.
- Real Admin attempts exposed three separate defects; each was repaired without inferring attendance.
- Pagination repair reserves WhatsApp's 10-row budget: maximum 8 visits + More + Back.
- #562 Completed and #357 No-show were finalized from explicit human truth; duplicate #357 replay failed closed.
- Direct connector-level CRM row read-back remains unavailable due Render Postgres SSL/TLS negotiation; do not fabricate that evidence.

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed 15 Aug 2026 10:45–12:15 Christel + MediHeel — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #562 Completed and #357 No-show are resolved from explicit human truth.
- Older attendance backlog remains human-truth-gated.
- PR #225 is completed, merged and production-live; do not redo.

**Authoritative current state:** application baseline PR #225 / `3fe02881...`; Render `dep-da00cjad0e5s73a8thng` live and healthy; attendance Admin UX/reminder cohort, Calendar contact presentation, and MediHeel icon specificity are verified.

**Highest-priority genuinely actionable item:** ⚪ **READY — implement the already-approved post-confirmation client UX package: Book another treatment / My appointments / Main menu + natural-language fallbacks.**

**Why this is next:** attendance's operational defect chain is closed and PR #225 is now fully finished. The post-confirmation UX package is already approved, directly improves discoverability/repeat booking, and is the next unfinished customer-facing workstream. Ordinary approval and Google Contacts remain READY but lower priority.

**Approval gate:** despite prior approval of the UX package, substantial engineering must still begin with the explicit four-part checkpoint before implementation. Read-only verification and reconciliation remain permitted.

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative. Preserve all provider-template, historical attendance, payment and privacy WAITING items fail-closed. Never recreate cancelled test appointments merely for proof.