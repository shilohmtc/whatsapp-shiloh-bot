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

## New-chat authorization model

At the start of each new Shiloh OS chat: read Master + Tracker on GitHub `main`, reconcile applicable authoritative systems, state authoritative current state, identify the single highest-priority genuinely actionable item and why it is next, then obtain explicit user approval before substantial work.

After that initial approval, continue the approved workstream for the remainder of the chat without repeated approval requests at ordinary engineering, PR, merge, deploy, controlled provider/configuration, verification, repair or housekeeping boundaries.

Request fresh approval only for material scope expansion, materially greater or unexpected destructive/irreversible risk, contradictory authoritative evidence that makes continuation unsafe, or an action that would violate an existing fail-closed/evidence gate. Human-truth/provider/external evidence gates always remain fail-closed; chat authorization never permits inferred evidence or manufactured appointments for proof.

## Automatic continuation rule

When an already-approved workstream is blocked only by a future authoritative condition, do not require a manual `continue` merely to resume the same approved sequence.

- **Short waits (typically minutes):** directly re-check the authoritative system during the active chat and continue once success is proven.
- **Longer waits:** when useful, create a condition-watch automation scoped to the exact dependency and already-approved continuation path.
- **Success:** continue only the next safe steps already covered by the active workstream authorization.
- **Failure / ambiguity / contradiction:** notify and stop; remain fail-closed and do not improvise or broaden scope.
- **Evidence gates:** automation never overrides human truth, provider approval, genuine WhatsApp evidence, attendance, payment, privacy or other explicit fail-closed gates.
- **Cadence:** use automation only when its available cadence is useful; if the platform's minimum cadence is slower than the expected wait, direct in-chat re-check is preferred.

## Current Product-Critical Gate

🟠 **WAITING — Meta lifecycle template review.**

Current application baseline: **PR #236 / `44cdd7bf9ae2fbef03f4f93c8b6abab4bf9e2e90`**. Render deploy **`dep-da03ab1t0dsc738pm16g`** is live with `META_LIFECYCLE_PROVISION_ON_START=false`.

Provider truth from the controlled one-shot submission:
- `shiloh_booking_confirmation_v1` — 🟢 APPROVED / UTILITY;
- `shiloh_staff_finalization_v1` — 🟢 APPROVED / UTILITY;
- `shiloh_appointment_reminder_actions_v1` — 🟠 PENDING;
- `shiloh_reschedule_confirmation_v1` — 🟠 PENDING;
- `shiloh_cancellation_confirmation_v1` — 🟠 PENDING.

Do not enable the three pending lifecycle templates until Meta reports the exact expected templates APPROVED and production configuration exactly matches.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| META-LIFECYCLE | Reminder/reschedule/cancel template package | 🟠 WAITING | PR #234 merged; PR #236 merged. Controlled provider submission returned PENDING for all three. Keep fail-closed; read-only status checks only until APPROVED. |
| META-BOOKING | Booking confirmation template | 🟢 VERIFIED | `shiloh_booking_confirmation_v1` provider-verified APPROVED / UTILITY. |
| META-STAFF | Staff finalization template | 🟢 VERIFIED | `shiloh_staff_finalization_v1` provider-verified APPROVED / UTILITY. |
| APP-RESILIENCE | Approval recovery / discoverability | 🟢 VERIFIED | PR #232 complete; Pending approvals + safe resend path production-live. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING | Confirmed after Christel approval. Capture actual handset evidence first; then cancel #567 through the normal Shiloh cancellation workflow. Do not modify/cancel before evidence. |
| A1-NAV | Attendance finalization Admin UX | 🟢 VERIFIED | PR #226/#227/#229 + real WhatsApp navigation/list/decision flow. |
| A1-20260814 | 14 Aug reminder finalizations | 🟢 VERIFIED | #562 Completed; #357 No-show from explicit human truth + Shiloh confirmation. |
| A1-HIST | Older attendance backlog | 🟠 WAITING | Each historical visit requires explicit authorized human truth; never infer/bulk-finalize. |
| C1-APP-DUMMY+ | Dummy Test positive JP approval | 🟢 VERIFIED | #564 lifecycle accepted; preserve semantics. |
| C1-APP-DUMMY-DECLINE | Dummy Test JP decline | 🟢 VERIFIED | #566 declined/released; do not recreate. |
| C1-RESCHEDULE | Canonical reschedule lifecycle | 🟢 VERIFIED | #565 accepted before later cancellation. |
| C1-CANCEL | Canonical cancellation | 🟢 VERIFIED | #565 cancelled; never recreate merely for proof. |
| C1-CALENDAR-CONTACT | Calendar staff contact presentation | 🟢 VERIFIED | PR #222 accepted. |
| C1-CALENDAR-ICON | MediHeel/pedicure Calendar icon specificity | 🟢 VERIFIED | PR #225 accepted. |
| C1-POSTBOOK-UX | Post-confirmation client actions | ⚪ READY | Book another treatment / My appointments / Main menu + natural-language equivalents. Can resume while Meta review is externally blocked, provided unapproved templates remain unused. |
| C1-APP-ORD | Ordinary approval rules | 🟠 WAITING | Genuine future evidence only; never manufacture appointments merely for proof. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Separate lower-priority workstream; CRM remains authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last authoritative quota 0 QPM. Revisit on Google follow-up approval email or quota change. |
| E1 | Ozow | 🟠 WAITING | Merchant config + explicit business rules. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed; authority + evidence required. |

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #567 confirmed after Christel approval — preserve until actual Pa Derik handset evidence is captured, then cancel normally.
- #562 Completed and #357 No-show resolved.
- PR #232 complete; do not redo.
- PR #234 lifecycle template package complete and merged.
- PR #236 explicit one-shot provisioning gate complete and merged.
- Final production flag `META_LIFECYCLE_PROVISION_ON_START=false`.
- Reminder-actions, reschedule confirmation and cancellation confirmation templates are PENDING at Meta.
- Google Business Profile API remains parked at last-authoritative 0 QPM.

**Authoritative current state:** application baseline PR #236 / `44cdd7bf...`; Render `dep-da03ab1t0dsc738pm16g` live; booking/staff templates APPROVED; three client lifecycle templates PENDING; #567 confirmed but handset-evidence gated before cancellation.

**Highest-priority state:** 🟠 **WAITING — Meta provider review of the three submitted lifecycle templates.**

**Highest-priority genuinely actionable item while Meta is blocked:** ⚪ **READY — post-confirmation client UX package**, without enabling or depending on unapproved lifecycle templates.

**Authorization:** apply the new-chat authorization model and automatic continuation rule above; evidence gates remain fail-closed.

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar, Meta/provider evidence and explicit real WhatsApp/human evidence are authoritative. Preserve provider-template, historical attendance, payment and privacy WAITING items fail-closed. Never recreate cancelled test appointments merely for proof.
