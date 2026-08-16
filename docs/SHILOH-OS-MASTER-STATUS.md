# Shiloh OS — Master Project Status

Updated: 2026-08-16
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted work.

## Authority

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

## Current production baseline

Current application baseline: **`e2e3d943d7291819e4c8e65e68a4816147380549`** (`Export calendar token helper for appointment actions`) on GitHub `main`.

Render production deploy **`dep-da0rph5g1s2s73bp2i90`** is verified **LIVE** on 2026-08-16. `/health` is returning 200. `META_LIFECYCLE_PROVISION_ON_START=false` remains fail-closed; provisioning is not required for templates that already exist at Meta.

Current-generation production template configuration is active for booking confirmation, booking approval request/outcome/decline, reschedule confirmation, cancellation confirmation, reminder actions, follow-up v2, birthday v2 and staff finalization. Legacy reminder/follow-up names remain fallback-only where retained; current action templates take precedence to avoid duplicate sends.

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

## Admin / controlled-test cleanup

Production Admin UX was cleaned on 2026-08-16. Visible Chenique/Dummy Test reset entries and the Pending approvals menu entry were removed from the normal privileged menu presentation. The underlying approval-recovery processor remains available so proven recovery capability was not destroyed.

**Reset Juvan profile** remains visible for Christel and Jean-Pierre as the single retained controlled CRM regression reset. This is a test-fixture function, not ordinary CRM functionality, and should be retired later if/when an automated fixture mechanism supersedes it.

All known Dummy Test calendar events were removed from the Shiloh Bookings and primary calendars; post-cleanup search returned no Dummy Test events on Shiloh Bookings, primary, Marietjie or Abigail calendars for 2026.

## Booking / approval core

Booking → staff approval core pipeline is production-verified, including Pending approvals recovery/resend and Christel approval of #567.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test historical policy used JP admin account alone; Dummy Test production UI has been cleaned and must not be recreated merely for proof. Pending holds have no automatic expiry. MediHeel remains Christel only.

### Pa Derik #567 — 🟠 WAITING final normal cancellation

#567 has now supplied real handset evidence and has additionally exercised the corrected reschedule UX.

Verified handset flow on 2026-08-16:
- existing Full Body Swedish / Christel booking was visible and selectable;
- clinic-aware reschedule date selection was button-first;
- Tuesday 18 August 2026 was selected;
- morning availability produced an authoritative `Available times` list;
- 08:30 was selected;
- Shiloh displayed current vs proposed appointment and explicitly stated `Nothing has changed yet`;
- `Confirm reschedule` / `Keep appointment` controls were shown;
- explicit confirmation completed the reschedule.

Authoritative Google Calendar verification after the mutation shows **Full Body Swedish — Pa Derik — Christel** on **Tuesday, 18 August 2026, 08:30–10:15** on both **Shiloh — Bookings** and the primary calendar, with no matching 17 August event in the checked window.

The earlier reschedule defect was real: closed Sunday could be offered through relative-date UI and `Choose another date` could retain stale candidate state. The production fix now makes date choices clinic-calendar-aware, rejects closed dates before daypart search, clears candidate date/time when choosing another date, and supplies explicit another-time / another-date / keep-appointment exits. The same closed-date guard applies to new booking availability.

During the Pa Derik reschedule, Render exposed a separate supplemental post-send defect: `TypeError: ensureToken is not a function` in `customerAppointmentActions.js`. The core CRM/Calendar reschedule had already succeeded; only supplemental calendar/action-link sending failed. Root cause was an import/export mismatch: `ensureToken` existed in `customerBookingConfirmation.js` but was not exported. Commit **`e2e3d943...`** exports the helper; production deploy **`dep-da0rph5g1s2s73bp2i90`** is live and healthy.

Do **not** reschedule #567 again merely for proof. Fresh post-fix handset evidence for the supplemental helper may be collected naturally through Juvan or another genuine journey. The remaining #567 action is normal Shiloh cancellation when Pa Derik is available. Do not delete it directly from Calendar or DB.

## Meta / WhatsApp templates

### Provider-active evidence — 2026-08-16

