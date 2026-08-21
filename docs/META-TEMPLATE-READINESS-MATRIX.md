# Meta / WhatsApp Template Readiness Matrix

Updated: 2026-08-21

The production Shiloh_MTC WhatsApp Manager evidence below was captured on 18 August 2026, with fresh booking-update provider/activation evidence on 19 August, the controlled `shiloh_booking_confirmation_v2` submission on 20 August, and a fresh complete 18-contract production/provider audit plus v2 activation on 21 August 2026. Provider approval is not handset delivery evidence and provider acceptance is not production activation. The checker must compare the complete provider contract and remain read-only except for an explicitly authorized controlled submission; no template is edited or sent merely for evidence.

| # | Identity | Category / language | Provider state | Production configuration / wiring | Readiness and remaining gate |
|---:|---|---|---|---|---|
| 1 | `shiloh_booking_update_v1` | Utility / `en` | API **APPROVED**; `already_exists`; quality `UNKNOWN`; not resubmitted | Exact provider identity and component contract verified; `duplicateCount=0`; production configured with `WHATSAPP_BOOKING_UPDATE_TEMPLATE=shiloh_booking_update_v1` and `WHATSAPP_BOOKING_UPDATE_ENABLED=true`. PR #332 terminally suppresses stale ended booking-update rows before delivery. | **LIVE / ENABLED.** Provider and production activation gates are closed. Successful customer delivery evidence remains open and may only arise naturally from a genuine change to a still-future appointment. #575 / audit event 674 is terminally suppressed historical evidence only and can never serve as delivery evidence. |
| 2 | `shiloh_staff_finalization_actions_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true`; genuine accepted send exists | Wired and provider-verified; preserve natural-use evidence only. |
| 3 | `shiloh_appointment_followup_v2` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine send exists, but genuine rating-response evidence is still missing. |
| 4 | `shiloh_booking_approval_outcome_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine route evidence remains. |
| 5 | `shiloh_booking_declined_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine decline journey remains. |
| 6 | `shiloh_booking_approval_request_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Wired; genuine Meta-accepted production send exists. |
| 7 | `shiloh_cancellation_confirmation_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine cancellation journey remains. |
| 8 | `shiloh_reschedule_confirmation_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine reschedule journey remains. |
| 9 | `shiloh_appointment_reminder_actions_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Wired; genuine Meta-accepted production send exists. |
| 10 | `shiloh_booking_confirmation_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true`; `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE=shiloh_booking_confirmation_v1` remains the live selector | **LIVE FALLBACK.** Preserve while v2 remains provider/activation gated. |
| 11 | `shiloh_booking_confirmation_v2` | Utility / `en` | API **APPROVED**; quality `UNKNOWN`; WhatsApp Manager human evidence **Active — Quality pending** | PR #383 made the exact contract sendable only through the centralized fail-closed gate; production selector is `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE=shiloh_booking_confirmation_v2`; exact five body parameters + three appointment-scoped quick-reply payloads; `duplicateCount=0`; `configured=true`; `ready=true`. PR #384/startup migration 071 persists template name + provider message ID. | **LIVE / ENABLED.** Provider, contract, configuration, wiring and deployment gates are closed. V1 remains exact/approved as the single-selector rollback. Genuine v2 handset delivery remains open for natural booking use only. |
| 12 | `shiloh_staff_finalization_v1` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Wired; genuine Meta-accepted production send exists. |
| 13 | `shiloh_birthday_wish_v2` | Marketing / `en` | API **APPROVED**; quality `UNKNOWN` | Exact configured contract; `duplicateCount=0`; `ready=true` | Provider-ready; genuine opted-in birthday eligibility/delivery remains. |
| 14 | `shiloh_birthday_wish_v1` | Marketing / `en` | API **APPROVED**; quality `UNKNOWN` | `configuredName` equals this identity; `configured=true`; `duplicateCount=0`; `sendable=false`; `ready=false` | Evidence-only legacy identity; full contract remains non-authoritative; existing configuration cannot bypass the fail-closed registry/send gate. |
| 15 | `appointment_followup` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | `configuredName` equals this identity; `configured=true`; `duplicateCount=0`; `sendable=false`; `ready=false` | Evidence-only legacy identity; full contract remains non-authoritative; current v2 supersedes it and existing configuration cannot bypass the fail-closed registry/send gate. |
| 16 | `appointment_reminder` | Utility / `en` | API **APPROVED**; quality `UNKNOWN` | `configuredName` equals this identity; `configured=true`; `duplicateCount=0`; `sendable=false`; `ready=false` | Evidence-only legacy identity; full contract remains non-authoritative; action reminder supersedes it and existing configuration cannot bypass the fail-closed registry/send gate. |

Meta's default `hello_world` is visible but is not a Shiloh operational template and is excluded from the 16-template contract inventory.

## Booking confirmation v2 controlled submission — 2026-08-20

