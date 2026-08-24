# Shiloh OS — Control Authorization — Single Imported Manual-review Remediation

Date: 2026-08-24
Control owner: Control & Reconciliation
Execution owner: Production & DevOps
Business/data owner: CRM & Identity
Status: AUTHORIZED FOR EXACT-TARGET REMEDIATION

## Decision

Control authorizes one bounded production remediation for the sole surviving imported Gate 2 manual-review target, subject to exact live fail-closed revalidation inside the same transaction that performs the write.

This authorization is deliberately narrower than Gate 2 and does not reopen or extend the completed bulk archival unit.

## Verified decision basis

Current GitHub `main` at decision time: `f7fdfa34a96bac0af54fcfa4d99fe1a2fad6c4fc`.

PR #433 records the completed CRM & Identity read-only evidence unit and business-authority judgment:

- Gate 2 remains COMPLETE / DO NOT REDO under PR #432.
- Exactly one active zero-appointment `goldie_import` manual-review target remains.
- The protecting state is one `booking_intents` row in `collecting`, created and last updated `2026-08-18 13:44:40.821885 UTC`.
- That row never progressed and has no service, preferred date, preferred time, practitioner preference, or policy acceptance.
- No `appointment_change_intents` row exists.
- No `appointment_lifecycle` row exists.
- No canonical appointment dependency exists.
- No active durable migration-074 verification exists.
- No onboarding state exists.
- No controlled Juvan/demo involvement exists.
- Exact-phone ownership was uniquely attributable with no other active or non-active owner.
- CRM & Identity classifies the protecting booking-intent state as demonstrably stale / non-authoritative.

PR #433 CI #1308 succeeded. Its exact documentation deploy `dep-da5uubu7bikc73c128t0` reached LIVE on merge `f7fdfa34a96bac0af54fcfa4d99fe1a2fad6c4fc`.

Control attempted an additional managed Render read-only observer query before this decision, but that connector failed TLS negotiation before any SQL executed. Therefore this authorization does not assume that the 08:54 SAST production snapshot is still unchanged. The execution transaction itself must independently revalidate every required predicate immediately before writes and must abort with zero mutation on any drift.

## Authorized transaction contract

Production & DevOps may execute only one transactionally guarded exact-target remediation.

Immediately before writes, the transaction must prove that the exact surviving manual-review target is still:

1. `clients.status='active'`;
2. `clients.source='goldie_import'`;
3. zero canonical appointments under the established Gate 2 rule;
4. uniquely phone-owned with exactly one usable normalized phone;
5. without any conflicting active or non-active phone owner;
6. outside controlled Juvan/demo state and without controlled-demo drift;
7. without active durable migration-074 verification;
8. without active, incomplete, or completed onboarding that changes identity authority;
9. without canonical booking/appointment dependency;
10. without `appointment_change_intents` state;
11. without `appointment_lifecycle` state;
12. without any new authoritative operational dependency that would make archival unsafe.

The exact protecting `booking_intents` row must still be the same stale abandoned state:

- status `collecting`;
- same created/updated timestamps as the reconciled evidence unless the executor proves an equivalent immutable row identity and unchanged state;
- service absent;
- preferred date absent;
- preferred time absent;
- practitioner preference absent;
- `policy_accepted_at IS NULL`;
- no progression or material change since the evidence observation.

Any drift, newly legitimate booking state, identity authority, lifecycle state, phone conflict, controlled-demo state, schema/dependency change, or ambiguity must fail closed and end with zero mutation.

## Authorized writes if every guard passes

Only if every live guard passes, Production & DevOps may, in the same transaction:

1. delete only the exact stale `booking_intents` row identified above; then
2. set only the same `goldie_import` client to the established reversible archived status.

The transaction must be all-or-nothing. A failure after deleting the intent but before archiving the client must roll back both changes.

## Required preservation

Preserve:

- canonical client ID;
- all `client_contacts` and phone ownership;
- `clients.source` and import provenance;
- external/import/reconciliation evidence;
- CRM audit/history references;
- all existing verification evidence;
- premium-welcome delivery state;
- any historical appointment/provenance authority;
- migrations 072 and 074 unchanged;
- Gate 1 archive-aware same-client reclaim/reactivation;
- premium first-contact exact-once behavior;
- centralized Booking/Admin verified-client authority;
- controlled Juvan semantics.

## Prohibited scope

This authorization does not permit:

- hard deletion of the client;
- merge or deduplication;
- identity rewrite;
- phone reassignment;
- trust backfill;
- mutation of the durable-verification exclusion;
- wider cohort archival;
- customer/provider messaging;
- WhatsApp mutation;
- Calendar mutation;
- manufactured customer journey or proof;
- edits/replay of migrations 072 or 074;
- unrelated application or production changes.

## Post-commit verification and reconciliation

After a successful commit, Production & DevOps must independently verify the committed post-state in a separate read-only transaction and report sanitized aggregate/exact-target evidence only.

At minimum verify:

- the stale `booking_intents` row is gone;
- the exact client is archived, not deleted;
- contacts and canonical phone ownership remain preserved;
- no new conflicting phone owner exists;
- no protected verification/onboarding/appointment/lifecycle state was altered;
- Gate 1 reclaim/reactivation remains compatible with the archived client;
- Gate 2's 551 archived records and the one durable-verification exclusion remain untouched;
- no unintended row-count or dependency drift occurred.

Then reconcile the exact result into the Project Tracker and Master Status where required.

## Completed / do not redo

Do not rerun or reopen:

- PR #425/#426/#427/#428/#429/#430/#431/#432;
- Stage 1 / Stage 2 previews;
- Gate 1;
- Gate 2;
- migrations 072/074;
- PR #433 read-only evidence query.

This authorization is for the one stale-state remediation only.
