# Shiloh OS — Master Status Addendum — Staff Browser Session Authority

Date: 2026-08-24
Owning authority: **00 — Control & Reconciliation**
Implementation owner: **40 — Production & DevOps**
Status: **AUTHORIZED TARGET ARCHITECTURE / NOT YET IMPLEMENTED OR VERIFIED**

## Purpose

Shiloh OS now has a verified-live read-only Day / Week / Agenda Calendar implementation, but production staff access remains disabled because there is no proven browser-safe staff/Admin authentication and session boundary.

This addendum records the durable target security architecture required before the existing read-only Calendar may be activated for genuine staff production use.

It does **not** claim that staff browser sessions are implemented today.

## Durable authority

### 1. Browser authentication must not reuse the shared Admin API secret

The existing `ADMIN_API_KEY` / `x-admin-key` API boundary is not a staff browser identity mechanism.

`ADMIN_API_KEY` must never be embedded, serialized or persisted in browser HTML, JavaScript, cookies, localStorage, sessionStorage or URLs, and must never be used as a staff password.

### 2. Shiloh staff/Admin browser sessions are server-side, opaque and revocable

The authorized target is:

- cryptographically random high-entropy session token;
- only the opaque session identifier sent to the browser in a cookie;
- only a cryptographic hash of the token persisted server-side;
- session bound to canonical Shiloh staff/Admin identity evidence;
- bounded issued/expiry/revocation/last-used or equivalent audit metadata;
- explicit logout/revocation;
- fresh session creation/rotation after successful authentication;
- invalid, expired, revoked, malformed or tampered sessions fail closed.

Long-lived self-contained browser tokens must not become the canonical staff authorization source merely for convenience. Current staff/Admin role/scope authority must remain server-resolvable and centrally revocable.

### 3. Production cookie security

Production session cookies must be:

- `HttpOnly`;
- `Secure`;
- governed by an appropriate restrictive `SameSite` policy;
- bounded in lifetime.

Session identifiers must not be placed in query strings, localStorage or sessionStorage.

### 4. Authorization remains server-side

Browser-provided `staffId`, `business_role`, `calendarScope` or equivalent values are not authorization.

Authenticated middleware must resolve the canonical Shiloh staff/Admin principal and current role/scope server-side using existing authoritative staff/Admin permission services where applicable.

Privilege changes/revocations must take effect safely without waiting for a long-lived client credential to expire.

### 5. Calendar trusted-viewer contract

The current read-only Calendar consumes trusted server viewer context under:

`Symbol.for('shiloh.calendar.server.viewer')`

with source:

`server_staff_session`

and SchedulingTimeline-compatible scope:

- `business_all_staff`; or
- `own_staff` plus canonical `staffId`.

Only authenticated trusted server middleware may establish this context. Browser query/header values cannot self-authorize Calendar scope.

The internal context shape may evolve through controlled implementation, but equivalent fail-closed server-side identity/scope semantics are mandatory.

### 6. Preferred passwordless bootstrap

Where safely supported by existing provider authority, the preferred initial authentication mechanism is a **user-initiated, passwordless, one-time challenge through the verified Shiloh staff WhatsApp channel**.

If implemented, the challenge must be:

- short-lived;
- single-use;
- stored only as a cryptographic hash;
- rate-limited/brute-force protected;
- absent from logs;
- accepted only for canonical authorized staff/Admin principals;
- followed by fresh opaque session issuance/rotation.

This preference does not override Meta/WhatsApp provider safeguards. If the verified staff WhatsApp channel cannot safely support this flow, implementation must return to Control rather than introduce improvised shared credentials.

Permanent password credentials are not authorized by this addendum.

### 7. CSRF and operational security

State-changing authentication/session operations must have suitable CSRF protection. Authentication/session telemetry must be sanitized and must not log tokens, codes, secrets or unnecessary personal data.

## Calendar activation authority remains separate

The read-only Calendar remains **not staff-activated** while this boundary is being built.

Implementing and verifying the staff browser session boundary does not automatically authorize Calendar activation. After the session boundary is verified live and reconciled, **00 — Control & Reconciliation** must explicitly decide whether to enable the existing read-only Calendar for staff/Admin production use.

Calendar booking creation, rescheduling, cancellation, drag/drop, practitioner/service assignment, schedule/block/leave writes and changes to Google authority remain separately held.

## Current verified state versus authorized future state

Current verified state:

- Day / Week / Agenda Calendar code is deployed;
- SchedulingTimeline is verified live;
- Calendar content remains fail-closed/not generally staff-accessible;
- no staff browser session boundary is proven;
- no existing staff workflow has been replaced.

Authorized future state:

- secure browser staff/Admin authentication;
- server-side opaque revocable session;
- current server-side permission derivation;
- trusted Calendar viewer context from authenticated middleware;
- later separate Control decision on read-only Calendar production activation.
