# Shiloh OS — Reconciliation — Zero-history Imported CRM Archive Assessment

Date: 2026-08-23
Owning workstream: CRM & Identity
Evidence observer/executor: Production & DevOps
Status: READ-ONLY ASSESSMENT COMPLETE / ARCHIVAL MUTATION BLOCKED PENDING CONTROL DECISION

## Scope

This unit assessed active `goldie_import` clients with zero appointment rows to determine whether contact-book-only records can safely leave the active CRM. It did not authorize or perform archive, delete, merge, trust backfill, identity rewrite, provider mutation, appointment mutation, or WhatsApp evidence manufacture.

Fresh-registration authority from PR #425 / PR #426 remains complete and must not be redone. Migration 072 and migration 074 remain checksum-authoritative and must not be edited or replayed for this assessment.

## Production evidence

Read-only production snapshots were taken at `2026-08-23 17:57:21 UTC` and `2026-08-23 18:03:07 UTC`.

Safety controls:

- `transaction_read_only = on`
- SSL enabled / TLSv1.3
- both observation transactions ended with `ROLLBACK`
- no INSERT / UPDATE / DELETE / DDL
- no archival/delete/merge/update
- no names, full phone values, credentials, or client PII were returned into durable evidence

## Cohort and references

Active `source='goldie_import'` clients with zero appointment rows: **553**.

Contacts: **592** `client_contacts` rows covering all 553 clients:

- mobile: 551 rows / 551 clients
- WhatsApp: 2 rows / 2 clients
- email: 37 rows / 37 clients
- other: 2 rows / 2 clients

`verified_at` proxy rows: 2 WhatsApp rows / 2 clients. This remains proxy evidence only and is not durable identity authority.

Durable `client_identity_verifications` evidence:

- active `imported_claim_registration`: **1 row / 1 client**

That client is genuinely verified under migration-074 authority and is permanently excluded from any unverified contact-book-only archival candidate set.

`client_onboarding_sessions`: 0 rows for this cohort at the evidence snapshot.

Import/reconciliation provenance is retained for all 553 clients:

- `external_records`: 558 client references / 553 clients
- `client_reconciliation_history`: 558 rows / 553 clients
- `client_reconciliation_queue.resolved_client_id`: 558 rows / 553 clients
- `crm_audit_events` polymorphic client reference: 1 row / 1 client

The bounded schema inventory found no additional non-FK client-id-like columns.

No cohort references were found in loyalty rewards/redemptions, package entitlements/enquiries, customer-care preferences, or birthday-message delivery state. The `privacy_requests` table is not present in the current production schema.

Phone-keyed communication/conversation state:

- `client_whatsapp_welcome_deliveries`: 1 row / 1 client
- `conversation_sessions`: 0
- `customer_experience`: 0
- `user_profiles`: 0

Aggregate evidence does not prove whether the welcome-ledger client is the same client as the durably verified client.

## Delete versus archive conclusion

Hard deletion is rejected.

A hard delete would remove 592 contact rows, delete the durable verification row through cascade if the verified client were included, sever 558 reconciliation-history canonical links through `SET NULL`, sever 558 reconciliation-queue resolved-client links through `SET NULL`, and risk dangling polymorphic canonical IDs in external/audit records. Phone-keyed WhatsApp welcome state would survive detached from its canonical client.

A non-destructive status-based archive/quarantine preserves the canonical client row, contacts, verification evidence, import/reconciliation provenance, audit references, and phone-keyed communication state.

## Critical current-code gate

Current PR #425 identity resolution deliberately queries exact-phone candidates only where `clients.status='active'`. Current onboarding completion also requires an existing claim-session client to remain `status='active'` before updating it.

Therefore a direct status archive under current code is **not safe** for the business model just established:

1. a future genuine message from an archived imported contact would no longer resolve the preserved imported client as an exact-phone candidate;
2. onboarding would start as an apparent no-match with no retained `client_id`;
3. completion would attempt to create a new client;
4. the retained archived client's phone contact would then trigger the existing exact-phone ownership conflict guard;
5. the transaction would roll back and the person would be trapped in an identity-conflict/manual path rather than the governed PR #425 fresh-registration claim path.

The duplicate guard therefore prevents a persisted duplicate, but simple archival would still break the intended fresh-registration experience.

**Current safe-to-mutate archival count under current code: 0.**

