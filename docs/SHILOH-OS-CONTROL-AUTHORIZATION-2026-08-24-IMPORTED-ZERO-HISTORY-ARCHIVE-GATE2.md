# Shiloh OS — Control Authorization — Imported Zero-history Archive Gate 2

Date: 2026-08-24
Owning execution workstream: Production & DevOps
Business/data owner: CRM & Identity
Control owner: Control & Reconciliation
Status: AUTHORIZED FOR BOUNDED PRODUCTION ARCHIVAL / FAIL-CLOSED LIVE PREDICATE REQUIRED

## Decision

Control authorizes a bounded, reversible production archival mutation for the current zero-appointment `source='goldie_import'` cohort, but only through the exact live fail-closed eligibility predicate proven by the completed post-Gate-1 production preview.

This authorization is **not** for a static list of 551 client IDs. The observed 551 eligible count is current evidence only. The execution transaction must recompute the same predicate against live production state immediately before writes and must abort without mutation if any required count, schema, dependency, verification, onboarding, controlled-demo/Juvan, phone-ownership, or other guard has drifted.

## Verified decision basis

Post-Gate-1 bounded read-only production preview completed at 2026-08-24 06:01:08.912987 UTC / 08:01:08.912987 SAST with:

- `transaction_read_only = on`;
- repeatable-read isolation;
- SSL/TLS enabled using TLSv1.3;
- transaction ended with `ROLLBACK`;
- no write, DDL, archive, delete, merge, trust-backfill, or outbound messaging.

Exact current production partition at preview time:

- active zero-appointment `goldie_import` cohort: 553;
- eligible: 551;
- excluded: 1;
- manual review: 1;
- counts reconcile exactly: 551 + 1 + 1 = 553.

The exclusion is one client with active durable verification authority. The manual-review client is held because of phone-keyed booking/lifecycle state. No current exact-phone ambiguity, cross-client phone ownership, unusable phone, multi-phone-key, controlled-demo/Juvan membership, global controlled-demo drift, onboarding, or schema/dependency drift was observed in the cohort.

The previous 552 historical ceiling is superseded by this preview and must not be used as a mutation target.

## Required mutation contract

Execution must preserve the following controls:

1. Recompute the full eligibility partition inside the production archival transaction immediately before writes.
2. Do not use a stale static client-ID list or assume that 551 remains eligible.
3. Require current `clients.status='active'`, `clients.source='goldie_import'`, and zero appointment rows for every candidate.
4. Exclude any client with active durable `client_identity_verifications` evidence.
5. Exclude any client with controlled-demo/Juvan binding, drift, conflict, or related state.
6. Exclude any active/incomplete onboarding state.
7. Require exact-phone ownership to remain uniquely attributable under the live archive-aware Gate 1 resolver contract.
8. Exclude/manual-review any unexpected booking/lifecycle, audit, communication, package, loyalty, privacy, identity, or other durable business dependency.
9. Abort if schema/dependency inventory, relevant phone surfaces, formal FK state, possible client-reference surfaces, or relevant-table inventory has drifted from the verified preview contract.
10. Preserve all contacts, import/reconciliation provenance, audit references, phone-keyed premium-welcome state, and historical canonical client IDs.
11. Archive by reversible status/quarantine semantics only. Hard deletion remains prohibited.
12. Do not modify names, DOB, gender, verification evidence, appointment rows, welcome-delivery state, or controlled-Juvan state as part of archival.
13. Preserve the Gate 1 archive-aware same-client reclaim/reactivation path so a future genuine contact may reclaim the same canonical archived client through fresh governed registration.
14. Preserve universal premium first-contact exact-once semantics and Booking/Admin centralized identity authority.
15. Perform post-mutation aggregate verification before commit/closure and report exact archived, excluded, manual-review, and unchanged cohort counts.
16. If any assertion fails, roll back the archival transaction and report the gate instead of partially archiving the cohort.

## Explicitly excluded from authorization

This decision does not authorize:

- archival of the one durable-verification exclusion;
- archival of the current manual-review client;
- archival based on the stale historical 552 ceiling;
- hard deletion;
- merge/deduplication;
- trust backfill;
- identity rewriting;
- changing migration 072 or 074;
- changing controlled Juvan semantics;
- changing premium first-contact authority;
- manufacturing customer/provider evidence;
- unrelated production or application mutations.

## Required execution and reconciliation sequence

1. Production & DevOps independently re-read current `main`, Engineering Governance, PR #429/#430 Gate 1 reconciliation, and this Control authorization.
2. Re-establish secure production SQL session with TLS and verify the intended write transaction scope and guards.
3. Recompute the live partition and assertions inside the bounded archival transaction.
4. If the live partition/guards differ materially from the authorized predicate, `ROLLBACK` and return to Control without archiving.
5. If all guards pass, archive only records still classified eligible.
6. Preserve excluded and manual-review records unchanged.
7. Perform post-mutation aggregate verification.
8. Reconcile exact production evidence through Project Tracker and Master Status where durable state changed.
9. Return the final result to CRM & Identity and Control & Reconciliation.

## Preserved / do not redo

- PR #425/#426 fresh registration;
- PR #427 zero-history read-only assessment;
- PR #428 Gate 1 Control authorization;
- PR #429 Gate 1 archive-aware reclaim implementation;
- PR #430 Gate 1 reconciliation;
- migrations 072/074;
- controlled Juvan semantics;
- universal premium first-contact authority;
- completed Stage 1/Stage 2 production preview.

## Control recommendation

Proceed now with the bounded reversible archival transaction under the live fail-closed predicate. Do not wait merely because the observed eligible count is large: the safety control is the predicate, transaction assertions, reversibility, and preserved same-client reclaim path—not the static count.