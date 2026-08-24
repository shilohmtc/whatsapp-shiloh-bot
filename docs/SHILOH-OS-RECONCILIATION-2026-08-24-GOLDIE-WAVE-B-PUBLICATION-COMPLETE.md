# Shiloh OS — Reconciliation — Goldie Wave B Publication Complete

Date: 2026-08-24
Owning workstream: 20 — CRM & Identity
Status: COMPLETE / VERIFIED LIVE / DO NOT REDO

## Authority

PR #447 is the exact Wave B publication authority. It approved exactly 15 claim-level descriptions for bounded CRM publication and retained five scope/high-risk rows on HOLD. PR #442 is CLOSED / SUPERSEDED / DO NOT MERGE and remains drafting history only.

PR #441 remains background Wave A/B/C authority. PR #445/#446 and migration 075 remain Wave A COMPLETE / VERIFIED LIVE / DO NOT REDO.

Retained Goldie source authority remains `export (33).csv`, SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`.

## Implementation

PR #448 — `Publish Control-approved Goldie Wave B descriptions` — merged as:

`c5e1fe88855e634968524a7ba96b9d58235d5589`

Migration:

`076_goldie_wave_b_customer_descriptions.sql`

The implementation reuses the PR #445 guarded publication pattern and is deliberately bounded:

- exact canonical key is `services.external_source='goldie'` + exact Goldie `external_id`;
- canonical publication field is `services.customer_description`;
- exactly 15 PR #447 target UUIDs are reachable;
- migration 076 requires transaction-local `PR447` authority, so generic `db:migrate` cannot bypass the guarded bootstrap;
- the one-purpose bootstrap locks and validates all 15 targets before the first update;
- source SHA, migration checksum, canonical name lineage, expected current description, service status, public eligibility and mapping preconditions are checked before mutation;
- Toe Gel Application and Pressotherapy Single Session are intentionally retained inactive, unmapped and non-bookable;
- the other 13 targets must remain active/public-catalogue eligible;
- both Medi-Heel targets must remain Christel-only/client-bookable;
- names, categories, prices, durations, booking notes, status and practitioner mappings are preserved;
- every non-target service description is snapshotted and verified unchanged;
- no client, appointment, Calendar, WhatsApp or provider state is mutated.

The Wave B migration changes descriptions only. It does not perform the separately referenced `Targated` → `Targeted` service-name correction; no service-name mutation was required or inferred in this bounded description publication.

## Exact publication result

Production startup emitted the guarded Wave B verification event after the exact production transaction:

- migration: `076_goldie_wave_b_customer_descriptions.sql`
- source SHA-256: `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`
- `appliedNow=true`
- `checksumVerified=true`
- `targetCount=15`
- `exactDescriptionCount=15`
- `activePublicCatalogueTargetCount=13`
- `retainedInactiveTargetCount=2`
- `retainedInactiveUnmappedTargetCount=2`
- `mappingsPreserved=true`
- `nonTargetDescriptionsPreserved=true`
- applied at `2026-08-24T10:36:31.256Z`

The exact Control-approved wording is frozen by `tests/goldie-wave-b-publication.test.js`, which compares all 15 parsed migration descriptions byte-for-byte against the PR #447 contract.

## CI

Final implementation CI:

- CI #1340
- workflow run `32717529842`
- job `97401843267`
- Node `24.14.1`
- maintenance framework: 12/12 passed
- full regression: 926/926 passed
- 0 failed / 0 cancelled / 0 skipped
- npm audit: 0 vulnerabilities

All seven new Wave B contract tests passed.

## Render / production proof

Exact auto-deploy:

`dep-da61t61t0dsc73cri96g`

Exact commit:

`c5e1fe88855e634968524a7ba96b9d58235d5589`

Status: LIVE

Started: `2026-08-24T10:36:08.231044Z`
Finished: `2026-08-24T10:36:37.074333Z`

The Wave B guard verified the production CRM post-state before application startup. `Shiloh started` followed at `2026-08-24T10:36:33.88873696Z`. A bounded post-cutover error query returned no error-level logs.

The strongest live catalogue evidence is the production bootstrap post-state query itself: it re-reads all 15 exact canonical Goldie UUIDs after mutation, verifies every exact `customer_description`, verifies 13 active/publicly eligible targets, verifies Toe Gel and Pressotherapy remain inactive/unmapped/non-bookable, verifies Medi-Heel current ownership and verifies mappings/non-target descriptions remain unchanged before the service accepts traffic.

The external Render read-only PostgreSQL connector continues to have the known TLS integration defect and was not weakened. No general SQL endpoint or arbitrary production write capability was created.

## HOLD / Wave C preservation

No publication occurred for these five PR #447 HOLD rows:

- `367dbc36-5af0-43e3-a3ec-3e382cb4954a` — Lip Plump Treatment
- `c97eda93-c42f-471c-a1fc-5f35207c0c86` — GF Needling with Growth Factors under Local Anesthetic
- `c7b12afc-a0ba-497b-affb-ab03b2958a73` — VHC Standard Needling with Vitamins under Local Anesthetic
- `068c0963-27db-418c-ad44-3a10431076b7` — Pelvic floor strengthening
- `0c86a08f-68e9-49f6-a33d-6ff5bc9870ea` — intimate HIFU

Wave C remains fail closed: no Psoas missing-tail inference, Bamboo identity/copy inference, blank-description authoring, corrupted-source reconstruction, retired Sports Massage blank replacement, or practitioner personal-phone restoration.

## Completed / do not redo

Do not redo this Wave B publication, migration 076, PR #447 wording decision, PR #448 implementation, Wave A PR #445/#446/migration 075, PR #392/#393 source comparison, PR #415/#436 exact-source-first policy, PR #440 matrix, or PR #441 publication-wave decision.

Future verification should reuse migration-076 checksum, exact 15-ID contract, PR #447 wording fixture, guarded bootstrap and this production evidence rather than rebuilding a publication mechanism.

## What this now enables

The exact Control-approved Wave B descriptions are now canonical CRM customer descriptions. Thirteen active/publicly eligible services can use the new text through existing CRM-backed catalogue consumers immediately. Toe Gel and Pressotherapy also retain their approved descriptions canonically while remaining intentionally inactive and unavailable for booking.

This is directly usable catalogue state, not a general database-write capability. Future specialists can reuse the existing exact-ID/checksum/precondition/transaction/postcondition publication pattern for another explicitly authorized set; they must not create arbitrary SQL execution or weaken the Render TLS boundary.

JP no longer needs to manually copy, map or verify these 15 Wave B descriptions. The production startup gate performs exact target, source, status, eligibility, mapping, non-target and post-description verification automatically.

Remaining limitations are deliberate: the five scope/high-risk rows remain HOLD, all Wave C truth gates remain HOLD, and the separate Render read-only PostgreSQL connector TLS defect remains unresolved.

## Reconciliation status

Project Tracker reconciliation: dated Wave B completion addendum included with this unit.

Master Status reconciliation: dated Wave B VERIFIED LIVE addendum included with this unit because durable production catalogue content changed.

## Next owner

00 — Control & Reconciliation owns the held Wave B rows and Wave C only when new authoritative scope/source/clinical evidence is available. No further CRM publication action is authorized for those rows now.