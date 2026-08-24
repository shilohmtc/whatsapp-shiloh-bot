# Shiloh OS — Reconciliation — Goldie Exact-Source-First Drafting Matrix

Date: 2026-08-24
Owning workstream: CRM & Identity
Observer / next decision owner: Control & Reconciliation
Status: DRAFTING MATRIX COMPLETE / PUBLICATION NOT AUTHORIZED

## Authority

This controlled unit applies the already-ratified PR #415 exact-source-first service-description policy and PR #436 shared-ledger reconciliation to the already-verified PR #392/#393 Goldie source/export/editor evidence.

No source audit was repeated. No Goldie, CRM, catalogue, application, PostgreSQL, Render configuration, Calendar or WhatsApp data was mutated by this drafting unit.

Source authority remains:

- `export (33).csv` SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`;
- `Services.csv` SHA-256 `f5f15b774b766b111236176e44040e7fc99bb1624f71b07117ea861380697e08`;
- 52/52 exact Goldie IDs and names reconciled;
- 49 nonblank descriptions;
- 3 exact blanks;
- no unmatched service records;
- no exact duplicate descriptions;
- Psoas exact source remains hard-truncated at 1,000 characters ending `deep physica`;
- Bamboo Area Specific versus Full Body treatment identity remains unresolved.

## Delivered artifact

`docs/SHILOH-OS-GOLDIE-EXACT-SOURCE-FIRST-PUBLICATION-MATRIX-2026-08-24.md`

The matrix covers all 52 services and applies the current policy at row level rather than carrying forward the superseded blanket medical-claim hold logic from the earlier 33-row exception workbook.

The drafting contract is:

- `VERBATIM` — exact Goldie Description remains the proposed public baseline;
- `CLAIM_DECISION` — exact source remains baseline and only the named objective claim is returned for keep/rewrite/remove disposition;
- `MECHANICAL` — only the named punctuation/spacing defect is proposed for correction;
- `REMOVE_CONTACT` — only practitioner personal contact fragments are removed; source content otherwise remains intact subject to any named claim decision;
- `SCOPE_DECISION` — exact procedure wording remains source baseline while operational/suitability scope receives explicit decision;
- `HOLD` — source truth, treatment identity, incompleteness or genuine corruption prevents faithful publication and remains fail closed;
- exact source blanks remain blank unless separately authored and approved.

## Material drafting outcome

The complete population can now be reviewed without conflating clean source text with exception work.

- **17 rows** are ready as exact-source `VERBATIM` proposals.
- **2 rows** — Permanent Makeup Eyeliner and Brows — have deterministic punctuation-only proposals and otherwise preserve source exactly.
- Remaining intact descriptions with objective medical/therapeutic/efficacy/recovery/safety/outcome/physiological/duration wording retain their source baseline while only the identified claims/scope questions route to Control.
- Psoas remains source-truth blocked.
- Bamboo Area Specific remains treatment-identity blocked.
- The two active lymphatic Description fields remain confirmed blank unless separately authored and approved.
- Retired Full Body Sports Massage remains intentionally blank / do not author.
- Demonstrably corrupted/incomplete rows remain fail closed; no missing wording was invented.
- Practitioner personal phone details remain excluded from public-description proposals and were not copied into the repository matrix.

The full-population application of PR #415 also identifies the Toe Gel six-week chip-resistant/durability sentence for claim-level review. This is not a source-audit redo; it is a consistent application of the newer objective-duration-claim policy across the already-verified 52-row population.

## Recommended controlled sequencing

CRM & Identity recommends three waves:

1. **Wave A:** approve the 17 exact-source `VERBATIM` rows plus the two deterministic punctuation-only rows.
2. **Wave B:** resolve only the isolated objective claims and scope questions, preserving unaffected source wording verbatim.
3. **Wave C:** leave source-truth, treatment-identity, blank-authoring and genuinely corrupted/incomplete rows fail closed until exact business/source truth exists.

If Shiloh OS were my own project, I would use this sequence now. It releases the clean majority for approval without allowing a small number of hard exceptions to force unnecessary rewriting or block the entire catalogue.

## Authorization boundary

This matrix is drafting/review evidence only.

It does **not** authorize:

- individual or bulk publication;
- Goldie writes;
- CRM/catalogue writes;
- application or database writes;
- provider/WhatsApp changes;
- source reconstruction;
- Psoas autocomplete;
- Bamboo identity inference;
- creation of new copy for blank descriptions;
- publication of practitioner personal contact details.

Final publication requires a separate Control/business decision identifying the exact approved rows and exact disposition of every remaining claim/truth/scope exception.

## Completed / do not redo

Preserve and do not redo:

- PR #392/#393 source/export/editor evidence;
- PR #415 exact-source-first policy;
- PR #436 policy reconciliation;
- PR #425–#435 imported-contact remediation;
- Gate 1 / Gate 2 / Stage 1 / Stage 2;
- migrations 072/074;
- PR #437/#438/#439 assistant PostgreSQL infrastructure authority unless capability materially changes.

## Reconciliation status

Project Tracker: a bounded addendum for this drafting unit is included with this change.

Master Status: **no new Master reconciliation required**. PR #436 already records the durable exact-source-first business policy; this unit creates a proposal/review artifact and does not change production, catalogue or durable policy state.

## Next owner

**00 — Control & Reconciliation** owns the exact approval decision on the proposed publication set and claim/truth/scope dispositions.

If Control authorizes a bounded publication implementation, it should route the exact approved set back to **20 — CRM & Identity** for implementation unless the selected publication mechanism introduces a separate Production / DevOps dependency.