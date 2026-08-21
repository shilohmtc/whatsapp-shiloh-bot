# Shiloh OS — Guarded Juvan Booking Cleanup Reconciliation

Date: 2026-08-21
Owning workstream: Booking & Admin UX
Status: 🟢 VERIFIED LIVE

## Scope and authority preserved

This reconciliation records the optional booking-cleanup path added to Jean-Pierre's controlled **Reset Juvan** workflow. It preserves the newer Meta booking-confirmation-v2 activation, PR #387 provider-log redaction, and every standing identity, booking, attendance, Calendar and human-truth gate.

PR #364 remains the sole authority for the exact phone-anchored, JP-only controlled Juvan identity lifecycle. The current controlled client is resolved through `controlled_demo_identities.current_client_id` and the exact controlled phone; historical client 845 is current production evidence only, never a permanent key. Display-name lookup is forbidden.

The PR #364 identity-only mutation is unchanged: it clears bounded phone state, releases WhatsApp/mobile contacts, archives the old client, unbinds the controlled current-client and approval-policy pointers, preserves appointment/audit history, and permits normal exact-phone onboarding/rebind.

## Guarded three-outcome reset contract

PR #388 adds three explicit choices after authorized Jean-Pierre selects **Reset Juvan**:

1. **Clean bookings and reset**
2. **Reset identity only**
3. **Cancel**

**Reset identity only** delegates to the existing PR #364 preview, confirmation and mutation path without changing its behaviour. **Cancel** exits without mutation.

**Clean bookings and reset** first resolves the exact current controlled profile and previews all current non-final appointments. Each preview identifies appointment ID, status, service, assigned practitioner(s), date/time, stored shared Calendar mapping when present, the deterministic shared mirror, and every recognized assigned-practitioner mirror. A digest binds Jean-Pierre's confirmation to that exact current client and appointment state; pointer or appointment drift requires a fresh preview.

After explicit Jean-Pierre confirmation, the workflow:

- cancels only non-final operational appointments and writes canonical appointment status history plus CRM audit evidence;
- preserves completed, no-show, already-cancelled and every appointment row;
- terminalizes related pending booking approvals, reschedule requests, lifecycle/reminder state and pending/sending/failed customer-change notification state;
- suppresses customer-change delivery with reason `controlled_juvan_administrative_reset` and sends no Juvan cancellation message;
- removes the stored and current deterministic shared Google Calendar targets plus every recognized assigned-practitioner mirror; and
- records Calendar cleanup results without deleting appointment rows.

Calendar deletion is independently attempted per mirror. Provider already-missing results are accepted as idempotent success. Disabled Calendar configuration, unknown practitioner mapping, provider failure or Calendar-audit failure remains unresolved and fails closed.

If booking-state cleanup commits but any Calendar mirror remains unresolved, the workflow reports the partial state, retains the controlled identity binding and instructs Jean-Pierre to retry **Clean bookings and reset**. Cleanup-authored cancelled appointments remain discoverable for that retry. Identity release runs only after Calendar cleanup reports zero unresolved mirrors and the identity-reset transaction confirms that no non-final appointment appeared in the interim.

No fixed client ID, display-name identity lookup or one-shot environment flag is used.

## Implementation, regression and merge evidence

PR #388 merged as `e4833a743945db63b8cce3731d593f76c9f17921`.

- Application head: `b9c01e661007c5ce5c2429ed8a63f70b25e0f9ac`.
- CI #1214 passed the full non-mutating regression gate.
- Local focused regression: 52 passed, 0 failed.
- Local full regression: 850 passed, 0 failed.
- Coverage includes exact authorization, current-pointer resolution, preview content/digest drift, terminal-history preservation, multi-practitioner Calendar cleanup, provider failure, partial-state retry/idempotency, zero customer messaging and the unchanged identity-only path.
- Static inspection confirmed no appointment/client row deletion, no hard-coded historical client 845 and no Juvan display-name resolver.

## Production verification

- Render deploy `dep-da450l9t0dsc73a7dbo0` reached **LIVE** on exact merge `e4833a743945db63b8cce3731d593f76c9f17921`.
- Startup completed normally and reverified the controlled Juvan identity as **BOUND** through the current pointer, presently client 845 / phone suffix 1564 / Jean-Pierre admin 4.
- Google Calendar provider health passed.
- `/health` returned `status=ok` and `database=ok`.
- No post-deploy error/fatal logs were present.

No real Juvan reset, appointment cancellation, customer message, Calendar deletion, booking creation or manufactured provider event was performed for verification.

## Boundary decision

CRM & Identity review was not required because PR #388 does not weaken, recreate or replace PR #364's identity safeguards. It adds a separately selected Booking/Admin cleanup phase and a cleanup-path-only no-operational-appointment pre-release guard; the identity-only path remains unchanged. Any future proposal that changes PR #364's phone anchor, reset mutation, pointer semantics or onboarding/rebind boundary must stop and coordinate with CRM & Identity.

## Completed / do not redo

- Guarded implementation, focused and full regression, CI, merge and production verification are complete.
- The durable Master and Project Tracker are reconciled by the documentation PR containing this file.
- Meta booking-confirmation-v2 remains activated and unchanged.
- PR #387 provider credential log redaction remains current beneath this feature.
- Do not execute a real reset or cancel/create an appointment merely to reproduce evidence.

## Remaining evidence boundary

A genuine **Clean bookings and reset** journey may occur only when Jean-Pierre actually intends the operational cleanup and identity reset. It is not a test requirement. The workflow must continue to fail closed on identity drift, appointment-preview drift or unresolved Calendar mirrors.

**Next specialist:** None — controlled unit complete.
