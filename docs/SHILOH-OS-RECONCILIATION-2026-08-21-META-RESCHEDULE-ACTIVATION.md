# Shiloh OS — Meta Reschedule Approval and Production Activation Reconciliation

Date: 2026-08-21
Scope: close the Meta provider gate and enable the already-implemented practitioner-approved client-reschedule path without changing application code or manufacturing a journey.

## Authority read before action

Current GitHub `main` was `d15857c65e1765faaaa22e101261323f7374bb46`, the documentation reconciliation merge for PR #381. Current accepted application code remained PR #380 / `2e387e5f1000774d97046a516c1c7d19e93cd947`; the reschedule implementation and fail-closed provider contracts remained PRs #354–#356.

The prior authoritative state was both reschedule templates PENDING, exactly configured, duplicate-free and not active behind `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false`.

## Provider verification — passed

Render workspace: **My Workspace**
Service: `shiloh-whatsapp-bot` / `srv-d9qbfmk9v7es73emgam0`

A bounded environment merge enabled only `META_RESCHEDULE_APPROVAL_TEMPLATES_PROVISION_ON_START=true`. Verification deploy `dep-da4331jm8hqs73dl3h60` reached LIVE on unchanged commit `d15857c65e1765faaaa22e101261323f7374bb46`. The feature remained off during this checkpoint.

The sanctioned one-shot verifier returned:

| Template | Result | Status | Category | Language | Exact | Duplicates | Configured |
|---|---|---|---|---|---|---:|---|
| `shiloh_reschedule_approval_request_v1` | `submitted=false / already_exists_exact` | APPROVED | UTILITY | `en` | true | 0 | true |
| `shiloh_reschedule_declined_v1` | `submitted=false / already_exists_exact` | APPROVED | UTILITY | `en` | true | 0 | true |

No provider template was submitted, edited or duplicated.

## Production activation — verified live

A second bounded environment merge set exactly:

- `META_RESCHEDULE_APPROVAL_TEMPLATES_PROVISION_ON_START=false`
- `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=true`

Activation deploy `dep-da433gbncjis73aucgv0` reached LIVE on the same unchanged GitHub commit. Startup verified:

- migration `064_client_reschedule_practitioner_approval.sql` checksum-valid;
- request table `appointment_reschedule_requests` present;
- pending uniqueness and staff indexes present;
- `featureEnabled=true`;
- approval and decline template configuration both true;
- no provider one-shot provisioning log on the activation restart.

A direct production `/health` check returned HTTP 200 with `status=ok` and `database=ok`. Render showed no error/fatal logs, template-send log or reschedule-request log during the activation window. No WhatsApp message, appointment, practitioner decision, CRM record or Google Calendar event was manufactured.

## Durable authority

Practitioner-approved client rescheduling is now production-enabled. Existing safeguards remain authoritative:

- every actual approval-request or decline-template send must pass the centralized exact approved/configured provider contract;
- drift, duplicates, wrong language/category/components, provider-read failure or disabled configuration fail closed;
- the original appointment remains unchanged until an authorized practitioner approves;
- the appointment-start boundary guard remains active;
- durable retry, stale suppression and approved-reschedule confirmation remain active;
- the deterministic emergency kill switch is `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false`;
- multi-staff Couples Massage client rescheduling remains assisted/fail-closed and is not broadened by this activation.

## Completed / do not redo

- Do not resubmit either exact approved template.
- Do not re-run provider verification merely to reproduce this checkpoint absent new contradictory evidence.
- Do not reimplement PRs #354–#356.
- Do not manufacture a Juvan reschedule, practitioner decision or CRM/Calendar mutation for handset proof.

## Remaining evidence boundary and ownership

The first genuine client/practitioner handset journey remains unproven and must arise through natural business use.

- **Booking & Admin UX** observes the first genuine journey and distinguishes expected behaviour from a defect.
- **WhatsApp / Meta Integration** owns any provider/delivery investigation arising from genuine use.
- **Production / DevOps** has no remaining activation dependency; it owns only runtime/configuration incidents or use of the explicit kill switch.
- **Control & Reconciliation** preserves this checkpoint and routes any new evidence.

Goldie description review remains paused and unrelated. Juvan remains BOUND to the phone-anchored current-client pointer; do not hard-code historical client 845 or restart onboarding without a separately authorized reset.
