# Shiloh OS — Project Tracker Addendum — Staff Calendar Pilot Gate

Date: 2026-08-24
Owning workstream: **40 — Production & DevOps**
Acceptance owner: **00 — Control & Reconciliation**

## Completed controlled unit

### `SHILOH-STAFF-CALENDAR-PILOT-GATE`

Status: **🟢 IMPLEMENTED / TESTED / MERGED / VERIFIED LIVE / COMPLETE / NOT ACTIVATED**

Control authority: PR #464.
Implementation PR: #465.
Implementation head: `b472936c47765474b06032c3478a2262f1fc3a74`.
Implementation merge: `2b9ccd91d11caabcd572280c3ad900100ea968a2`.

## Delivered rollout control

- explicit pilot mode, default off;
- canonical `staff_admin_accounts.id` allowlist;
- empty/invalid allowlist fails closed when pilot mode is on;
- server-side canonical identity resolution only;
- challenge request/verification/session/Calendar bridge fail closed for non-allowlisted accounts;
- non-enumerating public challenge behavior retained;
- browser-supplied identity/role/scope cannot create pilot authority;
- accepted session expiry/revocation/CSRF/cookie/current-authority rules unchanged;
- accepted Calendar viewer scope derivation unchanged;
- broad-rollout architecture preserved for a later Control decision;
- Calendar remains read-only.

## CI authority

PR #465 CI #1375:

- workflow run `32762341818`;
- job `97543847318`;
- Node 24.14.1;
- maintenance 12/12;
- SchedulingTimeline 6/6;
- Calendar UX/security 8/8;
- staff browser session/security 21/21;
- staff Calendar access UX/security 12/12;
- staff Calendar pilot gate 8/8;
- full regression **986/986**;
- zero fail/cancel/skip;
- npm audit zero vulnerabilities.

## Production evidence

Read-only Render Dashboard evidence after merge shows:

- event: `Deploy live for 2b9ccd9: Merge pull request #465 ... Add fail-closed staff Calendar pilot gate` at approximately 20:26 SAST;
- independently re-read full GitHub commit: `2b9ccd91d11caabcd572280c3ad900100ea968a2`;
- runtime log: `Your service is live`;
- repeated `/health` HTTP 200 responses across the new running instances at approximately 20:26–20:27 SAST.

The Render connector was unavailable for the final read-only observation, so operator-provided Dashboard evidence was used rather than inventing tool results.

No manual deploy or production configuration mutation was performed for PR #465.

## Activation state

All pilot/auth/Calendar activation remains **OFF / NOT AUTHORIZED** unless separately changed by a future exact Control decision:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED`;
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS`;
- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED`.

No real staff-auth WhatsApp authentication message has been sent.

## Completed / do not redo

- PR #451–#464 accepted Calendar/session/access lineage;
- PR #465 pilot-gate implementation;
- focused pilot security testing;
- CI #1375 and full regression 986/986;
- exact application-merge deployment/live/HTTP-health proof.

## Next owner / priority

**00 — Control & Reconciliation** now owns acceptance and the exact pilot activation decision.

Intended next sequence after Control acceptance:

1. one genuine Christel staff-Calendar access pilot;
2. guarded Calendar Create Booking implementation;
3. Christel production Calendar booking activation.

Defer broad rollout, nonessential polish, drag/drop, reschedule, cancel and Google optionality until the core Christel booking workflow is live.
