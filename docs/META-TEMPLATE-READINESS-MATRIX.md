# Meta / WhatsApp Template Readiness Matrix

Updated: 2026-08-15

## Permanent provider lead-time rule

Whenever a planned Shiloh feature may require an externally approved WhatsApp template, identify the complete foreseeable template set during feature planning and submit required templates early enough for provider review to run in parallel with engineering. Do not wait until implementation reaches the send step. Before declaring a submission batch complete, ask: **Does the current product roadmap contain any other foreseeable business-initiated WhatsApp message that would require provider approval?**

This rule does not justify speculative templates for undefined features. Payment, voucher, privacy and other future workflows must first have approved product/business semantics before provider copy is submitted.

## Current appointment/customer-care lifecycle

| Journey | Template | Provider evidence 2026-08-15 | Readiness |
|---|---|---|---|
| Booking confirmation after approval | `shiloh_booking_confirmation_v1` | Active / provider API APPROVED | Ready; existing production path |
| Practitioner booking approval request | `shiloh_booking_approval_request_v1` | Missing at audit start | Submit now; required because approval can be business-initiated outside an open client/staff conversation window |
| Secondary approver outcome notification | `shiloh_booking_approval_outcome_v1` | Missing at audit start | Submit now; required for reliable Abigail dual-authority outcome notification |
| Client booking declined | `shiloh_booking_declined_v1` | Missing at audit start | Submit now; required because practitioner decision may occur after the client's service window closes |
| 24-hour reminder with change actions | `shiloh_appointment_reminder_actions_v1` | In review / PENDING | Fail closed pending approval |
| Reschedule confirmation | `shiloh_reschedule_confirmation_v1` | In review / PENDING | Fail closed pending approval |
| Cancellation confirmation | `shiloh_cancellation_confirmation_v1` | In review / PENDING | Fail closed pending approval |
| Staff attendance finalization | `shiloh_staff_finalization_v1` | Active / provider API APPROVED | Ready; existing staff path |
| Generic appointment reminder | `appointment_reminder` | Active in Meta screenshot | Legacy fallback; supersede with action template once approved/evidence-verified |
| Post-appointment follow-up / rating | `appointment_followup` | Active in Meta screenshot | Existing production path |
| Birthday wish | `shiloh_birthday_wish_v2` | Active in Meta screenshot | Approved/active provider evidence; still requires explicit client birthday opt-in and production configuration |
| Birthday legacy | `shiloh_birthday_wish_v1` | Active in Meta screenshot | Legacy; do not newly configure when v2 is the intended current version |

## No additional template submission now

- Post-confirmation `Book another treatment`, `My appointments`, and `Main menu` are conversational actions immediately following an inbound/client journey; no separate outbound template is required for the feature itself.
- Treatment aftercare/rebooking guidance is currently delivered as part of the existing `appointment_followup`/rating conversation; no new provider template is required until a separate treatment-specific outbound campaign is deliberately designed.
- Loyalty status is client-requested. No proactive reward-notification workflow is currently defined.
- Google Business Profile and Google Contacts work do not create WhatsApp outbound-message requirements.
- Ozow/payment/voucher messages are not submitted speculatively: payment business rules and provider rollout remain gated, and exact transactional message semantics must be defined before templates are created.
- Privacy/data-subject workflows are evidence/authority gated and currently conversational/request-driven; do not create speculative outbound templates.

## Engineering rule

Provider approval and production enablement are separate gates. A template may be submitted early, but Shiloh must not configure or send through a new template until the exact provider template is APPROVED, the production environment points to the exact approved name, and the relevant real-delivery/evidence gate is satisfied.
