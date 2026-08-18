# Shiloh OS — Engineering Governance

Updated: 2026-08-18
Purpose: permanent engineering operating rules that apply across Shiloh OS continuation work.

## Screenshot evidence rule

Screenshots supplied during Shiloh OS work from WhatsApp, Render, GitHub, Meta/provider, CRM, Calendar, or related operational surfaces are diagnostic/operational evidence by default.

Do not generate images, sketches, mockups, redesigns, or other visual artifacts from those screenshots unless the user explicitly asks for visual creation or image editing.

A screenshot that shows unexpected runtime behaviour is evidence of a possible defect. Treat it as an engineering signal to investigate the authoritative implementation and production/provider state.

## Production-defect handling rule

When operational evidence exposes unexpected production behaviour, follow the controlled defect path:

1. Read the current authoritative state on GitHub `main` and do not reopen completed or superseded work.
2. Trace the actual current handler/state/provider path responsible for the observed behaviour.
3. Inspect applicable production logs, provider evidence, CRM/Calendar state, and other authoritative evidence before inferring root cause.
4. Reproduce the failure from code/tests/logs where practical without manufacturing appointments, provider state, handset evidence, attendance truth, or other operational evidence.
5. Identify the root cause and distinguish application defects from provider/configuration failures.
6. Repair the application defect with fail-closed behaviour where authoritative provider truth is required.
7. Add regression coverage for the discovered failure mode and, where practical, strengthen end-to-end or provider-health coverage so the same class of problem is detected before a human encounters it in WhatsApp.
8. Run CI, deploy through the established GitHub/Render path, verify the applicable production state, and reconcile the Master/Tracker/latest reconciliation.

Do not treat a generic user-facing error as sufficient handling when the system can safely identify a blocked provider or dependency. Prefer an explicit, non-destructive, fail-closed operational message that states that no change was saved and identifies the dependency that must be restored.

## Reliability principle

The user should not function as Shiloh's primary production test suite. Recurring business-critical journeys should progressively gain regression/E2E protection and dependency-health checks. Provider outages or expired credentials that can block authoritative booking operations should be detected proactively where practical and surfaced clearly without weakening conflict, Calendar, CRM, attendance, authorization, or audit guardrails.
