# Shiloh OS — Reconciliation — Archive-aware Same-client Reclaim Gate 1

Date: 2026-08-23
Owning workstream: CRM & Identity
Control authorization: PR #428
Status: VERIFIED LIVE / IMPLEMENTATION COMPLETE / PRODUCTION ARCHIVAL NOT AUTHORIZED

## Scope

This unit implemented the Control-authorized Gate 1 archive-aware same-client reclaim/reactivation contract. It changes identity resolution and fresh-registration completion so one uniquely attributable archived `goldie_import` exact-phone owner can be reclaimed safely when there is no active exact-phone candidate.

This unit did **not** archive, delete, merge, bulk-update, trust-backfill, or otherwise mutate the assessed zero-history imported production cohort. It did not manufacture a real CRM/WhatsApp onboarding journey for proof.

PR #425 / #426 fresh-registration authority, PR #427 read-only archive assessment, migrations 072/074, controlled Juvan semantics, universal premium first-contact exact-once authority, and Booking/Admin centralized identity authority remain preserved and must not be redone.

## Implementation authority

Behavior PR: **#429 — Implement archive-aware same-client reclaim Gate 1**

Tested head:
`f70a52e9da2ad92c5cb83bdb4d28bd4e77296bfe`

Application merge / behavior authority:
`ee0006804c0e15d9d824388d7b282850ef5e3eb8`

Changed only:

- `src/services/clientVerifiedIdentity.js`
- `src/services/clientIdentityOnboarding.js`
- `tests/verified-client-authority.test.js`

No migration changed. No archive executor was introduced. No appointment, provenance, reconciliation, audit-link, or premium-welcome-ledger mutation logic was added.

## Live authority contract

The central resolver now preserves active exact-phone authority first and unchanged. Archive-aware consideration occurs only after no active exact-phone candidate exists.

The fallback inventories all non-active exact-phone owners before choosing any reclaim candidate. It therefore fails closed when more than one non-active canonical client owns the phone or when the single non-active owner is not the supported archived imported identity.

One unique `status='archived'`, `source='goldie_import'` candidate may enter `claim_required` only when:

- no active exact-phone candidate exists;
- no controlled-demo/Juvan authority applies;
- no other non-active client shares the exact phone;
- the archived imported candidate does not already carry active durable verification evidence.

Unsupported non-active ownership, multiple active candidates, multiple non-active candidates, durable-verification inconsistency, controlled-demo state, or any cross-client phone conflict fails closed.

Imported display name, DOB, gender and other imported identity values remain non-authoritative and are not seeded into the fresh claim session.

Fresh registration retains the archived canonical `client_id`. Completion locks exact-phone ownership and the canonical client inside one transaction. A valid archived Goldie claim is revalidated, the **same canonical client** is reactivated, freshly supplied identity fields are written, and active `client_identity_verifications` evidence is created using the existing `imported_claim_registration` method. Source/provenance and appointment history are not rewritten.

Any conflicting completion rolls back. The archived client therefore remains archived on failure. Unknown/new registration also fails closed when any retained exact-phone owner exists, preventing a duplicate active canonical client.

The onboarding authority version is now `verified_client_v2_archive_reclaim`, causing stale incomplete onboarding sessions to re-resolve under the current central authority contract rather than silently continuing stale assumptions.

The premium-welcome delivery ledger is untouched, preserving existing exact-once first-contact behavior. Booking/Admin continues to consume the centralized resolver.

## Regression evidence

GitHub CI:

- Workflow: CI #1299
- Run: `32659200086`
- Job: `97242662287`
- Node: 24.14.1
- `npm ci`: 174 packages added / 175 audited / 0 vulnerabilities
- Full non-mutating regression: **901 / 901 passed**
- failed: 0
- cancelled: 0
- skipped: 0

Gate-specific regression proves at minimum:

- active exact-phone behavior remains first and unchanged;
- multiple active candidates remain ambiguous;
- one archived Goldie candidate is considered only after no active candidate exists;
- multiple archived/non-active owners fail closed;
- unsupported non-active ownership fails closed;
- archived active-verification inconsistency fails closed;
- controlled Juvan remains outside archive fallback;
- imported identity values are not seeded as proof;
- the archived canonical client ID is retained;
- exact-phone ownership is locked and revalidated before reactivation;
- successful completion reactivates the same client and writes explicit verification evidence;
- conflicting completion is rollback-safe;
- duplicate creation is blocked;
- premium-welcome delivery state is not mutated;
- Booking/Admin still uses central resolver authority;
- migration 074 remains latest verification authority and contains no trust backfill.

## Render production verification

Auto-deploy occurred from the green PR #429 merge; no manual duplicate deploy was triggered.

Deploy:
`dep-da5k16gae00c73bcpu7g`

Exact commit:
`ee0006804c0e15d9d824388d7b282850ef5e3eb8`

Trigger: `new_commit`

Created: `2026-08-23T18:48:58.928356Z`
Finished: `2026-08-23T18:49:36.582735Z`
Status: **LIVE**

Build evidence:

- exact behavior merge checked out;
- Node 24.14.1;
- 174 packages installed / 175 audited;
- 0 vulnerabilities;
- build successful.

Startup evidence:

- migration 074: `appliedNow:false`, `checksumVerified:true`, original `appliedAt: 2026-08-22T12:00:38.253Z`;
- migrations 065/066/067/068/072 remained unreplayed and checksum-valid;
- controlled Juvan remained `BOUND`, current client 845, existing approval contract unchanged;
- Google Calendar provider health check passed;
- Shiloh started on port 10000;
- new production instance returned `/health` 200;
- bounded error-level logs after cutover were clean.

No production imported client was archived or reclaimed merely to prove the implementation.

## Archive-assessment boundary after Gate 1

The prior 553-client read-only snapshot and 552-client maximum potential-candidate ceiling remain historical assessment evidence only. Gate 1 being live does **not** convert 552 into a current eligible or authorized mutation count.

A fresh production read-only exact mutation preview is now required because identity/business dependencies may have changed since the assessment snapshot.

The next preview must compute the then-current eligible, excluded and manual-review sets under the live archive-aware authority and verify that every candidate remains free of durable verification, appointment history, controlled-demo state, active onboarding, exact-phone conflict, and unexpected business/operational dependencies while preserving provenance and communication evidence.

No current authorization permits an archival mutation.

## Recommendation and next owner

CRM recommends proceeding **now** to the bounded read-only preview because Gate 1 is verified live and this is the approved controlled sequence.

If Shiloh OS were CRM's own production system, CRM would not archive any record yet. It would obtain the fresh exact production preview and require a separate Control decision before any status mutation.

Next owner: **40 — Production & DevOps** for read-only evidence only. After that preview, **00 — Control & Reconciliation** owns the separate production archival decision.
