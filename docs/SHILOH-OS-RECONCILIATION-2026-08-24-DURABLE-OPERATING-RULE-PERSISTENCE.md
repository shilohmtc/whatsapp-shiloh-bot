# Shiloh OS — Reconciliation: Durable Operating Rule Persistence

Date: 2026-08-24
Owning workstream: Shiloh OS — Control & Reconciliation
Status: Complete once merged to `main`.

## Decision

Shiloh OS must not rely on JP, conversational memory, chat history, or handoff text as the sole carrier of durable project-wide operating rules.

When a cross-workstream operating rule, reporting convention, workflow requirement, architectural working rule, authorization boundary, or other durable Shiloh OS norm is explicitly agreed or ratified, the owning workstream must persist it into the appropriate authoritative GitHub surface during the same controlled unit whenever tools and authorization permit.

Future specialists must recover such rules independently from current authoritative repository state and preserve newer authority. JP should not need to remember, restate, or police an already-ratified norm.

## Authoritative implementation

`docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md` now contains the mandatory **Durable operating-rule persistence / no user-memory dependency rule**.

The rule also defines the correct authority surface:
- Engineering Governance for durable working methods and cross-stream norms.
- Master Status for durable architecture, business rules, permissions, integrations, and verified operational truth.
- Project Tracker/reconciliation for delivery state, evidence, gates, and next actions.

## Boundaries

This rule does not require persisting casual preferences, transient instructions, secrets, credentials, private personal details, sensitive data, or one-off conversational choices into GitHub.

Persisting a rule does not expand production or security authorization.

## Completed / do not redo

Once merged, do not rely on JP to remember or restate a durable Shiloh OS operating rule that should exist in authoritative project state. If a specialist discovers such a rule exists only in conversational context, it must reconcile it into the appropriate authoritative surface or route the dependency to Control & Reconciliation.
