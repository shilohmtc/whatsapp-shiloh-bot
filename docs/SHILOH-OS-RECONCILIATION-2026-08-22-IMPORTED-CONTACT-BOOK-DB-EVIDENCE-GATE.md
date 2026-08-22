# Shiloh OS — Reconciliation — Imported Contact Book DB Evidence Gate

Date: 2026-08-22
Owning workstream: CRM & Identity
Evidence observer: Production & DevOps
Shared-state owner: Control & Reconciliation
Status: BLOCKED — MANUAL SINGLE-IP ALLOWLIST + TLS-CAPABLE READ-ONLY CLIENT REQUIRED

## Scope

This reconciliation records the current production-evidence capability gate affecting **AUDIT — Imported Contact Book vs Canonical CRM Identity**. It does not close the CRM audit and does not authorize remediation, migration, bulk cleanup, identity merge, archive, rename, or production-data mutation.

Current overall application lineage has advanced beyond PR #399 through newer Booking/Admin work now reconciled on current main; preserve that newer application authority. PR #399 / `26ace1027e10f40e41d0f5d981e72f4a55a972c6` remains durable authority for the CRM onboarding normalized-phone ambiguity repair; migration 072 remains complete/do-not-redo. PR #395 remains durable authority for practitioner Google Calendar conflict classification. Later documentation-only Control reconciliation commits do not supersede those bounded authorities.

## Current production evidence gate

Production & DevOps attempted the required bounded read-only production PostgreSQL evidence collection on 2026-08-22.

Verified provider/resource state:

- Render workspace: **My Workspace** / `tea-d9qb67n10e5c739at6j0`.
- Production Postgres: **shiloh-memory** / `dpg-d9quldht0dsc738p7m4g-a`.
- Database status: **available**.
- A fresh sanctioned Render `query_render_postgres` probe using `SELECT 1 AS ok;` failed **before SQL execution** with `FATAL: SSL/TLS required` / unexpected EOF.
- Render active-connection metrics remained non-zero during the same period, which is consistent with a connector/external-client path failure rather than evidence of a general production database outage.
- The connected Render tool surface exposes no authenticated SSH, shell, psql, secret-read, or alternate SQL execution path.
- No authenticated Render CLI fallback is available in the execution environment: Render CLI unavailable, `RENDER_API_KEY` unset, and no Render CLI authentication configuration.
- Existing application audit-read infrastructure is read-only but does not expose the CRM identity aggregates required by this audit.

No production SQL executed during these failed attempts.

## Exact 11-query pack — RESOLVED / DO NOT REDESIGN

The earlier query-pack dependency is **resolved**. CRM & Identity supplied the approved exact 11-query production evidence pack to Production & DevOps.

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

## Direct Render UI evidence — external access disabled

JP supplied direct Render Dashboard evidence from **Postgres → Connect → External** showing:

`External traffic not allowed. Add IP addresses in the Networking section.`

This establishes that the external database path is intentionally closed at the Render Networking layer in addition to the current connector's demonstrated TLS incompatibility. Adding an IP allowlist entry does **not** repair or change the TLS behaviour of the sanctioned ChatGPT/Render `query_render_postgres` connector. The allowlist can only enable an external client that independently supports Render's required TLS connection.

## Audit evidence status

The required current 2026-08-22 production evidence remains **UNKNOWN / NOT OBTAINED**. Historical 2026-08-16 counts must not be reused as current evidence.

The blocked audit evidence includes the required current aggregate/provenance set for distinguishing imported-contact-only records, imported contacts with appointment/history links, unique-phone imported contacts, duplicate/shared/conflicting phones, genuine-onboarding upgrades, and the other bounded identity/provenance checks defined by the approved CRM audit query pack.

The **Linda exact-phone trace is also blocked** because no exact phone anchor has been supplied to the evidence workstream. No display-name or `Linda Dr` lookup was performed. A display label is not an identity key and must not be used to infer canonical name, identity, consent, verified registration, DOB, gender, guardian state, or record ownership.

## Control authorization — bounded project-lifetime network exception

JP explicitly authorizes a narrow Render Postgres Networking exception for the production database so the approved read-only audit can be executed from a trusted TLS-capable client.

