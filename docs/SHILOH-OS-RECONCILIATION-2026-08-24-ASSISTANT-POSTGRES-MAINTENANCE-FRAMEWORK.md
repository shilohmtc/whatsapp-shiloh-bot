# Shiloh OS — Reconciliation — Assistant PostgreSQL Maintenance Framework

Date: 2026-08-24
Workstream: Production / DevOps
Decision owner / observer: Control & Reconciliation
Status: VERIFIED PRODUCTION COMPLETE — INERT FRAMEWORK ONLY

## Authority

PR #437 / merge `bea8a4ff26c9f79187bd1aba4abe433831dbbffa` ratified the two-plane assistant PostgreSQL access architecture and authorized only an inert, non-security-expanding repository framework for named maintenance operations.

PR #438 implemented that bounded framework and merged as `8bca442ac8b14e9f6d0794a9a51d70375c49e6db`.

No production database, schema, network, PostgreSQL role, credential, Render secret/environment variable, HTTP maintenance endpoint, generic SQL endpoint, SSH/remote shell, GitHub-hosted runner database path, Render One-Off Job execution, startup/deploy-triggered maintenance, or external PostgreSQL `/32` removal was authorized or performed by this unit.

## Implemented framework

PR #438 added an inert contract surface consisting of:

- `src/maintenance/operationFramework.js` — pure validation/contract helpers with no database, HTTP, network, shell or child-process execution dependency;
- `config/maintenance-operation-manifest.js` — versioned registry with an intentionally empty operation list;
- `tests/maintenance-operation-framework.test.js` — deterministic fail-closed contract coverage;
- a focused `test:maintenance-framework` package script and CI step;
- Production Runbook documentation for the non-executable boundary.

The framework validates, as applicable:

- named/versioned operation identity;
- explicit `read` / `write` classification;
- immutable SHA-256 contract checksum;
- exact 40-character Git commit binding;
- exact Control authorization reference contract;
- exact confirmation token bound to operation ID/version;
- prohibition of arbitrary SQL, raw commands, shell/exec, secrets and connection strings in operation definitions;
- bounded statement and lock timeouts;
- declared transaction isolation;
- write-operation lock, live precondition, expected-state, precommit-verification and independent read-only postcommit-verification contracts;
- replay-prevention interface contract;
- fail-closed registry lookup and duplicate operation rejection;
- sanitized structured-result keys.

The repository replay-prevention interface is implemented, but a production replay ledger/store is deliberately not implemented and remains separately gated.

## Verification

PR #438 CI:

- workflow: CI #1320;
- run: `32706333224`;
- job: `97368124213`;
- Node: 24.14.1;
- npm audit during CI: 0 vulnerabilities;
- focused maintenance-framework tests: **12/12 passed**, 0 failed/cancelled/skipped;
- full non-mutating regression: **913/913 passed**, 0 failed/cancelled/skipped.

The focused suite proves the manifest is inert, unknown operations fail closed, arbitrary SQL/command fields are rejected, exact commit/authorization/confirmation gates are enforced, write transaction and replay contracts fail closed when incomplete, structured result sanitization is enforced, and normal application startup has no framework execution wiring.

## Render / production verification

Render auto-deployed the exact implementation merge as:

- deploy: `dep-da60150ae00c73blrcs0`;
- commit: `8bca442ac8b14e9f6d0794a9a51d70375c49e6db`;
- status: LIVE;
- finished: `2026-08-24T08:28:33.198769Z`.

Observed deployment/runtime evidence:

- Render checked out the exact merge commit;
- Node 24.14.1;
- build command remained `npm ci` and completed successfully with 0 vulnerabilities;
- runtime command remained ordinary `npm start` and did not include the maintenance-operation framework;
- migration 074 remained checksum-verified and unreplayed;
- migrations 065/066/067/068/072 remained checksum-verified/unreplayed;
- controlled Juvan remained BOUND under the existing approval contract;
- Google Calendar provider health check passed;
- `Shiloh started` was logged;
- root and `/health` returned HTTP 200;
- bounded log search found no `Explicit maintenance command started`, `maintenance operation`, or `maintenance-operation` execution event;
- bounded error-level log search returned no error entries in the deployment verification window.

Therefore the framework deployment did not execute a maintenance operation merely because repository code was deployed.

## Durable authority and remaining gates

The inert named-maintenance-operation framework is now implemented and production-deployed as repository/runtime code, but **Plane B live assistant-operated execution remains BLOCKED** until a bounded first-party Render One-Off Job action or equivalent capability exists and an exact operation receives separate Control authorization.

The permanent least-privilege target remains a dedicated non-public maintenance execution context plus a dedicated restricted PostgreSQL role before Plane B becomes routine/permanent or repeated operation classes are enabled.

Plane A's first-party Render PostgreSQL query TLS integration defect remains unresolved. Production TLS remains correct and must not be weakened. Re-test only if connector/tool capability changes or a concrete new acceptance test is required.

The existing external PostgreSQL `/32` fallback remains unchanged and must not be broadened. Removal remains a later closure action after replacement paths are proven and local psql is no longer required.

## Completed / do not redo

Do not redo:

- PR #437 architecture ratification;
- PR #438 inert framework implementation;
- the current Render/PostgreSQL capability assessment unless capability changes;
- the imported-contact remediation lineage PR #425–#435, Gate 1, Gate 2, Stage 1/2 and migrations 072/074.

## Priority / next action

This infrastructure track remains secondary. No further Plane B implementation should be invented to bypass the current first-party execution-capability gate.

Return primary product/business focus to **20 — CRM & Identity** for the exact-source-first drafting/publication matrix. Production / DevOps should resume this infrastructure track only when the Render read-only connector capability changes, bounded One-Off Job execution becomes available, or Control authorizes another exact infrastructure unit.
