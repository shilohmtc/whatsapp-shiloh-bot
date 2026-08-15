# Shiloh OS — Master Project Status

Updated: 2026-08-15
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted work.

## Authority

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

## Current production baseline

Current application baseline: **PR #247** squash merge `c775ad0a4738a35f07b31a17831a1e63358291d8`.

Render production deploy **`dep-da05b7jncjis738eh13g`** is verified **live** on 2026-08-15. `META_LIFECYCLE_PROVISION_ON_START=false` remains fail-closed. The pending follow-up-v2 template is not configured for production delivery.

PR #241 post-confirmation client actions, PR #242 stale-session/navigation-priority repair, PR #243 button-first `My appointments`, PR #244 follow-up-v2 provider readiness, PR #246 in-session button-first rating UX, and PR #247 five-rating template-send readiness are all on `main`.

## Execution protocol

At the beginning of each new Shiloh OS chat: read Master + Tracker on `main`, reconcile applicable authoritative systems, state the authoritative current state, identify the single highest-priority genuinely actionable item and why it is next, then obtain explicit user approval before substantial work.

After that initial approval, continue the approved workstream for the remainder of the chat without repeated approval requests at ordinary engineering, PR, merge, deploy, controlled provider/configuration, verification, repair, or housekeeping boundaries.

Request fresh approval only for material scope expansion, materially greater or unexpected destructive/irreversible risk, contradictory authoritative evidence that makes continuation unsafe, or an action that would violate an existing fail-closed/evidence gate.

Human-truth and provider/external evidence gates always remain fail-closed. Never manufacture appointments merely for proof.

### Automatic continuation

If an already-approved workstream is blocked only by a short external condition, re-check the authoritative system directly and continue when success is proven. For longer waits, use a narrowly scoped condition-watch automation when useful. Failure, ambiguity, contradiction, or evidence-gated state must stop fail-closed.

## Permanent provider lead-time rule

Whenever a planned Shiloh feature may require externally approved WhatsApp templates, identify the complete foreseeable template set during feature planning and submit required provider work early enough to run in parallel with engineering. Do not wait until implementation reaches the send step. Do not submit speculative templates for undefined business semantics.

## Permanent button-first client UX rule

Whenever the next sensible client actions are known and WhatsApp supports an appropriate interactive control, expose them as buttons or list actions. Natural-language commands remain equivalent fallbacks, not the primary discovery mechanism. Buttons/lists must route into the same canonical deterministic handlers rather than duplicate booking/change logic. Do not force buttons where free text is genuinely needed.

## Booking / approval core

Booking → staff approval core pipeline is production-verified, including Pending approvals recovery/resend and Christel approval of #567.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test uses JP admin account alone. Pending holds have no automatic expiry. MediHeel remains Christel only.

### Pa Derik #567 — 🟠 WAITING

#567 is confirmed after Christel approval. Preserve it until Pa Derik's actual handset evidence is captured. Only after that evidence may #567 be cancelled through the normal Shiloh cancellation workflow. Do not modify/cancel it merely for proof.

## Attendance

The 2026-08-14 finalization cohort is 🟢 VERIFIED: #562 Zane Maree = Completed; #357 Buhle Zulu = No-show; duplicate #357 replay rejected.

Older historical attendance remains 🟠 WAITING and individually human-truth gated. Never infer or bulk-finalize.

## Meta / WhatsApp templates

### Provider-verified approved / active evidence

- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- Direct Meta UI evidence also showed `shiloh_birthday_wish_v1`, `shiloh_birthday_wish_v2`, `appointment_followup`, and `appointment_reminder` active. Provider-active does not by itself prove production configuration.

### Foreseeable lifecycle package — 🟠 WAITING provider review

Current provider truth:

- `shiloh_appointment_reminder_actions_v1` — **PENDING**;
- `shiloh_reschedule_confirmation_v1` — **PENDING**;
- `shiloh_cancellation_confirmation_v1` — **PENDING**;
- `shiloh_booking_approval_request_v1` — **PENDING**;
- `shiloh_booking_declined_v1` — **PENDING**;
- `shiloh_booking_approval_outcome_v1` — **PENDING**;
- `shiloh_appointment_followup_v2` — **PENDING**.

PR #244 added `shiloh_appointment_followup_v2` as a UTILITY template with five quick-reply rating choices (`1`–`5`). Controlled one-shot deploy **`dep-da055pjvctds73b2vc7g`** skipped the six existing templates and submitted only `appointment_followup_actions`; Meta returned **PENDING**. The provisioning flag was immediately restored to false.