The local contract for `shiloh_booking_confirmation_v2` was frozen before provider submission. PR #343 registered the exact contract in the central inventory as deliberately non-sendable and wired only canonical, non-mutating first-tap handlers. `Add to calendar` delegates to the existing Google Calendar / Apple-Outlook CTA path with appointment/client-phone ownership revalidation. `Manage booking` delegates to the existing guarded `Reschedule`, `Cancel booking`, and `My appointments` actions. `My appointments` remains the existing deterministic appointment view. `shiloh_booking_confirmation_v1` remained the live production selector throughout.

PR #343 head `ec656b9d56e9a5e58355ff4372398e3699935ce2` passed CI #1093 with **716/0** and merged as `311ce80030b4ef7600d55b8a73e895729d22b595`. PR #344 added sanitized provider component/status/duplicate-count read-back, passed CI #1095 with **717/0**, and merged as `3cf8dbce36c58d9f52c07951481d171d28d61539`.

Only after those gates were green, `META_BOOKING_CONFIRMATION_V2_PROVISION_ON_START=true` was set for one controlled Render startup. Deploy `dep-da383btg1s2s73d19cn0` reached LIVE and recorded exactly one submission (`submitted=true`, `reason=submitted`). The immediate read-only provider read-back at 06:25:51 SAST returned:

- name `shiloh_booking_confirmation_v2`;
- status **PENDING**;
- category **UTILITY**;
- language **en**;
- exact semantic contract **true**;
- `duplicateCount=0`;
- HEADER text `Appointment confirmed`;
- exact five-variable BODY;
- FOOTER `Shiloh Massage Therapy & Aesthetic Clinic`;
- QUICK_REPLY buttons in exact order: `Add to calendar`, `Manage booking`, `My appointments`.

The one-shot provisioning flag was immediately restored to `false`; flag-off deploy `dep-da383pdg1s2s73d1a40g` reached LIVE. Its normal v1 startup check reconfirmed `shiloh_booking_confirmation_v1` as configured, **APPROVED / UTILITY / already_exists**, with `submitted=false`. There was no v2 provisioning log on that restart.

**Activation remains blocked.** PENDING is not APPROVED. A later activation decision requires a fresh read-only provider check proving APPROVED + exact name/language/category/components + `duplicateCount=0`, followed by a separately reviewed code/config change that deliberately makes v2 sendable and selects it. Do not re-submit while the exact provider identity exists, and do not manufacture a booking or handset interaction for evidence.

## Booking confirmation v2 production activation — 2026-08-21

Fresh verifier deploy `dep-da439mjncjis73auosgg` ran on unchanged PR #382 `main` with v1 still selected. Meta returned `submitted=false / already_exists_exact`, **APPROVED / UTILITY / en**, exact frozen HEADER/BODY/FOOTER/buttons, and `duplicateCount=0`. The one-shot v2 verifier was restored to `false` by deploy `dep-da43a28ae00c739j2kk0`; no provider identity or message was created.

PR #383 merged as `7d0493cc6a977ef1136efb57303607f7d6342667` after CI #1204 passed **832/832**. It:

- permits v2 only through the existing exact provider/configuration gate;
- sends exactly five body parameters followed by quick-reply payloads in exact button order: `Add to calendar`, `Manage booking`, `My appointments`;
- reuses the canonical appointment-scoped calendar/manage/my-appointments handlers;
- suppresses redundant automatic supplements for both v1 and v2;
- retains v1 as an explicit selector rollback; and
- preserves accepted template name and provider message ID without reopening a provider-accepted claim.

PR #384 merged as `aed805842818983eb5d4e3ca50054627eea7fe0c` after CI #1206 passed. Deploy `dep-da43f1rbc2fs7395cv80` verified migration `071_booking_confirmation_template_evidence.sql` and its evidence columns while v1 remained selected.

A full sanitized production provider audit on deploy `dep-da43feuk1f9s73ajj6m0` reconciled all 18 current/legacy identities. Every current operational contract was APPROVED, exact, `en`, duplicate-free and ready under its current configuration; the three legacy identities remained `sendable=false / ready=false`.

Controlled activation deploy `dep-da43frojo6nc73diqvg0` selected v2 and returned `configured=true / ready=true` for v2. V1 remained provider APPROVED/exact/duplicate-free and became `ready=false` only because the shared selector no longer named it. Final deploy `dep-da43g9mk1f9s73ajl33g` restored `META_TEMPLATE_INVENTORY_AUDIT_ON_START=false`, retained the v2 selector, reached LIVE, verified migration 071, returned `/health` status/database `ok`, and had no error/fatal logs.

No appointment, booking, client message, attendance action, Juvan journey, template submission or provider edit was manufactured. Genuine v2 handset delivery remains an evidence boundary owned by Booking & Admin UX during natural business use.

## Booking-update approval, stale suppression and production activation — 2026-08-19

The provider gate for `shiloh_booking_update_v1` is closed: the template is **APPROVED**, `already_exists`, was not resubmitted, matches the expected provider identity, Utility / `en` category/language and exact component contract, and has `duplicateCount=0`. Provider quality remains `UNKNOWN`.

