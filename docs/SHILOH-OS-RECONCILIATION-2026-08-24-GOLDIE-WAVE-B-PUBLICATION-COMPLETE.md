# Shiloh OS — Reconciliation — Goldie Wave B Publication Complete

Date: 2026-08-24
Owning workstream: 20 — CRM & Identity
Status: COMPLETE / VERIFIED LIVE / DO NOT REDO

## Authority

PR #447 is the exact Wave B publication authority. It approved exactly 15 claim-level descriptions for bounded publication, retained five scope/high-risk rows on HOLD, preserved all Wave C fail-closed gates, and retained the already-approved mechanical `Targated` → `Targeted` service-name correction for Goldie ID `2d5b6147-ee9f-4a97-8e27-6270751c2673`.

PR #442 is CLOSED / SUPERSEDED / DO NOT MERGE and remains drafting history only. PR #445/#446 and migration 075 remain Wave A COMPLETE / VERIFIED LIVE / DO NOT REDO.

Retained Goldie source authority remains `export (33).csv`, SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`.

## Wave B description implementation

PR #448 — `Publish Control-approved Goldie Wave B descriptions` — merged as:

`c5e1fe88855e634968524a7ba96b9d58235d5589`

Migration:

`076_goldie_wave_b_customer_descriptions.sql`

The implementation reuses the PR #445 guarded publication pattern:

- exact canonical key: `services.external_source='goldie'` + exact Goldie `external_id`;
- exactly 15 PR #447 target UUIDs are reachable;
- exact Control-approved strings are frozen byte-for-byte in focused tests;
- migration 076 requires transaction-local `PR447` authority, preventing generic `db:migrate` bypass;
- all 15 targets are locked and validated before the first update;
- source SHA, checksum, canonical identity/name lineage, expected current description, service status, public eligibility and mapping preconditions are verified;
- Toe Gel Application and Pressotherapy Single Session remain intentionally inactive, unmapped and non-bookable;
- the other 13 targets remain active/public-catalogue eligible;
- both Medi-Heel targets retain current Christel-only/client-bookable mapping;
- names, categories, prices, durations, booking notes, status and practitioner mappings are preserved by migration 076;
- every non-target service description is snapshotted and verified unchanged;
- no client, appointment, Calendar, WhatsApp or provider state is mutated.

## Mechanical Targeted Sports name correction

PR #449 — `Apply PR447 Targeted Sports name correction` — merged as:

`263b71653cdc73cacb4f8c993ccf352a06cbf97c`

Migration:

`077_goldie_targeted_sports_name_correction.sql`

Exact one-row change:

`Targated Area Specific Sports Massage` → `Targeted Area-Specific Sports Massage`

for Goldie ID:

`2d5b6147-ee9f-4a97-8e27-6270751c2673`

Migration 077 requires a separate transaction-local `PR447` authority marker. Its one-purpose bootstrap validates the exact canonical ID, prior-or-already-corrected name, already-live exact Wave B description, active/public eligibility and mappings before mutation; after mutation it verifies the exact target name while preserving the description, all non-name metadata, mappings and every non-target service name.

## CI evidence

Wave B publication PR #448 final CI:

- CI #1340
- workflow run `32717529842`
- job `97401843267`
- Node 24.14.1
- maintenance framework: 12/12 passed
- full regression: 926/926 passed
- 0 failed / 0 cancelled / 0 skipped
- npm audit: 0 vulnerabilities
- all seven Wave B exact-contract tests passed

Targeted Sports mechanical correction PR #449 final CI:

- CI #1342
- workflow run `32717980282`
- job `97403188699`
- Node 24.14.1
- maintenance framework: 12/12 passed
- full regression: 931/931 passed
- 0 failed / 0 cancelled / 0 skipped
- npm audit: 0 vulnerabilities
- all five correction-specific tests passed

## Production verification

### Wave B exact descriptions

Exact auto-deploy:

`dep-da61t61t0dsc73cri96g`

Exact commit:

`c5e1fe88855e634968524a7ba96b9d58235d5589`

Status: LIVE

Production guard evidence:

- migration `076_goldie_wave_b_customer_descriptions.sql`
- source SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`
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

