# Shiloh OS — Control Authorization — Archive-aware Reclaim Gate 1

Date: 2026-08-23
Owning implementation workstream: CRM & Identity
Future production evidence observer: Production & DevOps
Control owner: Control & Reconciliation
Status: AUTHORIZED FOR IMPLEMENTATION / PRODUCTION ARCHIVAL NOT AUTHORIZED

## Decision

Control authorizes Gate 1: a bounded archive-aware same-client reclaim/reactivation implementation for uniquely attributable archived/quarantined `goldie_import` exact-phone candidates.

This authorization is implementation-only. It does **not** authorize archiving any production CRM record, including the current maximum potential ceiling identified by the read-only assessment.

## Verified decision basis

Current `main` at decision time: `e98256b9a4c4f795aa40e9fe4c2873dbd6a1f91b`.

PR #427 records the completed read-only assessment:

- 553 active `goldie_import` clients with zero appointment rows;
- 1 has active `imported_claim_registration` verification and is excluded from any unverified archival candidate population;
- 552 is only a maximum potential-candidate ceiling, not a safe mutation count;
- current safe-to-mutate archival count under current code is 0;
- hard deletion is rejected;
- direct status archival under current PR #425 semantics would break same-client fresh registration by hiding the canonical client from active-only exact-phone resolution and then causing exact-phone ownership conflict on attempted duplicate creation.

## Required Gate 1 architecture

Implementation must preserve existing active-client authority first and unchanged.

Only when no active exact-phone candidate exists may the resolver consider one uniquely attributable archived/quarantined `goldie_import` candidate.

The archive-aware path must:

1. fail closed for multiple active candidates;
2. fail closed for multiple archived/quarantined candidates;
3. fail closed for cross-client exact-phone ownership conflict;
4. fail closed for controlled-Juvan drift/conflict;
5. fail closed for verification inconsistencies or other identity conflicts;
6. never disclose, compare, trust or seed imported display name, DOB, gender or other imported identity data;
7. carry the archived canonical `client_id` into the existing fresh governed registration contract;
8. on successful completion, atomically revalidate exact-phone ownership, reactivate the same canonical client, write freshly supplied canonical identity information, and write explicit active `client_identity_verifications` evidence;
9. preserve import/reconciliation/audit provenance, historical relationships and phone-keyed welcome-delivery state;
10. leave the record archived/quarantined on failed or conflicting completion through transaction rollback;
11. never create a duplicate active canonical client;
12. preserve the universal premium first-contact welcome exact-once semantics;
13. preserve Booking/Admin consumption of centralized identity authority.

## Archive mechanism requirement

Prefer a reversible auditable archive/quarantine contract with durable batch/member evidence rather than an opaque bulk status mutation. The Gate 1 implementation may introduce the minimum schema/code required for that reversible contract, subject to normal migration checksum and regression controls.

## Required regression

At minimum prove:

- active exact-phone candidates remain first authority and unchanged;
- one unique archived `goldie_import` candidate is discoverable only when no active candidate exists;
- multiple archived candidates fail closed;
- archived plus conflicting active/contact ownership fails closed;
- controlled Juvan semantics remain unchanged;
- fresh registration carries the archived canonical client ID;
- successful completion reactivates the same client atomically and writes explicit verification evidence;
- failed/conflicting completion rolls back and leaves the client archived;
- no duplicate active client is created;
- imported identity data is not disclosed, trusted or seeded;
- premium first-contact welcome remains exact-once;
- Booking/Admin centralized authority remains consistent.

## Sequence and later Gate 2

After Gate 1 is implemented, tested, merged, deployed and production-verified, Production & DevOps must run a **new bounded read-only exact production mutation preview**.

That preview must compute then-current eligible, excluded and manual-review sets and verify no new dependencies.

Only after that preview may Control make a **separate explicit decision** whether to authorize any production archival mutation.

## Explicit non-authorization / do not redo

This decision does not authorize:

- archiving any production client;
- deleting, merging, renaming or trust-backfilling imported clients;
- modifying the currently observed 552 potential-candidate ceiling into an assumed mutation set;
- replaying or weakening migrations 072 or 074;
- changing controlled Juvan semantics;
- weakening ambiguity/contact-ownership protection;
- manufacturing client, appointment or WhatsApp journeys merely for evidence.

PR #425 / #426 fresh-registration authority and PR #427 read-only assessment remain complete / do not redo.
