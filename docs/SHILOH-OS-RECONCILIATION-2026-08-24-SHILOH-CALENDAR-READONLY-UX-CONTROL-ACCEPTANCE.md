# Shiloh OS — Control & Reconciliation — Calendar Read-Only UX Acceptance

Date: 2026-08-24
Owning workstream: **00 — Control & Reconciliation**
Next implementation owner: **40 — Production & DevOps**
Supporting consumer/reviewer: **10 — Booking & Admin UX**
Status: **READ-ONLY UX ACCEPTED / STAFF BROWSER SESSION BOUNDARY AUTHORIZED**

## Authority reviewed

Control independently reviewed the completed `SHILOH-CALENDAR-READONLY-UX` against:

- PR #451 — Shiloh Calendar foundation architecture;
- PR #452 — Control ratification and future Calendar-first booking authority;
- PR #453 — read-only `SchedulingTimeline` implementation;
- PR #454 — projection reconciliation;
- PR #455 — projection Control acceptance and read-only UX authorization;
- PR #456 — read-only Day / Week / Agenda implementation, merge `533907a704e29106ef67852ddedd800164521cc5`;
- PR #457 — read-only UX reconciliation, merge/current reviewed main `e187f7c857c41d575a59666ad19df4653f504d67`.

## Control acceptance

Decision: **ACCEPT** `SHILOH-CALENDAR-READONLY-UX` as **VERIFIED LIVE / COMPLETE / DO NOT REDO**.

Independent evidence supports the completed unit:

- PR #456 is bounded to the read-only Calendar presentation surface and tests;
- Day, Week and Agenda all consume the accepted `SchedulingTimeline` contract through a thin server adapter;
- no independent appointment SQL, availability algorithm, conflict algorithm, Google classifier or schedule interpretation was introduced;
- PR #380 multi-practitioner semantics remain one canonical appointment with authoritative staff assignments;
- PR #395 Google practitioner/shared conflict classification remains consumed from the existing owner and Google-only busy remains visibly non-canonical;
- Calendar navigation/filtering are non-mutating and bounded to the already-authorized viewer scope;
- provider/timeline failure renders an explicit unavailable/degraded state instead of guessed scheduling truth;
- `/calendar/:token.ics` remains a separate tokenized appointment export/share surface;
- CI #1356 / run `32738644960` / job `97467479413` passed Node 24.14.1, maintenance 12/12, SchedulingTimeline 6/6, Calendar UX security/no-mutation 8/8 and full regression 945/945 with zero failures/cancellations/skips and zero npm vulnerabilities;
- application deploy `dep-da659kqd0e5s73c6h780` reached live on exact PR #456 application merge;
- PR #457 reconciliation CI #1358 succeeded;
- current reconciliation deploy `dep-da65bs9t0dsc73cvkf5g` is live on exact PR #457 merge;
- current production startup evidence shows Google Calendar provider health passed, `Shiloh started`, root HTTP success and repeated new-instance `/health` HTTP 200;
- the bounded reviewed startup window contained no error-level production logs;
- Project Tracker and Master Status were reconciled by PR #457.

No synthetic appointment, CRM, WhatsApp, schedule/block/leave or Google Calendar mutation is required to re-prove this read-only unit. Do not manufacture one.

## Critical usability boundary

The read-only UX is real deployed application code, but **it is not yet a genuinely staff-usable production Calendar**.

Current production authority remains fail closed:

- the read-only Calendar is not activated for staff production use;
- the Calendar route requires trusted server-only viewer context under `Symbol.for('shiloh.calendar.server.viewer')`;
- the trusted viewer source must be `server_staff_session`;
- no current production middleware supplies an authenticated browser staff/Admin session context;
- browser query/header scope cannot self-authorize SchedulingTimeline access;
- the shared `ADMIN_API_KEY` / `x-admin-key` API model is not a browser identity mechanism and was not exposed by PR #456.

Therefore no existing staff workflow has yet been replaced by the Shiloh Calendar.

## Next dependency owner

Control routes the next bounded unit to **40 — Production & DevOps**.

Unit: **`SHILOH-STAFF-BROWSER-SESSION-BOUNDARY`**

This is application security/session infrastructure. It is not a CRM/client-identity remediation unit.

**10 — Booking & Admin UX** is the consumer/reviewer of the resulting authenticated viewer contract.

**00 — Control & Reconciliation** retains authority for later production activation of the read-only Calendar and all Calendar mutation sequencing.

## Authorized target security architecture

Control authorizes a browser-safe staff/Admin authentication and session boundary with these properties:

