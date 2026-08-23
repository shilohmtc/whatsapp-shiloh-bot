# Shiloh OS — Reconciliation — Imported Fresh Registration

Date: 2026-08-23
Owning workstream: CRM & Identity
Status: VERIFIED LIVE / COMPLETE

## Authoritative outcome

PR #425 implements the authorized fresh governed-registration path for an ordinary single exact-phone `goldie_import` candidate without explicit verification, including a candidate with legitimate appointment history.

Legacy Goldie/contact-book provenance remains non-authoritative identity data. Appointment history remains legitimate historical relationship data but is not identity proof and no longer forces an otherwise ordinary single imported candidate into the `historical_unverified` human-verification dead end.

An unverified imported candidate now resolves to `claim_required` whether or not appointment history exists. The existing governed onboarding path then collects canonical registration data afresh without disclosing, comparing, trusting or seeding imported display name, DOB or gender.

## Preserved authority

The change is deliberately narrower than removing `historical_unverified` globally.

- Non-imported historical clients without explicit verification remain `historical_unverified` and fail closed to human verification.
- Explicit active `client_identity_verifications` evidence still has priority and genuinely verified imported/historical clients remain verified.
- Multiple active exact-phone candidates remain `ambiguous` and fail closed before claim flow.
- Conflicting exact-phone contact ownership remains fail closed under the existing all-row `FOR UPDATE` guard.
- Controlled Juvan binding remains accepted independent authority; Juvan drift/conflict remains manual review.
- Booking/Admin continues to consume the centralized verified-client authority through the existing compatibility resolver.
- Migration 072 is untouched and remains checksum authority for normalized-phone ambiguity repair.
- Migration 074 is untouched and remains the explicit verification-evidence authority.
- Universal premium first-contact presentation from PR #419 remains exact-once through the existing v2 welcome-delivery ledger.

## Same-client registration semantics

No new persistence path or migration was introduced. Existing governed onboarding already provides the required safe completion behavior:

1. A claim session carries the resolved canonical `client_id`.
2. Completion locks and updates that active client rather than inserting a duplicate when `client_id` exists.
3. Freshly supplied name, DOB and gender become canonical on that retained client.
4. Existing `clients.source` is preserved as provenance; completion does not rewrite appointment rows.
5. All exact-phone mobile/WhatsApp contacts are locked and ownership conflicts fail closed.
6. Goldie/imported completion writes explicit `client_identity_verifications` evidence using `imported_claim_registration` and writes `client.identity_verified` audit evidence.
7. Historical appointments therefore remain linked to the same canonical client ID.
8. Future resolution can use the new explicit verification evidence as verified returning-client authority.

## GitHub and regression evidence

Implementation PR: #425 — Allow fresh registration for unverified imported clients

- inspected base/current authority before implementation: `65cbc3dd5db751da670b623d50a66b79ac9209d0`
- tested implementation head: `4fe76256508c857f1158c61be953802c79cb1d65`
- merge/application authority: `30a15eac45f37baf8f89b7a22d60f513545bab09`
- CI: #1292
- workflow run: `32639022401`
- job: `97193114857`
- Node: 24.14.1
- full non-mutating regression: 893/893 passed
- failed: 0
- cancelled: 0
- skipped: 0

Focused regression proves:

- imported exact phone + appointment history + no explicit verification -> `claim_required`;
- imported exact phone + no history -> `claim_required`;
- verified imported historical client remains verified;
- non-imported historical client without explicit evidence remains fail closed;
- multiple active exact-phone clients remain ambiguous;
- imported labels cannot promote identity and imported DOB/gender are not seeded;
- governed completion reuses the canonical client, preserves source provenance and does not rewrite appointments;
- explicit verification evidence is written on the retained client;
- exact-phone ownership protection remains fail closed;
- Booking/Admin continues to inherit centralized resolver authority;
- controlled Juvan behavior remains unchanged;
- premium first-contact regression remains exact-once.

## Production evidence

Render application auto-deploy: `dep-da5eagu7bikc73bjrqb0`

- exact application commit: `30a15eac45f37baf8f89b7a22d60f513545bab09`
- trigger: `new_commit`
- status: LIVE
- finished: `2026-08-23T12:19:42.739162Z`
- Node 24.14.1 build succeeded; dependency audit found 0 vulnerabilities.
- migration 074 startup evidence: `appliedNow=false`, `checksumVerified=true`, original applied timestamp preserved.
- migrations 065/066/067/068/072 reverified checksum-valid and unreplayed.
- controlled Juvan remained BOUND with the existing primary/backup first-decision-wins approval contract.
- Google Calendar provider health check passed.
- `Shiloh started` on port 10000.
- new instance returned repeated `/health` HTTP 200.
- bounded post-cutover error-level log query returned no errors.

No real client onboarding, CRM mutation, appointment, Calendar event or WhatsApp journey was manufactured merely for evidence.

## Explicit non-scope / DO NOT REDO

Do not:

- bulk archive/delete/merge the imported cohort;
- backfill verification/trust;
- use imported identity fields as verification questions;
- treat appointment history as identity proof;
- edit or replay migration 072;
- edit migration 074 or weaken verification evidence;
- re-run PR #425 implementation or deployment merely for reconciliation;
- manufacture a customer journey for proof.

The imported zero-history/contact-book-only archival question remains a separate read-only assessment. No archival authority is granted by this reconciliation.

## Recommendation

Keep this implementation exactly as shipped. It is the narrowest safe convergence: imported provenance is claimable through fresh registration, while non-imported historical uncertainty and every genuine conflict remain fail closed.

The separate zero-history imported-contact population assessment should be performed next as read-only CRM analysis before any archival decision. No bulk archive action should occur without a later explicit Control decision based on that evidence.
