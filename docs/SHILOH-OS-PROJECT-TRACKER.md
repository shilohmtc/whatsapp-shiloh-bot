# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the detailed current ledger. Historical pre-approval detail remains in `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Next actionable Client Perspective priority: controlled `Cancel booking` lifecycle. Use #565 only if intentionally willing to cancel that test appointment; do not cancel or mutate #564.**

Current production runtime baseline: PR **#214** squash merge `560ba16efd6bf58c79b757184d15e5292061d9a0`; Render deploy `dep-d9vfrkgu01pc73acdoq0` is live.

## Real-accepted client evidence

- ✅ MediHeel treatment list accepted; current MediHeel practitioner truth is **Christel only**.
- ✅ #564 positive Dummy Test approval path accepted end-to-end: indefinite pending hold, JP-only approval, held-slot exclusion, JP approval, final client confirmation, and canonical `Shiloh — Bookings` Google Calendar event with client mobile.
- ✅ Confirmation UX accepted on #565: no raw calendar URLs; Google Calendar and Apple / Outlook CTA buttons; Reschedule and Cancel booking reply buttons; typed fallbacks retained.
- ✅ Multi-booking Reschedule selection accepted: Shiloh displayed `10:45 · #564` and `12:30 · #565`, retained full summaries and typed booking-number fallback, and never guessed.
- ✅ #565 reschedule self-conflict defect fixed by PR #213. Real post-deploy availability returned **12:15** and **12:30** while preserving #564's occupied period.
- ✅ #565 canonical reschedule completed and REAL-ACCEPTED: review showed old 12:30 → new 12:15 before write; final confirmation succeeded; Google Calendar independently verified #565 at **12:15–13:45** and #564 unchanged at **10:45–12:15**.
- ✅ Reminder/change coordination REAL-reobserved: the reminder no longer interrupted the active reschedule, then resumed after completion using correct `Dummy Test` name and updated **12:15** time.

## PR #214 lifecycle polish

Self-test-first evidence:
- post-reschedule red commit `18e5bd0d594a9ab319100da1691b5634eaa46c6e` → CI **#596 failure**;
- implementation → CI **#599 success**;
- reminder-template red commit `ffa74aed0de935412c2b845bfea9a76661ac2a96` → CI **#600 failure**;
- final head `2985003a61ddd09b8aa9fe284c833325f2750a23` → CI **#604 success**;
- merge `560ba16efd6bf58c79b757184d15e5292061d9a0`;
- Render `dep-d9vfrkgu01pc73acdoq0` live.

New production behavior/readiness:
- 🟡 successful reschedules now schedule the same **Google Calendar**, **Apple / Outlook**, **Reschedule**, and **Cancel booking** controls after the primary success reply, using the updated canonical appointment and existing calendar-share token; no new appointment or Google Calendar event is created. REAL acceptance waits for a future genuine successful reschedule.
- 🟠 code now supports/provisions utility reminder template `shiloh_appointment_reminder_actions_v1` with native **Reschedule** / **Cancel booking** quick replies and routes template button payloads through the canonical change router.
- 🟠 the existing approved reminder template remains active unless `WHATSAPP_REMINDER_ACTIONS_TEMPLATE` is explicitly configured **after Meta approval**. Do not claim reminder buttons complete until approval/configuration and real delivery are observed.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-MEDIHEEL | MediHeel presentation/Christel routing | 🟢 REAL-ACCEPTED | Do not repeat solely for proof. |
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 REAL-ACCEPTED | #564 complete; do not recreate. |
| C1-HOLD | Indefinite hold / slot exclusion | 🟢 REAL-ACCEPTED | Proven on #564. |
| C1-CONFIRM-UX | Confirmation buttons/calendar CTAs | 🟢 REAL-ACCEPTED | Proven on #565. |
| C1-CHANGE-SELECT | Multi-booking Reschedule/Cancel selection | 🟢 REAL-ACCEPTED | Buttons proven for #564/#565. |
| C1-REMINDER-GATE | Suppress reminders during active changes + CRM name | 🟢 REAL-ACCEPTED | Re-observed after #565 reschedule. |
| C1-RESCHEDULE | #565 canonical reschedule lifecycle | 🟢 REAL-ACCEPTED | #565 now 12:15–13:45; Calendar verified. |
| C1-RESCHEDULE-ACTIONS | Post-reschedule calendar/change controls | 🟡 CODE/CI + PROD LIVE | Future genuine reschedule delivery required. |
| C1-REMINDER-TPL | Reminder native change buttons | 🟠 PROVIDER/TEMPLATE WAITING | Meta approval → configure env → real delivery. |
| C1-CANCEL | Client cancellation lifecycle | 🔵 ACTIVE NEXT | Use #565 only if cancellation is intentionally acceptable; preserve #564. |
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
- **#565** — confirmed after successful reschedule, Saturday 15 August 2026, **12:15–13:45**, Christel + MediHeel; Google Calendar verified with Dummy Test mobile retained.
- **#561** — cancelled historical test. Never recreate.

The #565 reschedule intent is complete; do not restart it merely to re-prove completed lifecycle behavior.

**Next action:** test **Cancel booking** using #565 only if intentionally willing to cancel it. Expected acceptance path: deterministic appointment selection if required → explicit review-before-write → canonical cancellation → Google Calendar reconciliation/removal behavior → client confirmation → #564 remains unchanged.

## Guardrails

- GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence are authoritative.
- Never infer provider/template/attendance outcomes.
- Pending approval holds remain indefinite until explicit decision.
- Dummy Test approval remains JP admin account alone.
- MediHeel remains Christel only.
- Do not recreate #561 or mutate/cancel #564.
- Preserve all externally blocked/provider/payment/privacy items fail-closed.