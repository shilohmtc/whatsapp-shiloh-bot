# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth. Historical detail remains in Git history/archive; do not redo accepted work.

## Authority and production baseline

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or Calendar state.

Current runtime baseline: **PR #219** squash merge `f51d304112fc6d2b9274b23eda3bb41ad225e019`; Render deploy **`dep-d9vgq66q1p3s7392qhb0` live**. PR #219 is presentation-only for the declined-booking next action and policy version display: decline/hold/approval semantics and immutable policy audit identity are unchanged.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test uses JP admin account alone. Pending holds have no automatic expiry. MediHeel remains Christel only.

## Execution Protocol — mandatory checkpoint before substantial work

Before beginning substantial engineering or any new controlled production mutation, Shiloh OS must stop at an explicit four-part checkpoint:

1. **Authoritative current state** — verify and state the current truth from GitHub `main`, Render production, Shiloh CRM, Google Calendar and/or explicit real WhatsApp/human evidence as applicable. Do not rely on stale chat history where an authoritative source can be checked.
2. **Highest-priority actionable item** — identify the single highest-priority genuinely unfinished item that is actionable now. Completed work must not be repeated, and externally blocked or evidence-gated items remain fail-closed.
3. **Why this is next** — briefly explain why that item is the correct next action, including why any apparently higher-priority alternatives are already completed, blocked, waiting on genuine evidence, or lower priority.
4. **Explicit approval gate** — do **not** proceed automatically with substantial engineering, schema/data changes, migrations, production mutations, new controlled bookings, or material workflow changes. Stop and ask the user for explicit approval to proceed.

Read-only verification, diagnostics, repository/production-state inspection, reconciliation, documentation/status maintenance, and clearly requested minor housekeeping may proceed without a second approval gate. If a defect is exposed during an already-approved test, stop at the defect, explain the proposed correction and obtain approval before substantial engineering unless the user has already explicitly authorized that repair.

Every continuation state should therefore end with the current authoritative state, the single next actionable item, why it is next, and either `WAITING FOR USER APPROVAL TO PROCEED` or a record of the user's explicit approval.

## Real Client Perspective acceptance — 2026-08-14

### #564 positive Dummy Test approval — REAL-ACCEPTED

Confirmed Sat 15 Aug 2026, 10:45–12:15, Christel + MediHeel. Proven: indefinite hold, JP sole approval, held-slot exclusion, explicit approval, client confirmation and canonical Google Calendar event with Dummy Test mobile. **Leave #564 unchanged.**

### #565 reschedule + cancellation — REAL-ACCEPTED

#565 proved canonical reschedule including the repaired self-conflict path, old→new review-before-write, 12:15 boundary availability and Calendar update while #564 remained unchanged. It subsequently proved deterministic destructive cancellation review and explicit cancellation; its Calendar event was absent afterward and #564 remained unchanged. **#565 is cancelled; never recreate merely for proof.**

### #566 Dummy Test JP decline — REAL-ACCEPTED

A new genuine Dummy Test request for **Bamboo Sports Massage - Area Specific with Abigail, Sat 15 Aug 2026 12:15** produced appointment request **#566**. Real evidence proved the complete negative approval chain:
- client received `Booking request received — #566`, with the selected time held indefinitely while Jean-Pierre reviewed and explicit `not yet confirmed` wording;
- JP received the sole-approver request with correct Dummy Test/service/Abigail/12:15 context and Approve/Decline controls;
- JP explicitly pressed **Decline** and received `Declined by Jean-Pierre. Appointment request #566 was cancelled and the held time was released.`;
- Dummy Test received a clear not-confirmed outcome: held time released and `Nothing is booked.`;
- independent Google Calendar search found **no #566 event** for 15 Aug; #564 remained unchanged;
- released-capacity proof was then observed: the authoritative Abigail/Bamboo Sports Massage availability list again offered **12:15**, without creating another booking.

Therefore **C1-APP-DUMMY-DECLINE is REAL-ACCEPTED**. #566 is declined/cancelled and must not be recreated merely for proof.

### Client Perspective presentation polish — PR #219

Self-test-first polish followed the #566 observation:
- declined-booking outcome now uses one **Book another time** reply button whose stable payload is the existing `BOOKING` command; typed `BOOKING` remains fallback;
- Booking Policy client display now says **`Policy updated: 11 August 2026`** instead of exposing the technical version identifier;
- immutable internal/audit version remains exactly **`2026-08-11-v1`** in booking intents and `booking_policy_acceptances`; policy terms and explicit `I AGREE` / `DECLINE` semantics were not changed;
- red CI #617 proved the new expectations before implementation; after implementation/test-harness correction, CI **#621 passed**; PR #219 merged and Render deploy `dep-d9vgq66q1p3s7392qhb0` is live.

Real WhatsApp acceptance of the two new presentation details waits for the next genuine applicable journey; do not manufacture a booking solely for presentation proof.

## Provider/template and other fail-closed items

- Post-reschedule Google/Apple CTAs + Reschedule/Cancel controls are code/CI/prod-live; REAL acceptance waits for a future genuine reschedule.
- Reminder native Reschedule/Cancel buttons remain **PROVIDER/TEMPLATE WAITING** pending Meta approval, explicit production config and real delivery evidence.
- Google Contacts synchronization is not implemented; CRM remains authoritative.
- Attendance finalizations remain WAITING for genuine Completed/No-show truth.
- Ozow remains WAITING on merchant configuration and explicit business rules.
- Destructive privacy execution remains fail-closed pending authority/evidence.

## Remaining Client Perspective priorities

Completed/accepted now includes both Dummy Test approval directions: #564 positive JP approval and #566 explicit JP decline/release.

**Highest-priority genuinely unfinished actionable item: ordinary approval acceptance.** The production rules exist but still require controlled real evidence: Marietjie self-approval; Christel self-approval; Abigail booking approved by Abigail or Christel with first valid decision authoritative. Use genuine controlled requests and do not mutate #564 solely for proof. Apply safe self-test-first engineering only if a defect is exposed.

**Why it is next:** both controlled Dummy Test approval directions are already accepted; ordinary production approval rules are not externally blocked and still lack genuine acceptance evidence; provider-template, attendance, payment and privacy items are either externally blocked or evidence-gated.

## Exact continuation state

- **#561** — cancelled historical test. Never recreate.
- **#564** — confirmed Sat 15 Aug 2026, **10:45–12:15**, Christel + MediHeel. Leave unchanged.
- **#565** — cancelled after accepted reschedule/cancellation lifecycle. Never recreate merely for proof.
- **#566** — declined by JP; held Abigail/Bamboo 12:15 capacity was proven released; no #566 Calendar event. Never recreate merely for proof.

**Authoritative current state:** production baseline and controlled appointment state above remain authoritative until re-verified against the applicable sources.

**Highest-priority actionable item:** controlled **ordinary approval acceptance**, starting with the least complex self-approval path (Marietjie or Christel), then covering Abigail's dual-authority/first-valid-decision rule.

**Why this is next:** Dummy Test positive/negative approval is complete, while ordinary production approval remains genuinely unaccepted and is not externally blocked.

**Approval gate:** **WAITING FOR USER APPROVAL TO PROCEED.** Do not begin a new controlled booking or substantial engineering solely from this continuation state.