The latest explicit business instruction supersedes the earlier proposed immediate-removal timing: the authorized rule may remain in place **until Shiloh OS project closure**, at which point removal and verification that external access is closed are mandatory Control/Production completion actions.

The authorization is constrained as follows:

1. Allow **one trusted source public IP only**, preferably as an exact `/32` IPv4 CIDR (or equivalent single-address rule supported by Render).
2. **Never** use `0.0.0.0/0`, a broad office/ISP range, or an unnecessarily broad CIDR merely to make the connection work.
3. The allowlist applies only to **shiloh-memory** and only to external PostgreSQL reachability. It does not authorize any web-service, application, Meta, Calendar, or other networking change.
4. TLS remains mandatory. Do not weaken or disable Render/PostgreSQL TLS. Use the full Render external hostname, not a resolved IP shortcut.
5. Use only the existing authorized database credential through a secure channel. Database URLs, usernames/passwords and full connection strings must not be written to GitHub, reconciliation documents, chat, logs, screenshots, or copied into unsecured tools.
6. The SQL session/transaction must be explicitly **READ ONLY** where supported (`default_transaction_read_only=on` or transaction-level `READ ONLY`).
7. Execution is limited to the already-approved exact Q1–Q11 audit pack. No substitute SQL, exploratory write-capable function execution, or scope expansion is authorized.
8. No production `INSERT`, `UPDATE`, `DELETE`, DDL, side-effecting function call, advisory mutation, or session setting that broadens write authority is authorized.
9. No Render service environment-variable change, application code change, temporary audit endpoint, database credential rotation, database restart, service deploy, or redeploy is authorized merely to obtain the audit evidence.
10. If the trusted source IP changes or is no longer controlled/needed, the obsolete allowlist entry must be removed rather than widened. A replacement must remain a single trusted source address.
11. At final Shiloh OS project closure, Production & DevOps must remove the remaining audit allowlist entry and Control must verify that Render again reports external traffic disabled before the project is considered fully closed.

This is a **network reachability authorization**, not a database-write authorization.

## Remaining execution boundary

The connected ChatGPT/Render tooling does not expose a Networking/IP-allowlist mutation action and the existing `query_render_postgres` connector has already failed the TLS requirement. Therefore Control cannot execute the Render Networking change or Q1–Q11 from the current tool surface.

The practical next path is:

1. From the trusted machine that will run the audit, determine its current public IP without exposing database credentials.
2. In Render Dashboard → `shiloh-memory` → Networking, add only that single trusted IP as the permitted external source.
3. Use a trusted TLS-capable PostgreSQL client on that same source machine (for example Render's supplied PSQL command in a local `psql` client, or an equivalently trusted PostgreSQL client) with the full external hostname and TLS required.
4. Establish a read-only session/transaction.
5. Execute Q1–Q11 unchanged.
6. Return only safely aggregated/masked results to Production & DevOps / CRM & Identity.
7. Keep the single-IP allowlist in place under this explicit project-lifetime authorization until project closure, unless it becomes obsolete or unsafe earlier.

If no trusted TLS-capable client can be established without exposing credentials, remain blocked. Do not broaden the IP rule or alter Render/application configuration to manufacture access.

## Routing

Once the bounded external path exists, return to **40 — Production & DevOps** to execute/validate the already-approved exact **11-query** CRM audit evidence pack. Production & DevOps must not redesign the audit or implement remediation.

The resulting safely aggregated current evidence must then return to **20 — CRM & Identity** for audit closure, trust-model recommendation, remediation design, risk classification, and the exact implementation approval decision.

## Non-mutation evidence

Up to this reconciliation point, no production CRM, appointment, Calendar, WhatsApp/provider, database row, application code, Render environment variable, database credential, or TLS setting was mutated for this audit. No SQL from Q1–Q11 executed. The new authorization permits only the narrowly bounded Render Postgres external-IP allowlist described above; it does not itself record that the Networking mutation has yet occurred.

## Continuation rule

Do not claim the imported-contact audit complete while the current production evidence remains unavailable. Do not reuse stale 2026-08-16 counts as current truth. Do not trace `Linda Dr` by display name. Preserve exact-phone duplicate protection and fail closed on ambiguous identity.

The remaining exact gate is now: **a trusted single-IP Render allowlist plus a functioning authenticated TLS-capable read-only PostgreSQL client must be established before Q1–Q11 can execute**.