Direct Meta WhatsApp Manager evidence now shows the following templates **Active – Quality pending** (quality-rating state, not approval-review pending):

- `shiloh_appointment_followup_v2` — Utility;
- `shiloh_booking_approval_outcome_v1` — Utility;
- `shiloh_booking_declined_v1` — Utility;
- `shiloh_booking_approval_request_v1` — Utility;
- `shiloh_cancellation_confirmation_v1` — Utility;
- `shiloh_reschedule_confirmation_v1` — Utility;
- `shiloh_appointment_reminder_actions_v1` — Utility;
- `shiloh_booking_confirmation_v1` — Utility;
- `shiloh_staff_finalization_v1` — Utility;
- `shiloh_birthday_wish_v2` — Marketing;
- `shiloh_birthday_wish_v1` — Marketing;
- legacy `appointment_followup` — Utility.

Therefore the former seven-template Meta review gate is **closed/resolved**. Do not describe these templates as `PENDING` unless newer provider evidence explicitly changes their state.

### Canonical production configuration

Current-generation templates are configured/wired as follows:

- `shiloh_booking_confirmation_v1` → confirmed client booking;
- `shiloh_booking_approval_request_v1` → practitioner/staff approval request with Approve/Decline payloads;
- `shiloh_booking_approval_outcome_v1` → secondary approver outcome where applicable;
- `shiloh_booking_declined_v1` → client decline notification with Book another time action;
- `shiloh_reschedule_confirmation_v1` → successful client reschedule;
- `shiloh_cancellation_confirmation_v1` → successful client cancellation;
- `shiloh_appointment_reminder_actions_v1` → reminder with Reschedule/Cancel actions;
- `shiloh_appointment_followup_v2` → follow-up with rating actions 1–5;
- `shiloh_birthday_wish_v2` → canonical birthday sender;
- `shiloh_staff_finalization_v1` → staff finalization route.

Production startup on the current generation reports `reminderActionsTemplateConfigured=true`, `followupActionsTemplateConfigured=true`, and `birthdayTemplateConfigured=true`. `shiloh_booking_confirmation_v1` and `shiloh_staff_finalization_v1` are independently provider-reported APPROVED / UTILITY in startup provisioning checks.

Legacy birthday v1 and legacy follow-up are not canonical current senders. Do not enable duplicate lifecycle sends.

### Remaining template evidence gates

Provider-active/configured does not equal end-to-end delivery verified. Promote each lifecycle route to 🟢 only after a genuine applicable WhatsApp journey proves the exact template/parameters/buttons where human/provider evidence is required.

Pa Derik's 2026-08-16 reschedule occurred **before** the current-generation lifecycle template normalization deploy, so his final in-session `Appointment rescheduled` message does not by itself prove `shiloh_reschedule_confirmation_v1` delivery. Use Juvan or another genuine journey for post-normalization proof; do not mutate #567 merely to prove a template.

Birthday v2 must obey CRM birthday + opt-in/business rules and must not be artificially triggered in the Juvan booking test.

## Juvan controlled acceptance journey — 🔵 ACTIVE

Juvan is the retained controlled CRM regression client. His reset was completed through Christel's Admin flow and no 2026 Juvan events were found on Shiloh Bookings, primary, Marietjie or Abigail calendars at baseline.

The approved acceptance scope is beginning-to-end client-perspective booking with tracking across WhatsApp/provider evidence, Render processing, CRM/canonical identity and appointment state, staff approval/hold state, Google Calendar, confirmation, button-first post-confirmation actions, corrected reschedule/closed-day behaviour, cancellation and naturally applicable lifecycle templates.

Routine screenshots are not required. Machine-visible authoritative evidence should be used wherever available; handset screenshots are required only when a human/UI truth cannot otherwise be established or when the user observes unexpected behaviour.

The direct Render Postgres connector still cannot establish SSL/TLS for read-only SQL, so CRM truth must be reconciled through Shiloh's guarded application flows, audit/log evidence, appointment IDs and Calendar state unless that connector later becomes available. Ambiguity remains fail-closed.

## Client UX / button-first workstream

