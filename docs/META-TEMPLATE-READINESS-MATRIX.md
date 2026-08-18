# Meta / WhatsApp Template Readiness Matrix

Updated: 2026-08-18

The production Shiloh_MTC WhatsApp Manager evidence below was captured on 18 August 2026. **Active – Quality pending** is provider approval evidence, but not handset delivery evidence. `In review` is not approval. The checker must compare the complete provider contract and remain read-only; no template is submitted, edited or sent for evidence.

| # | Identity | Category / language | Provider state | Production configuration / wiring | Readiness and remaining gate |
|---:|---|---|---|---|---|
| 1 | `shiloh_booking_update_v1` | Utility / English | **In review** | Expected current name; outbox additionally requires `WHATSAPP_BOOKING_UPDATE_ENABLED=true` | **Blocked:** provider approval, exact contract, environment gate, then genuine booking-change journey. |
| 2 | `shiloh_staff_finalization_actions_v1` | Utility / English | Active – Quality pending | Current action path; provider check APPROVED / UTILITY; genuine accepted send exists | Wired and provider-verified; preserve natural-use evidence only. |
| 3 | `shiloh_appointment_followup_v2` | Utility / English | Active – Quality pending | Current follow-up-actions configuration | Provider-ready; genuine send exists, but genuine rating-response evidence is still missing. |
| 4 | `shiloh_booking_approval_outcome_v1` | Utility / English | Active – Quality pending | Current secondary-approver outcome contract | Provider-ready; genuine route evidence remains. |
| 5 | `shiloh_booking_declined_v1` | Utility / English | Active – Quality pending | Current decline contract | Provider-ready; genuine decline journey remains. |
| 6 | `shiloh_booking_approval_request_v1` | Utility / English | Active – Quality pending | Current practitioner request and resend path | Wired; genuine Meta-accepted production send exists. |
| 7 | `shiloh_cancellation_confirmation_v1` | Utility / English | Active – Quality pending | Current cancellation contract; provider API APPROVED | Provider-ready; genuine cancellation journey remains. |
| 8 | `shiloh_reschedule_confirmation_v1` | Utility / English | Active – Quality pending | Current reschedule contract | Provider-ready; genuine reschedule journey remains. |
| 9 | `shiloh_appointment_reminder_actions_v1` | Utility / English | Active – Quality pending | Current reminder-actions configuration | Wired; genuine Meta-accepted production send exists. |
| 10 | `shiloh_booking_confirmation_v1` | Utility / English | Active – Quality pending | Current confirmation contract; provider check APPROVED / UTILITY | Wired; genuine Meta-accepted production send exists. |
| 11 | `shiloh_staff_finalization_v1` | Utility / English | Active – Quality pending | Current staff finalization path; provider check APPROVED / UTILITY | Wired; genuine Meta-accepted production send exists. |
| 12 | `shiloh_birthday_wish_v2` | Marketing / English | Active – Quality pending | Current configured, brand-correct v2 only | Provider-ready; genuine opted-in birthday eligibility/delivery remains. |
| 13 | `shiloh_birthday_wish_v1` | Marketing / English | Active – Quality pending | Legacy; deliberately non-sendable | Evidence-only legacy identity; do not newly configure. |
| 14 | `appointment_followup` | Utility / English | Active – Quality pending | Legacy follow-up | Evidence-only legacy identity; current v2 supersedes it. |
| 15 | `appointment_reminder` | Utility / English | Active – Quality pending | Legacy reminder | Evidence-only legacy identity; action reminder supersedes it. |

Meta's default `hello_world` is visible but is not a Shiloh operational template and is excluded from the 15-template contract inventory.

## Enforced readiness reconciliation

For each identity the centralized inventory reconciles: **defined by Shiloh → exact production environment name configured → provider status APPROVED → exact language/category/components/variable and button ordering match → send path wired**. Current operational contracts fail closed on any mismatch or provider-read failure. Arbitrary environment names and the three legacy identities cannot pass the send boundary. Booking update also requires its explicit environment enablement gate; birthday requires the exact brand-correct v2 contract.

Provider approval never proves handset delivery. No appointment, attendance action, birthday, reminder, client message, rating response, template submission or template edit may be manufactured for evidence.
