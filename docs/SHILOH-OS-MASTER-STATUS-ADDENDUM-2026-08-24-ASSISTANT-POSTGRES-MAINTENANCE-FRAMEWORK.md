# Shiloh OS — Master Status Addendum — Assistant PostgreSQL Maintenance Framework

Date: 2026-08-24
Status: VERIFIED PRODUCTION COMPLETE — INERT FRAMEWORK ONLY

This addendum supplements the PR #437 assistant PostgreSQL access architecture authority.

## Durable current state

PR #438 / merge `8bca442ac8b14e9f6d0794a9a51d70375c49e6db` implements the repository-side named-maintenance-operation contract authorized by PR #437.

The implemented framework is deliberately inert and non-security-expanding:

- operations are named, versioned and explicitly classified `read` or `write`;
- operation definitions are checksum-bound and include exact Git commit, Control authorization reference and explicit confirmation contracts;
- arbitrary SQL, raw command, shell/exec, secrets and connection-string fields are prohibited by validation;
- write contracts require bounded lock/timeouts, live preconditions, expected-state assertions, precommit verification and independent read-only postcommit verification declarations;
- replay-prevention is represented as an interface/contract only; no production replay ledger/store exists;
- unknown operations and incomplete contracts fail closed;
- structured output validation rejects identity/credential/raw-payload result keys;
- the production operation manifest is intentionally empty;
- the normal application startup path does not import or execute the framework.

PR #438 CI #1320 / run `32706333224` / job `97368124213` passed focused **12/12** and full non-mutating **913/913** on Node 24.14.1.

Exact Render deploy `dep-da60150ae00c73blrcs0` reached LIVE on `8bca442ac8b14e9f6d0794a9a51d70375c49e6db`. Build/startup/runtime verification proved ordinary `npm start`, successful health/root responses, existing migration and controlled-Juvan authority preserved, Google Calendar provider health passed, no framework maintenance execution event, and no error-level deployment-window logs.

## Preserved security / execution authority

This implementation does **not** authorize or create:

- a production database write path;
- a production maintenance schema or replay table;
- a PostgreSQL maintenance role or credential;
- a Render secret/environment variable;
- an HTTP/generic SQL maintenance endpoint;
- SSH/remote shell;
- GitHub-hosted runner direct production PostgreSQL access;
- Render One-Off Job execution;
- normal startup/deploy-triggered maintenance;
- network/IP allowlist expansion or removal of the existing external PostgreSQL `/32` fallback.

Plane B live assistant-operated execution remains BLOCKED until a bounded first-party One-Off Job or equivalent mechanism exists and an exact operation has separate Control authorization. The permanent least-privilege target remains a dedicated non-public maintenance execution context plus a dedicated restricted PostgreSQL role before Plane B becomes routine/permanent or repeated maintenance classes are enabled.

Plane A remains the preferred normal read-only evidence path. Its current first-party Render query TLS integration failure remains unresolved; production TLS is correct and must not be weakened. Re-test only when connector/tool capability changes or a concrete acceptance test is required.

## Completed / do not redo

Do not redo PR #437 architecture ratification or PR #438 inert framework implementation. Preserve the completed imported-contact remediation lineage, Gate 1/Gate 2, Stage 1/2 and migrations 072/074.

## Current priority

This infrastructure track is a secondary parallel track. With the inert framework complete and live execution capability still externally gated, primary product/business focus returns to **CRM & Identity — exact-source-first drafting/publication matrix**.
