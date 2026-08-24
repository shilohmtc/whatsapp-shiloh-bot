# Shiloh OS — Reconciliation — Single Imported Manual-review Remediation Complete

Date: 2026-08-24
Workstream: Production / DevOps
Business/data owner: CRM & Identity
Control authorization: PR #434
Status: VERIFIED PRODUCTION COMPLETE

## Authority

Control authorization PR #434 merged as `80d781a21e1789fd4c7674f943ec5d218d9b7b5a`. CI #1310 / run `32701054227` succeeded. Exact authorization deploy `dep-da5v201t0dsc73cp1adg` reached LIVE.

The decision basis remains PR #433 / merge `f7fdfa34a96bac0af54fcfa4d99fe1a2fad6c4fc`, which classified the sole protecting booking-intent state as demonstrably stale / non-authoritative.

Gate 2 remains COMPLETE / DO NOT REDO under PR #432. This unit did not reopen or extend the Gate 2 bulk archival.

## Exact live revalidation

The production write transaction began at `2026-08-24 07:32:54.94083 UTC` / `2026-08-24 09:32:54.940831 SAST` using SERIALIZABLE isolation, SSL enabled, TLSv1.3, and an exclusive advisory execution guard.

Before writes, the transaction proved:

- exactly one current manual-review record and exactly one exact phone-keyed target;
- primary reason `phone_keyed_booking_or_lifecycle_state`;
- schema/dependency surface stable;
- controlled-demo global state stable;
- one locked target client row, one locked stale booking-intent row, and one locked relevant contact row;
- zero target durable-verification rows, onboarding rows, canonical appointment rows, appointment-change intents, and appointment-lifecycle rows;
- active zero-history count remained 2 before mutation, including exactly one durable-verification exclusion;
- the exact stale booking-intent count was 1 and no additional target booking-intent rows existed;
- the existing Gate 2 archival marker still identified exactly 551 rows;
- no other phone-keyed operational state or welcome state had appeared;
- target was not controlled demo/Juvan;
- exact phone ownership remained one owner with zero conflicting owner rows;
- the exact authorization guard passed.

The stale row still matched the reconciled abandoned state required by PR #434.

## Authorized mutation result

Mutation timestamp: `2026-08-24 07:33:00.215502 UTC`.

The single transaction:

1. deleted exactly **1** stale `booking_intents` row; and
2. archived exactly **1** exact `goldie_import` client by reversible status semantics.

`exact_write_succeeded = true`.

Precommit verification proved:

- target archived marker count = 1;
- target booking-intent rows after delete = 0;
- existing Gate 2 551-row marker remained 551;
- remaining active zero-history count = 1;
- durable-verification exclusion count = 1;
- exact phone owner count = 1;
- conflicting phone owner rows = 0;
- Gate 1 archive-aware reclaim compatibility remained true;
- precommit verification passed.

The transaction then reached `COMMIT`.

## Independent post-commit verification

A separate READ ONLY / REPEATABLE READ verification ran at `2026-08-24 07:33:03.915362 UTC` / `2026-08-24 09:33:03.915362 SAST` over SSL/TLSv1.3.

It independently observed:

- exact client archived count = **1**;
- exact client row count = **1** — archived, not deleted;
- stale booking-intent rows remaining = **0**;
- existing Gate 2 marker rows = **551**;
- contact rows preserved = **1**;
- verification rows preserved = 0, unchanged;
- appointment rows preserved = 0, unchanged;
- onboarding rows preserved = 0, unchanged;
- appointment-change rows preserved = 0, unchanged;
- appointment-lifecycle rows preserved = 0, unchanged;
- durable-verification exclusion rows after = **1**;
- remaining active zero-history count = **1**;
- exact phone owner count after = **1**;
- conflicting phone owner rows after = **0**;
- Gate 1 reclaim compatibility after = true;
- postcommit verification passed.

The verification transaction ended with `ROLLBACK` after reading the already committed state. That rollback did not undo the remediation commit.

## Durable result

The sole stale-state manual-review remediation is complete:

- the abandoned booking-intent residue is gone;
- the exact imported client is archived, not deleted;
- canonical client identity and phone ownership remain preserved;
- the original Gate 2 551 archived clients remain untouched;
- the separate active durable-verification exclusion remains active and untouched;
- there is now exactly one remaining active zero-history imported record, the durable-verification exclusion;
- no hard client deletion, merge, identity rewrite, phone reassignment, trust backfill, Calendar mutation, provider messaging, migration edit/replay, or wider cohort mutation occurred.

Gate 1 archive-aware same-client reclaim/reactivation, migrations 072/074, controlled Juvan semantics, Booking/Admin centralized verified-client authority, premium first-contact exact-once behavior, provenance, contacts, audit/history references and verification authority remain preserved.

## Completed / do not redo

Do not rerun or reopen PR #425/#426/#427/#428/#429/#430/#431/#432/#433/#434, Stage 1/Stage 2, Gate 1, Gate 2, migrations 072/074, the PR #433 evidence query, or this exact-target remediation.

External local PostgreSQL `/32` access cleanup remains a project-closure dependency when that route is no longer required.