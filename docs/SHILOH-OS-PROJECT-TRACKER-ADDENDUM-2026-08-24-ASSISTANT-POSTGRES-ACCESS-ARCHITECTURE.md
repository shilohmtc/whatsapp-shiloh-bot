# Shiloh OS — Project Tracker Addendum — Assistant-Operated PostgreSQL Access Architecture

Date: 2026-08-24
Owning workstream: Control & Reconciliation
Implementation owner: Production / DevOps
Status: 🟢 ARCHITECTURE RATIFIED / 🟠 READ CONNECTOR DEFECT / 🟠 LIVE WRITE CAPABILITY BLOCKED

## Current tracker authority

Control & Reconciliation ratified the two-plane architecture for reliable assistant-operated PostgreSQL access.

### Plane A — normal read-only evidence

Preferred permanent path: repaired first-party Render PostgreSQL read-only query capability using an authenticated internal/private path where possible, otherwise correctly negotiated TLS 1.2+ external access.

Acceptance requires tool-enforced read-only operation, sanitized outputs, no credential exposure, no broad allowlist, and a harmless proof that `transaction_read_only=on`.

Current defect: the assistant-side Render query integration fails before SQL execution with `FATAL: SSL/TLS required (SQLSTATE 28000)`. Production PostgreSQL TLS remains correct and must not be weakened. This defect is the first infrastructure issue to resolve/track.

### Plane B — rare authorized writes

Permanent model: version-controlled named maintenance operations executed through isolated Render One-Off Jobs or an equivalent first-party bounded job mechanism. Arbitrary SQL and interactive production shells are prohibited.

Live assistant-operated Plane B execution remains **BLOCKED** because the currently connected assistant Render toolchain exposes no bounded One-Off Job execution actions. Any exact future live write also requires separate Control authorization after review of its concrete operation contract.

## Dedicated maintenance isolation

A dedicated non-public maintenance execution context plus a dedicated least-privilege PostgreSQL role is the mandatory permanent target.

It is not required before inert repository-framework development. A transitional existing-Shiloh-service One-Off Job environment may be considered for an initial exact operation only after first-party bounded job execution exists and only under separate exact Control authorization. Dedicated role/context separation is required before Plane B becomes routine/permanent, enables repeated operation classes, or broadens privileges.

## Authorized now

**40 — Production / DevOps may proceed with an inert, non-security-expanding repository framework only**, including operation registry/manifest, immutable operation ID/checksum contracts, exact-commit binding, explicit confirmation/authorization references, no-raw-SQL guards, timeout/lock/precondition/expected-row abstractions, replay-prevention interfaces, sanitized result contracts, postcommit verification contracts, deterministic tests and runbook/documentation updates.

This authorization does not permit production DB writes, production-applied maintenance schema, DB roles/credentials, Render secrets, HTTP maintenance endpoints, network changes, SSH/remote shell, direct GitHub-runner PostgreSQL access, One-Off Job execution, or startup/deploy-triggered maintenance.

## Security preservation

Preserve PostgreSQL TLS, current network restrictions and the existing narrow external `/32` fallback until replacement mechanisms are verified. Do not broaden it. Remove and independently verify closure only after Plane A is reliable, the bounded write path is proven where required, and local `psql` is no longer operationally necessary.

## Priority

The current product/business priority remains **20 — CRM & Identity: exact-source-first drafting/publication matrix**. This Production / DevOps infrastructure work is a parallel secondary track and must not displace that unit absent a higher-severity production/security gate.

## Completed / do not redo

- Production / DevOps PostgreSQL capability assessment unless connector/plugin capabilities change;
- PR #425–#435 imported-contact remediation chain;
- Gate 1 / Gate 2 / Stage 1 / Stage 2;
- migrations 072/074 and exact-target imported remediation;
- PR #415/#436 Goldie exact-source-first policy reconciliation.

## Next action

Production / DevOps owns:

1. Plane A TLS/read-connector defect tracking and later acceptance verification; and
2. implementation/testing of the inert repository maintenance-operation framework.

All live execution and security-sensitive changes remain separately gated.