- Post-confirmation client actions are production-live.
- Generic greeting / stale booking state escape and `Book another treatment` priority are production-live and handset verified.
- `My appointments` button-first actions are production-live and handset verified for the no-upcoming state.
- In-session customer-experience/rating UX is production-live: invalid/ambiguous `awaiting_rating` responses render a five-choice list, positive ratings expose `Book another` + `Main menu`, and low-rating explanatory feedback remains free text.
- Reschedule date selection is now clinic-calendar-aware and has real Pa Derik handset evidence through date → daypart → authoritative slot → explicit confirmation → success.
- Actual post-confirmation three-button row, reminder-actions delivery, follow-up-v2 delivery/rating and current-generation reschedule/cancel template delivery remain genuine-journey evidence items where not yet naturally observed.

## Attendance

The 2026-08-14 finalization cohort is 🟢 VERIFIED: #562 Zane Maree = Completed; #357 Buhle Zulu = No-show; duplicate #357 replay rejected.

Older historical attendance remains 🟠 WAITING and individually human-truth gated. Never infer or bulk-finalize.

## Google integration

- Google Calendar integration is operational through existing OAuth credentials, but operation alone does not prove OAuth consent-screen verification approval.
- Google Business Profile API access remains ⏸️ DEFERRED. Last authoritative Google Cloud Console evidence on 2026-08-15 showed Business Information API enabled but **0 QPM**. Revisit when Google sends a follow-up approval email or quota changes.
- Google Contacts synchronization remains lower priority; CRM remains authoritative.

## Other gated items

- Ordinary practitioner approval combinations — 🟠 WAITING for genuine future evidence only.
- Current-generation reminder/reschedule/cancel lifecycle template delivery evidence — 🟠 WAITING for genuine delivery evidence where not yet observed.
- Follow-up-v2 delivery — 🟠 WAITING for a genuine completed-visit journey.
- In-session rating UX handset evidence — 🟠 WAITING for the next genuine applicable rating journey.
- Birthday v2 delivery — 🟠 WAITING for a genuine eligible CRM birthday/opt-in condition.
- Google Contacts synchronization — ⚪ READY, lower priority.
- Ozow — 🟠 WAITING for merchant configuration and explicit business rules; do not submit speculative payment templates.
- Destructive privacy execution — 🟠 WAITING; fail closed pending authority/evidence.

## Exact continuation state

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #567 **rescheduled and authoritative at Tue 18 Aug 2026 08:30–10:15**; real handset reschedule UX evidence captured; leave unchanged until normal cancellation when Pa Derik is available.
- #562 Completed and #357 No-show resolved.
- Older attendance backlog remains human-truth gated.
- Admin cleanup complete; keep only Juvan controlled reset visible among test resets.
- Meta seven-template provider-review gate resolved by direct Active – Quality pending evidence.
- Current lifecycle template generation is production-configured; genuine per-route delivery evidence remains separate.
- Reschedule closed-day/loop-state repair complete and handset accepted for the core UX.
- Supplemental appointment action helper export defect fixed at `e2e3d943...`; fresh natural post-fix delivery evidence remains pending.
- Final production deploy: `dep-da0rph5g1s2s73bp2i90` LIVE.
- GBP remains parked at last-authoritative 0 QPM.

**Authoritative current state:** GitHub `main` is at `e2e3d943...`; Render `dep-da0rph5g1s2s73bp2i90` is live and healthy; current-generation Meta lifecycle templates are provider-active and production-configured; Pa Derik #567 has real handset reschedule evidence and Calendar truth at Tue 18 Aug 08:30–10:15; the supplemental action-token defect found during that journey is fixed live; #567 normal cancellation remains deferred until Pa Derik is available; Juvan controlled end-to-end acceptance is the active test workstream.

**Highest-priority genuinely actionable item:** 🔵 **Continue Juvan beginning-to-end controlled client acceptance from the clean baseline**, using the current production template generation and specifically re-verifying the repaired reschedule/closed-day/supplemental-action path without manufacturing unrelated human-truth evidence.

**Authorization:** the current chat/workstream is already approved under the automatic-continuation rule. Continue ordinary engineering/deploy/verification automatically; stop only at a genuine human/provider evidence gate, unexpected destructive risk, contradictory authority, or material scope expansion.
