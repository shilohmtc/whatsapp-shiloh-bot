# Shiloh OS — Control Reconciliation — Meta Business Verification Convergence

Date: 2026-08-25
Owner: 00 — Control & Reconciliation
Execution owner: 30 — WhatsApp & Meta Integration

## Accepted evidence

00 accepts the read-only provider recheck recorded by commit `63bc7feaaf4ae313d4f4bde717fad03f1d5b2aa4`.

Authenticated Meta UI reports the Business as VERIFIED / APPROVED, while the provider API still reports Business verification `rejected`, overall provider health `LIMITED`, and BUSINESS health `LIMITED`. Token validity, SYSTEM_USER token type, required WhatsApp scopes, WABA review `APPROVED`, WABA status `ACTIVE`, WABA ownership `SELF`, and readable template inventory remain proven.

Template-creation capability is therefore not yet proven restored.

## Control decision

Treat the mismatch as a provider state-convergence / propagation gate before escalating to support.

Authorize exactly one further bounded GET-only provider recheck, no earlier than 2026-08-25 06:45 Africa/Johannesburg (04:45 UTC).

The recheck may use the existing default-off diagnostic only. If startup flag activation is required to execute the bounded audit, it must be enabled only for the diagnostic rollout and immediately restored to `META_WABA_TEMPLATE_PERMISSION_AUDIT_ON_START=false`, with normal health verification after re-lock.

The recheck succeeds only if fresh provider evidence proves BOTH:

- Business verification no longer reports `rejected`; and
- BUSINESS health no longer reports `LIMITED`.

If both conditions pass, stop and return the sanitized read-only evidence to 00. Do not create a template yet.

If either condition still fails, do not keep polling or retrying. Treat the UI/API discrepancy as a Meta provider-support gate and return to 00/JP to open the appropriate Meta Business Support case with the exact sanitized mismatch evidence.

## Holds

This authority does not permit:

- template creation or submission;
- `shiloh_staff_auth_otp_v1` creation;
- a real staff-auth WhatsApp message;
- another Christel challenge;
- token-scope changes;
- human/system-user role or task changes;
- asset-assignment changes;
- WABA ownership or partner-sharing changes;
- phone-registration/ownership changes;
- provider credential changes;
- Calendar/auth activation;
- Calendar create/reschedule/cancel/drag-drop or schedule/block/leave mutations;
- Google Calendar authority changes.

## Recommendation

Use one short propagation window and one bounded recheck now because the Calendar path is priority-critical. If the provider API is still stale after that recheck, escalate the mismatch the same day instead of waiting indefinitely or experimenting with permissions.
