# Shiloh OS — P4 Payments / Ozow / Vouchers Architecture

Status: **architecture + non-mutating state contract only**. No live payment collection, Ozow credential, payment-link creation, webhook, payment table, voucher issuance or appointment/payment coupling is enabled by this document.

## 1. Core truth boundary

Payment is an independent domain from booking.

- `appointments.status` answers booking/attendance truth.
- payment state answers whether a specific monetary obligation was paid/refunded.
- Google Calendar answers diary/availability/mirroring only.
- loyalty answers qualifying completed visits/reward entitlement only.

A payment callback, browser redirect, payment link creation or client message must never mark an appointment completed, attended, cancelled or no-show. Likewise an appointment being booked/completed must never silently assert that money was received.

## 2. Current repository audit

At the start of P4:

- no Ozow/payment provider variable is part of Shiloh's required environment contract;
- no payment/Ozow/voucher service is present in the active service layer by name;
- existing loyalty redemption explicitly says it does not change payment status;
- booking/client/admin paths already carry price snapshots, but price is not proof of payment.

This is the correct baseline. P4 should add payment truth alongside booking truth, not retrofit payment semantics into appointment status.

## 3. Current Ozow integration facts reviewed 12 Aug 2026

Official Ozow integration material currently describes an API option that returns a payment request ID and payment link, with the request ID usable for status checking. Ozow also exposes transaction-status APIs and recommends unique merchant transaction references. Request/response integrity uses server-side hashing/authentication. Shiloh should treat provider-verified server evidence as authoritative rather than a browser/client redirect.

Do not freeze endpoint fields or cryptographic construction into Shiloh until the merchant account/integration method is selected and the exact current Ozow merchant documentation for that account is verified again.

## 4. Proposed normalized payment state machine

Pure state contract now lives at `src/domain/paymentState.js`:

`created -> link_issued -> pending -> paid -> partially_refunded/refunded`

Alternative terminal outcomes from an unpaid intent:

`failed`, `cancelled`, `expired`

Rules:

- `paid`, `partially_refunded` and `refunded` require verified-provider evidence.
- failed/cancelled/expired intents are not resurrected; a retry creates a new intent/reference.
- repeated verified provider events must be idempotent.
- raw provider events should be retained separately from normalized state.

## 5. Proposed database model — NOT YET MIGRATED

### `payment_intents`

Recommended fields:

- internal UUID/id
- `client_id` nullable only where a legitimate anonymous flow is explicitly designed
- `appointment_id` nullable; linking does not make payment a booking status
- `purpose` enum-like value, initially not enabled until business rules are approved
- amount + currency (`ZAR` expected for Shiloh but do not hard-code provider assumptions unnecessarily)
- provider (`ozow` initially if selected)
- opaque unique merchant reference, e.g. `PAY-<random/uuid>` — no client name, treatment name or DOB
- provider request ID / transaction ID, unique when supplied
- normalized payment status
- expiry timestamps
- created/updated timestamps

### `payment_events`

Append-only evidence ledger:

- payment intent id
- provider
- provider event/reference id or deterministic dedupe key
- event type/status
- verified flag + verification method
- minimal sanitized provider payload/evidence
- received timestamp

Raw payload retention must be minimized and classified under the privacy/retention model before production use.

### `payment_allocations`

Only if later needed to support partial payments/deposits/multiple obligations. Keep allocation separate from the provider transaction itself.

## 6. Idempotency and reconciliation

Minimum production contract before activation:

1. Generate one unique merchant reference per payment intent.
2. Persist intent before exposing any provider payment link.
3. Treat link generation as `link_issued`, never `paid`.
4. Verify provider notification/status server-side before payment truth changes.
5. Deduplicate repeated notifications/events.
6. Reconcile uncertain/pending payments by provider status query; never guess from redirects/screenshots/messages.
7. Log normalized state changes in an append-only audit trail.
8. A failed retry creates a new payment intent/reference while preserving the prior evidence.

## 7. Booking/deposit policy remains a business decision

P4 must not yet assume whether Shiloh will require:

- no prepayment;
- optional full payment;
- a fixed deposit;
- a percentage deposit;
- deposits only for selected services/practitioners/time windows;
- late-cancellation/no-show fee collection.

Until explicitly approved, payment status may be displayed alongside a booking but must not gate, cancel or auto-confirm the booking.

If a deposit policy is introduced later, model it as a separate `payment_requirement`/allocation rule, not by overloading `appointments.status`.

## 8. Refunds/cancellations

Appointment cancellation and monetary refund are separate operations.

- cancelling an appointment must not claim a refund occurred;
- refunding a payment must not cancel the appointment;
- refund initiation and provider-confirmed refund completion require separate states/evidence;
- automatic refund policy must remain disabled until the clinic's cancellation/refund rules and operational ownership are approved.

## 9. “Vouchers” must remain disambiguated

There are at least two different concepts:

1. **Ozow Voucher Redemption** — a payment product/payment rail offered by Ozow.
2. **Shiloh-issued gift/service vouchers** — a possible clinic liability/entitlement product.

They are not the same model. Do not build Shiloh gift vouchers by using Ozow's voucher-redemption semantics.

If Shiloh later wants its own gift vouchers, use a separate liability ledger with issuance value, remaining balance, expiry policy, purchaser/recipient privacy boundaries, redemption events and reversal controls. Gift-voucher redemption can then allocate value to a payment obligation without changing appointment truth.

## 10. Privacy / POPIA minimization

- Use opaque merchant references; do not send treatment names, DOB, health context, notes or diagnosis-like information to the payment provider.
- Send only provider-required customer/payment fields.
- Keep provider credentials server-side only.
- Never expose API keys/site codes/private hash material to WhatsApp/client code.
- Define retention for provider request/response data before production activation.
- Access to payment evidence/refunds/reconciliation must be role-gated and audited.

## 11. Activation gates

Do not progress to real payment collection until all are true:

- Ozow merchant account/site is ready and exact integration method is selected.
- Required current merchant credentials/URLs are known and stored as secrets, never committed.
- Shiloh business payment/deposit/refund policy is explicitly approved.
- payment schema/migration and role permissions are reviewed.
- verified callback/status logic and hash verification have tests against current Ozow documentation/sandbox evidence.
- duplicate callback, delayed success, failed/cancelled/expired, refund and reconciliation tests pass.
- POPIA inventory/retention is updated for payment data.
- test mode/sandbox succeeds without sending unnecessary client messages.
- production feature flag defaults off and activation is explicit.

## 12. Safe next implementation slice

After the business/provider gates are known, the recommended order is:

1. migration for provider-neutral intent/event ledger;
2. role/permission and audit contracts;
3. Ozow adapter in test mode only;
4. verified provider status/callback ingestion;
5. read-only admin payment reconciliation view;
6. client payment-link UX;
7. only then any approved booking/deposit policy coupling through a separate requirement layer;
8. Shiloh gift vouchers, if actually desired, as a distinct later subsystem.
