# Shiloh OS — Project Tracker Addendum — Staff Auth WhatsApp Delivery Repair

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Closed unit

`SHILOH-STAFF-CALENDAR-CHRISTEL-PILOT`

State: COMPLETE AS FAILED PILOT / SAFELY RE-LOCKED / DO NOT REDO.

The single genuine challenge authorized by PR #467 was consumed. Christel did not receive the challenge. No second challenge was attempted. Production was re-locked and verified healthy.

## Control diagnosis

Independent production evidence proves:

- challenge request reached Meta and returned a real WhatsApp message ID;
- application logged `WhatsApp message sent`;
- `POST /challenge` returned 202;
- Meta then posted to `/webhook` approximately 1.2 seconds later;
- current webhook handling discards status-only `value.statuses` callbacks;
- current staff-auth challenge transport is free-form text;
- current exact Meta template inventory has no staff-authentication template contract.

The exact historical provider delivery/failure status is therefore not available from Shiloh logs and must not be guessed.

## Active next unit

`SHILOH-STAFF-AUTH-WHATSAPP-DELIVERY-REPAIR`

State: AUTHORIZED FOR IMPLEMENTATION NOW.

Owner: 30 — WhatsApp & Meta Integration.

Support: 40 — Production & DevOps only where Render rollout/verification is required.

Acceptance owner: 00 — Control & Reconciliation.

Priority: HIGHEST CURRENT CALENDAR DEPENDENCY.

## Required deliverables

- sanitized WhatsApp status-only callback handling and correlation;
- no loss of existing inbound-message behavior;
- exact provider status/error observability without authentication secrets or full recipient numbers;
- provider/template inventory inspection;
- Meta-compliant exact staff OTP authentication-template delivery path if supported;
- fail-closed exact template contract and configuration checks;
- mocked-provider focused tests;
- all existing WhatsApp/template/session/Calendar/pilot tests;
- full non-mutating regression;
- merged application PR, exact Render verification and reconciliation.

If no suitable auth template exists, Control authorizes submission of exactly one dedicated Shiloh staff authentication OTP template for provider review. That authority does not include a real recipient send.

## Holds

No second real Christel challenge until this unit is complete and separately accepted by Control.

All Calendar/staff-auth production activation gates remain OFF.

No Calendar create/reschedule/cancel/drag-drop, schedule/block/leave writes, broad staff rollout, or Google authority changes are authorized.

## Priority sequence

1. NOW — 30 repairs/observes staff-auth WhatsApp delivery.
2. 00 accepts/rejects repair evidence.
3. One newly authorized bounded Christel read-only pilot challenge.
4. On successful pilot, 10 implements `SHILOH-CALENDAR-CREATE-BOOKING` as the highest-priority product unit.
5. Christel production Calendar booking activation after guarded create-booking proof.
6. Broader rollout and secondary Calendar mutations later.