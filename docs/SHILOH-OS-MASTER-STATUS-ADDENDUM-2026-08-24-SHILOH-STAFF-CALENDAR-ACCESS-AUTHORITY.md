# Shiloh OS — Master Status Addendum — Staff Calendar Access Authority

Date: 2026-08-24
Owning authority: **00 — Control & Reconciliation**
Implementation consumer: **10 — Booking & Admin UX**
Later production activation executor: **40 — Production & DevOps**, only after separate Control authorization
Status: **STAFF BROWSER SESSION BOUNDARY VERIFIED LIVE / COMPLETE / FROZEN; STAFF CALENDAR ACCESS NOT YET ACTIVATED**

## Durable verified architecture

`SHILOH-STAFF-BROWSER-SESSION-BOUNDARY` is accepted as production architecture and must not be rebuilt merely to activate the Calendar.

Authoritative completed implementation:

- Control authority: PR #458;
- application implementation: PR #459;
- application merge: `3a53a465bd1d9e803ac4931ec833d320d5a44fba`;
- migration: `078_staff_browser_sessions.sql`;
- Production & DevOps reconciliation: PR #460;
- reconciled main reviewed by Control: `1de9071d5c6d22b4ba931c7e1b9b8bc61416790f`;
- final reviewed live deploy: `dep-da66t5rl550s738t9bn0`.

The durable session/security model is:

- high-entropy opaque server-side staff/Admin session tokens;
- only SHA-256 token hashes persisted;
- one-time challenge and CSRF values persisted hash-only;
- bounded challenge/session lifetime, attempt limits and rate limits;
- revocation, rotation and fixation resistance;
- current staff/Admin authority re-resolved server-side on validation;
- business-wide Calendar authority only from current business authority;
- own-staff Calendar authority only from the canonical active linked staff record;
- browser-supplied staff IDs, roles or Calendar scope are never authorization facts;
- production cookie uses `__Host-` semantics with `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, bounded `Max-Age`, and no `Domain`;
- state-changing session operations require same-origin JSON and per-session CSRF where applicable;
- `ADMIN_API_KEY` / `x-admin-key` remains a separate server/API boundary and is never a browser identity mechanism;
- session tokens are not placed in URLs, localStorage or sessionStorage.

## Existing staff authentication contract

The deployed application exposes the bounded staff-browser authentication API under `/calendar/staff-auth`:

- user-initiated challenge request;
- one-time challenge verification;
- current session read;
- CSRF rotation;
- logout/revocation.

The challenge contract is intentionally non-enumerating and the provider adapter remains dark by default.

This API is **security/session infrastructure**. It does not by itself mean that a complete staff-facing login/access journey is available or authorized for general production use.

## Production activation gates

Three separate production gates remain binding:

1. `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`
   - permits genuine staff-authentication WhatsApp challenge delivery;
   - **not currently authorized**.

2. `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`
   - allows a valid staff session to establish the trusted server-side Calendar viewer context;
   - **not currently authorized for general production use**.

3. `SHILOH_CALENDAR_READONLY_UX_ENABLED=true`
   - enables the existing read-only Day / Week / Agenda Calendar UX;
   - **not currently authorized for general staff activation**.

Implementation presence, deployed code, schema readiness, or a verified session boundary must never be interpreted as implicit authority to turn on any of these gates.

## Next authorized application state

Control authorizes a new default-off presentation/integration unit:

`SHILOH-STAFF-CALENDAR-ACCESS-UX`

Owner: **10 — Booking & Admin UX**.

The access UX must consume the existing staff-authentication API and existing read-only Calendar. It must not introduce a competing identity system, permanent browser password, long-lived browser JWT authority, duplicated Calendar scope rules, or any alternate `ADMIN_API_KEY` path.

The completed UX must provide a coherent human journey for:

- requesting a staff sign-in challenge;
- entering/verifying the bounded one-time challenge;
- clear invalid, expired, rate-limited and provider-unavailable recovery states;
- authenticated read-only Calendar entry under server-derived scope;
- revoked/expired-session handling;
- explicit logout.

Own-staff authority must remain own-only. Business-wide authority must remain limited to the currently accepted server-derived business scope.

The unit must remain default-off in production and automated verification must not require a real authentication WhatsApp send.

## Future activation model

After `SHILOH-STAFF-CALENDAR-ACCESS-UX` is implemented, tested, merged, verified live and reconciled, it returns to **00 — Control & Reconciliation**.

Control may then decide whether to authorize a **bounded production staff-access pilot**. Only after that separate authority may **40 — Production & DevOps** perform the exact environment/provider activation and verify genuine sign-in/session/read-only behavior.

General rollout must not be inferred from a successful pilot; Control decides rollout scope after evidence.

## Calendar mutation authority remains unchanged

This addendum does not authorize:

- Calendar booking creation;
- reschedule or cancellation mutation;
- drag/drop mutation;
- practitioner or service reassignment;
- schedule, block, leave or clinic-closure mutation;
- Google Calendar writes beyond existing currently authorized application behavior;
- weakening Google Calendar conflict/mirror authority;
- migration of canonical appointment truth merely to expose the read-only Calendar.

Those remain future separately controlled Calendar units.

## Durable sequencing rule

The authoritative sequence is:

`secure session boundary complete → staff-facing access UX complete while default-off → Control acceptance → bounded activation pilot if authorized → production evidence → broader access decision → only later consider Calendar mutation units`.

Do not skip directly from the completed session infrastructure to general staff Calendar activation.
