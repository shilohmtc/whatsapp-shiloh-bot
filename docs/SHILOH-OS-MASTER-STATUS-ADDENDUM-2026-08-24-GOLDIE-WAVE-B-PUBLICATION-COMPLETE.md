# Shiloh OS — Master Status Addendum — Goldie Wave B Publication Complete

Date: 2026-08-24
Owning workstream: 20 — CRM & Identity
Durable state: VERIFIED LIVE / COMPLETE / DO NOT REDO

## Authoritative production state

PR #447 exact Wave B authority is fully implemented and verified live.

Description publication:

- PR #448 merge `c5e1fe88855e634968524a7ba96b9d58235d5589`
- migration `076_goldie_wave_b_customer_descriptions.sql`
- retained source SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`
- exact Render deploy `dep-da61t61t0dsc73cri96g` LIVE
- production proof: exactly 15/15 approved descriptions; 13 active/public-catalogue eligible; Toe Gel and Pressotherapy retained inactive/unmapped/non-bookable; MediHeel current Christel-only mapping preserved; all mappings and non-target descriptions preserved.

Mechanical name correction retained by PR #447:

- PR #449 merge `263b71653cdc73cacb4f8c993ccf352a06cbf97c`
- migration `077_goldie_targeted_sports_name_correction.sql`
- exact Render deploy `dep-da61vlk9v7es73fk7su0` LIVE
- Goldie ID `2d5b6147-ee9f-4a97-8e27-6270751c2673` canonical name is now `Targeted Area-Specific Sports Massage`
- exact Wave B description, status/public eligibility, mappings, all non-name metadata and all non-target names preserved.

The PR #449 startup also reverified migration 076 idempotently with `appliedNow=false`, 15/15 exact descriptions, 13 active/public targets and 2 retained inactive/unmapped targets.

## CI

PR #448 CI #1340 / run `32717529842` / job `97401843267`: 12/12 maintenance framework + 926/926 full regression, zero failed/cancelled/skipped, npm audit 0 vulnerabilities.

PR #449 CI #1342 / run `32717980282` / job `97403188699`: 12/12 maintenance framework + 931/931 full regression, zero failed/cancelled/skipped, npm audit 0 vulnerabilities.

## Superseded prior state

Any prior Master/Tracker wording describing the exact 15 PR #447 rows as approved but not yet published is superseded. These 15 descriptions and the retained mechanical Targeted Sports correction are VERIFIED LIVE.

PR #442 remains CLOSED / SUPERSEDED / DO NOT MERGE. Wave A PR #445/#446 / migration 075 remains VERIFIED LIVE / COMPLETE / DO NOT REDO.

## Still held

These five PR #447 rows remain unapproved for publication and unchanged:

- Lip Plump Treatment
- GF Needling with Growth Factors under Local Anesthetic
- VHC Standard Needling with Vitamins under Local Anesthetic
- Pelvic floor strengthening
- intimate HIFU

All Wave C gates remain fail closed, including Psoas missing-tail truth, Bamboo identity/copy truth, blank-description preservation, corrupted/incomplete source wording, retired Sports Massage blank preservation and practitioner personal-contact exclusion.

## Infrastructure limitation

The Render read-only PostgreSQL connector still has the known TLS integration defect. TLS was not weakened. The production proof is provided by the application’s existing database connection and guarded pre/post-state verification before startup; no generic SQL/write route or broadened database permission was created.

## Continuity

Future specialists must treat PR #447 + migrations 076/077 + PR #448/#449 production evidence as authoritative. Do not repeat the source audit, rewrite the approved strings, rename the service again, or rebuild the publication mechanism.

00 — Control & Reconciliation owns the remaining held rows only if new authoritative evidence becomes available.