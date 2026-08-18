# Shiloh OS — Reconciliation — Workstream Operating Model

Date: 2026-08-18
Scope: governance and operating-model adoption after PR #313.

## Authoritative baseline reviewed

- GitHub `main` at `846acd7e50fe70604e7a72d9316f1129079092d1`.
- `docs/SHILOH-OS-MASTER-STATUS.md`.
- `docs/SHILOH-OS-PROJECT-TRACKER.md`.
- `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`.
- PR #313 / `ef0da63681d244fc3a0fbb1e6c9e1cdb42bf77c7`, CI run #1011 and Render deploy `dep-da26430ae00c73c786s0` remain the accepted production-code baseline.

No existing governance conflict was found. The established rules already required authoritative-state inspection, explicit initial approval, automatic continuation after approval, fail-closed stopping gates, full CI/deploy verification and reconciliation. This change makes workstream ownership, cross-workstream dependency handling, documentation responsibility and completion sequencing explicit.

## Adopted workstreams

1. Shiloh OS — Control & Reconciliation.
2. Booking & Admin UX.
3. WhatsApp / Meta Integration.
4. CRM & Identity.
5. Production / DevOps.

These workstreams share one authoritative state. They are focused chat/ownership boundaries, not independent projects or sources of truth.

## Adopted completion contract

`inspect authoritative state → implement → test/full applicable regression gate → repair until green → merge → verify Render/production/provider state → reconcile Project Tracker → reconcile Master when durable architectural/operational state changed → final checkpoint`

Intermediate completion does not end controlled work. Work pauses only at a genuine approval, safety, provider, human-truth, unavailable-capability, contradictory-authority, material scope/risk or other material decision gate. No background-work claim is permitted without an actual scheduled or automated mechanism.

## Documentation contract

- Master: durable current architecture, business rules, permissions, integrations and operational truth.
- Project Tracker: delivery state, PRs/commits, tests, deployment evidence, outstanding work and next actions.
- Reconciliation evidence and Git history: durable audit trail and superseded implementation detail.
- Planned or in-progress work is never recorded as completed production state.

## Cross-workstream contract

A specialist chat must read applicable authoritative state before controlled work. If its change affects another workstream's contract or assumptions, it must identify and reconcile that dependency into the shared authoritative state. Conflicting specialist versions of Shiloh OS are prohibited.
