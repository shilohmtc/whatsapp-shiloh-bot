# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the detailed current ledger. Historical pre-approval detail remains in `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Continue the existing Dummy Test reschedule journey for appointment #565 from the current time-of-day prompt. Press `Afternoon`; do not restart Reschedule and do not create another booking.**

Current production runtime baseline: PR **#211** squash merge `e701baaa06565b81675bf7de7ad48efdf21c8eec`; Render deploy `dep-d9vf0cdbedkc7383lcig` is live.

## Real-accepted client evidence

- ✅ MediHeel treatment list accepted; current MediHeel practitioner truth is **Christel only**.
- ✅ #564 positive Dummy Test approval path accepted end-to-end: indefinite pending hold, JP-only approval, held-slot exclusion, JP approval, final client confirmation, and canonical `Shiloh — Bookings` Google Calendar event with client mobile.
- ✅ Confirmation UX accepted on new appointment #565: no raw calendar URLs; Google Calendar and Apple / Outlook CTA buttons; Reschedule and Cancel booking reply buttons; typed fallbacks retained.
- ✅ PR #209 CTA wording polish deployed.
- ✅ Multi-booking Reschedule selection accepted after PR #210: Shiloh displayed `10:45 · #564` and `12:30 · #565`, retained full summaries and typed booking-number fallback, and never guessed.
- ✅ Selecting `12:30 · #565` isolated only #565 and entered its reschedule flow.
- ✅ `Tomorrow` was accepted and Shiloh retained service + Christel context, reaching **Morning / Afternoon / Evening** selection.

## Reminder collision found and repaired

Real WhatsApp then showed the existing 12:30 reminder in the middle of #565's active reschedule journey. This was a Product-Critical client-state collision.

PR **#211** repaired it self-test-first:
- regression commit `563d0e817bd7d38f83cdbfa44b1386a9582a6025` failed CI **#586**;
- final head `e7856e00384e6b3309737b502f79e2873a2ea707` passed CI **#588**;
- merge `e701baaa06565b81675bf7de7ad48efdf21c8eec`;
- Render `dep-d9vf0cdbedkc7383lcig` live.

New runtime behavior:
- reminder claim pauses while the same WhatsApp client has active `appointment_change_intents` with `status='collecting'` and action `reschedule` or `cancel`;
- reminder remains unclaimed during the pause, so eligibility can resume after the change intent clears against authoritative state;
- reminder name resolution now prefers exactly one active CRM client `display_name` through canonical contacts before falling back to transient profile memory.

🟠 The currently approved **Meta reminder template** still has legacy typed change wording. Native reminder Reschedule/Cancel buttons are not yet claimed complete because the current template sender supplies body parameters only and provider-template buttons require exact Meta template configuration/approval. Keep this evidence-gated; do not fake equivalence with a free-form interactive send outside the customer-service window.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-MEDIHEEL | MediHeel presentation/Christel routing | 🟢 REAL-ACCEPTED | Do not repeat solely for proof. |
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 REAL-ACCEPTED | #564 complete; do not recreate. |
| C1-HOLD | Indefinite hold / slot exclusion | 🟢 REAL-ACCEPTED | Proven on #564. |
| C1-CONFIRM-UX | Confirmation buttons/calendar CTAs | 🟢 REAL-ACCEPTED | Proven on #565. |
| C1-CHANGE-SELECT | Multi-booking Reschedule/Cancel selection | 🟢 REAL-ACCEPTED | Buttons proven for #564/#565. |
| C1-REMINDER-GATE | Suppress reminders during active changes | 🟡 CODE/CI + PROD LIVE; LIVE REOBSERVE NATURALLY | PR #211 deployed; continue #565 and ensure no new collision. |
| C1-RESCHEDULE | #565 canonical reschedule lifecycle | 🔵 ACTIVE PRODUCT-CRITICAL | Press **Afternoon**, verify authoritative times, then continue. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 PROVIDER/TEMPLATE WAITING | Exact Meta template update/approval + real delivery required. |
| C1-CANCEL | Client cancellation lifecycle | ⚪ READY LATER | Use controlled appointment after reschedule gate. |
| C1-APP-DUMMY-DECLINE | Dummy Test JP decline | ⚪ READY LATER | Separate genuine request. |
| C1-APP-ORD | Ordinary approval rules | 🔵 LIVE / REAL ACCEPTANCE PENDING | Marietjie self; Christel self; Abigail or Christel. |
| GCONTACTS | CRM → Google Contacts | 🟠 NOT IMPLEMENTED | Separate explicit workstream only; CRM remains authority. |
| A1 | Six known attendance finalizations | 🟠 WAITING | Genuine Completed/No-show truth only. |
| A2 | Finalization/earnings UX | ⚪ READY | After client-critical gate. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| F3 | Instagram ownership/connection | ⚪ READY | Verify existing account first. |
| PRIV | Destructive privacy execution | 🟠 WAITING / FAIL-CLOSED | Legal/owner authority + evidence required. |

## Exact continuation

Current controlled appointments:
- **#564** — confirmed, 10:45–12:15, accepted positive-approval evidence. Leave unchanged.
- **#565** — confirmed original slot 12:30–14:00 and currently inside an active reschedule intent.
- **#561** — cancelled historical test. Never recreate.

Current #565 WhatsApp state: appointment #565 is selected; `Tomorrow` was chosen; Shiloh is asking for time of day with **Morning / Afternoon / Evening**.

**Next action: press `Afternoon`.** Then verify the returned slots are authoritative for Christel + the MediHeel service. Continue only on #565. Confirm #564 remains unchanged throughout the eventual write/Calendar update/final client message.

## Guardrails

- GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative.
- Never infer provider/template/attendance outcomes.
- Pending approval holds remain indefinite until explicit decision.
- Dummy Test approval remains JP admin account alone.
- MediHeel remains Christel only.
- Do not recreate #561 or #564.
- Preserve all externally blocked/provider/payment/privacy items fail-closed.