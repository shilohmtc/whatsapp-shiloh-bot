# Shiloh OS — Booking-Update Stale-Suppression Reconciliation

Date: 2026-08-19
Status: VERIFIED LIVE / PRODUCTION ACTIVATION STILL GATED
Owning workstreams: WhatsApp / Meta Integration + Production / DevOps

## Authority

This reconciliation supersedes only the prior assumption that appointment #575 / audit event 674 remained a valid future booking-update delivery candidate after Meta approval. It does not supersede the 19 August 2026 provider reconciliation for `shiloh_booking_update_v1`: provider status remains **APPROVED / already_exists**, Utility / `en`, exact contract, `duplicateCount=0`, API quality `UNKNOWN`, with no resubmission required.

The booking-update production activation boundary also remains unchanged: the last verified `WHATSAPP_BOOKING_UPDATE_TEMPLATE` gate is unsatisfied and `WHATSAPP_BOOKING_UPDATE_ENABLED` is not independently readable / was not reached. This controlled unit did not set either environment variable and did not authorize booking-update delivery.

## Defect established

Read-only production investigation established that the only active customer-change notification was appointment **#575 / audit event 674**, a practitioner change for Oarabile Mgibi from Christel to Abigail. The appointment ran on 18 August 2026 from 15:00–16:45 SAST but remained `scheduled` in the appointment record. The outbox row was `failed`, `sent_at=null`, and the supplied investigation observed `attempt_count=27`; its failure was the unsatisfied `WHATSAPP_BOOKING_UPDATE_TEMPLATE` contract gate.

The pre-fix `customerChangeNotification.js` retried every `pending` / `failed` row after five minutes and had no terminal stale/expired state or appointment-ended guard. Enabling booking-update delivery in that state could therefore have released an obsolete practitioner-change message after the appointment had already ended.

A bounded production log re-read also found an additional old-code retry at **2026-08-19 14:25:13 SAST**, after the supplied investigation and before the corrective deploy. Therefore `27` must not be carried forward as an exact post-deploy `attempt_count`. It remains the investigation baseline only.

## Guarded repair

PR **#332 — Suppress stale booking-update retries** introduced the smallest durable outbox correction:

- `customer_change_notifications.status` now permits terminal `suppressed` in addition to `pending`, `sending`, `sent`, and `failed`;
- self-initialization upgrades the existing production CHECK constraint and adds nullable `suppression_reason` and `suppressed_at` columns idempotently;
- service, practitioner, time, and price booking-update notifications are atomically suppressed when their appointment `ends_at <= NOW()` while the row is still `pending` or `failed`;
- suppression is checked before provider/configuration work and rechecked after appointment loading before contact validation / send claim;
- terminal reason is `appointment_already_ended`;
- suppression preserves the existing audit event, appointment record, `attempt_count`, `last_error`, and `sent_at`; it neither deletes nor marks the row sent;
- retry scans continue to select only `pending` / `failed`, so suppressed rows are excluded from future retries;
- cancellation behavior is unchanged;
- genuine future appointment-change notifications remain on the normal approved-template delivery path.

No WhatsApp fallback or synthetic evidence path was added.

## Regression and merge evidence

PR #332 head `7bce3a14a04c5193baeebf2c655eee88bd201fc6` passed full CI run **#1064** under Node 24.14.1: **695 tests / 695 passed / 0 failed**. Focused coverage verifies terminal suppression, durable reason/timestamp fields, preservation of failed-attempt history, exclusion from retry scans, pre-provider and pre-send expiry checks, unchanged cancellation semantics, and continued future-update delivery path.

PR #332 merged to `main` as **`bd6b3963b5ba8a9518d49d9502936521a986a7bb`**.

## Production verification

Render auto-deployed that exact merge commit without a manual deploy or environment mutation:

- deploy: **`dep-da2q3eks728c73b4jfug`**;
- trigger: `new_commit`;
- status: **LIVE** at 2026-08-19 14:30:21 SAST;
- production start command loaded `adminBookingCustomerNotificationPatch.js` and started the five-minute customer-change scheduler normally;
- startup provider check still reported `booking_update`: `submitted=false`, `reason=already_exists`, `providerStatus=APPROVED`.

At **2026-08-19 14:30:18.812 SAST**, the new production instance emitted the exact event:

- `appointmentId=575`;
- `auditEventId=674`;
- `changeKind=practitioner`;
- `reason=appointment_already_ended`;
- message: `Customer booking-change confirmation suppressed`.

That log is emitted only after the durable `UPDATE ... SET status='suppressed', suppression_reason='appointment_already_ended' ... RETURNING` succeeds. In the same post-deploy window, #575 appears only in the suppression event and there is no `shiloh_booking_update_v1` send log. No WhatsApp message was sent or manufactured by this controlled unit.

The code path does not modify `attempt_count`, `last_error`, or `sent_at` during suppression. Because one old-code retry occurred after the supplied `attempt_count=27` observation, the exact post-deploy counter is intentionally not asserted here.

## Read-only SQL verification limitation

The sanctioned Render `query_render_postgres` read-only tool was attempted twice. Both attempts failed at connector-level SSL/TLS negotiation before SQL execution with `FATAL: SSL/TLS required`. No write-capable workaround was attempted.

Accordingly, these exact post-deploy column reads are **not independently readable through the available SQL surface in this checkpoint**:

- final numeric `attempt_count`;
- direct SELECT of `suppression_reason` / `suppressed_at` / `sent_at`;
- direct SELECT count of remaining `pending` / `failed` / `sending` rows;
- direct SELECT for a `customer.booking_update_confirmation_sent` audit event.

Production suppression itself is independently evidenced by the application log generated only after the durable suppression update succeeds; absence of a booking-update send is evidenced by the bounded post-deploy application-log search. The connector limitation must not be bypassed with a mutation action.

## Shared-state reconciliation

The previous statement that #575 / 674 was a genuine queued journey waiting to be released after production configuration is now stale.

Authoritative state is now:

- #575 / 674 is genuine historical queue evidence but **terminally suppressed for non-delivery** because the appointment had already ended;
- it is **not** successful WhatsApp journey evidence and must never be marked sent or reused to manufacture evidence;
- future customer-change journey evidence must come from a genuine change to a still-future appointment after a separately approved booking-update production activation;
- `shiloh_booking_update_v1` remains provider-ready and exact; no Meta resubmission is required;
- production activation remains separately gated and was **not** performed here;
- the stale-appointment release hazard is closed before any future activation decision.

## Stop / next owner

This controlled safety unit is complete through merge, deployment, live suppression verification, and shared-state reconciliation.

**Do not set `WHATSAPP_BOOKING_UPDATE_TEMPLATE` or `WHATSAPP_BOOKING_UPDATE_ENABLED` as part of this unit.** The next actionable booking-update boundary remains a separately approved **Production / DevOps** configuration/enablement decision. After any future activation, only a genuine still-future appointment-change journey may close customer-change delivery evidence.