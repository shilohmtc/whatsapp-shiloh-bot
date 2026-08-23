# Shiloh OS — Master Status Addendum — Zero-history Imported Archive Assessment

Date: 2026-08-23
Status: READ-ONLY ASSESSMENT COMPLETE / ARCHIVAL MUTATION NOT AUTHORIZED

This bounded addendum supplements `docs/SHILOH-OS-MASTER-STATUS.md` without replacing unrelated Master authority.

## Durable CRM conclusion

Production read-only evidence identified **553** active `goldie_import` clients with zero appointment rows. Exactly **1** client has active migration-074 `client_identity_verifications` evidence using `imported_claim_registration` and must remain outside any unverified contact-book-only archival candidate set. The remaining **552** clients are a maximum potential-candidate ceiling, not a currently safe mutation set.

Hard deletion is not an acceptable archival model. It would delete contact rows, could delete durable verification evidence, sever canonical reconciliation links, leave polymorphic provenance/audit references vulnerable to dangling canonical IDs, and detach phone-keyed communication state from the canonical row.

A reversible status-based archive/quarantine model is preferred because it preserves the canonical client ID, contacts, import/reconciliation provenance, audit linkage, identity-verification evidence and phone-keyed communication state.

## Current implementation gate

PR #425 remains the durable fresh-registration authority and must not be redone. Its central exact-phone resolver only considers clients with `status='active'`, and its existing-client onboarding completion requires the claim-session client to remain active.

Accordingly, directly archiving an unverified imported client under current code would remove that canonical record from exact-phone candidate resolution. A future genuine message would begin as a no-match; onboarding would then attempt a new client and encounter the preserved archived client's exact-phone ownership during the existing all-row contact lock. The transaction would roll back into identity conflict rather than reclaim the preserved client.

Therefore **the current safe-to-mutate archival count is 0**. The duplicate guard still prevents an unsafe persisted duplicate, but direct archival would break the intended PR #425 fresh-registration path.

## Recommended future architecture — not yet authorized

Before any imported cohort status mutation, CRM recommends a bounded archive-aware same-client reclaim/reactivation path:

- preserve existing active exact-phone resolution first;
- only when no active candidate exists may one uniquely owned archived/quarantined `goldie_import` exact-phone candidate be considered;
- ambiguity, cross-client contact ownership, controlled-Juvan conflict/drift and verification inconsistency remain fail closed;
- imported name/DOB/gender are never disclosed, compared, trusted or seeded;
- the archived canonical client ID is carried through fresh governed registration;
- successful completion atomically reactivates the same client, writes fresh canonical identity fields and explicit verification evidence, and preserves provenance/history;
- failed completion leaves the record archived;
- no duplicate active client may be created;
- universal premium first-contact delivery state remains preserved and exact-once;
- Booking/Admin continues to consume the centralized resolver.

The archive mechanism should be reversible and auditable, preferably with a durable batch/member ledger rather than an opaque bulk status change.

After that implementation is green, merged, deployed and verified, Production & DevOps must run a fresh read-only exact mutation preview. Only then may Control consider a separate explicit approval for an actual archival mutation.

## Preserved authority / do not redo

- PR #425 / PR #426 fresh registration remains complete.
- Migration 072 remains checksum authority and must not be edited/replayed.
- Migration 074 remains explicit verification-evidence authority and must not be edited/replayed.
- `client_contacts.verified_at` remains proxy evidence only.
- The one durably verified zero-history imported client remains excluded from an unverified archive set.
- Hard deletion remains rejected.
- No archive/delete/merge/trust backfill is authorized by this addendum.

## Next governance action

Control & Reconciliation owns the architecture/priority decision on whether to authorize the archive-aware reclaim implementation as the next bounded CRM unit. Authorization of that implementation must not be interpreted as authorization for the later production archival mutation.