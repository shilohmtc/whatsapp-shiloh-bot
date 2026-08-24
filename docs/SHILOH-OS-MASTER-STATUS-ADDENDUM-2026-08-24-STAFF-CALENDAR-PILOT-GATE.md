# Shiloh OS — Master Status Addendum — Staff Calendar Pilot Gate

Date: 2026-08-24
Owning workstream: **40 — Production & DevOps**
Acceptance authority: **00 — Control & Reconciliation**

## Verified durable state

`SHILOH-STAFF-CALENDAR-PILOT-GATE` is **IMPLEMENTED / TESTED / MERGED / VERIFIED LIVE / DEFAULT-OFF / NOT ACTIVATED**.

Application implementation: PR #465.
Implementation merge: `2b9ccd91d11caabcd572280c3ad900100ea968a2`.
Control authority: PR #464.

The durable rollout architecture now includes:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED` as the explicit pilot gate;
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS` as a strict canonical `staff_admin_accounts.id` allowlist;
- fail-closed behavior when pilot mode is enabled and the allowlist is absent, empty or malformed;
- pilot eligibility resolved only from canonical active server-side Admin identity;
- non-allowlisted accounts denied across challenge request, challenge verification, session validation and Calendar viewer establishment;
- non-enumerating challenge behavior retained for unknown/disallowed identities;
- browser claims cannot authorize pilot membership or change role/practitioner/Calendar scope;
- current canonical role/scope/revocation authority remains decisive on every session;
- existing opaque session, secure cookie, CSRF, expiry and fixation-resistance semantics remain unchanged;
- Calendar viewer authority remains server-derived and read-only;
- broad staff rollout remains a later separate Control decision.

## Security and regression authority

PR #465 CI #1375 / run `32762341818` / job `97543847318` passed on Node 24.14.1.

Focused security/parity suites remained green, including the new pilot-gate suite at 8/8. Full non-mutating regression is **986/986**, with zero failures, cancellations or skips and zero npm vulnerabilities.

No real staff-authentication WhatsApp message was sent.

## Production state

The exact application merge `2b9ccd91d11caabcd572280c3ad900100ea968a2` is verified live from Render Dashboard evidence:

- Render Events showed `Deploy live for 2b9ccd9` with the PR #465 merge message at approximately 20:26 SAST;
- GitHub `main` independently re-read as the full matching SHA;
- runtime evidence showed `Your service is live`;
- repeated `/health` requests returned HTTP 200 across the new running instances.

No manual deploy, environment mutation, repository wiring change, credential/permission change, cache clear or integration reconnect was performed for PR #465.

The Render connector was unavailable for the final read-only observation. A fresh connector-origin provider-health line was therefore unavailable; this unit changed no Google Calendar provider configuration or authority, and regression coverage preserved existing Google conflict/mirror behavior. This observation limitation does not authorize any provider or activation mutation.

## Activation authority remains held

Implementation presence is not activation.

The following values remain under a future exact Control decision and must not be enabled merely because the pilot gate exists:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED`;
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS`;
- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED`.

No genuine Christel staff-Calendar pilot has yet occurred.

## Sequencing authority

The shortest controlled path to the business objective is now:

1. secure staff browser session boundary — complete / accepted;
2. staff Calendar sign-in/access UX — complete / accepted;
3. canonical-account pilot gate — implemented / verified live, pending Control acceptance;
4. one exact Christel staff-Calendar access pilot under separate Control activation/provider authority;
5. guarded Calendar Create Booking implementation;
6. Christel production Calendar booking activation.

Defer nonessential Calendar polish, broad rollout, drag/drop, reschedule, cancel and Google optionality until the core Christel booking workflow is live.

Google Calendar conflict/mirror authority remains unchanged.
