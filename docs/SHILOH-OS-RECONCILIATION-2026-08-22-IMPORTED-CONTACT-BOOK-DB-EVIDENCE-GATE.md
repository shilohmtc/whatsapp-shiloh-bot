# Shiloh OS — Reconciliation — Imported Contact Book DB Evidence Gate

Date: 2026-08-22
Owning workstream: CRM & Identity
Evidence observer: Production & DevOps
Shared-state owner: Control & Reconciliation
Status: BLOCKED — AUTHENTICATED TLS-CAPABLE READ-ONLY PRODUCTION DB PATH UNAVAILABLE

## Scope

This reconciliation records the current production-evidence capability gate affecting **AUDIT — Imported Contact Book vs Canonical CRM Identity**. It does not close the CRM audit and does not authorize remediation, migration, bulk cleanup, identity merge, archive, rename, or production-data mutation.

PR #399 / `26ace1027e10f40e41d0f5d981e72f4a55a972c6` remains the current application-code authority. Migration 072 remains complete/do-not-redo. PR #395 remains durable authority for practitioner Google Calendar conflict classification.

## Current production evidence gate

Production & DevOps attempted the required bounded read-only production PostgreSQL evidence collection on 2026-08-22.

Verified provider/resource state:

- Render workspace: **My Workspace** / `tea-d9qb67n10e5c739at6j0`.
- Production Postgres: **shiloh-memory** / `dpg-d9quldht0dsc738p7m4g-a`.
- Database status: **available**.
- A fresh sanctioned Render `query_render_postgres` probe using `SELECT 1 AS ok;` failed **before SQL execution** with `FATAL: SSL/TLS required` / unexpected EOF.
- Render active-connection metrics remained non-zero during the same period, including values between 1 and 3 connections, which is consistent with a connector/external TLS-client path failure rather than evidence of a general production database outage.
- The connected Render tool surface exposes no authenticated SSH, shell, psql, secret-read, or alternate SQL execution path.
- No authenticated Render CLI fallback is available in the execution environment: Render CLI unavailable, `RENDER_API_KEY` unset, and no Render CLI authentication configuration.
- Existing application audit-read infrastructure is read-only but does not expose the CRM identity aggregates required by this audit.

No Render environment variable, service configuration, database configuration, deploy, or redeploy was changed to investigate this gate.

## Exact 11-query pack — RESOLVED / DO NOT REDESIGN

The earlier query-pack dependency is now **resolved**. CRM & Identity supplied the approved exact 11-query production evidence pack to Production & DevOps.

Production & DevOps submitted that exact pack to the sanctioned Render read-only PostgreSQL query path against the production database above. The connection failed **before any SQL executed** with:

- `failed to receive message: unexpected EOF`; and
- server error `FATAL: SSL/TLS required (SQLSTATE 28000)`.

Therefore:

- Q1–Q11 were **not executed**;
- no current 2026-08-22 CRM audit counts were obtained;
- no 2026-08-16 counts were reused;
- no substitute SQL was invented; and
- no verified-identity inference was made.

The query definitions themselves are no longer a dependency. Do not ask CRM & Identity to redesign or resend the pack merely because the transport path remains blocked.

## Audit evidence status

The required current 2026-08-22 production evidence remains **UNKNOWN / NOT OBTAINED**. Historical 2026-08-16 counts must not be reused as current evidence.

The blocked audit evidence includes the required current aggregate/provenance set for distinguishing imported-contact-only records, imported contacts with appointment/history links, unique-phone imported contacts, duplicate/shared/conflicting phones, genuine-onboarding upgrades, and the other bounded identity/provenance checks defined by the approved CRM audit query pack.

The **Linda exact-phone trace is also blocked** because no exact phone anchor has been supplied to the evidence workstream. No display-name or `Linda Dr` lookup was performed. A display label is not an identity key and must not be used to infer canonical name, identity, consent, verified registration, DOB, gender, guardian state, or record ownership.

## Authorized recovery boundary

Control authorizes restoration/use of a **bounded authenticated TLS-capable READ-ONLY PostgreSQL observation path** only, subject to all of the following:

1. No Render environment/configuration change.
2. No Render service/database redeploy or restart.
3. No application code change merely to expose audit data.
4. No production `INSERT`, `UPDATE`, `DELETE`, DDL, function execution with side effects, advisory mutation, or session setting that broadens write authority.
5. The client must require TLS and authenticate to the existing production Postgres endpoint using an already-authorized secure credential path.
6. The session must be explicitly read-only where supported (`default_transaction_read_only=on` or transaction-level `READ ONLY`) and queries must remain bounded to the approved CRM audit evidence pack.
7. Secrets must not be written to GitHub, reconciliation documents, chat, logs, or screenshots.
8. If the external connection string/credential cannot be obtained through an already-authorized secure channel, stop and treat that as the remaining human/provider capability gate rather than changing Render configuration to manufacture access.

The preferred recovery is therefore an authenticated external PostgreSQL client using Render's existing external connection details with TLS required and a read-only transaction. This is an access restoration/observation step, not an application change.

Current connected tooling does **not** expose the credential or alternate authenticated TLS-capable path required to complete this step. Control cannot safely manufacture that path from the existing tool surface.

## Routing

Once the bounded authenticated TLS-capable read-only path is available, return to **40 — Production & DevOps** to execute the already-approved exact **11-query** CRM audit evidence pack. Production & DevOps must not redesign the audit or implement remediation.

The resulting safely aggregated current evidence must then return to **20 — CRM & Identity** for audit closure, trust-model recommendation, remediation design, risk classification, and the exact implementation approval decision.

## Non-mutation evidence

This blocker reconciliation caused no production CRM, appointment, Calendar, WhatsApp/provider, Render configuration, environment, database, or application mutation. No SQL from Q1–Q11 executed. The only authorized repository work is documentation of the gate.

## Continuation rule

Do not claim the imported-contact audit complete while the current production evidence remains unavailable. Do not reuse stale 2026-08-16 counts as current truth. Do not trace `Linda Dr` by display name. Preserve exact-phone duplicate protection and fail closed on ambiguous identity.

The remaining exact gate is: **no functioning authenticated TLS-capable read-only PostgreSQL observation path is available through the currently authorized tooling**.
