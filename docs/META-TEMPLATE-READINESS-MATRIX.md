# Meta / WhatsApp Template Readiness Matrix

Updated: 2026-08-18

The production Shiloh_MTC WhatsApp Manager evidence below was captured on 18 August 2026. The fresh read-only production API audit returned HTTP 200 with `report.ok=true`. Provider API quality is `UNKNOWN` for every identity; this does not supersede the separate WhatsApp Manager screenshot evidence showing **Active – Quality pending**. Provider approval is not handset delivery evidence. The checker must compare the complete provider contract and remain read-only; no template is submitted, edited or sent for evidence.

| # | Identity | Category / language | Provider state | Production configuration / wiring | Readiness and remaining gate |
|---:|---|---|---|---|---|
| 1 | `shiloh_booking_update_v1` | Utility / `en` | API **PENDING**; quality `UNKNOWN` | Exact provider contract exists; `duplicateCount=0`; `configuredName=null`; `ready=false` | **Blocked:** provider approval and production configuration/enablement, then a genuine booking-change journey. |
| 2 | `shiloh_staff_finalization_actions_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true`; genuine accepted send exists | Wired and provider-verified; preserve natural-use evidence only. |
| 3 | `shiloh_appointment_followup_v2` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine send exists, but genuine rating-response evidence is still missing. |
| 4 | `shiloh_booking_approval_outcome_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine route evidence remains. |
| 5 | `shiloh_booking_declined_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine decline journey remains. |
| 6 | `shiloh_booking_approval_request_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Wired; genuine Meta-accepted production send exists. |
| 7 | `shiloh_cancellation_confirmation_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine cancellation journey remains. |
| 8 | `shiloh_reschedule_confirmation_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine reschedule journey remains. |
| 9 | `shiloh_appointment_reminder_actions_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Wired; genuine Meta-accepted production send exists. |
| 10 | `shiloh_booking_confirmation_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Wired; genuine Meta-accepted production send exists. |
| 11 | `shiloh_staff_finalization_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Wired; genuine Meta-accepted production send exists. |
| 12 | `shiloh_birthday_wish_v2` | Marketing / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine opted-in birthday eligibility/delivery remains. |
| 13 | `shiloh_birthday_wish_v1` | Marketing / `en` | API **APPROVED**; quality `UNKNOWN` | `configuredName` equals this identity; `configured=true`; `duplicateCount=0`; `sendable=false`; `ready=false` | Evidence-only legacy identity; full contract remains non-authoritative; existing configuration cannot bypass the fail-closed registry/send gate. |
| 14 | `appointment_followup` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | `configuredName` equals this identity; `configured=true`; `duplicateCount=0`; `sendable=false`; `ready=false` | Evidence-only legacy identity; full contract remains non-authoritative; current v2 supersedes it and existing configuration cannot bypass the fail-closed registry/send gate. |
| 15 | `appointment_reminder` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | `configuredName` equals this identity; `configured=true`; `duplicateCount=0`; `sendable=false`; `ready=false` | Evidence-only legacy identity; full contract remains non-authoritative; action reminder supersedes it and existing configuration cannot bypass the fail-closed registry/send gate. |

Meta's default `hello_world` is visible but is not a Shiloh operational template and is excluded from the 15-template contract inventory.

## Permanent provider lead-time and submission governance

Identify the complete foreseeable template set during feature planning and submit required templates early enough for provider review to run in parallel with engineering. Before treating a submission batch as complete, ask whether another foreseeable roadmap message will require provider approval. This never authorizes speculative submissions: payment, voucher, privacy, or other future workflows require approved product and business semantics first. Provider approval and production enablement remain separate gates. Do not submit, edit, configure, or send a template merely to create evidence.

## Enforced readiness reconciliation

For each identity the centralized inventory reconciles: **defined by Shiloh → exact production environment name configured → provider status APPROVED → exact language/category/components/variable and button ordering match → send path wired**. Current operational contracts fail closed on any mismatch or provider-read failure. Arbitrary environment names and the three legacy identities cannot pass the send boundary. Booking update also requires its explicit environment enablement gate; birthday requires the exact brand-correct v2 contract.