## CRM eligibility judgment

After excluding the one durably verified client, **552 clients** remain as the maximum current unverified zero-history population for further archival eligibility. This is a potential-candidate ceiling, not a currently mutation-safe count and not an authorization to archive.

The single welcome-delivery row is presentation/delivery state, not identity authority or a business-reference reason to permanently keep a contact-book record active. CRM recommends preserving that ledger across archive/reactivation rather than treating it as an exclusion by itself. Because it is phone-keyed, it should continue to enforce the existing exact-once premium-welcome contract. This recommendation is pending the overall Control archive-model decision.

Proxy `client_contacts.verified_at` remains non-authoritative and is not by itself an exclusion. Active migration-074 verification evidence remains the authoritative exclusion.

Import/reconciliation provenance and audit references are preservation requirements, not reasons to hard-delete or sever the canonical client row.

## Recommended architecture — pending Control authorization

CRM recommends a two-gate non-destructive archive model.

### Gate 1 — archive-aware reclaim implementation before any cohort mutation

Implement a bounded archive-aware imported-claim path that preserves existing active-client semantics:

- active exact-phone candidates remain first authority and unchanged;
- multiple active candidates remain ambiguous/fail closed;
- only when no active candidate exists may one exact-phone archived/quarantined `goldie_import` candidate be considered;
- multiple archived candidates, cross-client phone ownership conflicts, controlled-Juvan matches/drift, active durable verification inconsistencies, or other identity conflicts fail closed;
- one safe archived imported candidate may enter the same fresh governed registration contract without imported name/DOB/gender disclosure, comparison, trust, or seeding;
- the onboarding session must retain that archived canonical `client_id`;
- successful governed completion must atomically revalidate exact-phone ownership, reactivate the same canonical client, write the fresh canonical identity details, write active `client_identity_verifications` evidence, and preserve provenance/history;
- failed or conflicting completion must roll back and leave the record archived;
- no duplicate active client may be created;
- universal premium first-contact welcome remains exact-once using the existing delivery ledger;
- Booking/Admin continues to consume the centralized verified-client authority.

The archive mechanism should be reversible and auditable. CRM recommends an explicit archive batch/member ledger or equivalently strong durable audit contract rather than destructive deletion or an opaque bulk status update.

### Gate 2 — exact production mutation preview and separate approval

Only after Gate 1 is implemented, green, merged, deployed, and verified should a new read-only production preview compute the exact mutation set at that time.

Final mutation predicate must fail closed and at minimum require:

- current `clients.status='active'`;
- `clients.source='goldie_import'`;
- zero appointment rows;
- no active `client_identity_verifications` evidence;
- no controlled-demo/Juvan binding or drift;
- no active/incomplete onboarding session;
- exact-phone ownership remains uniquely attributable to that client under the archive-aware resolver contract;
- no new durable business/operational dependency has appeared since this evidence snapshot;
- all import/reconciliation provenance links remain preservable;
- any unexpected identity, communication, package, loyalty, privacy, lifecycle, or other reference fails closed to exclusion/manual review.

The exact preview must report final eligible, excluded, and manual-review counts before any production status mutation.

A separate explicit Control authorization is required for the production archival mutation after that preview. No current evidence or recommendation authorizes the mutation.

## What CRM would choose

If Shiloh OS were CRM's own production system, CRM would:

1. reject hard deletion;
2. keep the one durably verified client active;
3. implement archive-aware same-client reclaim/reactivation before archiving any imported record;
4. preserve welcome-delivery state instead of treating it as identity authority;
5. preserve every import/reconciliation/audit link;
6. use a reversible status archive with a durable batch/member audit trail;
7. run a fresh exact production preview only after the reclaim code is live;
8. require a second explicit Control decision before executing the cohort mutation.

This should be done **later for the data mutation, but the archive-aware implementation decision should be made now**. Direct archival under current code should not be done at all.

## Control decision required

Next owner: **Shiloh OS — Control & Reconciliation**.

Control should decide whether to authorize Gate 1 as the next bounded CRM implementation unit. Gate 1 authorization must not be interpreted as authorization for Gate 2 production archival. If Gate 1 is approved, CRM & Identity owns implementation; Production & DevOps is the production evidence observer; Control remains the final mutation-authorization owner after the post-deploy read-only preview.
