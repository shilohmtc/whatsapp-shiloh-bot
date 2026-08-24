# Shiloh OS — Master Status Addendum — Staff Calendar Access UX Control Acceptance

Date: 2026-08-24
Owning authority: **00 — Control & Reconciliation**

## Verified durable state

`SHILOH-STAFF-CALENDAR-ACCESS-UX` is **IMPLEMENTED / VERIFIED LIVE / CONTROL ACCEPTED / DEFAULT-OFF**.

The accepted staff browser access architecture is unchanged:

- canonical staff/Admin identity lives in `staff_admin_accounts` and related current server-side authority;
- browser sessions remain opaque, revocable, server-side sessions from PR #459;
- role/Calendar scope is re-resolved server-side;
- successful authorized sessions enter only the read-only Day / Week / Agenda Calendar;
- `ADMIN_API_KEY` remains server/API-only;
- no browser JWT authority, password store, browser-supplied role/scope authority, URL auth secret or persistent browser auth storage exists;
- `/calendar/:token.ics` remains separate;
- scheduling writes remain outside the Calendar access surface.

Application implementation is PR #462. Reconciliation is PR #463.

## Production activation state

Implementation presence is not activation.

The following production gates remain off/not authorized:

- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED`.

No genuine staff-authentication WhatsApp pilot has yet occurred.

## Pilot rollout architecture — authorized target, not yet implemented

Control has determined that the existing three feature flags are global and therefore cannot enforce a one-user production pilot by themselves.

Before a one-user pilot, Shiloh must add a temporary rollout-control layer with these durable principles:

- pilot mode is explicit and defaults off;
- pilot membership is keyed only by immutable canonical `staff_admin_accounts.id` values resolved server-side;
- when pilot mode is active, a missing/empty/invalid allowlist fails closed;
- non-allowlisted accounts cannot receive a staff-browser challenge, verify into a session, retain/use a pilot session, or establish Calendar viewer authority;
- non-enumerating public challenge behavior remains intact;
- the pilot allowlist is not an identity source and cannot grant role, practitioner identity, business authority or Calendar scope;
- current canonical authority and revocation remain decisive on every session;
- browser-supplied phone/name/staffId/adminId/role/scope values cannot authorize pilot membership;
- broad rollout remains a later Control decision after pilot evidence.

Preferred implementation controls:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED`;
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS`.

This section records an **authorized target architecture only**. It must not be read as proof that those controls are already implemented or active.

## Sequencing authority

The Calendar activation sequence is now:

1. accepted secure session boundary — complete;
2. accepted staff sign-in/access UX — complete;
3. server-side canonical-account pilot gate — next;
4. Control acceptance of pilot gate;
5. one exact named-account production pilot under separate environment/provider authority;
6. Control review of genuine login/session/scope/logout evidence;
7. broader read-only staff rollout only if separately authorized;
8. Calendar scheduling mutations only after later Control authority.

Google Calendar conflict/mirror authority remains unchanged throughout.
