# Shiloh OS — Master Status Addendum — Goldie Wave B Publication Complete

Date: 2026-08-24
Owning workstream: 20 — CRM & Identity
Durable state: VERIFIED LIVE / COMPLETE / DO NOT REDO

## Authoritative production state

PR #447 exact 15-row Wave B publication authority has been implemented and verified live through PR #448.

Current application merge for the implementation:

`c5e1fe88855e634968524a7ba96b9d58235d5589`

Migration 076 is checksum-controlled and bound to the retained Goldie source SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16` and transaction-local authority `PR447`.

Exact Render implementation deploy `dep-da61t61t0dsc73cri96g` reached LIVE. Production verification proved:

- exactly 15 canonical target rows;
- 15/15 exact PR #447 descriptions;
- 13 active/public-catalogue eligible targets;
- Toe Gel Application and Pressotherapy Single Session retained inactive, unmapped and non-bookable;
- both Medi-Heel targets retained current Christel-only/client-bookable authority;
- all practitioner mappings preserved;
- all non-target service descriptions preserved;
- migration checksum and retained source SHA verified;
- no client, appointment, Calendar, WhatsApp or provider state changed.

CI #1340 passed 12/12 focused maintenance-framework tests and 926/926 full regression tests with zero failures/cancellations/skips and zero npm vulnerabilities.

## Superseded prior state

Any prior Master/Tracker wording that describes the exact 15 PR #447 Wave B rows as `approved but not yet published` is superseded by this addendum. Those 15 rows are now VERIFIED LIVE.

PR #442 remains CLOSED / SUPERSEDED / DO NOT MERGE and is not publication authority.

Wave A PR #445/#446 / migration 075 remains VERIFIED LIVE / COMPLETE / DO NOT REDO.

## Still held

These five PR #447 rows remain unapproved for publication and unchanged by Wave B implementation:

- Lip Plump Treatment
- GF Needling with Growth Factors under Local Anesthetic
- VHC Standard Needling with Vitamins under Local Anesthetic
- Pelvic floor strengthening
- intimate HIFU

All Wave C gates remain fail closed, including Psoas missing-tail truth, Bamboo identity/copy truth, blank-description preservation, corrupted/incomplete source wording and retired Sports Massage blank preservation. Practitioner personal contact details remain excluded.

## Infrastructure limitation

The separate Render read-only PostgreSQL connector still has the known TLS integration defect. This does not invalidate the live Wave B proof because the production bootstrap performs the exact pre/post-state queries inside the application’s existing database connection before startup. TLS was not weakened and no general SQL/write route was created.

## Continuity

Future specialists must treat migration 076 + PR #447 exact wording + PR #448 production evidence as authoritative. Do not repeat the source audit or rebuild a publication mechanism.

00 — Control & Reconciliation owns the remaining held rows only when new authoritative evidence exists.