### Targeted Sports mechanical correction

Exact auto-deploy:

`dep-da61vlk9v7es73fk7su0`

Exact commit:

`263b71653cdc73cacb4f8c993ccf352a06cbf97c`

Status: LIVE

Production guard evidence:

- migration `077_goldie_targeted_sports_name_correction.sql`
- `appliedNow=true`
- `checksumVerified=true`
- external ID `2d5b6147-ee9f-4a97-8e27-6270751c2673`
- target name `Targeted Area-Specific Sports Massage`
- `descriptionPreserved=true`
- `mappingsPreserved=true`
- `nonTargetNamesPreserved=true`
- applied at `2026-08-24T10:41:50.982Z`

The same startup reverified migration 076 idempotently with `appliedNow=false`, 15/15 exact descriptions, 13 active/public targets, 2 retained inactive/unmapped targets, mappings preserved and non-target descriptions preserved. The service reached LIVE after those guards.

The separate Render read-only PostgreSQL connector still has the known TLS integration defect and was not weakened. No generic SQL endpoint, arbitrary SQL route, startup dispatcher or broadened database permission was created.

## Holds preserved

No publication occurred for these five PR #447 HOLD rows:

- `367dbc36-5af0-43e3-a3ec-3e382cb4954a` — Lip Plump Treatment
- `c97eda93-c42f-471c-a1fc-5f35207c0c86` — GF Needling with Growth Factors under Local Anesthetic
- `c7b12afc-a0ba-497b-affb-ab03b2958a73` — VHC Standard Needling with Vitamins under Local Anesthetic
- `068c0963-27db-418c-ad44-3a10431076b7` — Pelvic floor strengthening
- `0c86a08f-68e9-49f6-a33d-6ff5bc9870ea` — intimate HIFU

Wave C remains fail closed: no Psoas missing-tail inference, Bamboo identity/copy inference, blank-description authoring, corrupted-source reconstruction, retired Sports Massage blank replacement, or practitioner personal-phone restoration.

## Completed / do not redo

Do not redo PR #447 wording decisions, PR #448/migration 076, PR #449/migration 077, Wave A PR #445/#446/migration 075, PR #392/#393 source comparison, PR #415/#436 exact-source-first policy, PR #440 matrix or PR #441 publication-wave decision.

Future verification must reuse migration checksums, exact ID/string contracts and this production evidence rather than rebuilding a publication mechanism.

## What this now enables

The exact Control-approved Wave B text is canonical CRM catalogue content. Thirteen active/publicly eligible services can use it immediately through existing CRM-backed catalogue consumers. Toe Gel and Pressotherapy retain their approved descriptions canonically while remaining intentionally inactive/unmapped/non-bookable. The targeted sports service now also carries the approved corrected canonical name `Targeted Area-Specific Sports Massage` without changing its Wave B description or booking authority.

This is directly usable catalogue state, not a general database-write capability. Future specialists can reuse the exact-ID/checksum/precondition/transaction/postcondition publication pattern for another explicitly authorized set; they must not create arbitrary SQL execution or weaken the Render TLS boundary.

JP no longer needs to manually copy, map, rename or verify these Wave B catalogue records. The production startup gates perform the exact target, source, status, eligibility, mapping, non-target and post-state verification automatically.

Remaining limitations are deliberate: the five scope/high-risk rows remain HOLD, all Wave C truth gates remain HOLD, and the separate Render read-only PostgreSQL connector TLS defect remains unresolved.

## Reconciliation status

Project Tracker reconciliation: final dated Wave B completion addendum included with this unit.

Master Status reconciliation: final dated Wave B VERIFIED LIVE addendum included with this unit because durable catalogue state changed.

## Next owner

00 — Control & Reconciliation owns the five held Wave B rows and Wave C only when new authoritative scope/source/clinical evidence becomes available. No further CRM publication action is authorized for those rows now.