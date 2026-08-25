# Shiloh Calendar template disposition and verification matrix

Controlled unit: `SHILOH-CALENDAR-OPERATIONAL-ASSURANCE-CUTOVER`

Authority: `src/services/metaTemplateContracts.js` is the centralized production contract registry. The registry declares 19 contract keys, exact expected provider components, whether a contract is sendable, configured-name rules, provider approval/duplicate checks, and send-time gates. This matrix does **not** authorize deleting or disabling any Meta template. `RETIRE` means "do not use for new sends; preserve until a separately authorized Meta cleanup".

Verification legend:
- **Trigger**: code path / feature gate is explicit.
- **Variables / rendered payload**: contract builder defines exact body/buttons/components and `compareContract` requires semantic equality to Meta.
- **Recipient**: sender path resolves the intended client/staff/practitioner recipient before send.
- **Idempotency**: lifecycle sender has a canonical claim/delivery guard or the template is an interactive/auth infrastructure message whose upstream operation owns idempotency.
- **Failure handling**: send path fails closed or records retry/delivery evidence; template approval and exact-component mismatches block sends through `assertTemplateSendAllowed`.
- **Audit**: canonical lifecycle/audit/delivery records retain appointment/message/provider evidence where applicable.

| Contract key | Default/provider contract | Disposition | Trigger / recipient | Variables & rendered payload | Idempotency / failure / audit verification |
|---|---|---|---|---|---|
| `booking_update` | configured `WHATSAPP_BOOKING_UPDATE_TEMPLATE` | RETAIN | Explicit booking-update gate; client recipient | Exact contract registry comparison | Feature-gated; send blocked unless exact/approved/configured; appointment delivery evidence applies |
| `staff_auth_otp` | configured/default staff-auth OTP contract | CRITICAL INFRASTRUCTURE | Staff browser authentication; authenticated staff phone | Exact authentication-template contract; one-time code semantics | `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED`; exact provider contract required; staff-auth session/OTP state owns replay and audit |
| `staff_finalization_actions` | registry action contract | CRITICAL INFRASTRUCTURE | Staff appointment finalization workflow; assigned staff | Exact buttons/components | Finalization workflow owns claim/state transition; contract mismatch blocks send; operational audit retained |
| `appointment_followup_v2` | follow-up actions contract | OTHER LIFECYCLE | Post-appointment client follow-up | Exact lifecycle contract | Canonical follow-up state/delivery path; exact/approved template required |
| `booking_approval_outcome` | approval outcome contract | OTHER LIFECYCLE | Existing approval workflow; client recipient | Exact lifecycle contract | Approval state is canonical; send contract rejects mismatches; delivery/audit evidence retained |
| `booking_declined` | booking declined contract | OTHER LIFECYCLE | Existing approval/decline workflow; client recipient | Exact lifecycle contract | Canonical approval outcome prevents duplicate decision semantics; provider contract enforced |
| `booking_approval_request` | booking approval request contract | OTHER LIFECYCLE | Existing practitioner approval workflow; practitioner/admin recipient | Exact interactive lifecycle contract | Canonical approval request owns state; send contract enforced; no retirement in this cutover |
| `reschedule_approval_request` | reschedule approval request contract | RETAIN | Client reschedule approval workflow; practitioner recipient | Exact interactive lifecycle contract | `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED`; canonical approval state; exact/approved provider required |
| `reschedule_declined` | reschedule declined contract | RETAIN | Reschedule decision workflow; client recipient | Exact lifecycle contract | Same feature gate and canonical decision state; exact provider contract required |
| `cancellation_confirmation` | cancellation confirmation contract | RETAIN | Canonical cancellation lifecycle; client recipient | Exact lifecycle contract | Canonical appointment status is source; delivery/provider evidence retained; contract mismatch blocks send |
| `reschedule_confirmation` | reschedule confirmation contract | RETAIN | Canonical reschedule lifecycle; client recipient | Exact lifecycle contract | Canonical appointment timestamps are source; delivery/provider evidence retained |
| `appointment_reminder_actions` | reminder actions contract | RETAIN | Scheduled reminder lifecycle; client recipient | Exact action buttons/components | Reminder lifecycle owns due/claim state; exact provider contract required; failures remain observable |
| `booking_confirmation` | v1 confirmation contract | RETAIN | Existing booking-confirmation sender when configured to v1; client recipient | Exact v1 confirmation contract | `customer_message_deliveries` primary key `(appointment_id,message_kind)` prevents duplicate delivery claim; provider IDs/template name retained |
| `booking_confirmation_v2` | v2 confirmation contract | RETAIN | Existing booking-confirmation sender when configured to v2; client recipient | Exact v2 confirmation contract | Same canonical `customer_message_deliveries` idempotency/evidence; exact provider contract required |
| `staff_finalization` | configured/default staff finalization contract | CRITICAL INFRASTRUCTURE | Staff finalization/reminder workflow; assigned staff | Exact registry contract | Canonical finalization state + provider contract enforcement; operational evidence retained |
| `birthday_v2` | configured birthday v2 contract | OTHER LIFECYCLE | Birthday customer-care lifecycle; eligible client recipient | Exact birthday contract | Birthday lifecycle state/eligibility owns send cadence; provider mismatch blocks send |
| `birthday_v1` | `shiloh_birthday_wish_v1` | RETIRE | No new sends (`sendable=false`) | Legacy definition intentionally lacks current exact component contract | `assertTemplateSendAllowed` rejects; preserve provider object/history until separately authorized cleanup |
| `appointment_followup_legacy` | `appointment_followup` | RETIRE | No new sends (`sendable=false`) | Legacy definition | `assertTemplateSendAllowed` rejects; preserve historical provider/delivery evidence |
| `appointment_reminder_legacy` | `appointment_reminder` | RETIRE | No new sends (`sendable=false`) | Legacy definition | `assertTemplateSendAllowed` rejects; preserve historical provider/delivery evidence |

## Cutover decision

Do not retire WhatsApp infrastructure globally. No Google Calendar or Meta/WhatsApp provider object is deleted by this unit.

- No WhatsApp or Meta infrastructure is globally retired by this unit.
- The three registry-declared legacy, non-sendable contracts are classified `RETIRE` prospectively only; no provider deletion is authorized or performed.
- Staff authentication and staff finalization contracts are `CRITICAL INFRASTRUCTURE`.
- Current booking/reschedule/cancellation/reminder notification contracts are retained because Shiloh Calendar lifecycle actions may still require customer/staff notifications independently of obsolete client WhatsApp booking acquisition.
- Approval and customer-care contracts remain `OTHER LIFECYCLE`; their removal would be a separate lifecycle decision, not a Calendar cutover side effect.

## Live-provider verification gate

`inspectMetaTemplateInventory()` is the production verification mechanism. For every registry contract it fetches all Meta WABA templates and checks expected name, language, category, semantic components, TTL where applicable, approval status, quality, duplicate variants, configuration and sendability. `assertTemplateSendAllowed()` blocks actual sends unless a sendable template is exact, approved and configured, plus any feature-specific gate.

A provider-side inventory result must be captured from production credentials before 00 marks provider verification complete. This matrix intentionally performs no Meta mutation and grants no retirement authority.
