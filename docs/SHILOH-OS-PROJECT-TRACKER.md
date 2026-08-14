# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the detailed current ledger. Historical detail remains in archive/Git history; do not redo completed work.

## Current Product-Critical Gate

🔵 **Next actionable Client Perspective priority: separate genuine Dummy Test JP-decline journey.** Positive JP approval is already accepted on #564; explicit JP decline remains genuinely unproven and is not externally blocked. Create a new controlled request only for this decline journey. Do not recreate #561 or #565 and do not mutate/cancel #564.

Current runtime baseline: PR **#216** squash merge `23c366271528aa851fccf588d2060ff66a8fee7e`; Render deploy `dep-d9vg4had0e5s73afuh30` live. Reconciliation PR #217 merge `3398740e5ca95cc9f3311ffb3438b2b8cc8db7ce`; descendant deploy `dep-d9vg66bncjis738tmuvg` live.

## Real-accepted client evidence

- ✅ MediHeel presentation and practitioner truth: **Christel only**.
- ✅ #564 positive Dummy Test approval path: indefinite hold, JP-only approval, held-slot exclusion, explicit approval, final confirmation, canonical Google Calendar event with client mobile.
- ✅ Booking confirmation UX: Google Calendar + Apple/Outlook CTAs, Reschedule + Cancel controls, typed fallbacks.
- ✅ Multi-booking Reschedule/Cancel selection: deterministic controls, typed fallback, no guessing.
- ✅ #565 canonical reschedule: self-conflict defect fixed; 12:15 boundary slot accepted; Google Calendar updated existing event; #564 unchanged.
- ✅ Reminder/change coordination: no reminder during active change; canonical `Dummy Test` name and updated time after completion.
- ✅ Cancellation review polish: correct 24-hour/possible 50% fee warning, `Nothing has changed yet.`, Confirm cancellation / Keep appointment buttons, typed YES/STOP fallback.
- ✅ **#565 canonical cancellation REAL-ACCEPTED:** explicit Confirm cancellation produced correct client confirmation; independent Google Calendar search found no #565 event afterward; #564 remained unchanged at 10:45–12:15 with correct MediHeel/Christel/mobile data.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-MEDIHEEL | MediHeel presentation/Christel routing | 🟢 REAL-ACCEPTED | Do not repeat solely for proof. |
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 REAL-ACCEPTED | #564 complete; leave unchanged. |
| C1-HOLD | Indefinite hold / slot exclusion | 🟢 REAL-ACCEPTED | Proven on #564. |
| C1-CONFIRM-UX | Confirmation buttons/calendar CTAs | 🟢 REAL-ACCEPTED | Proven on #565 before cancellation. |
| C1-CHANGE-SELECT | Multi-booking Reschedule/Cancel selection | 🟢 REAL-ACCEPTED | Both paths observed. |
| C1-REMINDER-GATE | Suppress reminders during active changes + CRM name | 🟢 REAL-ACCEPTED | Re-observed on #565. |
| C1-RESCHEDULE | Canonical reschedule lifecycle | 🟢 REAL-ACCEPTED | #565 journey accepted before later cancellation. |
| C1-CANCEL-REVIEW | Cancellation destructive review | 🟢 REAL-ACCEPTED | Buttons + warning + fail-closed copy observed. |
| C1-CANCEL | Canonical cancellation | 🟢 REAL-ACCEPTED | #565 cancelled; Calendar event absent; #564 preserved. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule calendar/change controls | 🟡 CODE/CI + PROD LIVE | Future genuine reschedule delivery only. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 PROVIDER/TEMPLATE WAITING | Meta approval → env config → real delivery. |
| C1-APP-DUMMY-DECLINE | Dummy Test JP decline | 🔵 ACTIVE NEXT | New genuine request → JP Decline → verify release/no confirmed Calendar event. |
| C1-APP-ORD | Ordinary approval rules | 🔵 LIVE / REAL ACCEPTANCE PENDING | Marietjie self; Christel self; Abigail or Christel. |
| GCONTACTS | CRM → Google Contacts | 🟠 NOT IMPLEMENTED | Separate explicit workstream; CRM remains authority. |
| A1 | Attendance finalizations | 🟠 WAITING | Genuine Completed/No-show truth only. |
| A2 | Finalization/earnings UX | ⚪ READY | After client-critical gate. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| PRIV | Destructive privacy execution | 🟠 WAITING / FAIL-CLOSED | Legal/owner authority + evidence required. |

## Exact continuation

- **#561** — cancelled historical test. Never recreate.
- **#564** — confirmed Sat 15 Aug 2026, **10:45–12:15**, Christel + MediHeel; fully accepted positive evidence. Leave unchanged.
- **#565** — **cancelled** after fully accepted controlled cancellation. Its Google Calendar event is absent after cancellation. Never recreate merely for proof.

**Next action:** start a **new genuine Dummy Test booking request** specifically to exercise the JP-decline path. Expected acceptance: slot becomes indefinitely held/pending → JP receives sole-approver request with actionable decline → JP explicitly declines → client receives clear decline/not-confirmed outcome → held slot becomes available again → no confirmed Google Calendar event remains/appears for that declined request. If any defect appears, apply safe self-test-first engineering before proceeding.

## Guardrails

- GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative.
- Never infer provider/template/attendance outcomes.
- Pending approval holds remain indefinite until explicit decision.
- Dummy Test approval remains JP alone.
- MediHeel remains Christel only.
- Do not recreate #561 or #565; do not mutate/cancel #564.
- Preserve provider-template, attendance, payment, privacy and other externally blocked items fail-closed.
