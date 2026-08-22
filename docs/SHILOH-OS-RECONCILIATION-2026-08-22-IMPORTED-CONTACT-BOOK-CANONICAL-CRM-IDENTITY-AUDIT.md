# Shiloh OS — Reconciliation — Imported Contact Book vs Canonical CRM Identity

Date: 2026-08-22
Owning workstream: CRM & Identity
Shared-state owner: Control & Reconciliation
Cross-workstream implementation consumer: Booking & Admin UX
Production evidence observer: Production & DevOps
Audit status: COMPLETE / VERIFIED READ-ONLY
Implementation gate: APPROVED — BOUNDED VERIFIED-CLIENT AUTHORITY CHANGE
Risk: HIGH — identity integrity / privacy / historical-record association / consent

## Scope

This reconciliation closes the read-only audit **Imported Contact Book vs Canonical CRM Identity** and ratifies the shared verified-client authority contract for the next implementation unit. It does not itself implement schema/application remediation and does not authorize bulk production CRM cleanup.

Preserve all newer unrelated authority on current `main`. At this reconciliation boundary the accepted overall application baseline is PR #409 / `696a2c669a3de7b21f8119f0786c707974c30ffd`, with later documentation/provider-health reconciliation through PR #412. PR #399 / `26ace1027e10f40e41d0f5d981e72f4a55a972c6` remains durable authority for the migration-072 normalized-phone ambiguity repair. Migration 072 is complete/do-not-redo. PR #395 remains durable authority for practitioner Google Calendar conflict classification.

## Production evidence safety

Production evidence snapshot: **2026-08-22 11:11:35.088085 UTC / 13:11:35 SAST**.

The approved Q1–Q11 production evidence pack executed through a bounded external PostgreSQL observation path with:

- authenticated PostgreSQL connection over **TLSv1.3**;
- production Postgres `shiloh-memory`;
- transaction explicitly verified `transaction_read_only = on` before the audit queries;
- Q1–Q11 executed unchanged;
- observation transaction ended with `ROLLBACK`;
- no `INSERT`, `UPDATE`, `DELETE`, DDL or side-effecting production mutation;
- no CRM, appointment, Google Calendar, WhatsApp/provider, Render environment or application mutation;
- no full normalized phone values retained in reconciliation evidence.

The earlier Render query-connector TLS capability gate is therefore **closed for this audit evidence unit**. The separately authorized database-specific single-IP external allowlist remains a bounded project-lifetime networking exception under PR #411 authority and must be removed and external access re-closed at final Shiloh OS project closure.

## Current production findings

For active `clients.source='goldie_import'`:

- **794** active imported-origin clients total.
- **776** have at least one mobile/WhatsApp phone.
- **553** have no appointment history; all 553 have a phone.
- **241** have appointment history, covering **530** appointment rows.
- Derived: **223** have both phone + appointment history.
- Derived: **18** have appointment history but no current mobile/WhatsApp phone.
- **776** imported-origin normalized-phone groups resolve to exactly one active canonical client.
- **0** imported-origin normalized-phone groups resolve to more than one active canonical client.
- **3** imported clients currently carry a WhatsApp contact.
- **4** imported clients have `verified_at` contact proxy evidence.
- **0** imported clients have `client_onboarding_sessions.state='complete'`.
- Q11 found no durable identity/onboarding/contact/claim/registration audit action for this cohort; the observed action was unrelated `admin.demo_booking_verified_for_cleanup` evidence only.
- Latest Goldie import batch is **ID 3 / completed**. Requested aggregate metadata fields are absent and must not be manufactured.

The exact-phone Linda trace remains **BLOCKED — NO PHONE ANCHOR**. No `Linda Dr` or display-name search was performed. The audit must not infer identity, canonical name, consent, DOB, gender, guardian status or verified registration from an imported address-book label.

## Authoritative interpretation

1. `clients.source='goldie_import'` and imported contact-book provenance are **not verified Shiloh identity authority**.
2. Exact-phone uniqueness is **candidate selection and duplicate/conflict protection**, not proof of identity, registration, consent, canonical name, DOB, gender or guardian status.
3. The **553** imported records with a phone and no appointment history form the current imported-contact-only/no-history cohort under the authoritative evidence snapshot.
4. The **223** imported records with both a phone and appointment history are historical imported clients requiring safer reconciliation; appointment history is not identity proof.
5. The **18** historical imported clients without a current mobile/WhatsApp phone do not have a phone-based claim path and require stronger/human verification when identity must be established.
6. **Zero** imported records are authoritatively proven by the current durable evidence to have completed genuine onboarding. Historical real-world registration may have occurred, but it cannot be inferred from absent durable evidence.
7. The **4 `verified_at` records are proxy/anomaly evidence only** and must not be grandfathered into verified-client authority merely because `verified_at` is populated.
8. `contact_type`, profile completeness, `clients.source`, appointment history and `verified_at` alone are each insufficient verified identity authority.

## Current application defect / shared-contract violation

The audit establishes a current identity-authority defect across CRM onboarding and Booking/Admin consumers:

