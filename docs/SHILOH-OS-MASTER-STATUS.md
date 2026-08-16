# Shiloh OS — Master Project Status

Updated: 2026-08-16
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted work.

## Authority

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

## Current production baseline

Current application baseline: **`f6612e632f2d5db6018af1601e6aba1727ab5fec`** (`Improve imported-client first WhatsApp verification`) on GitHub `main`.

Render production for this baseline is verified live and healthy on 2026-08-16; `/health` returns 200. `META_LIFECYCLE_PROVISION_ON_START=false` remains fail-closed.

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

## CRM provenance / imported-client first WhatsApp verification

CRM numbers are canonical Shiloh client IDs, not proof of WhatsApp registration. The controlled Goldie migration legitimately promoted qualifying historical clients into canonical CRM records with `source=goldie_import`.

Read-only provenance audit on 2026-08-16 established:
- CRM48 = Pa Derik; legitimate `goldie_import`, created through controlled `create_new_promotion`; keep.
- CRM473 = legitimate `goldie_import`, same controlled promotion mechanism, with historical appointment history; keep.
- CRM1 is the only stronger orphan-like review candidate found by the audit (active, no contacts, no appointments, no completed onboarding); do not delete without a final identity/supersession check.

Pa Derik handset evidence exposed a first-contact identity UX defect: an imported mobile match was treated too much like a previously verified WhatsApp identity, exact-name matching rejected `Derik` against `Pa Derik`, and natural `2 oct 64 male` input did not retain the DOB.

Commit **`f6612e63...`** fixes this production path. Imported Goldie clients with a unique matching mobile contact but no verified WhatsApp contact now enter an existing-profile claim/verification flow rather than an automatic `Welcome back`. Safe non-identity prefixes (`Pa`, `Mr`, `Mrs`, `Ms`, `Miss`, `Dr`) are ignored for compatibility matching while unsafe partial-name matching remains rejected. Successful unique number + compatible-name verification promotes the existing mobile contact to verified WhatsApp on the same CRM ID; ambiguous/conflicting identity remains fail-closed for clinic verification. Natural DOB/gender parsing accepts forms such as `2 oct 64 male` and safely expands two-digit years with validity/age bounds. No duplicate CRM client is created by this claim flow.

Fresh real-human evidence for a never-before-verified imported client remains a natural future acceptance item; do not reset Pa Derik or another real client merely to manufacture proof.

## Booking / approval core

Booking → staff approval core pipeline is production-verified, including Pending approvals recovery/resend and Christel approval of #567.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test historical policy used JP admin account alone; Dummy Test production UI has been cleaned and must not be recreated merely for proof. Pending holds have no automatic expiry. MediHeel remains Christel only.

### Pa Derik #567 — 🟠 WAITING final normal cancellation

#567 has supplied real handset evidence and exercised the corrected reschedule UX. The appointment is authoritative at **Tuesday, 18 August 2026, 08:30–10:15**, Full Body Swedish with Christel, synchronized on Shiloh — Bookings and primary Google Calendar.

Verified handset flow: clinic-aware date selection → Tuesday 18 August → morning → authoritative available-times list → 08:30 → current-vs-proposed comparison with `Nothing has changed yet` → `Confirm reschedule` / `Keep appointment` → explicit confirmation → success.

The earlier defect where a closed Sunday could be offered through relative-date UI and `Choose another date` could retain stale candidate state is fixed. Booking and reschedule date choices are clinic-calendar-aware; closed dates are rejected before daypart search; candidate state clears on another-date navigation; explicit exits are provided.

During Pa Derik's reschedule, a supplemental post-send defect (`ensureToken is not a function`) affected calendar/action-link sending after the core CRM/Calendar mutation succeeded. Commit **`e2e3d943...`** exported the helper and fixed the defect. Fresh natural post-fix evidence may be collected through Juvan or another genuine journey; do not re-mutate #567 merely for proof.

Remaining #567 action: normal Shiloh cancellation when Pa Derik is available. Do not delete directly from Calendar or DB.

## Meta / WhatsApp templates

Direct Meta WhatsApp Manager evidence on 2026-08-16 shows the lifecycle templates **Active – Quality pending**; this is active quality-rating state, not approval-review pending. The former seven-template review gate is resolved.

Canonical production generation:
- `shiloh_booking_confirmation_v1` → confirmed client booking;
- `shiloh_booking_approval_request_v1` → practitioner/staff approval request;
- `shiloh_booking_approval_outcome_v1` → secondary approver outcome where applicable;
- `shiloh_booking_declined_v1` → client decline notification;
- `shiloh_reschedule_confirmation_v1` → successful reschedule;
- `shiloh_cancellation_confirmation_v1` → successful cancellation;
- `shiloh_appointment_reminder_actions_v1` → reminder with Reschedule/Cancel actions;
- `shiloh_appointment_followup_v2` → follow-up with rating actions 1–5;
- `shiloh_birthday_wish_v2` → canonical birthday sender;
- `shiloh_staff_finalization_v1` → staff finalization.

