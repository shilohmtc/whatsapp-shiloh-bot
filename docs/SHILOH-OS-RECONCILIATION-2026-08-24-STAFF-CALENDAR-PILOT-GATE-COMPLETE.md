# Shiloh OS — Production & DevOps Reconciliation — Staff Calendar Pilot Gate Complete

Date: 2026-08-24
Owning workstream: **40 — Production & DevOps**
Control acceptance owner: **00 — Control & Reconciliation**
Business consumer: **10 — Booking & Admin UX**

## Controlled unit

`SHILOH-STAFF-CALENDAR-PILOT-GATE`

Status: **IMPLEMENTED / TESTED / MERGED / VERIFIED LIVE / COMPLETE / NOT ACTIVATED**

Control authority: PR #464 — accept staff Calendar access UX and authorize a default-off canonical-account pilot gate.

Implementation: PR #465 — **Add fail-closed staff Calendar pilot gate**.

- implementation head: `b472936c47765474b06032c3478a2262f1fc3a74`;
- implementation merge: `2b9ccd91d11caabcd572280c3ad900100ea968a2`;
- authoritative GitHub `main` at production verification: `2b9ccd91d11caabcd572280c3ad900100ea968a2`.

## Implemented durable boundary

PR #465 adds the rollout control authorized by Control without changing the accepted staff-browser identity/session architecture:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED` is the explicit pilot-mode gate and defaults off;
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS` is a strict allowlist of canonical `staff_admin_accounts.id` values;
- pilot eligibility is resolved only from canonical server-side staff/Admin identity;
- missing, empty or malformed allowlist data fails closed for all staff-browser authentication while pilot mode is enabled;
- challenge request, challenge verification, session validation and Calendar viewer establishment fail closed for a non-allowlisted account while pilot mode is enabled;
- unknown/disallowed challenge requests preserve the non-enumerating accepted/no-delivery contract;
- browser-supplied adminId, staffId, role or Calendar scope cannot create pilot authority;
- current authority, expiry, revocation, CSRF, secure-cookie and Calendar-scope rules from the accepted staff-session boundary remain decisive;
- pilot mode off preserves the accepted broad-rollout architecture for a later separate Control decision;
- existing Calendar access remains read-only;
- no Calendar booking, reschedule, cancel, drag/drop or Google Calendar write capability was added.

## CI and regression evidence

PR #465 CI:

- CI run number: **#1375**;
- workflow run: `32762341818`;
- job: `97543847318`;
- Node: **24.14.1**;
- npm audit: **0 vulnerabilities**.

Focused suites:

- maintenance framework: **12/12**;
- SchedulingTimeline parity: **6/6**;
- Calendar UX/security: **8/8**;
- staff browser session/security: **21/21**;
- staff Calendar access UX/security: **12/12**;
- staff Calendar pilot gate: **8/8**.

Full non-mutating regression: **986/986 passed** with zero failures, cancellations or skips.

The pilot-gate suite proves at minimum:

- pilot mode defaults off;
- enabled pilot mode with missing/invalid allowlist fails closed;
- one allowlisted canonical Admin can request/verify a challenge under mocked delivery;
- another active canonical Admin receives non-enumerating denial and cannot verify/use a pilot session;
- browser claims cannot self-enrol into the allowlist;
- disallowed sessions fail closed while allowlisted sessions retain only canonical current viewer authority;
- revoked/current-authority-invalid sessions remain invalid;
- all production activation/pilot controls remain inactive in automated proof unless explicitly injected.

No real staff-authentication WhatsApp message was sent.

## Production verification

Render production evidence was obtained after the PR #465 merge.

The connected Render tool became unavailable at the final observation boundary, so Production & DevOps did not invent connector evidence. JP supplied read-only Render Dashboard evidence instead.

Render Events evidence at approximately **20:26 SAST** shows:

> `Deploy live for 2b9ccd9: Merge pull request #465 from shilohmtc/production/staff-calendar-pilot-gate-20260824 Add fail-closed staff Calendar pilot gate`

The displayed commit prefix `2b9ccd9` binds to the independently re-read full authoritative GitHub commit:

`2b9ccd91d11caabcd572280c3ad900100ea968a2`.

Separate Render runtime-log evidence from the same cutover window shows:

- `Your service is live`;
- the primary Render URL available;
- repeated `/health` requests returning HTTP **200** across the newly running instances at approximately 20:26–20:27 SAST.

No manual deploy, environment-variable change, repo/branch change, credential/permission change, cache-clear operation or integration reconnect was performed for PR #465.

The implementation itself changes no production activation variable. Therefore the controlled unit remains **implemented but not activated**.

A fresh Render connector read of provider-health/error labels was not possible because the Render tool was disabled after deployment; no provider configuration or Google Calendar authority was changed by this unit, and the full regression preserved the existing Google conflict/mirror contracts. This limitation does not authorize any activation or provider mutation.

## Activation state — still held by Control

This completion does **not** activate or authorize production values for:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED`;
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS`;
- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED`.

No genuine staff-authentication WhatsApp challenge was sent.

## Completed / do not redo

- PR #451–#464 accepted Calendar/session/access authority chain;
- PR #465 pilot-gate implementation;
- pilot-gate security design and focused tests;
- CI #1375 / run `32762341818` / job `97543847318`;
- full regression 986/986;
- production deploy/live/HTTP-health verification for application merge `2b9ccd91d11caabcd572280c3ad900100ea968a2`.

## Next decision

Return immediately to **00 — Control & Reconciliation**.

Control now owns whether to accept/freeze `SHILOH-STAFF-CALENDAR-PILOT-GATE` and whether to authorize one exact canonical Christel staff/Admin account plus the exact production environment/provider changes for a genuine read-only staff Calendar pilot.

The next intended product sequence remains:

1. one genuine Christel staff-Calendar access pilot;
2. guarded Calendar Create Booking implementation;
3. Christel production Calendar booking activation.

Broad rollout, nonessential Calendar polish, drag/drop, reschedule, cancel and Google optionality remain deferred until the core Christel booking workflow is live.
