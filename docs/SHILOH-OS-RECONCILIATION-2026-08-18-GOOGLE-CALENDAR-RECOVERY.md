# Shiloh OS — Reconciliation 2026-08-18 Google Calendar Recovery

Reconciled: 2026-08-18
Status: VERIFIED LIVE

## Authority and evidence

This reconciliation records the production recovery of the Google Calendar dependency exposed by the real WhatsApp Admin **Manage booking → Change practitioner** journey for booking **#570**.

Authority used:
- GitHub `main` and the existing PR #302 provider-guard lineage;
- Render production deployment and application logs in My Workspace;
- Google Auth Platform configuration observed during the controlled repair;
- real WhatsApp handset evidence supplied after the repair.

## Incident and root cause

The original practitioner-change attempt failed after the valid practitioner name `Christel` was entered. Production logs established that the failure was not practitioner-name parsing: Google Calendar OAuth returned `invalid_grant` because the configured refresh token had expired or been revoked.

The Google Auth Platform application was subsequently confirmed to be **External / Testing**. It was moved to **In production** so the integration is no longer left under the Testing-mode refresh-token lifecycle that caused this incident.

A fresh OAuth authorization was then issued against the existing **Shiloh CRM Calendar Render** web client. After the refresh token was replaced, Render exposed a second authoritative configuration error: `invalid_client — The provided client secret is invalid`. The Render OAuth client secret was reconciled with the enabled secret for the same Google OAuth client.

## Provider recovery — VERIFIED

After the corrected OAuth Client ID / Client Secret / Refresh Token chain was saved, Render redeployed the production service as **`dep-da21culbedkc73d5desg`**, which reached **LIVE** on 2026-08-18.

Fresh startup evidence from the new production instance recorded:

`Google Calendar provider health check passed`

This clears the Google Calendar credential/provider gate recorded in the prior public-catalogue reconciliation. Do not retain the earlier `invalid_grant` provider gate as current state.

The PR #302 fail-closed guard and recurring/read-only provider health probe remain valuable permanent controls and must not be removed merely because the credential is healthy again.

## Booking #570 — real WhatsApp end-to-end verification

After provider recovery, the exact previously failing Admin journey was repeated on the real WhatsApp surface for booking **#570**.

Real handset evidence showed:

`Practitioner changed to Christel and the Google Calendar event was updated.`

The resulting booking card showed:
- client: **Linda Dr**;
- service: **Sports Massage — Package Session**;
- practitioner: **Christel**;
- date/time preserved: **2026/08/21, 14:30–15:20**;
- value preserved: **R0.00**.

Therefore **Manage booking → Change practitioner → typed practitioner name → authoritative Calendar check/update → booking update** is now **VERIFIED LIVE** end to end. The incident is closed. Do not mutate booking #570 again merely for proof.

## Permanent engineering controls retained

The engineering-governance rule added during this incident remains authoritative:
- operational screenshots are diagnostic evidence by default, not image-generation requests;
- production defects follow current `main` → trace → provider/runtime evidence → root cause → guarded repair → regression/E2E → CI → deploy → production verification → reconciliation;
- business-critical recurring journeys should gain automated regression/E2E and dependency-health protection where practical so the business user is not the primary production test suite;
- provider failures remain explicit and fail-closed rather than weakening Calendar/CRM/conflict/audit authority.

## Exact continuation state

**Google Calendar:** 🟢 VERIFIED HEALTHY — production startup provider probe passed after OAuth credential reconciliation.

**Admin practitioner change:** 🟢 VERIFIED LIVE — booking #570 successfully changed to Christel and its Google Calendar event updated; service/date/time/value were preserved.

**PR #302 provider guard:** 🟢 RETAIN — fail-closed handling and proactive provider health probing remain permanent protection.

**Do not redo:** OAuth recovery or booking #570 mutation merely to gather duplicate evidence.

**Standing unrelated gates remain:** historical attendance requires human truth; appointment #558 remains fail-closed until the real historical practitioner is established; genuine lifecycle/follow-up/birthday evidence remains genuine-journey gated; material commercial/service/business-rule changes still require explicit business approval.

**Next controlled continuation:** return to the authoritative backlog from the accepted production state; the previously recorded Google Calendar provider gate is closed.