PR #247 removed a local future-wiring mismatch: template sending now accepts the exact five quick-reply payloads required by follow-up-v2, while ordinary in-session reply buttons remain capped at three. This does **not** enable or send follow-up-v2 while it is pending.

All seven templates remain fail-closed. Do not configure/enable production delivery until Meta reports the exact expected template APPROVED and production configuration exactly matches. Real WhatsApp delivery evidence remains required before the relevant lifecycle control is promoted to verified.

The **Meta Lifecycle Approval** condition-watch is enabled and covers all seven exact template names.

## Client UX / button-first workstream

- PR #241 post-confirmation actions — production-live.
- PR #242 generic greeting / stale booking state escape and `Book another treatment` priority — production-live and real-handset verified.
- PR #243 `My appointments` button-first actions — production-live and real-handset verified for the no-upcoming state.
- PR #246 in-session customer-experience/rating UX — production-live: invalid/ambiguous `awaiting_rating` responses now render a five-choice WhatsApp list, positive ratings expose `Book another` + `Main menu`, and low-rating explanatory feedback remains free text.
- Actual post-confirmation three-button row (`Book another`, `My appointments`, `Main menu`) is implemented but awaits the next genuine confirmed booking for direct handset evidence; never create a booking solely for proof.
- PR #246 rating controls await the next genuine applicable `awaiting_rating` journey for handset evidence; do not manufacture a completed appointment merely for proof.
- `shiloh_appointment_followup_v2` has been submitted early so provider review runs in parallel with real-journey acceptance.

## Google integration

- Google Calendar integration is operational through existing OAuth credentials, but operation alone does not prove OAuth consent-screen verification approval.
- Google Business Profile API access remains ⏸️ DEFERRED. Last authoritative Google Cloud Console evidence on 2026-08-15 showed Business Information API enabled but **0 QPM**. Revisit when Google sends a follow-up approval email or quota changes.
- Google Contacts synchronization remains lower priority; CRM remains authoritative.

## Other gated items

- Ordinary practitioner approval combinations — 🟠 WAITING for genuine future evidence only.
- Reminder/reschedule/cancel lifecycle delivery evidence — 🟠 WAITING for Meta approval + config + genuine delivery evidence.
- Follow-up-v2 delivery — 🟠 WAITING for Meta approval + config + genuine delivery evidence.
- In-session rating UX handset evidence — 🟠 WAITING for the next genuine applicable rating journey.
- Google Contacts synchronization — ⚪ READY, lower priority.
- Ozow — 🟠 WAITING for merchant configuration and explicit business rules; do not submit speculative payment templates.
- Destructive privacy execution — 🟠 WAITING; fail closed pending authority/evidence.

## Exact continuation state

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #567 confirmed — preserve until Pa Derik handset evidence, then cancel normally.
- #562 Completed and #357 No-show resolved.
- Older attendance backlog remains human-truth gated.
- PR #232 approval resilience complete; do not redo.
- PR #238 foreseeable lifecycle-template inventory complete.
- PR #239 automatic-continuation governance complete.
- PR #241 post-confirmation UX complete.
- PR #242 navigation-priority repair complete and handset accepted.
- PR #243 button-first `My appointments` complete and handset accepted.
- PR #244 follow-up-v2 provider readiness complete; template submitted and PENDING.
- PR #246 button-first in-session rating UX production-live; genuine handset evidence pending.
- PR #247 follow-up-v2 five-payload sender readiness production-live.
- Final production flag: `META_LIFECYCLE_PROVISION_ON_START=false` on `dep-da05b7jncjis738eh13g`.
- Seven lifecycle templates are PENDING at Meta.
- GBP remains parked at last-authoritative 0 QPM.

**Authoritative current state:** GitHub `main` includes PR #247; Render `dep-da05b7jncjis738eh13g` is live with provisioning false; post-confirmation/navigation and `My appointments` button-first UX have real Dummy Test handset evidence; in-session rating button-first UX is production-live but awaits a genuine applicable handset journey; booking/staff templates are approved; seven lifecycle templates are pending; #567 remains handset-evidence gated before cancellation.

**Highest-priority state:** 🟠 **WAITING — Meta provider review of the seven submitted lifecycle templates.**

**Highest-priority genuinely actionable item while Meta is blocked:** continue read-only button-first consistency audit and minor safe UX housekeeping; do not manufacture evidence-gated journeys. Google Contacts remains the next separate lower-priority READY workstream.

**Authorization:** apply the new-chat authorization model, automatic-continuation rule, provider lead-time rule, and button-first rule. Evidence gates remain fail-closed.