Provider approval never proves handset delivery. No appointment, attendance action, birthday, reminder, client message, rating response, template submission or template edit may be manufactured for evidence.

## Exact current-template contract appendix

`v1` and `v2` are literal suffixes within a Meta **template name**. They are not a separate application or provider `version` field. All current contracts have no HEADER unless explicitly stated below (none currently do). “None” means the component is absent, not an empty string.

### `shiloh_booking_update_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None. **Buttons/payloads:** None.
- **BODY (exact):**
  ```text
  Hi {{1}}, your Shiloh appointment has been updated. 🌿

  ✨ Service: {{2}}
  👤 With: {{3}}
  📅 Date: {{4}}
  🕐 Time: {{5}}
  💰 Booked price: {{6}}
  Booking #{{7}}

  This is your latest confirmation. Reply RESCHEDULE or CANCEL if you need another change.
  ```
- **Variables in order:** `{{1}}` client name; `{{2}}` service; `{{3}}` practitioner; `{{4}}` appointment date; `{{5}}` time/range; `{{6}}` booked price; `{{7}}` booking ID.

### `shiloh_staff_finalization_actions_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None.
- **BODY (exact):** `Hi {{1}}, you have {{2}} Shiloh visit(s) awaiting finalization. Review them in batches if needed and return later. Attendance is never inferred automatically.`
- **Variables:** `{{1}}` staff/Admin display name; `{{2}}` pending visit count.
- **Buttons in exact order:** `Finalize past visits` → payload `admin_action_finalize`.

### `shiloh_appointment_followup_v2` — Utility / `en`
- **HEADER:** None. **FOOTER:** None.
- **BODY (exact):** `Hi {{1}}, thank you for visiting Shiloh for {{2}}. 🌿\n\nHow was your experience? Please choose a rating from 1 to 5 below.`
- **Variables:** `{{1}}` client name; `{{2}}` service.
- **Buttons/payloads in exact order:** `1` → `1`; `2` → `2`; `3` → `3`; `4` → `4`; `5` → `5`.

### `shiloh_booking_approval_outcome_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None. **Buttons/payloads:** None.
- **BODY (exact):** `Booking request update.\n\n{{1}} — {{2}} — {{3}}\n{{4}} has {{5}} the request.\nBooking #{{6}}\n\nThe first valid decision is final for this request.`
- **Variables:** `{{1}}` client name; `{{2}}` treatment; `{{3}}` requested date/time; `{{4}}` deciding Admin; `{{5}}` decision; `{{6}}` booking ID.

### `shiloh_booking_declined_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None.
- **BODY (exact):** `Hi {{1}}, your Shiloh booking request could not be confirmed.\n\n✨ Service: {{2}}\n📅 Requested time: {{3}}\nBooking #{{4}}\n\nThe held time has been released and nothing is booked. You can choose another available time whenever you are ready. 🌿`
- **Variables:** `{{1}}` client name; `{{2}}` service; `{{3}}` requested date/time; `{{4}}` booking ID.
- **Button:** `Book another time` → payload `BOOKING`.

### `shiloh_booking_approval_request_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None.
- **BODY (exact):** `Booking approval required.\n\nClient: {{1}}\nTreatment: {{2}}\nWith: {{3}}\nTime: {{4}}\nBooking #{{5}}\n\nThis time is being held until an authorized approver approves or declines the request.`
- **Variables:** `{{1}}` client name; `{{2}}` treatment; `{{3}}` assigned practitioner; `{{4}}` requested date/time; `{{5}}` booking ID.
- **Buttons/payloads in exact order:** `Approve` → `booking_approval_approve_<bookingId>`; `Decline` → `booking_approval_decline_<bookingId>`.

