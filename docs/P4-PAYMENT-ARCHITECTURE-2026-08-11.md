# P4 Payment Architecture — 2026-08-11

## Scope
P4 introduces payment and voucher infrastructure without allowing browser redirects, WhatsApp messages, appointment state, or client assertions to become payment truth.

Initial provider: **Ozow**. Provider-specific code must sit behind an adapter so Shiloh's ledger and CRM do not become Ozow-specific.

## Non-negotiable invariants
1. Shiloh's payment ledger is authoritative inside Shiloh; appointment and payment states remain separate.
2. A browser redirect never marks a payment paid.
3. Provider callbacks are untrusted until authenticated and reconciled.
4. `paid` requires provider-confirmed truth matched to SiteCode, unique merchant reference, currency and exact amount.
5. Every payment attempt gets a unique merchant reference; retries create new attempts.
6. Store money as integer minor units (cents), never floating point.
7. Provider events and side effects are idempotent.
8. Late failure/cancel events cannot regress a confirmed paid attempt.
9. No secrets in source, logs, CRM metadata, WhatsApp or URLs.
10. Missing configuration, bad hash, mismatches or reconciliation ambiguity fail closed and remain unpaid.
11. Card/bank credentials never touch Shiloh; payment happens on the provider surface.
12. Refunds are separate auditable financial events and never erase payment history.

## Trust boundaries
Trusted: reviewed Shiloh code, Shiloh Postgres ledger, Render runtime secrets, and authenticated Ozow status responses after validation/matching.

Untrusted until verified: WhatsApp text, success/cancel/error redirects, notification bodies, client-supplied transaction IDs/references, duplicate/replayed callbacks.

## Domain model
### payment_obligations
What is owed, independent of provider attempt: UUID id, appointment/client linkage, ZAR amount_minor, status (`open|paid|cancelled|refunded|partially_refunded`), description and timestamps.

### payment_attempts
One checkout attempt: UUID id, obligation_id, provider, unique merchant_reference, provider_transaction_id, amount_minor, currency, status (`created|link_issued|pending|paid|cancelled|failed|expired`), is_test, payment_url and timestamps.

### payment_provider_events
Immutable provider inbox/audit: provider, attempt, provider transaction/reference, unique event fingerprint, authenticated flag, provider status, minimized/redacted payload, processed_at and result.

### payment_state_events
Immutable internal history of obligation/attempt transitions, reason, source, actor and timestamp.

## State machine
Obligation: `open -> paid|cancelled`; `paid -> partially_refunded -> refunded` or `paid -> refunded`. Never regress paid to open because of a late provider failure.

Attempt: `created -> link_issued -> pending`; any pre-terminal state may become `paid|cancelled|failed|expired`. `paid` is terminal; refunds are separate events.

## Ozow adapter
Provider-neutral contract:
- `createPaymentAttempt(obligation)`
- `verifyNotification(rawFields)`
- `getTransactionStatus(attempt)`
- `mapProviderStatus(status)`

Ozow rules: ZA/ZAR initially; generate SHA-512 request hash server-side in Ozow's required field order; unique TransactionReference; NotifyUrl for async results; redirects are UX only; validate response hash; lock and match SiteCode/reference/amount/currency; only authenticated/matched `Complete` may advance to paid, with status-API reconciliation used before final commit where available; Cancelled/Error never override paid.

## Notification processing
1. Dedicated endpoint with strict body limits.
2. Normalize only provider-contract fields.
3. Fingerprint and insert event idempotently.
4. Validate hash with constant-time comparison.
5. Unauthenticated events cannot mutate money state.
6. Resolve exactly one attempt under DB lock.
7. Compare immutable SiteCode/reference/amount/currency.
8. Reconcile via provider status API where required/available.
9. Apply allowed transition transactionally.
10. Mark obligation paid only when confirmed payments satisfy it.
11. Commit ledger/audit before WhatsApp or other side effects.
12. Side effects use outbox/idempotency keys.

## Redirect UX
Success/cancel/error routes never write financial state. They may say "We're confirming your payment with Ozow" and direct the client back to WhatsApp. Shiloh says "payment confirmed" only after the ledger is paid.

## Appointment linkage
Booking and payment stay separate. First release creates obligations for existing confirmed appointments. No appointment is confirmed/cancelled merely from redirects. Appointment lifecycle changes never delete financial history.

## Admin authorization
Owner/business-admin only initially: view payment status, resend safe existing link, initiate allowed new attempt, reconcile provider status. Manual `mark paid` is excluded from the first release.

## Voucher boundary
Vouchers are separate from payments. Future lifecycle: `issued|active|reserved|redeemed|expired|cancelled`, integer minor-unit value/balance, atomic redemption, unique non-sequential codes, expiry and immutable audit. Voucher value may reduce an obligation but never masquerades as an Ozow payment.

## Required tests before real money
Forged/invalid hash; amount/currency/SiteCode/reference tampering; duplicate/replayed/out-of-order callbacks; unknown attempt; status API timeout; DB failure; success URL opened without payment; concurrent duplicate processing; concurrent attempts; stale-link retry; test-mode cannot satisfy production obligation; no secrets in logs; WhatsApp never announces paid early; appointment cancellation preserves financial history.

## Rollout gates
A. Architecture only — current. No payment behavior.
B. Ledger schema/state machine + tests; provider disabled.
C. Ozow sandbox adapter; requires test credentials.
D. Sandbox E2E success/cancel/error/tamper/duplicate/replay.
E. Production secrets in Render; creation still feature-flagged.
F. One explicitly approved low-value live verification; reconcile Ozow and Shiloh before normal enablement.

## Future configuration contract
`PAYMENTS_ENABLED=false`, `PAYMENT_PROVIDER=ozow`, `OZOW_SITE_CODE`, `OZOW_API_KEY`, `OZOW_PRIVATE_KEY`, `OZOW_IS_TEST=true`, plus public callback base URL. Missing secrets disable initiation rather than partially operating.

## Decision
Proceed with Ozow as Shiloh's first provider while keeping provider truth behind Shiloh's provider-neutral ledger and adapter. No credentials or human intervention are required for architecture/ledger work. Request Ozow merchant/test credentials only when sandbox integration is ready.
