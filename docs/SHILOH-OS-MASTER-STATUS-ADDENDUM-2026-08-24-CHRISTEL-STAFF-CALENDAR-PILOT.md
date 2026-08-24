# Shiloh OS — Master Status Addendum — Christel Staff Calendar Pilot

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Verified operational truth before pilot

The Shiloh staff Calendar stack through PR #466 is deployed and verified but remains non-activated for general staff use.

Durable accepted capabilities include:

- canonical `SchedulingTimeline` over existing Shiloh/Postgres scheduling truth;
- read-only Day / Week / Agenda Calendar;
- secure opaque server-side staff/Admin browser sessions;
- user-initiated WhatsApp one-time authentication challenge path;
- server-derived current staff/Admin Calendar authority;
- staff sign-in/access/logout UX;
- fail-closed canonical-Admin pilot allowlist gate.

The pilot gate limits rollout only. It never grants role, business authority, practitioner identity, service authority, or Calendar scope. Current canonical server-side staff/Admin authority remains decisive.

## Control-authorized bounded operational pilot

One production read-only pilot is authorized for Christel's exact canonical active Admin account:

`staff_admin_accounts.id = 2`

The Admin-account ID must not be confused with Christel's practitioner/staff ID.

For this pilot only, 40 — Production & DevOps may set these five production controls:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED=true`
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS=2`
- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`
- `SHILOH_CALENDAR_READONLY_UX_ENABLED=true`

This is bounded pilot authority, not general production activation authority.

Exactly one genuine authentication challenge is authorized, and it must be deliberately initiated by Christel through the deployed sign-in UI after the activation rollout is verified healthy. No proactive or second real challenge is authorized.

The pilot may establish only the Calendar scope derived from Christel's current canonical server-side authority. Pilot membership itself cannot elevate that scope.

## Mandatory fail-closed return state

After the pilot, successful or unsuccessful, 40 must re-lock the production surface before returning evidence to Control:

- pilot mode false;
- pilot allowlist removed/empty;
- auth WhatsApp delivery false;
- Calendar session bridge false;
- read-only Calendar UX false.

A wider staff rollout requires a later explicit Control decision.

## Scheduling authority unchanged

The pilot is read-only. It does not authorize or alter:

- appointment creation;
- appointment reschedule/cancel;
- drag/drop;
- service or practitioner reassignment;
- schedule/block/leave/closure writes;
- Google Calendar writes or authority;
- Google mirror behavior;
- canonical booking conflict/permission/approval rules.

PR #380 remains multi-practitioner booking authority. PR #395 remains Google practitioner/shared conflict-classification authority.

## Priority after accepted pilot

On successful Control acceptance of the Christel read-only pilot, the next product-critical unit is guarded Calendar booking creation. Staff/Admin manual booking is intended to become Calendar-first only through delegation to the existing canonical guarded booking owner; Shiloh Calendar must not become a second mutable source of truth.
