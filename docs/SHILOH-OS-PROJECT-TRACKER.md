# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the detailed current ledger. Historical pre-approval detail remains in `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **#565 cancellation lifecycle is active but no cancellation has occurred. PR #216 button polish is production-live. Because the old review was already delivered pre-deploy, send `STOP` once, re-enter Cancel booking, select `12:15 · #565`, and stop at the new confirmation buttons before any destructive write. Do not cancel or mutate #564.**

Current production runtime baseline: PR **#216** squash merge `23c366271528aa851fccf588d2060ff66a8fee7e`; Render deploy `dep-d9vg4had0e5s73afuh30` is live.

## Real-accepted client evidence

- ✅ MediHeel treatment list accepted; current MediHeel practitioner truth is **Christel only**.
- ✅ #564 positive Dummy Test approval path accepted end-to-end: indefinite pending hold, JP-only approval, held-slot exclusion, JP approval, final client confirmation, and canonical `Shiloh — Bookings` Google Calendar event with client mobile.
- ✅ Confirmation UX accepted on #565: no raw calendar URLs; Google Calendar and Apple / Outlook CTA buttons; Reschedule and Cancel booking reply buttons; typed fallbacks retained.
- ✅ Multi-booking Reschedule selection accepted: Shiloh displayed `10:45 · #564` and `12:30 · #565`, retained full summaries and typed booking-number fallback, and never guessed.
- ✅ #565 reschedule self-conflict defect fixed by PR #213. Real post-deploy availability returned **12:15** and **12:30** while preserving #564's occupied period.
- ✅ #565 canonical reschedule completed and REAL-ACCEPTED: review showed old 12:30 → new 12:15 before write; final confirmation succeeded; Google Calendar independently verified #565 at **12:15–13:45** and #564 unchanged at **10:45–12:15**.
- ✅ Reminder/change coordination REAL-reobserved: the reminder no longer interrupted the active reschedule, then resumed after completion using correct `Dummy Test` name and updated **12:15** time.
- ✅ Multi-booking **Cancel** selection is now also real-observed: #564 and #565 were listed with deterministic `10:45 · #564` / `12:15 · #565` buttons; selecting #565 isolated only #565.
- ✅ Cancellation review real-observed for #565: correct service, Christel, Sat 15 Aug 2026 12:15, booking #565, and the within-24-hours warning that a 50% fee may apply. No cancellation was performed.

## PR #214 lifecycle polish

- 🟡 successful reschedules schedule the same **Google Calendar**, **Apple / Outlook**, **Reschedule**, and **Cancel booking** controls after the primary success reply, using the updated canonical appointment and existing calendar-share token; no new appointment or Google Calendar event is created. REAL acceptance waits for a future genuine reschedule.
- 🟠 code supports/provisions utility reminder template `shiloh_appointment_reminder_actions_v1` with native **Reschedule** / **Cancel booking** quick replies.
- 🟠 the existing approved reminder template remains active unless `WHATSAPP_REMINDER_ACTIONS_TEMPLATE` is explicitly configured after Meta approval. Do not claim reminder buttons complete until approval/configuration and real delivery are observed.

## PR #216 cancellation review polish

The old #565 destructive review exposed typed-only `YES` / `STOP` wording. PR **#216** changes only presentation, not cancellation semantics:
- red regression `e543e68fde7e0847817bc53e18daf936c5df46b3` → CI **#608 failure**;
- final head `d6ae107f068ba099a5886af4d096858dc135a996` → CI **#611 success**;
- squash merge `23c366271528aa851fccf588d2060ff66a8fee7e`;
- Render `dep-d9vg4had0e5s73afuh30` live;
- destructive review now presents **Confirm cancellation** (`yes`) and **Keep appointment** (`stop`) buttons;
- visible review states `Nothing has changed yet.` and retains typed `YES` / `STOP` fallback;
- the existing 24-hour warning and canonical `cancelCanonical()` write remain unchanged and still occur only after explicit confirmation.

WhatsApp cannot alter an already-delivered pre-deploy message, so the current old #565 review must be stopped once and re-rendered to collect real evidence of the new buttons.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-MEDIHEEL | MediHeel presentation/Christel routing | 🟢 REAL-ACCEPTED | Do not repeat solely for proof. |
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 REAL-ACCEPTED | #564 complete; do not recreate. |
| C1-HOLD | Indefinite hold / slot exclusion | 🟢 REAL-ACCEPTED | Proven on #564. |
| C1-CONFIRM-UX | Confirmation buttons/calendar CTAs | 🟢 REAL-ACCEPTED | Proven on #565. |
| C1-CHANGE-SELECT | Multi-booking Reschedule/Cancel selection | 🟢 REAL-ACCEPTED | Both entry paths observed for #564/#565. |
| C1-REMINDER-GATE | Suppress reminders during active changes + CRM name | 🟢 REAL-ACCEPTED | Re-observed after #565 reschedule. |
| C1-RESCHEDULE | #565 canonical reschedule lifecycle | 🟢 REAL-ACCEPTED | #565 now 12:15–13:45; Calendar verified. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule calendar/change controls | 🟡 CODE/CI + PROD LIVE | Future genuine reschedule delivery required. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 PROVIDER/TEMPLATE WAITING | Meta approval → configure env → real delivery. |
| C1-CANCEL-REVIEW | Cancellation review buttons | 🟡 CODE/CI + PROD LIVE; REAL REOBSERVE NOW | STOP old intent → Cancel booking → #565 → inspect buttons. |
| C1-CANCEL | Canonical #565 cancellation | 🔵 ACTIVE AFTER REVIEW ACCEPTANCE | Only press Confirm cancellation after new review is accepted; verify CRM/Calendar/client/#564. |
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
- **#564** — confirmed, Saturday 15 August 2026, **10:45–12:15**, accepted positive-approval evidence. Leave unchanged.
- **#565** — confirmed after successful reschedule, Saturday 15 August 2026, **12:15–13:45**, Christel + MediHeel; Google Calendar verified with Dummy Test mobile retained. It is selected in the current cancellation intent but is **not cancelled**.
- **#561** — cancelled historical test. Never recreate.

Current WhatsApp state is the old pre-PR-#216 #565 cancellation confirmation asking for typed `YES` / `STOP`. No destructive write has occurred.

**Next action:** send **`STOP` once**. Confirm Shiloh says the appointment is unchanged. Then press **Cancel booking**, select **`12:15 · #565`**, and stop at the new review. Verify **Confirm cancellation**, **Keep appointment**, the late-cancellation warning, `Nothing has changed yet.`, and typed fallback. Only after that review passes may Confirm cancellation be pressed.

## Guardrails

- GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative.
- Never infer provider/template/attendance outcomes.
- Pending approval holds remain indefinite until explicit decision.
- Dummy Test approval remains JP admin account alone.
- MediHeel remains Christel only.
- Do not recreate #561 or mutate/cancel #564.
- Preserve all externally blocked/provider/payment/privacy items fail-closed.