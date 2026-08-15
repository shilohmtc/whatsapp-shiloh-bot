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

## Governance

At the start of each new Shiloh OS chat: read Master + Tracker on GitHub `main`, reconcile applicable authoritative systems, state authoritative current state, identify the single highest-priority genuinely actionable item and why it is next, then obtain explicit approval before substantial work.

After that initial approval, continue the approved workstream without repeated approval requests at ordinary engineering, PR, merge, deploy, controlled provider/configuration, verification, repair, or housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authoritative evidence, or an existing fail-closed evidence gate.

Automatic continuation: short waits are re-checked directly; longer waits may use a narrow condition-watch. Failure/ambiguity remains fail-closed.

Provider lead-time: identify foreseeable WhatsApp templates during feature planning and submit them early enough for provider review to run in parallel with engineering. Do not submit speculative templates for undefined business semantics.

Button-first UX: known finite client actions should use WhatsApp buttons/lists when supported. Natural language remains fallback. Interactive controls must route into canonical handlers.

## Current production baseline

**PR #244 / `c6d09219519e621d2e34ae660e190b95d310c7bd`** is on `main`.

Render **`dep-da056au7bikc73ee1gsg`** is live with `META_LIFECYCLE_PROVISION_ON_START=false`.

## Current Meta/provider gate

🟠 **WAITING — seven lifecycle templates under Meta review.**

Provider truth:
- `shiloh_booking_confirmation_v1` — 🟢 APPROVED / UTILITY;
- `shiloh_staff_finalization_v1` — 🟢 APPROVED / UTILITY;
- `shiloh_appointment_reminder_actions_v1` — 🟠 PENDING;
- `shiloh_reschedule_confirmation_v1` — 🟠 PENDING;
- `shiloh_cancellation_confirmation_v1` — 🟠 PENDING;
- `shiloh_booking_approval_request_v1` — 🟠 PENDING;
- `shiloh_booking_declined_v1` — 🟠 PENDING;
- `shiloh_booking_approval_outcome_v1` — 🟠 PENDING;
- `shiloh_appointment_followup_v2` — 🟠 PENDING.

Controlled one-shot deploy `dep-da055pjvctds73b2vc7g` skipped the six existing templates and submitted only `shiloh_appointment_followup_v2`; Meta returned PENDING. Final provisioning flag is false. The Meta Lifecycle Approval condition-watch is enabled and covers all seven.

Do not configure or enable any pending template until exact provider approval is proven and production configuration matches. Real WhatsApp delivery evidence remains required for promotion to verified.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| META-LIFECYCLE | Foreseeable lifecycle template package | 🟠 WAITING | Seven templates PENDING. PR #244 adds follow-up v2. Final provisioning flag false. Condition-watch covers all seven. |
| META-BOOKING | Booking confirmation template | 🟢 VERIFIED | `shiloh_booking_confirmation_v1` APPROVED / UTILITY. |
| META-STAFF | Staff finalization template | 🟢 VERIFIED | `shiloh_staff_finalization_v1` APPROVED / UTILITY. |
| APP-RESILIENCE | Approval recovery / discoverability | 🟢 VERIFIED | PR #232 complete; Pending approvals + safe resend production-live. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING | Confirmed after Christel approval. Capture handset evidence first; then cancel normally. Do not modify/cancel before evidence. |
| A1-20260814 | 14 Aug reminder finalizations | 🟢 VERIFIED | #562 Completed; #357 No-show; duplicate replay rejected. |
| A1-HIST | Older attendance backlog | 🟠 WAITING | Explicit authorized human truth per visit; never infer/bulk-finalize. |
| C1-POSTBOOK-UX | Post-confirmation client actions | 🟢 VERIFIED / one evidence nuance | `My appointments`, `Main menu`, `Book another treatment`, and greeting navigation handset-verified. Actual post-confirmation three-button row awaits next genuine confirmed booking. |
| C1-BUTTON-FIRST-MYAPPTS | `My appointments` button-first UX | 🟢 VERIFIED | PR #243 live; Dummy Test handset shows `Book another` + `Main menu` buttons. |
| C1-FOLLOWUP-V2 | Button-first appointment follow-up template | 🟠 WAITING | PR #244 merged. `shiloh_appointment_followup_v2` submitted with rating buttons 1–5; Meta PENDING. Do not configure yet. |
| C1-BUTTON-FIRST-RATING | In-session rating UX | 🔵 ACTIVE | While provider review runs, make invalid/ambiguous rating prompts interactive and expose useful next actions after positive rating; low-rating feedback remains free text. |
| C1-APP-ORD | Ordinary approval combinations | 🟠 WAITING | Genuine future evidence only; never manufacture appointments. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Lower priority; CRM remains authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last authoritative quota 0 QPM; revisit on Google follow-up email/quota change. |
| E1 | Ozow | 🟠 WAITING | Merchant config + approved business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #567 confirmed — preserve until Pa Derik handset evidence, then cancel normally.
- #562 Completed and #357 No-show resolved.
- PR #232 complete; do not redo.
- PR #238 foreseeable template inventory complete.
- PR #239 automatic-continuation governance complete.
- PR #241 post-confirmation UX complete.
- PR #242 navigation-priority repair complete and handset accepted.
- PR #243 button-first `My appointments` complete and handset accepted.
- PR #244 follow-up-v2 provider readiness complete; template submitted and PENDING.
- Final production flag `META_LIFECYCLE_PROVISION_ON_START=false` on `dep-da056au7bikc73ee1gsg`.
- Seven lifecycle templates are PENDING at Meta.
- GBP remains parked at last-authoritative 0 QPM.

**Authoritative current state:** PR #244 is on `main`; Render `dep-da056au7bikc73ee1gsg` is live with provisioning false; post-confirmation/navigation and `My appointments` button-first UX have real Dummy Test handset evidence; booking/staff templates are approved; seven lifecycle templates are pending; #567 remains evidence-gated before cancellation.

**Highest-priority state:** 🟠 **WAITING — Meta review of the seven lifecycle templates.**

**Highest-priority genuinely actionable item while Meta is blocked:** 🔵 **ACTIVE — in-session customer-experience/rating button-first UX**, without enabling the pending follow-up-v2 template.

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar, Meta/provider evidence and explicit real WhatsApp/human evidence are authoritative. Preserve provider-template, historical attendance, payment, privacy, and #567 evidence gates fail-closed. Never recreate cancelled test appointments merely for proof.
