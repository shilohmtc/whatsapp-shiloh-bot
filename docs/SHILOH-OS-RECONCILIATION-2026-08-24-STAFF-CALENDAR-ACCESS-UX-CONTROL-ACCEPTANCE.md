# Shiloh OS — Control Acceptance — Staff Calendar Access UX

Date: 2026-08-24
Owning authority: **00 — Control & Reconciliation**
Completed implementation owner: **10 — Booking & Admin UX**
Next implementation owner: **40 — Production & DevOps**

## Decision

`SHILOH-STAFF-CALENDAR-ACCESS-UX` is **CONTROL ACCEPTED / VERIFIED LIVE / COMPLETE / FROZEN / DO NOT REDO**.

Accepted chain:

- PR #459/#460 — secure staff browser session boundary and reconciliation;
- PR #461 — Control acceptance and access-UX authorization;
- PR #462 — staff Calendar sign-in/access UX implementation;
- PR #463 — implementation reconciliation.

PR #462 merge: `12e91b29c095db7f41679cc9c51ba644f14442a9`.
PR #463 merge/current main at this decision: `b37c31ce73698afe107090b70fa1f4ddfe8a8347`.

PR #462 CI #1369 remained green with maintenance 12/12, SchedulingTimeline 6/6, Calendar UX/security 8/8, staff browser session/security 21/21, staff Calendar access UX/security 12/12, full regression 978/978, and zero npm vulnerabilities.

The bounded PR #462 recovery deploy `dep-da6873on74is739g7nkg` reached LIVE on the exact application merge. PR #463 then auto-deployed normally as `dep-da6892eq1p3s73dqkbpg`, supporting treatment of the earlier auto-deploy miss as an isolated delivery exception unless it recurs.

## Immediate pilot decision

Control **DECLINES immediate activation of the proposed one-user production pilot using only the three existing global feature flags**.

Reason: the current implementation has no server-side one-account pilot restriction. When WhatsApp auth delivery is enabled, `beginChallenge()` resolves any active canonical `staff_admin_accounts` identity by normalized WhatsApp number. The Calendar session bridge and read-only UX gates are also global feature gates. Therefore enabling the three flags would not technically enforce a one-user pilot.

Control will not rely on URL obscurity, staff instructions, or the assumption that other authorized staff will not try the surface.

## Next authorized controlled unit

`SHILOH-STAFF-CALENDAR-PILOT-GATE`

Owner: **40 — Production & DevOps**
Priority: **NOW**, before any genuine authentication delivery or Calendar production activation.

Goal: add a bounded, server-side, canonical-account pilot restriction without changing the accepted authentication/session architecture.

Authorized target:

1. Add explicit pilot mode, default off.
2. Add a canonical `staff_admin_accounts.id` allowlist for pilot mode.
3. Pilot identity must be resolved server-side from the authenticated canonical admin account; never from browser-supplied name, phone, role, staffId or Calendar scope.
4. When pilot mode is enabled, challenge delivery, challenge verification, session validation and Calendar bridge authority must fail closed for any admin account not in the allowlist.
5. Pilot mode with a missing, empty or invalid allowlist must fail closed for all staff browser authentication.
6. Existing non-enumerating challenge-request behavior must remain intact for disallowed/unknown accounts.
7. Existing rate limits, challenge/session expiry, CSRF, cookie, revocation, current-authority re-resolution and Calendar scope rules remain unchanged.
8. The accepted broad-rollout architecture remains available later only after separate Control authority; the pilot gate is a temporary rollout control, not a new identity source.

Preferred configuration names:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED`
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS`

No production value or activation is authorized in this implementation unit.

## Required proof

Focused tests must prove at minimum:

- pilot mode defaults off;
- pilot mode enabled + empty/invalid allowlist fails closed;
- one allowlisted canonical admin may request/verify a challenge under mocked provider delivery;
- a different active canonical admin receives no challenge delivery and cannot verify/create/use a session;
- browser-supplied identity/scope claims cannot join the allowlist;
- revocation/current-authority checks still apply to the allowlisted admin;
- Calendar scope remains derived from current canonical authority;
- all four production activation flags/pilot controls remain inactive during automated tests unless injected locally;
- no real WhatsApp authentication message is sent;
- existing Calendar remains read-only;
- full non-mutating regression remains green.

## Activation authority remains held

This decision does **not** authorize production changes to:

- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED`;
- the new pilot-mode/allowlist variables once implemented.

It does not authorize a real authentication WhatsApp send or any Calendar mutation.

After the pilot gate is implemented, tested, merged, Render-verified and reconciled, return to **00 — Control & Reconciliation**. Control may then authorize one exact canonical staff/Admin account for a bounded production pilot and separately authorize the exact environment changes required to run it.
