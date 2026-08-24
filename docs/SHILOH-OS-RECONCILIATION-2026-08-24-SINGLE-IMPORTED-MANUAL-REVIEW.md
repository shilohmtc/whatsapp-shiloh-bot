# Shiloh OS — Reconciliation — Single Imported Manual-review Record

Date: 2026-08-24
Workstream: CRM & Identity
Status: READ-ONLY EVIDENCE COMPLETE / REMEDIATION REQUIRES CONTROL AUTHORIZATION

## Authority

Gate 2 remains COMPLETE / DO NOT REDO under PR #432 / merge `ee0c9dc755468ea4fc47d1896da1b8a6948bfa3c`.

This is a separate bounded evidence unit for the one remaining active zero-appointment `goldie_import` record classified `phone_keyed_booking_or_lifecycle_state`.

No mutation was authorized or performed.

## Read-only production evidence

Production / DevOps completed a bounded observation at `2026-08-24 06:54:39.713519 UTC` / `2026-08-24 08:54:39.71352 SAST` against `shiloh_memory` using:

- `transaction_read_only = on`
- repeatable-read isolation
- SSL enabled
- TLSv1.3 / TLS_AES_256_GCM_SHA384
- terminal `ROLLBACK`

The exact existing Stage 2 selector proved one current manual-review target, stable dependency/schema surface, stable controlled-demo state, no active durable migration-074 verification, no active/incomplete or completed onboarding, unique normalized phone ownership, no other active or non-active phone owner, and no controlled Juvan/demo involvement.

No client name, full phone, or imported profile value was returned.

## Operational-state finding

### booking_intents

Exactly one phone-keyed row is the protecting state:

- status: `collecting`
- created_at: `2026-08-18 13:44:40.821885 UTC`
- updated_at: `2026-08-18 13:44:40.821885 UTC`
- service: absent
- preferred date: absent
- preferred time: absent
- practitioner preference: absent
- `policy_accepted_at`: null

At observation it was approximately 5 days 17 hours old and had never progressed after creation.

### appointment_change_intents

No row exists. There is no cancellation/reschedule/change workflow and no current/upcoming actionable canonical appointment dependency.

### appointment_lifecycle

No rows exist. There is no future reminder obligation, completed follow-up obligation, canonical appointment linkage, or other executable lifecycle dependency.

### Premium welcome

No matching premium-welcome state exists. Premium-welcome state is not identity or booking/lifecycle authority.

## CRM & Identity business judgment

The remaining `phone_keyed_booking_or_lifecycle_state` protection is **demonstrably stale / non-authoritative**.

The only protecting state is an empty, never-progressed `booking_intents` row in `collecting`. It is unsupported by appointment-change state, lifecycle state, canonical appointment state, onboarding, durable identity verification, controlled-demo authority, or conflicting phone ownership.

This stale technical residue does not establish a legitimate current operational reason to keep the imported client active.

## Recommended controlled remediation

CRM & Identity recommends a narrow, exact-target remediation under separate Control & Reconciliation authorization:

1. Revalidate the exact target and all safety predicates immediately before writes in one transaction.
2. Require the protecting `booking_intents` row still to be the same stale empty `collecting` state and still unsupported by current booking/lifecycle/identity authority.
3. Delete only that exact stale booking-intent row.
4. Archive only the same exact `goldie_import` client using the same reversible status-only semantics used by Gate 2.
5. Preserve contacts, provenance, appointment history, audit references, verification evidence, welcome state, and Gate 1 archive-aware same-client reclaim/reactivation.
6. Fail closed on any drift, new onboarding, verification, appointment, lifecycle/change state, phone-ownership conflict, controlled-demo membership, or changed booking-intent content/status.
7. No hard deletion, merge, identity rewrite, phone reassignment, trust backfill, customer message, Calendar mutation, or provider mutation.

If Shiloh OS were my own project, I would do this remediation now rather than leave a known stale workflow artifact indefinitely protecting an otherwise eligible imported record. The material risk is accidental removal of newly legitimate state; that is controlled by exact live revalidation and fail-closed transactional guards. The cost of leaving the stale residue is ongoing false-positive retention and ambiguity in the imported-contact cleanup boundary.

## Current gate

No current authority permits the remediation mutation.

Owning decision workstream: **00 — Control & Reconciliation**.

CRM & Identity has completed the business-authority judgment. Control must separately authorize or reject the exact mutation contract above before any production write occurs.

## Completed / do not redo

Do not rerun:

- PR #425/#426/#427/#428/#429/#430/#431/#432
- Stage 1 / Stage 2 previews
- Gate 1
- Gate 2
- migrations 072/074
- this single-record read-only evidence query

Gate 2 remains complete and untouched.