1. **Server-side opaque sessions.** Generate cryptographically random high-entropy session tokens. The browser receives only the opaque identifier in a cookie. Persist only a cryptographic hash of the token server-side, preferably in PostgreSQL, with bounded identity/session metadata, expiry, revocation and audit timestamps.
2. **Secure cookies.** Production cookies must be `HttpOnly`, `Secure`, use an appropriate restrictive `SameSite` policy, have bounded expiry, and never place session identifiers in URLs, localStorage or sessionStorage.
3. **Fixation resistance and revocation.** Successful authentication creates/rotates a fresh session. Logout/revocation must be supported. Expired, revoked, malformed and tampered sessions fail closed.
4. **Server-side current authority.** The session identifies a canonical Shiloh staff/Admin principal. Current Shiloh role/scope authority is re-resolved server-side so privilege changes take effect safely.
5. **Never expose or repurpose `ADMIN_API_KEY`.** Do not send it to browser HTML/JavaScript, cookies, URLs or browser storage and do not use it as a staff password.
6. **Never trust browser-supplied identity/scope.** `staffId`, `business_role`, `calendarScope` and similar authorization facts must be resolved/validated server-side; privilege-escalation attempts fail closed.
7. **CSRF protection** is required for state-changing authentication/session operations as applicable.
8. **Sanitized observability.** Never log session tokens, authentication challenges/codes, secrets or unnecessary personal data.

## Recommended first-login mechanism

If the current provider pathway can support it safely, Control recommends a **user-initiated passwordless one-time challenge through Shiloh's existing verified staff WhatsApp channel**.

If used, the challenge must be short-lived, single-use, hashed at rest, rate-limited, absent from logs, and limited to canonical authorized staff/Admin principals. Successful verification creates/rotates an opaque server-side session. Do not bulk-send or send unsolicited authentication challenges.

This is a recommendation, not authority to weaken current Meta/WhatsApp safeguards. If 40 proves the provider pathway cannot safely support the flow, return the exact constraint to Control instead of improvising shared passwords or insecure secrets. Do not create a permanent password table merely for expediency without a new Control decision.

## Calendar integration contract

After session validation, trusted middleware must resolve the current Shiloh staff/Admin principal and derive Calendar scope server-side using existing staff/Admin scope authority where applicable.

The current Calendar route expects trusted viewer context under:

`Symbol.for('shiloh.calendar.server.viewer')`

with:

- `source: 'server_staff_session'`;
- an authorized `calendarScope` compatible with SchedulingTimeline authority (`business_all_staff` or `own_staff`);
- canonical `staffId` when required by the scope.

Reuse existing staff/Admin authorization primitives such as `staffAdminScope` and `staffScopeAuthorization` where applicable rather than duplicating permission rules. If the internal context contract is deliberately evolved, preserve equivalent fail-closed semantics and update tests/authority explicitly.

## Activation hold remains binding

This authorization **does not activate the read-only Calendar**.

During `SHILOH-STAFF-BROWSER-SESSION-BOUNDARY`:

- keep Calendar default-off / not generally staff-accessible;
- prove authentication/session behavior independently of Calendar activation;
- do not alter appointments, schedules, blocks, leave, CRM records or Google Calendar events merely for proof;
- do not authorize Calendar create/reschedule/cancel/drag-drop/assignment/schedule/block/leave mutations;
- do not reduce Google conflict/mirror authority;
- do not make Google Calendar optional.

After the secure session boundary is verified live and reconciled, return to **00 — Control & Reconciliation**. Control will separately decide whether to activate the existing read-only Calendar for genuine staff/Admin use.

## Required verification

At minimum prove:

- no `ADMIN_API_KEY` reaches browser content, cookies, storage or URLs;
- production cookies are `HttpOnly`, `Secure` and use an appropriate `SameSite` policy;
- invalid/tampered/expired/revoked sessions fail closed;
- successful authentication rotates/creates a fresh session and resists fixation;
- logout/revocation works;
- CSRF defenses cover state-changing auth/session operations as applicable;
- authentication challenges are short-lived, single-use, hashed at rest and absent from logs if WhatsApp challenge is used;
- challenge/login abuse is rate-limited;
- browser-supplied staff IDs or Calendar scopes cannot escalate privilege;
- current staff/Admin role/scope changes are reflected safely by server-side authorization;
- unauthenticated users cannot obtain protected scheduling/client detail;
- only trusted session middleware can establish the Calendar server-viewer context;
- Calendar remains default-off/not broadly activated unless separately authorized by Control;
- existing booking, WhatsApp, Google, SchedulingTimeline and `/calendar/:token.ics` behavior remain unchanged;
- focused security/session tests and the full non-mutating regression suite pass before merge.

## Priority and recommendation

Do this **now** as the highest-priority Calendar dependency.

If Shiloh OS were my own project, I would not authorize Calendar mutations until the read surface has a strong staff identity/session boundary and has first been safely used in production. Server-side opaque sessions are preferable here to long-lived self-contained browser JWTs because Shiloh's staff roles/scopes can change and the server should remain able to revoke access and re-resolve current authority centrally.
