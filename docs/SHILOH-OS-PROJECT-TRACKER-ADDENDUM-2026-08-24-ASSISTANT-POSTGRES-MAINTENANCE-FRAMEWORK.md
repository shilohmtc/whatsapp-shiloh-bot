# Shiloh OS — Project Tracker Addendum — Assistant PostgreSQL Maintenance Framework

Date: 2026-08-24

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| ASSISTANT-POSTGRES-NAMED-MAINTENANCE-FRAMEWORK | Production / DevOps; Control observer | 🟢 VERIFIED PRODUCTION COMPLETE — INERT FRAMEWORK | PR #437 ratified the two-plane architecture. PR #438 / merge `8bca442ac8b14e9f6d0794a9a51d70375c49e6db` implemented only the inert repository framework: named/versioned operation registry contract, read/write classification, immutable checksum, exact commit + Control authorization + confirmation bindings, recursive no-arbitrary-SQL/command/secret validation, transaction isolation/lock/timeout/precondition/expected-state/precommit/postcommit contracts, replay-prevention interface, sanitized structured-result validation, and intentionally empty live manifest. CI #1320 / run `32706333224` / job `97368124213`: focused **12/12** and full non-mutating **913/913** passed on Node 24.14.1. Exact Render deploy `dep-da60150ae00c73blrcs0` reached LIVE; ordinary `npm start` remained unchanged, root/health 200, Calendar health passed, existing migrations checksum-valid/unreplayed, no maintenance execution log event and no deployment-window error-level logs. Plane B live execution remains BLOCKED pending bounded first-party One-Off Job/equivalent capability plus separate exact Control authorization. Plane A TLS connector defect remains unresolved; do not weaken TLS. Existing external PostgreSQL `/32` remains unchanged. Next project priority remains CRM & Identity exact-source-first drafting/publication matrix. |

## Completed / do not redo

Do not redo PR #437 architecture ratification or PR #438 inert framework implementation. Do not repeat the full Render/PostgreSQL capability assessment unless connector/tool capability changes.

## Remaining infrastructure gates

- Plane A: first-party Render read-only Postgres query integration must correctly negotiate the authorized connectivity path and prove `transaction_read_only=on`; current TLS failure remains an integration defect, not a database-security defect.
- Plane B: live assistant execution remains blocked until bounded first-party One-Off Job/equivalent execution exists and each exact operation receives separate Control authorization.
- Permanent Plane B requires dedicated non-public execution context plus restricted PostgreSQL role before routine/repeated use.
- Keep the current narrow external PostgreSQL `/32` fallback unchanged until replacement paths are proven and closure is separately authorized.
