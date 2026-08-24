# Shiloh OS — Master Status Addendum — Assistant-Operated PostgreSQL Access Architecture

Date: 2026-08-24
Owning workstream: Control & Reconciliation
Implementation owner: Production / DevOps
Status: RATIFIED DURABLE ARCHITECTURE / LIVE WRITE EXECUTION NOT AUTHORIZED

## Durable architecture

Shiloh OS uses two separate planes for assistant-operated production PostgreSQL access.

### Plane A — read-only evidence

Normal production evidence should use a corrected first-party Render PostgreSQL query path, preferring authenticated internal/private connectivity and otherwise requiring correctly negotiated TLS 1.2+ external connectivity. The path must be tool-enforced read-only, sanitize outputs, expose no production credentials, require no broad IP allowlist, and prove `transaction_read_only=on` before acceptance.

The current assistant-side Render query integration fails before SQL execution with `FATAL: SSL/TLS required (SQLSTATE 28000)`. This is treated as a connector/integration defect. Production PostgreSQL TLS must remain enabled and must not be weakened to accommodate the tool.

### Plane B — explicitly authorized maintenance writes

Rare production writes use version-controlled **named maintenance operations** executed as isolated Render One-Off Jobs or an equivalent first-party bounded job mechanism. Arbitrary SQL arguments and interactive production shells are not part of Shiloh's approved architecture.

Each exact live operation requires its own Control authorization and bounded safeguards, including immutable operation identity/version/checksum, exact Git commit, explicit confirmation, locks/timeouts, same-transaction fail-closed preconditions, appropriate transaction isolation, expected-row/state assertions, rollback on drift/failure, replay protection, sanitized output, independent read-only postcommit verification and reconciliation.

Ordinary Render deploy/startup is not a maintenance dispatcher.

## Permanent least-privilege target

Plane B's permanent state requires a dedicated non-public maintenance execution context plus a dedicated PostgreSQL role restricted to approved maintenance responsibilities, with credentials retained only in Render secret/environment management.

Inert repository framework work may precede that infrastructure. Once first-party bounded One-Off Job execution exists, an initial transitional exact operation may be considered using the existing Shiloh service environment only under separate Control authorization. Dedicated execution/DB-role isolation is mandatory before Plane B becomes routine/permanent, enables repeated operation classes, or broadens privileges.

## Current authorization boundary

Production / DevOps is authorized to build and test only the **inert, non-security-expanding repository framework** for named maintenance operations.

This durable architecture does not authorize any production database write, production-applied maintenance schema, PostgreSQL role/credential, new Render secret, endpoint, network/allowlist change, SSH/remote shell, direct GitHub-runner database access, One-Off Job execution, or `/32` removal.

Live assistant-operated Plane B remains blocked until the assistant toolchain exposes bounded first-party One-Off Job actions or an equivalent mechanism and Control separately authorizes the concrete operation.

## Network and fallback authority

Preserve PostgreSQL TLS, existing network restrictions and the current narrow external `/32` fallback while replacement paths are unverified. Do not broaden access. Remove the `/32` only after assistant-operated Plane A is proven reliable, the bounded write path is proven where required, and local `psql` is no longer operationally necessary; independently verify closure afterward.

## Rejected patterns

Do not introduce a generic public SQL endpoint, unrestricted permanent DB write access, broad IP allowlisting, credentials in GitHub/ChatGPT, unaudited shell access, GitHub-hosted runners directly connecting to production PostgreSQL, or deploy/startup-triggered maintenance as a workaround for connector limitations.

## Priority and separation from completed authority

The current product/business priority remains CRM & Identity's exact-source-first description drafting/publication matrix. The PostgreSQL access architecture is a parallel secondary Production / DevOps track unless a higher-severity production/security gate emerges.

Imported-contact remediation through PR #435 and Goldie exact-source-first policy reconciliation through PR #436 remain complete/do-not-redo. This architecture changes no CRM identity, archival, migration 072/074, catalogue-publication or client-data authority.