The production activation gate is also closed. Production / DevOps performed one Render environment merge update setting exactly:

- `WHATSAPP_BOOKING_UPDATE_TEMPLATE=shiloh_booking_update_v1`
- `WHATSAPP_BOOKING_UPDATE_ENABLED=true`

Render activation deploy `dep-da2qovs9v7es73cqlrr0` reached LIVE at 15:16:16 SAST on GitHub `main` `29cf4ebc249b8b85d66a1616a26e35bd9e9739a0`. Post-restart health returned HTTP 200; startup provider verification reported `submitted=false`, `reason=already_exists`, `providerStatus=APPROVED`; no Meta resubmission or unexpected booking-update send occurred during startup.

Immediately before activation, authoritative production read-only evidence established `active_booking_update_rows=0`. Appointment **#575 / audit event 674** remained terminally `suppressed` with reason `appointment_already_ended` and `sent_at=null`. PR #332 continues to exclude suppressed rows from pending/failed retry scans. #575 / 674 is historical queue evidence only and must never be released, marked sent or used as successful delivery evidence.

Successful booking-update customer delivery evidence remains **OPEN**. It may only close from a naturally occurring service, practitioner, time or price change to a **still-future appointment**. Do not mutate an appointment, manufacture another booking change, force a retry or send a WhatsApp message merely to create evidence.

The deterministic production kill switch is `WHATSAPP_BOOKING_UPDATE_ENABLED=false`.

The supplied stale-suppression investigation observed `attempt_count=27`, but a further old-code retry occurred at 14:25:13 SAST before PR #332 deployed, so 27 remains an investigation baseline rather than an asserted final counter. Direct post-deploy SQL verification in that earlier checkpoint was blocked by the sanctioned Render read-only connector's SSL/TLS negotiation failure; no write-capable workaround was used.

## Permanent provider lead-time and submission governance

Identify the complete foreseeable template set during feature planning and submit required templates early enough for provider review to run in parallel with engineering. Before treating a submission batch as complete, ask whether another foreseeable roadmap message will require provider approval. This never authorizes speculative submissions: payment, voucher, privacy, or other future workflows require approved product and business semantics first. Provider approval and production enablement remain separate controls even when both are currently satisfied. Do not submit, edit, configure, or send a template merely to create evidence.

## Enforced readiness reconciliation

For each identity the centralized inventory reconciles: **defined by Shiloh → exact production environment name configured → provider status APPROVED → exact language/category/components/variable and button ordering match → send path wired**. Current operational contracts fail closed on any mismatch or provider-read failure. Arbitrary environment names and the three legacy identities cannot pass the send boundary. Booking update also requires its explicit environment enablement gate; that gate is currently enabled, with `WHATSAPP_BOOKING_UPDATE_ENABLED=false` remaining the deterministic kill switch. Booking confirmation v2 is production-selected and sendable only while the shared selector names v2 and the exact APPROVED/duplicate-free provider contract remains valid. V1 remains the explicit single-selector rollback and becomes ready again only when deliberately reselected. Birthday requires the exact brand-correct v2 contract.

Provider approval and production activation never prove handset delivery. No appointment, attendance action, birthday, reminder, client message, rating response, template submission or template edit may be manufactured for evidence.

## Exact current-template contract appendix

`v1` and `v2` are literal suffixes within a Meta **template name**. They are not a separate application or provider `version` field. A component is absent unless explicitly listed. Booking confirmation v2 is the current contract with an explicit static TEXT HEADER.

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
- **Buttons/payloads in exact order:** `Finalize past visits` → `admin_action_finalize`.

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

### `shiloh_booking_confirmation_v2` — Utility / `en` — provider APPROVED / production active
- **HEADER:** TEXT `Appointment confirmed`.
- **BODY (exact):**
  ```text
  Hi {{1}}, your Shiloh appointment is confirmed. 🌿

  ✨ Service: {{2}}
  👤 Practitioner: {{3}}
  📅 Date: {{4}}
  🕐 Time: {{5}}

  Use the options below to add this appointment to your calendar or manage your booking.

  We look forward to welcoming you. 🌿
  ```
- **Variables in order:** `{{1}}` client name; `{{2}}` service; `{{3}}` practitioner; `{{4}}` date; `{{5}}` time/range.
- **FOOTER:** `Shiloh Massage Therapy & Aesthetic Clinic`.
- **Buttons in exact order:** QUICK_REPLY `Add to calendar`; QUICK_REPLY `Manage booking`; QUICK_REPLY `My appointments`.
- **Application payload/handler contract:** appointment-scoped payloads route calendar/manage actions through existing canonical handlers; My appointments uses the existing deterministic appointment view. The Meta template provider definition contains button labels/types, not application payload IDs.
- **Activation:** `sendable=true`, current production selector is v2, provider status APPROVED, exact contract true and `duplicateCount=0`. V1 remains the explicit selector rollback. Do not resubmit.

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