### `shiloh_cancellation_confirmation_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None. **Buttons/payloads:** None.
- **BODY (exact):** `Hi {{1}}, your Shiloh appointment has been cancelled.\n\n✨ Service: {{2}}\n📅 Date: {{3}}\n🕐 Time: {{4}}\nBooking #{{5}}\n\nReply BOOK if you would like to make another appointment. 🌿`
- **Variables:** `{{1}}` client name; `{{2}}` service; `{{3}}` appointment date; `{{4}}` appointment time; `{{5}}` booking ID.

### `shiloh_reschedule_confirmation_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None. **Buttons/payloads:** None.
- **BODY (exact):** `Hi {{1}}, your Shiloh appointment has been rescheduled. 🌿\n\n✨ Service: {{2}}\n👤 With: {{3}}\n📅 New date: {{4}}\n🕐 New time: {{5}}\n\nReply RESCHEDULE or CANCEL if you need another change.`
- **Variables:** `{{1}}` client name; `{{2}}` service; `{{3}}` practitioner; `{{4}}` new date; `{{5}}` new time.

### `shiloh_appointment_reminder_actions_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None.
- **BODY (exact):** `Hello {{1}},\n\nThis is a friendly reminder of your appointment at Shiloh Massage Therapy & Aesthetic Clinic.\n\nTreatment: {{2}}\nDate: {{3}}\nTime: {{4}}\n\nWe look forward to welcoming you.\n\nNeed to make a change? Use a button below.`
- **Variables:** `{{1}}` client name; `{{2}}` treatment; `{{3}}` appointment date; `{{4}}` appointment time.
- **Buttons/payloads in exact order:** `Reschedule` → `client_reschedule_booking`; `Cancel booking` → `client_cancel_booking`.

### `shiloh_booking_confirmation_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None. **Buttons/payloads:** None in the Meta template.
- **BODY (exact):** `Hi {{1}}, your Shiloh appointment is confirmed. 🌿\n\n✨ Service: {{2}}\n👤 With: {{3}}\n📅 Date: {{4}}\n🕐 Time: {{5}}\n\nAdd to calendar:\nGoogle Calendar: {{6}}\nApple / Outlook / phone: {{7}}\n\nNeed to make a change? Reply RESCHEDULE or CANCEL.\nWe look forward to seeing you. 🌿`
- **Variables:** `{{1}}` client name; `{{2}}` service; `{{3}}` practitioner; `{{4}}` date; `{{5}}` time/range; `{{6}}` Google Calendar URL; `{{7}}` ICS/calendar URL.

### `shiloh_staff_finalization_v1` — Utility / `en`
- **HEADER:** None. **FOOTER:** None. **Buttons/payloads:** None.
- **BODY (exact):** `Hi {{1}}, {{2}} Shiloh visit(s) {{4}} for {{3}}. Please open Shiloh Admin > Appointments > Finalize past visits and record Completed or No-show. Attendance is never inferred automatically.`
- **Variables by numeric identity:** `{{1}}` staff/Admin display name; `{{2}}` pending count; `{{3}}` clinic date; `{{4}}` reminder timing phrase. The textual occurrence order is `{{1}}, {{2}}, {{4}}, {{3}}` and must remain exact.

### `shiloh_birthday_wish_v2` — Marketing / `en`
- **HEADER:** None. **Buttons/payloads:** None.
- **BODY (exact):** `Happy birthday, {{1}}! 🎂 Wishing you a beautiful day from all of us at Shiloh Massage Therapy and Aesthetic Clinic. Thank you for being part of our community. 🌿`
- **Variable:** `{{1}}` client name.
- **FOOTER (exact):** `Reply BIRTHDAY OFF any time to stop birthday wishes.`

### Legacy provider-only identities

`shiloh_birthday_wish_v1`, `appointment_followup`, and `appointment_reminder` are visible provider identities, but their full HEADER/BODY/FOOTER/variable/button contracts are **unknown and not authoritative in current main**. No copy, variable meaning, or button/payload contract is inferred for them. They are deliberately non-sendable and cannot be enabled through an environment-name override.
