# Shiloh OS — Reconciliation — Goldie Wave A Publication Complete

Date: 2026-08-24
Owning workstream: 20 — CRM & Identity
Status: COMPLETE / VERIFIED LIVE / DO NOT REDO

## Authority

PR #441 remains the exact publication authority:

- Wave A: exactly 20 approved Goldie rows — 18 VERBATIM + 2 punctuation-only MECHANICAL.
- Wave B: drafting/redraft only; no publication.
- Wave C: fail closed; no publication.

PR #443 remains authoritative final-checkpoint governance. PR #444 remains durable operating-governance authority and did not alter Wave A scope.

Retained Goldie source authority remains `export (33).csv`, SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`. No newer Goldie service-description source was found before implementation.

## Implementation

PR #445 — `Publish authorized Goldie Wave A descriptions` — merged as:

`e4505570f625e14af94ddb5bda8e1d20bfb14a6c`

Migration:

`075_goldie_wave_a_customer_descriptions.sql`

The implementation is deliberately bounded:

- exact canonical key is `services.external_source='goldie'` + exact Goldie `external_id`;
- canonical publication field is `services.customer_description`;
- exactly 20 target UUIDs are reachable;
- Wave B/C target IDs are structurally excluded;
- migration 075 requires the transaction-local `PR441` marker, so generic `db:migrate` cannot bypass the guarded bootstrap;
- the one-purpose bootstrap locks and validates the 20 target rows before the first update;
- missing/duplicate target, source SHA drift, unexpected current description, checksum drift, status/eligibility drift or unauthorized ID causes rollback;
- service names, categories, prices, durations, booking notes, service statuses and practitioner mappings are preserved;
- all non-target service descriptions are snapshotted and verified unchanged;
- no client, appointment, Calendar, WhatsApp or provider state is mutated.

Historical broad `Waxing` remains inactive and non-bookable; only its approved `customer_description` was stored. It was not reactivated or remapped.

## Exact publication result

Production startup emitted the guarded evidence event after the production transaction:

- migration: `075_goldie_wave_a_customer_descriptions.sql`
- source SHA-256: `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`
- `appliedNow=true`
- `checksumVerified=true`
- `targetCount=20`
- `exactDescriptionCount=20`
- `activePublicCatalogueTargetCount=19`
- `retainedInactiveTargetCount=1`
- `mappingsPreserved=true`
- `nonTargetDescriptionsPreserved=true`
- applied at `2026-08-24T09:59:29.649Z`

The 18 VERBATIM rows equal the retained Goldie source. The two MECHANICAL rows differ only by the PR #441 punctuation corrections:

- Permanent Makeup Eyeliner: add the missing `)` after Thick line Top touch-up `2H00`.
- Permanent Makeup Brows: remove the stray `)` after `R2150` in the combined-brows touch-up.

No practitioner personal phone number was introduced.

## CI and repair

Initial CI #1333 correctly blocked merge because one legacy verified-client test incorrectly required migration 074 to remain the globally highest-numbered migration.

The repair did not alter migration 074 or verified-client authority. It changed only the stale assertion so migration 074 remains unique, unchanged in role, no-backfill, and verified before the later Wave A startup gate.

Final CI:

- CI #1334
- workflow run `32714349691`
- job `97392322019`
- Node `24.14.1`
- maintenance framework: 12/12 passed
- full regression: 919/919 passed
- 0 failed / 0 cancelled / 0 skipped
- npm audit: 0 vulnerabilities

All six new Wave A focused contract tests passed.

## Render / production proof

Exact auto-deploy:

`dep-da61bq1t0dsc73cr1d4g`

Exact commit:

`e4505570f625e14af94ddb5bda8e1d20bfb14a6c`

Status: LIVE

Started: `2026-08-24T09:59:04.977386Z`
Finished: `2026-08-24T09:59:33.782377Z`

The guarded publication event occurred before `Shiloh started`; application startup then completed successfully. The bounded post-cutover error query returned no error-level logs.

The strongest live-catalogue evidence is the production bootstrap itself: after mutation and before commit/startup it re-queries the exact canonical 20 Goldie UUIDs, verifies every exact `customer_description`, verifies 19 active/public-catalogue-eligible rows, verifies the inactive Waxing row remains non-bookable, and verifies mappings/non-target descriptions remain unchanged.

The separate first-party Render read-only PostgreSQL connector still has the previously known TLS integration defect and was not weakened. This unit created no new SQL endpoint or general production database write capability.

## Wave B / Wave C preservation

Wave B remains drafting/redraft only. No Wave B text was published by PR #445.

Wave C remains fail closed. In particular:

- do not infer Psoas missing text;
- do not infer Bamboo identity;
- do not author the two active lymphatic blanks without separate approval;
- do not author the retired Full Body Sports Massage blank;
- do not infer corrupted/incomplete source wording;
- do not restore practitioner personal phone numbers.

## Completed / do not redo

Do not redo this Wave A publication, migration 075, the 52-service source comparison, PR #392/#393, PR #415, PR #436, PR #440, PR #441, Psoas/Bamboo evidence, imported-contact remediation through PR #435, Gate/Stage work, or migrations 072/074.

Future Wave A verification should reuse the migration-075 checksum, exact 20-ID contract, guarded bootstrap and production evidence rather than rebuilding a new publication mechanism.

## What this now enables

Shiloh's approved Goldie Wave A descriptions are now stored in the canonical CRM-backed customer-description field and are directly available to existing catalogue consumers for the 19 active/publicly eligible services. The approved description for historical Waxing is also retained canonically without making that retired service bookable.

This is a **bounded write capability, not a general database-write capability**. Future specialists can directly reuse the one-purpose migration/bootstrap pattern for an explicitly authorized catalogue set, including exact-ID locking, source/checksum validation, pre-state checks, rollback, post-state verification and non-target preservation. They should not rebuild an arbitrary SQL path or weaken the existing Render TLS boundary.

JP no longer needs to manually copy these 20 descriptions into production, manually map them to CRM rows, manually reactivate Waxing, or manually verify each target after deployment. The deployment gate itself performs the exact canonical verification.

Remaining gates are separate: Wave B requires Control's per-row publication decisions; Wave C remains blocked on source/identity/blank/corruption truth. The Render read-only PostgreSQL connector TLS defect also remains a separate infrastructure limitation and does not affect the completed Wave A publication.

## Reconciliation status

Project Tracker reconciliation: dated Tracker addendum included with this unit.

Master Status reconciliation: durable live catalogue-state addendum included with this unit because production catalogue content changed.

## Next owner

00 — Control & Reconciliation for Wave B per-row publication decisions.

20 — CRM & Identity must not publish Wave B until Control returns an exact approved set. Wave C remains held.