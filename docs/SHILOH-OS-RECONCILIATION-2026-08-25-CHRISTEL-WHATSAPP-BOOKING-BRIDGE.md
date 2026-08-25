# Shiloh OS — Control Reconciliation — Christel WhatsApp Booking Bridge

Date: 2026-08-25
Owner: 00 — Control & Reconciliation
Operational owner: 10 — Booking & Admin UX

## Decision

Because Meta staff-browser authentication remains externally blocked, client-booking throughput must not wait for Calendar activation.

Control authorizes the existing production WhatsApp Admin booking flow as the immediate operational bridge for Christel.

This is not a new mutation path and does not bypass existing scheduling authority. Current code already grants Christel the narrow `christel_abigail` Admin booking entitlement and presents the guarded `Make a booking` action.

## Authorized operational scope

Christel may use her existing verified WhatsApp Admin identity to create client bookings for:

- Christel; and
- Abigail,

only where the existing canonical booking flow permits the selected practitioner/service combination.

The existing booking owner remains authoritative for practitioner eligibility, active service mappings, working schedule, clinic rules, CRM appointment conflicts, Google Calendar conflicts, provider health, canonical appointment creation, appointment_staff assignment, audit/history and customer-notification rules.

This bridge does not grant clinic-wide practitioner authority and does not authorize any new browser/Calendar mutation capability.

## Production use

The intended operator path is the existing WhatsApp Admin surface:

`Admin` / Admin menu -> `Appointments` -> `Make a booking` -> client -> service -> practitioner -> date/time -> review -> confirm.

If a service is not eligible for Abigail or Christel, or the requested slot conflicts with canonical availability, the existing flow must fail closed.

## Calendar dependency

Calendar remains the target staff booking surface. The WhatsApp Admin bridge is temporary operational continuity while Meta staff-authentication is resolved and until `SHILOH-CALENDAR-CREATE-BOOKING` is accepted for production use.

The Meta convergence/template/Christel-login work continues independently and must not block booking throughput through the already-live WhatsApp Admin path.

## Not authorized by this decision

- weakening or bypassing canonical availability;
- manual database appointment writes;
- direct Google Calendar-only bookings that omit canonical Shiloh appointment truth;
- practitioner/service assignment outside existing entitlements;
- Calendar create/reschedule/cancel/drag-drop activation;
- broad staff browser rollout;
- any Meta/authentication workaround outside existing Control authority.

## Priority

Immediate operational priority: enable Christel to process the booking backlog through the existing WhatsApp Admin path now.

Parallel technical priority: complete Meta staff-authentication convergence and then deliver Calendar Create Booking without reopening completed Calendar foundation work.
