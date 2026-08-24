# Shiloh OS — Project Tracker Addendum — Goldie Publication Control Decision

Date: 2026-08-24
Owning workstream: Control & Reconciliation
Implementation owner: CRM & Identity
Status: 🟢 WAVE A AUTHORIZED / 🔵 WAVE B REDRAFT READY / 🟠 WAVE C GATED

## Current tracker authority

`GOLDIE-DESCRIPTIONS` advances from drafting-complete/publication-pending to a bounded publication decision.

### Wave A — authorized for implementation

Exactly **20 rows** are authorized for bounded publication implementation:

- **18 exact-source VERBATIM rows** from the PR #440 row-level matrix: matrix rows `3, 11–21, 25, 26, 28, 34, 35, 36`;
- **2 deterministic punctuation-only rows**: matrix rows `32` and `33`.

The PR #440 aggregate/handoff statement of 17 VERBATIM rows is an arithmetic documentation defect. The explicit row-level table contains 18. The Control reconciliation `docs/SHILOH-OS-RECONCILIATION-2026-08-24-GOLDIE-PUBLICATION-CONTROL-DECISION.md` identifies all 20 authorized Goldie IDs individually and is controlling for implementation scope.

No other row is authorized for publication by this decision.

### Wave B — redrafting authorized, publication still gated

A bounded repository check found no retained substantiation or qualified clinical/compliance review artifact for the isolated objective claims. Goldie provenance therefore does not authorize those claims unchanged.

Control disposition:

- preserve every unaffected part of intact source descriptions verbatim;
- neutral-redraft the isolated unsupported objective claim at sentence/claim level;
- remove a claim when neutral wording would still assert an unsupported objective result;
- keep scope-dependent rows blocked until exact operational/clinical scope truth is confirmed;
- keep high-risk clinical treatment/outcome claims blocked pending retained substantiation + qualified review or an exact neutral rewrite that removes the unsupported claim.

CRM & Identity may prepare the exact Wave B final wording now, but must return that exact wording to Control before any Wave B publication.

### Wave C — fail closed

Psoas, Bamboo, source-identity/mapping defects, genuinely corrupted/incomplete source and preserved blanks remain gated exactly as recorded in the Control reconciliation.

- Psoas: Goldie Support/backend history truth gate; never autocomplete the 1,000-character source ending `deep physica`.
- Bamboo: confirm Area Specific versus Full Body identity/copy before claim review.
- Facial Lymphatic Drainage Massage and Lymphatic Drainage Reset Package: preserve blank unless separately authored and approved.
- Retired Full Body Sports Massage: final preserve blank / do not author.
- Other named corruption/mapping rows: exact source/business truth required; do not infer reconstruction.

## Verification basis

- Pre-decision current main: `acb90baec0c58523b825e7655e83c364841cab9d` / PR #440.
- PR #440 CI #1324 / run `32707564441` / job `97371817870`, Node 24.14.1.
- Focused maintenance-framework tests: 12/12 passed.
- Full non-mutating regression: 913/913 passed, 0 failed, 0 cancelled, 0 skipped.
- Exact Render deploy `dep-da607kid0e5s73c0vgk0`: LIVE on `acb90baec0c58523b825e7655e83c364841cab9d`.
- Post-deploy error-level log query returned no entries; Google Calendar provider health check passed.

## Publication boundary

This Control decision does not itself mutate Goldie, CRM, PostgreSQL, the public catalogue, application code, Render configuration, Calendar, WhatsApp or provider state.

CRM & Identity owns Wave A implementation. Before writing it must independently verify the current CRM-backed public catalogue targets and selected publication mechanism, use exact Goldie/canonical service identity mapping, fail closed on drift, and touch only the authorized Wave A set.

If the safe implementation mechanism requires infrastructure execution outside CRM ownership, return the exact dependency to Production / DevOps through Control rather than creating a generic write path.

## Completed / do not redo

- PR #392/#393 source/export/editor evidence and 52-service reconciliation;
- PR #415 exact-source-first policy;
- PR #436 policy reconciliation;
- PR #440 drafting matrix except the aggregate arithmetic correction recorded above;
- imported-contact remediation through PR #435;
- Gate 1 / Gate 2 / Stage 1 / Stage 2;
- migrations 072/074;
- PR #437/#438/#439 PostgreSQL maintenance architecture/framework authority unless capability materially changes.

## Next action

**20 — CRM & Identity** implements only the exact 20-row Wave A publication set through the normal controlled-work completion protocol and prepares Wave B exact redrafts in parallel. Wave B and Wave C publication remain prohibited until their stated gates close and Control explicitly approves the exact final wording/set.
