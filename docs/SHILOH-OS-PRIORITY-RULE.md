# Shiloh OS — Product-Critical Priority Rule

Effective: 2026-08-13

This is authoritative project-management policy and must be read with the Master before selecting the next work item.

## Mandatory priority selection

Before ordinary ACTIVE / READY engineering, identify unresolved production defects and the current **Product-Critical Gate**. Rank work by threat to Shiloh's core business function, not merely by workstream number or which technical item was previously ACTIVE.

A human/provider-evidence item is genuinely WAITING only while the required evidence is unavailable. If an authorised human/tester is present and can perform the real WhatsApp acceptance step, that item is actionable for the session. Never infer the result: run the acceptance test and record the evidence.

After any blocker/HOLD is removed, re-rank the whole project against current operational truth. Do not automatically resume the technical item that was active before the blocker.

## Current Product-Critical Gate

🔵 **Complete real Client Perspective acceptance of the WhatsApp booking and booking-management lifecycle.**

Sequence: real dedicated client WhatsApp → registration/recognition → service/treatment discovery → authoritative practitioner information and eligibility/choice → availability → booking → canonical CRM verification → Google Calendar mirror → real WhatsApp confirmation → view booking → reschedule → cancellation → lifecycle/template communications.

If the journey exposes a defect, that shared production-path defect becomes the immediate engineering priority. Reproduce safely, self-test first, fix, deploy, verify, then resume the same journey.

C1.10 privacy/governance remains open and all existing safety controls remain mandatory, including disabled destructive execution. It must not displace the client booking gate unless it exposes an immediate safety/booking blocker.

## Current correction

- G1 is resolved: existing `shiloh-memory` upgraded in place to Basic-256mb, Free expiry removed, connections resumed, issue #166 closed. No HA/tested-restore claim inferred.
- C3 real first-time booking acceptance is actionable/human-assisted now because the authorised tester is available.
- User reports Meta templates approved; verify exact template names/statuses before promoting A3/D1 or enabling provider-dependent sends.
