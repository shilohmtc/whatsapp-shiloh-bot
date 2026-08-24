# Shiloh OS — Reconciliation — Imported Zero-history Archive Gate 2

Date: 2026-08-24
Workstream: Production / DevOps
Control authorization: PR #431
Status: VERIFIED PRODUCTION ARCHIVAL COMPLETE

## Authority

PR #431 authorized the bounded reversible Gate 2 archival using the live fail-closed predicate. Authorization merge: `8bfa3a52fec9f8fd7a932968cac9b21ddb06f00b`. CI #1304 / run `32696044238` succeeded. Render deploy `dep-da5u3sbl550s738k1ajg` reached LIVE on the exact authorization merge.

## Execution result

The first execution attempt rolled back completely after a `psql` control-flow defect caused the live mutation CTE to be evaluated twice inside the same transaction. No first-attempt archival persisted. The script was repaired without changing predicate or scope and rerun as v2.

The corrected v2 transaction recomputed immediately before writes:

- active zero-appointment `goldie_import` cohort: **553**
- eligible: **551**
- excluded: **1**
- manual review: **1**
- schema/dependency drift: **false**
- controlled-demo global drift: **false**
- exact authorized partition match: **true**
- write guard passed: **true**

The transaction archived exactly **551** eligible clients using reversible status-only semantics. Hard deletion was not used. Protected records and dependencies remained untouched.

The archival transaction reached `COMMIT` and emitted `SHILOH_GATE2_ARCHIVE_COMMIT_COMPLETE`.

## Independent post-commit verification

A separate REPEATABLE READ READ ONLY verification ran at `2026-08-24 06:27:04.21542+00` / `2026-08-24 08:27:04.21542` SAST with SSL enabled and TLSv1.3.

It observed:

- committed archived count: **551**
- remaining active zero-history count: **2**
- committed marker count: **551**
- remaining active classifier: eligible **0**, excluded **1**, manual review **1**
- excluded primary reason: `active_durable_verification` = **1**
- manual-review primary reason: `phone_keyed_booking_or_lifecycle_state` = **1**
- schema/dependency drift: **false**
- controlled-demo global drift: **false**

The independent verification ended with `ROLLBACK` after reading committed state and emitted `SHILOH_GATE2_POST_COMMIT_READ_ONLY_VERIFY_ROLLBACK_COMPLETE` and `SHILOH_GATE2_ARCHIVE_AND_VERIFICATION_COMPLETE`. That verification rollback did not undo the already committed archival transaction.

## Durable result

Gate 2 is complete:

- **551** eligible imported zero-history clients are archived.
- **2** protected active zero-history clients remain: **1 excluded**, **1 manual review**.
- **0** of the remaining active cohort are eligible under the Gate 2 predicate.
- No hard deletion occurred.
- No schema/dependency or controlled-demo drift was detected.

Gate 1 archive-aware same-client reclaim/reactivation remains authoritative and unchanged. Migration 072, migration 074, controlled-demo semantics, premium first-contact exact-once behavior and Booking/Admin centralized identity authority remain preserved.

## Completed / do not redo

PR #425/#426, PR #427, PR #428, PR #429, PR #430, PR #431, Stage 1/Stage 2 preview, migrations 072/074, Gate 2 archival. Do not rerun the Gate 2 mutation.

## Remaining state

The one excluded record and one manual-review record remain active and untouched. Any future action on the manual-review record requires a separate controlled evidence/decision path.

External local Postgres access cleanup remains a project-closure task when that access is no longer required.