- `identityOnboardingGuard` compares a claimant-supplied name to imported `clients.display_name`, seeds imported DOB/gender into onboarding, and can promote the contact after that match.
- `processClientIdentityMessage` can treat unique phone + profile completeness as `matched_complete`.
- `clientBookingIdentityGate` and `clientBookingCommit` independently use the same unique-phone + profile-complete authority.

Those paths allow imported address-book attributes/profile completeness to become de facto verified-client authority. That violates the ratified business rule that imported personal contacts are provenance/candidate data, not verified identity.

## Ratified verified-client authority contract

Control ratifies the following shared contract for CRM & Identity and every Booking/Admin consumer:

1. Preserve `clients.source` plus `external_records`, `external_client_records`, reconciliation history and original imported values as immutable provenance/audit evidence.
2. Add durable explicit client/contact verification evidence in the next available **forward migration**. Do not edit migration 072 or any historical applied migration.
3. Centralize one verified-client resolver and require CRM onboarding plus Booking & Admin UX identity gates/commit paths to consume that same authority rather than independently re-deriving identity from phone/profile fields.
4. **Imported contact unverified:** an exact phone may select exactly one candidate record, but the flow must not disclose or compare the imported label and must not seed imported DOB/gender. Collect canonical registration data afresh while preserving the existing client ID and all import provenance.
5. **Historical imported client:** preserve appointment/history linkage, but history is not identity proof. Where independent verification is insufficient, fail closed to stronger/human verification rather than silently claiming the historical record.
6. **Ambiguous/conflicting verification:** fail closed for human review.
7. **No match:** use normal registration.
8. Preserve exact-phone uniqueness, duplicate/contact ownership conflict protection and standing fail-closed canonical identity guards.
9. Do not treat imported display name, DOB, gender, appointment history, profile completeness, source, contact type or `verified_at` alone as verified identity authority.
10. Do not bulk delete, merge, archive, rename, rewrite, or trust-backfill imported records during the first repair.
11. Do not manually alter the four `verified_at` proxy/anomaly records under this approval.

## Approval decision

**APPROVED:** the Shiloh OS verified-client authority change.

Implementation authorization covers the bounded application/schema unit required to establish the ratified contract:

- forward migration for durable explicit verification evidence;
- centralized verified-client resolver;
- CRM onboarding changes so imported candidates collect canonical registration data afresh and never compare against or seed imported labels/demographics;
- preservation of existing canonical client IDs and original import provenance;
- historical/imported ambiguity fail-closed handling;
- Booking & Admin UX migration to the same resolver/authority contract;
- focused regression coverage plus full applicable non-mutating regression;
- CI, bounded PR, merge only when green;
- normal Render deployment/startup verification and production health/error verification;
- Project Tracker/Master reconciliation after implementation changes durable authority.

This approval **does not authorize**:

- bulk production CRM record remediation;
- deletion, merge, archive, rename or rewrite of imported clients;
- trust backfill of the 794 imported cohort;
- manual modification of the four `verified_at` proxy records;
- Linda record modification or display-name-based lookup;
- appointment, Google Calendar or WhatsApp/provider mutation merely for proof;
- weakening exact-phone duplicate/conflict protection.

Any later cohort remediation requires a separate evidence-based migration/remediation design and explicit authorization after the verified-client authority change is live and reconciled.

## Ownership and sequence

Implementation owner: **20 — CRM & Identity**.

Required shared-contract consumer: **10 — Booking & Admin UX**. Booking/Admin must not invent a separate identity rule; `clientBookingIdentityGate`, `clientBookingCommit` and any equivalent existing-client booking path must consume the centralized verified-client resolver/contract.

Production & DevOps remains deployment/evidence observer for normal CI/Render verification. Control & Reconciliation owns final shared-state reconciliation.

Priority: **DO NOW**, before further onboarding expansion. The required sequence is:

`current authority → forward schema evidence → centralized verified-client resolver → CRM onboarding integration → Booking/Admin consumer integration → focused tests → full regression → CI → bounded merge → Render verification → Tracker → Master → final specialist checkpoint`

Stop for contradictory authority, material scope expansion, a new production-data remediation requirement, or a genuine human/provider/security gate.

## Completed / do not redo

- The Q1–Q11 read-only production audit is complete.
- The earlier database observation tooling gate is complete for this audit.
- Do not reuse 2026-08-16 counts as if they were the 2026-08-22 snapshot.
- Do not rerun Q1–Q11 merely for reconciliation unless production evidence materially changes and a later decision requires a fresh snapshot.
- Migration 072 / PR #399 is complete/do-not-redo.
- PR #395 Calendar conflict classification is complete/do-not-redo.
- Linda remains unresolved until a legitimate exact-phone anchor is supplied; no display-name resolution is authorized.

## Continuation

The audit is **🟢 VERIFIED READ-ONLY / COMPLETE**. The next controlled unit is the approved **verified-client authority implementation** under CRM & Identity, with Booking & Admin UX as a mandatory shared-contract consumer. No bulk cohort remediation is authorized in that unit.