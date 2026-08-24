# Shiloh OS — Reconciliation — Reliable Assistant-Operated PostgreSQL Access Architecture

Date: 2026-08-24
Owning workstream: Control & Reconciliation
Assessment workstream: Production / DevOps
Implementation workstream: Production / DevOps
Status: ARCHITECTURE RATIFIED / READ CONNECTOR DEFECT OPEN / LIVE WRITE EXECUTION BLOCKED
Production/database mutation authorized by this reconciliation: none

## Authoritative baseline

This Control decision was made after independently re-reading current GitHub `main` at `d16f06a41b0bf9e4e58de0f4b4826ffebe4edfe0`, the applicable Master Status and Project Tracker plus current addenda, the latest imported-contact reconciliation, and Engineering Governance. The Production / DevOps assessment is routing evidence rather than authority.

The supplied assessment referenced older main `c5077abe36c2ab798564378a40d5b50a14411523`; that is superseded by current main `d16f06a41b0bf9e4e58de0f4b4826ffebe4edfe0`. The newer Goldie description-policy reconciliation does not conflict with this infrastructure decision.

The imported-contact / CRM identity remediation through PR #435 remains COMPLETE / DO NOT REDO. This architecture changes none of Gate 1, Gate 2, Stage 1/Stage 2, the 552 archived legacy zero-history imported records, the one intentionally verified active zero-history imported client, migrations 072/074, or prior production archival SQL.

## Verified capability boundary carried from Production / DevOps assessment

The bounded Production / DevOps capability assessment established:

- production PostgreSQL remains available, PostgreSQL 18, Oregon;
- the existing narrow external PostgreSQL `/32` access remains unchanged;
- no broad database allowlist was added;
- a harmless read-only query probe failed before SQL execution with `FATAL: SSL/TLS required (SQLSTATE 28000)`;
- production PostgreSQL correctly requires TLS; the failure is therefore treated as an assistant-side Render query integration/provider defect, not a reason to weaken database transport security;
- the connected Render integration exposes PostgreSQL read-only query capability in principle plus service/deploy/log/environment capabilities, but currently exposes no bounded Render One-Off Job create/get/list/cancel actions and no SSH or remote-exec shell;
- no suitable alternate PostgreSQL/SSH/terminal plugin was available at assessment time.

Do not repeat this capability assessment unless the relevant connector/plugin capability changes or new production evidence contradicts it.

## Decision A — two-plane architecture

**RATIFIED.** Reliable assistant-operated PostgreSQL access shall use two deliberately separate planes.

### Plane A — normal read-only production evidence

The preferred permanent read path is the first-party Render PostgreSQL query capability, repaired or corrected so that it uses an authenticated Render internal/private database path where available or correctly negotiates TLS 1.2+ on an approved external path.

Required acceptance contract:

1. tool-enforced read-only execution;
2. authenticated internal/private Render database path preferred where topology supports it;
3. otherwise TLS 1.2+ correctly negotiated externally;
4. no broad IP allowlist;
5. no database credentials exposed to ChatGPT, committed to GitHub, or returned in outputs;
6. sanitized query outputs and logs;
7. a harmless acceptance query proving `transaction_read_only=on` before the path is treated as normal Shiloh evidence infrastructure;
8. bounded independent read verification after any separately authorized maintenance operation.

The existing connector TLS failure is the first infrastructure defect to resolve or have resolved by the provider/tool integration. Do not compensate for it by disabling TLS, broadening network access, publishing credentials, or building a generic SQL-over-HTTP endpoint.

Once Plane A is proven reliable, it should replace local Windows `psql` as the normal Shiloh production-evidence path.

### Plane B — rare explicitly authorized production writes

The preferred write path is **version-controlled named maintenance operations executed as isolated Render One-Off Jobs or an equivalent first-party bounded job mechanism**.

Plane B is not arbitrary SQL access and is not an interactive production shell. Every live production write operation must be separately and exactly authorized by Control & Reconciliation after its concrete operation contract is reviewable.

The permanent execution contract requires, as applicable:

- immutable operation identifier and version/checksum;
- exact Git commit containing the operation;
- exact Control authorization reference using minimum necessary authoritative information;
- one exact named operation only;
- no raw SQL argument or arbitrary-command passthrough;
- explicit execution confirmation;
- exclusive/advisory execution locking;
- bounded statement and lock timeouts;
- live fail-closed preconditions checked in the same transaction;
- transaction isolation appropriate to the risk, using SERIALIZABLE where required by the operation contract;
- exact expected row-count and state assertions;
- all-or-nothing writes and rollback on drift/failure;
- precommit verification before commit;
- durable execution evidence preventing accidental replay of the same authorized operation;
- sanitized structured output with no credentials or unnecessary personal data;
- independent postcommit Plane A read-only verification;
- Project Tracker reconciliation; and
- Master Status reconciliation when durable authoritative state changed.

Ordinary Render deploy/startup must never become a hidden maintenance dispatcher. Maintenance execution remains an explicit operator action and separate from routine application deployment/restart.

## Decision B — dedicated maintenance isolation

**RATIFIED AS A MANDATORY PERMANENT TARGET, WITH A CONTROLLED TRANSITIONAL PHASE.**

The permanent Plane B state requires a dedicated non-public maintenance execution context plus a dedicated PostgreSQL role restricted to approved maintenance responsibilities, with credentials retained only in Render secret/environment management.

