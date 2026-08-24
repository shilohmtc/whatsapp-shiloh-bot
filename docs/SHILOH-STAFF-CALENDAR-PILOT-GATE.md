# Shiloh Staff Calendar Pilot Gate

Controlled unit: `SHILOH-STAFF-CALENDAR-PILOT-GATE`

Control authority: PR #464.

## Purpose

Provide a temporary, server-side one-account rollout control over the accepted staff browser authentication/session and read-only Calendar access architecture. This gate is a rollout restriction only; it is not a new identity source and does not authorize production activation.

## Configuration

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED`
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS`

Pilot mode is enabled only when the first value is exactly `true` after case/whitespace normalization.

When pilot mode is enabled, the allowlist must be a non-empty comma-separated set of positive canonical `staff_admin_accounts.id` integers. A missing, empty, zero, negative, fractional, malformed, or partly malformed allowlist fails closed for all staff browser authentication/session use.

No production values are set by this implementation.

## Enforcement

When pilot mode is enabled:

1. Challenge requests resolve the active canonical admin account server-side from normalized WhatsApp identity. Unknown or disallowed accounts retain the existing non-enumerating accepted/no-delivery response.
2. Challenge verification re-resolves the active canonical admin account server-side and fails closed before session creation for disallowed accounts.
3. Session validation requires the current session's canonical `adminId` to remain in the allowlist. Existing expiry, revocation and current-authority revalidation still run in the accepted session service.
4. The Calendar session bridge consumes the pilot-guarded session service, so a disallowed session cannot establish `server_staff_session` viewer authority.
5. Browser-supplied names, phone claims, roles, staff IDs, admin IDs or Calendar scopes cannot alter the allowlist decision.

When pilot mode is off, the accepted broad-rollout architecture behaves as before. Broad production activation remains separately controlled.

## Existing security authority preserved

The pilot gate does not change:

- opaque/hash-only staff sessions;
- challenge/session expiry and rate limits;
- session rotation/revocation;
- HttpOnly/Secure/SameSite cookie rules;
- CSRF/same-origin protections;
- current `staff_admin_accounts` and staff authority re-resolution;
- server-derived Calendar viewer scope;
- `ADMIN_API_KEY` browser prohibition;
- existing `/calendar/:token.ics` behavior;
- read-only Calendar semantics;
- Google Calendar conflict/mirror authority;
- booking behavior.

## Activation remains held

This repository unit does **not** enable or set production values for:

- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED`;
- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED`;
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS`.

No real staff authentication WhatsApp message is authorized or required for implementation proof. No Calendar mutation is authorized.
