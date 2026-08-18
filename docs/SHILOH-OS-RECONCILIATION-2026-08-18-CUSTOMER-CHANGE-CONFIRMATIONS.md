# Shiloh OS — Reconciliation 2026-08-18 Customer Change Confirmations

Reconciled: 2026-08-18

## Authority checked

- GitHub `main`
- PR #303 and GitHub Actions CI run #982
- Render production deploy for the PR #303 merge commit
- Existing canonical Admin booking-update, Admin cancellation, customer booking-confirmation, Google Calendar and Meta/WhatsApp template paths
- Fresh Render startup/provider evidence after deployment

## Implemented production change

PR **#303**, **Send WhatsApp confirmations after booking changes**, passed GitHub Actions CI run **#982** and merged to `main` as **`632ec4780489a97349b41a85567fa13b18d9ca35`**.

Render auto-deployed that exact merge commit as **`dep-da21jsdg1s2s73c1ju60`**. The new production instance started the **customer-change notification scheduler**, retained the PR #302 Google Calendar provider guard, and logged **`Google Calendar provider health check passed`**.

The existing new-booking confirmation path remains unchanged. PR #303 adds customer notification coverage after successful Admin mutations for:

- service change;
- practitioner change;
- date/time change;
- booked-price change;
- Admin cancellation.

For service, practitioner, date/time and price changes, the latest authoritative appointment snapshot is queued for delivery through a new Meta UTILITY template, **`shiloh_booking_update_v1`**, containing client name, current service, current practitioner, current date, current 24-hour time range, current booked price and booking number. Admin cancellation reuses the existing **`shiloh_cancellation_confirmation_v1`** template.

## Safety and delivery semantics

Customer notification is downstream of the authoritative mutation. CRM/Calendar/authorization/conflict guards run first. A failed or blocked booking mutation does not queue a customer confirmation.

Notification delivery is audit-event idempotent. A durable `customer_change_notifications` outbox records one delivery item per canonical mutation audit event, with pending/sending/sent/failed state and retry handling. This prevents a transient Meta failure or pending template approval from losing the notification and prevents the same audit event from deliberately generating duplicate sends.

The implementation sends these proactive change messages only through Meta templates whose provider state is **APPROVED**. It does not fall back to proactive free-text messaging when the provider template is unavailable.

The Manage booking presentation now states that a successful saved change queues the customer's latest WhatsApp confirmation, replacing the earlier message that customer-change notifications were disabled.

## Provider state at reconciliation

Fresh production startup evidence after PR #303 reported:

- **`shiloh_cancellation_confirmation_v1` — APPROVED** / already exists;
- **`shiloh_booking_update_v1` — submitted successfully, PENDING**.

Therefore the implementation and retry queue are **LIVE**, cancellation confirmations are provider-ready, and ordinary booking-update confirmations remain **provider-gated** until Meta changes `shiloh_booking_update_v1` to **APPROVED**. While it is pending, qualifying update notifications stay queued rather than being sent through an unsafe fallback.

Do not claim handset delivery for `shiloh_booking_update_v1` until a genuine post-approval appointment change produces provider/handset evidence. Do not mutate booking #570 or another real appointment merely to manufacture proof.

## Regression evidence

CI run **#982** passed after the lifecycle inventory regression was updated to include the new booking-update template. Coverage verifies:

- the complete latest-confirmation template payload;
- mapping of service, practitioner, time, price and cancellation mutation audit actions;
- audit-event idempotency and retry state;
- approved-template-only proactive delivery;
- queueing only after successful mutation results;
- preload ordering after the Google Calendar provider guard.

## Exact continuation state

**Authoritative runtime:** PR #303 / `632ec4780489a97349b41a85567fa13b18d9ca35` is the current customer-change-notification implementation on `main` and Render production.

**Completed:** engineering, regression coverage, merge and production deployment for customer confirmations after successful Admin appointment changes/cancellations.

**Provider-ready now:** cancellation confirmation template is APPROVED.

**Provider gate:** `shiloh_booking_update_v1` is currently PENDING. Service/practitioner/date-time/price update notifications are durably queued and must wait for Meta APPROVED status before delivery.

**Do not redo:** the PR #303 notification architecture, PR #302 Google Calendar guard/recovery, or booking #570 proof. Re-check provider status and wait for genuine post-approval operational evidence.

**Other standing gates remain unchanged:** historical attendance truth, appointment #558 practitioner identity, genuine lifecycle/follow-up/birthday evidence, and explicit approval for material commercial/service/business-rule changes.