Legacy birthday v1 and legacy follow-up are not canonical current senders. Provider-active/configured does not equal end-to-end delivery verified; genuine applicable delivery evidence remains required per route. Birthday v2 must obey genuine CRM birthday + opt-in/business rules and must not be artificially triggered.

## Juvan controlled acceptance journey — 🔵 ACTIVE

Juvan is the retained controlled CRM regression client. His reset was completed through Christel's Admin flow and no 2026 Juvan events were found on Shiloh Bookings, primary, Marietjie or Abigail calendars at baseline.

Approved scope: beginning-to-end client-perspective booking tracked across WhatsApp/provider evidence, Render processing, CRM/canonical identity and appointment state, staff approval/hold state, Google Calendar, confirmation, post-confirmation actions, corrected reschedule/closed-day behaviour, cancellation and naturally applicable lifecycle templates.

Routine screenshots are not required. Machine-visible authoritative evidence should be used wherever available; handset screenshots are required only when human/UI truth cannot otherwise be established or the user observes unexpected behaviour.

## Client UX / button-first workstream

- **Post-confirmation client UX package is 🟢 COMPLETE / production-live:** `Book another treatment`, `My appointments`, and `Main menu` are available as button-first actions, with natural-language equivalents such as `I want to make another booking`, `book another treatment`, and `another appointment` routed into the same canonical handlers. The former note that this package was paused behind Meta/Google verification is historical and must not be carried forward as an active blocker.
- Generic greeting / stale booking state escape and `Book another treatment` priority are production-live and handset verified.
- `My appointments` button-first actions are production-live and handset verified for the no-upcoming state.
- In-session customer-experience/rating UX is production-live: invalid/ambiguous `awaiting_rating` responses render a five-choice list, positive ratings expose `Book another` + `Main menu`, and low-rating explanatory feedback remains free text.
- Reschedule date selection is clinic-calendar-aware and has real Pa Derik handset evidence through date → daypart → authoritative slot → explicit confirmation → success.
- Reminder-actions delivery, follow-up-v2 delivery/rating and current-generation reschedule/cancel template delivery remain genuine-journey evidence items where not yet naturally observed. These delivery gates do not reopen the completed post-confirmation navigation package.

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
- Imported-client first-WhatsApp claim flow — 🟠 WAITING for natural first contact from another legitimate, never-before-verified Goldie-imported client; do not manufacture evidence.
- Birthday v2 delivery — 🟠 WAITING for a genuine eligible CRM birthday/opt-in condition.
- CRM1 provenance/supersession review — ⚪ READY, read-only; do not delete without proof.
- Google Contacts synchronization — ⚪ READY, lower priority.
- Ozow — 🟠 WAITING for merchant configuration and explicit business rules; do not submit speculative payment templates.
- Destructive privacy execution — 🟠 WAITING; fail closed pending authority/evidence.

## Exact continuation state

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #567 rescheduled and authoritative at Tue 18 Aug 2026 08:30–10:15; leave unchanged until normal cancellation when Pa Derik is available.
- #562 Completed and #357 No-show resolved.
- Older attendance backlog remains human-truth gated.
- Admin cleanup complete; keep only Juvan controlled reset visible among test resets.
- CRM48 and CRM473 are legitimate Goldie-imported canonical clients; CRM1 remains review-only pending identity/supersession proof.
- Imported-client first-WhatsApp verification repair is live at `f6612e63...`; natural human acceptance remains evidence-gated.
- Meta seven-template provider-review gate resolved; current lifecycle generation is production-configured; genuine per-route delivery evidence remains separate.
- Post-confirmation client UX package is complete; do not reclassify it as paused behind Meta/Google verification.
- Reschedule closed-day/loop-state repair complete and handset accepted for core UX.
- Supplemental appointment action helper defect fixed at `e2e3d943...`; fresh natural post-fix delivery evidence remains pending.
- GBP remains parked at last-authoritative 0 QPM.

**Authoritative current state:** GitHub `main` application baseline is `f6612e63...`; production is live/healthy; imported-client first-WhatsApp verification has been repaired without merging/recreating CRM records; CRM48/CRM473 are legitimate Goldie imports and CRM1 remains review-only; current-generation Meta lifecycle templates are active/configured; Pa Derik #567 is authoritative at Tue 18 Aug 08:30–10:15 and awaits normal cancellation when available; the post-confirmation client UX package is complete; Juvan controlled E2E remains the active acceptance workstream.

**Highest-priority genuinely actionable item:** 🔵 **Continue Juvan beginning-to-end controlled client acceptance from the clean baseline**, exercising the completed post-confirmation UX, current template wiring and repaired reschedule/closed-day/supplemental-action path. Imported-client claim proof waits for a natural eligible Goldie client and must not block Juvan.

**Authorization:** the current chat/workstream is already approved under the automatic-continuation rule. Continue ordinary engineering/deploy/verification automatically; stop only at a genuine human/provider evidence gate, unexpected destructive risk, contradictory authority, or material scope expansion.
