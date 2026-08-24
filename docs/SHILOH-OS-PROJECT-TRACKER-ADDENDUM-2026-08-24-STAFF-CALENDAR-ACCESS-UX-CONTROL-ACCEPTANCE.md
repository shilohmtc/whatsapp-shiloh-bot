# Shiloh OS — Project Tracker Addendum — Staff Calendar Access UX Control Acceptance

Date: 2026-08-24
Owning authority: **00 — Control & Reconciliation**

## Completed unit

### `SHILOH-STAFF-CALENDAR-ACCESS-UX`

Status: **🟢 CONTROL ACCEPTED / VERIFIED LIVE / COMPLETE / DO NOT REDO**

Application implementation: PR #462.
Implementation reconciliation: PR #463.
Current main at acceptance: `b37c31ce73698afe107090b70fa1f4ddfe8a8347`.

Production proof includes bounded recovery deploy `dep-da6873on74is739g7nkg` for the PR #462 application merge and normal subsequent PR #463 auto-deploy `dep-da6892eq1p3s73dqkbpg`.

Full regression authority remains 978/978 with the accepted focused security/Calendar suites green.

## Activation state

General staff production access remains **OFF / NOT AUTHORIZED**.

The existing global activation gates remain held:

- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED`.

No real staff-authentication WhatsApp pilot has yet been authorized or executed.

## Control pilot decision

The proposed one-user pilot is **NOT AUTHORIZED YET** because the current activation gates do not enforce a one-account rollout. Enabling them would make the sign-in path available to every otherwise eligible active canonical staff/Admin account.

## Next controlled unit

### `SHILOH-STAFF-CALENDAR-PILOT-GATE`

Status: **🟡 AUTHORIZED FOR IMPLEMENTATION NOW**
Owner: **40 — Production & DevOps**
Priority: **NOW**

Required result:

- server-side pilot mode, default off;
- canonical `staff_admin_accounts.id` allowlist;
- fail-closed empty/invalid allowlist;
- allowlist enforced across challenge delivery, verification, session validation and Calendar bridge use;
- browser claims cannot self-enrol;
- existing authentication/session/permission architecture unchanged;
- no real provider send;
- no production activation-variable mutation;
- focused security tests + full regression;
- PR/CI/merge/Render verification;
- Tracker/Master reconciliation;
- return to Control.

Only after this unit is accepted may Control authorize one exact canonical staff/Admin account and the exact production environment changes for a genuine pilot.

## Still unauthorized

- broad staff Calendar rollout;
- real staff-auth WhatsApp delivery outside a future exact pilot authority;
- Calendar booking/reschedule/cancel/drag-drop;
- practitioner/service reassignment;
- schedule/block/leave/closure mutation;
- Google Calendar authority reduction, mirror removal or optionality.