That dedicated role/context is **not required before inert repository framework work begins**.

After a first-party bounded One-Off Job capability becomes available to the assistant toolchain, a transitional existing-Shiloh-service execution environment may be considered for an initial exact named operation because it can reuse an existing Render-managed database secret rather than creating a new public access surface. However, such an initial live operation still requires a separate exact Control authorization and all live fail-closed safeguards above.

The dedicated maintenance role/context becomes mandatory **before Plane B is declared a routine/permanent production capability, before multiple maintenance operation classes are enabled for repeated use, or before maintenance privileges broaden beyond the smallest initial bounded responsibility**.

This staged boundary preserves a practical proof path without treating shared application credentials as an acceptable permanent least-privilege design.

## Decision C — repository framework authorization

**AUTHORIZED NOW, WITH A HARD NON-SECURITY-EXPANDING BOUNDARY.**

Production / DevOps may implement and test the repository-side framework required to express named maintenance operations, including:

- operation registry/manifest and read/write classification;
- immutable operation IDs and version/checksum validation;
- exact-commit binding contracts;
- explicit confirmation and authorization-reference requirements;
- no-raw-SQL/no-arbitrary-command validation;
- transaction/lock/timeout/precondition/expected-row-count abstractions;
- replay-prevention interface/contract;
- sanitized structured result schema;
- postcommit verification contract;
- deterministic tests and documentation/runbook updates.

This authorization is deliberately inert. It does **not** authorize:

- a production database write;
- a production-applied schema migration or execution-ledger table;
- creation of a PostgreSQL role or credential;
- a new Render secret/environment variable;
- a new public/private HTTP maintenance endpoint;
- a generic SQL endpoint;
- broadening an IP allowlist;
- SSH/remote shell access;
- GitHub-hosted runners connecting directly to production PostgreSQL;
- wiring a maintenance operation into ordinary Render deploy/startup;
- a new production One-Off Job execution; or
- any live operation merely because its repository implementation exists.

If framework implementation would make a production database connection reachable or apply a database/schema/security mutation merely by merge/deploy, that part is outside this authorization and must remain blocked pending separate Control review.

Live assistant-operated Plane B execution remains blocked until BOTH are true:

1. the connected assistant toolchain exposes bounded first-party Render One-Off Job actions or an equivalent first-party mechanism suitable for this architecture; and
2. Control & Reconciliation separately authorizes the exact named live operation after reviewing its commit, operation ID/checksum, preconditions, expected effects, rollback/failure behavior and verification plan.

## Decision D — preserve current database security and fallback access

**RATIFIED.**

Preserve the existing PostgreSQL TLS requirement, current network restrictions and existing narrow external `/32` access while the replacement mechanisms are unproven.

Do not broaden the `/32`, weaken TLS, or expose credentials to make assistant access easier. Do not remove the existing narrow fallback prematurely while local production `psql` may still be required for legitimate bounded evidence or explicitly authorized operations.

After Plane A is proven reliable and the bounded Plane B path is proven where required, and local Windows `psql` is no longer operationally necessary, Production / DevOps should remove the remaining external `/32` access and independently verify closure.

## Explicitly rejected designs

Shiloh OS shall not adopt the following merely to gain assistant database access:

- generic public SQL endpoint;
- permanent unrestricted production database write access;
- broad IP allowlisting;
- production credentials committed to GitHub or exposed to ChatGPT;
- unaudited SSH or interactive production shell;
- GitHub-hosted runners connecting directly to production PostgreSQL;
- ordinary Render deployment/startup as a hidden maintenance dispatcher.

A future architecture change that proposes one of these requires a new explicit Control decision and must not be inferred from this ratification.

## Priority and sequencing

The Goldie exact-source-first policy unit is already complete. The next product/business controlled priority remains **20 — CRM & Identity preparing the exact-source-first drafting/publication matrix**.

This PostgreSQL architecture is a **parallel secondary infrastructure track owned by 40 — Production / DevOps**. It must not displace the CRM drafting unit unless new production evidence creates a higher-severity operational or security gate.

Within the Production / DevOps track:

1. Plane A connector TLS/read-path defect is the first infrastructure defect to resolve/track and later acceptance-test;
2. the inert Plane B repository framework may proceed under Decision C;
3. live Plane B execution remains capability- and authorization-gated;
4. dedicated maintenance role/context hardening occurs before Plane B becomes routine/permanent or broadens;
5. external `/32` removal is later, only after replacement paths are proven.

## Completed / do not redo

- Production / DevOps capability assessment described above, unless connector/plugin capabilities change;
- PR #425 through #435 imported-contact remediation chain;
- Gate 1;
- Gate 2;
- Stage 1 / Stage 2;
- migrations 072/074;
- exact-target imported remediation and associated production archival SQL;
- PR #415/#436 Goldie exact-source-first policy and shared-ledger reconciliation.

## Next controlled action

**40 — Production / DevOps** owns two bounded infrastructure actions under this ratified architecture:

1. track/verify repair of Plane A first-party Render PostgreSQL read-only TLS connectivity without weakening database security; and
2. implement only the inert, non-security-expanding repository framework authorized by Decision C, with tests and documentation.

Any live database execution, role/secret/network change, production-applied maintenance schema, One-Off Job execution, or `/32` removal remains separately gated.
