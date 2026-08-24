# Shiloh OS — Reconciliation — Goldie Exact-Source-First Description Policy

Date: 2026-08-22
Authority refresh: 2026-08-24
Owning workstream: Control & Reconciliation
Drafting/publication implementation owner: CRM & Identity
Status: BUSINESS POLICY RATIFIED / DRAFTING AUTHORIZED / PUBLICATION NOT YET MUTATED

## Current-main refresh

This reconciliation was re-read and refreshed against pre-merge GitHub `main` `c5077abe36c2ab798564378a40d5b50a14411523` before PR #415 proceeds.

The refresh included the current Master Status, Project Tracker, latest applicable Goldie business-approval reconciliation, Engineering Governance, the full PR #415 policy text and the newer repository lineage after PR #415's original base `02d375b3a9bd271806d499fcff7f576283f37c8b`.

No newer authority conflicts with the exact-source-first service-description policy. Later CRM/imported-contact work concerns canonical client identity, imported-contact provenance, verification, same-client reclaim and controlled archival. It does not supersede Goldie service-description source/export/editor evidence or authorize description publication. In particular, the `goldie_import` client provenance semantics from the CRM identity work must not be conflated with attributable Goldie service-description source lineage.

The completed imported-contact remediation through PR #435 remains separate, complete and do-not-redo. This policy does not alter migration 072 or 074, Gate 1 or Gate 2, archived client state, verified-client authority, appointments, contacts or CRM identity evidence.

The pre-merge Master Status and Project Tracker still contain the older D5/D8/D11 blanket-neutralization/review wording from the 2026-08-21 approval. They require controlled reconciliation after this policy is merged; those ledgers must not be whole-file replaced from stale PR #415 ancestry.

## Decision

Business authorization explicitly ratifies an **exact-source-first** policy for Goldie service descriptions.

The business objective is that client-facing descriptions remain useful and sufficiently detailed for clients to understand what a specific service is intended to do and what the treatment involves. The project must therefore not automatically neutralize, shorten or paraphrase accurate Goldie source wording merely because the description discusses a treatment or therapeutic purpose.

This decision is **reviewable and supersedable**. It is current business authority, not an irreversible commitment. A later explicit Control/business decision may revise the policy, approve different wording for an individual service, or restore a stricter review rule where evidence, regulation, clinical judgment or business preference warrants it.

## Preserved source authority

PR #392/#393 source/export/editor evidence remains authoritative and must not be repeated merely because the publication policy changed.

Preserve:

- the two active lymphatic Description fields as genuinely blank unless separately authored and approved;
- retired Full Body Sports Massage as intentionally blank;
- the Psoas editor/export value as exactly 1,000 characters ending `deep physica`, with the missing tail still unresolved;
- all original Goldie source values and recovery evidence;
- the rule that missing/truncated/corrupted source text must never be invented or auto-completed;
- the rule that practitioner personal phone numbers do not belong in public service descriptions and should route through Shiloh's controlled clinic contact journey;
- the Bamboo Area Specific versus Full Body identity gate until exact treatment truth is confirmed.

## Exact-source-first publication contract

1. **Verbatim source is the preferred baseline.** Where an existing Goldie description is intact and attributable to the correct service, CRM & Identity should preserve its exact wording by default when preparing the publication proposal.
2. **Do not rewrite merely for tone or generic caution.** Accurate explanatory content about treatment areas, techniques, pressure, session structure, intended focus, practitioner actions and the client experience should not be neutralized merely because it is health- or treatment-related.
3. **Objective claims are assessed individually, not by blanket rewrite.** If a specific sentence makes an objectively testable medical, therapeutic, efficacy, recovery, safety, outcome, physiological or duration claim, flag that exact sentence for evidence/review rather than rewriting or withholding the entire description automatically.
4. **Where adequate retained support exists, preserve the exact wording.** The exact source remains preferred unless a later explicit Control/business decision approves a different client-facing formulation.
5. **Where support is absent or disputed, isolate the specific claim.** Do not automatically neutralize the entire service description. Return the specific unsupported/disputed sentence to Control/business for an explicit keep/rewrite/remove decision before publication of that affected claim.
6. **No inference from missing source.** Exact-source-first never authorizes inventing the Psoas missing tail, copying image text into a blank Description, inferring Bamboo treatment identity, or fabricating source wording.
7. **Personal contact details remain excluded.** Remove practitioner personal phone numbers from public descriptions while preserving the rest of the source wording wherever possible.
8. **Mechanical corrections remain controlled.** Obvious punctuation, spacing, bracket and quotation defects may be proposed as mechanical corrections, but the source wording should otherwise remain intact unless a specific approved exception applies.
9. **Corrupted/misplaced text remains exception work.** Text demonstrably attached to the wrong service or corrupted beyond faithful publication may be rewritten only through the controlled exception matrix and exact approval.
10. **No bulk publication by this policy reconciliation.** This policy authorizes drafting and review under the new default; it does not itself write to Goldie, Shiloh CRM, the public catalogue, application code, database rows or Render.

## Relationship to D1–D11

The 2026-08-21 D1–D11 business decisions remain durable where they do not conflict with this newer policy.

Preserved unchanged:

- D1/D2: the two confirmed active lymphatic blanks remain blank for now;
- D3: retired Full Body Sports Massage remains blank;
- D4: Psoas missing-source recovery remains a Goldie Support/backend-history gate;
- D6: practitioner personal phone numbers are removed from public descriptions;
- D7: Bamboo treatment identity must be confirmed before publication;
- D9: mechanical correction drafting remains authorized;
- D10: controlled rewrites remain authorized for genuinely corrupted/misplaced text with exact approval.

Superseded/narrowed by this reconciliation:

- **D5:** Psoas remains unpublished because its source is truncated and its tail unresolved. The earlier blanket instruction to neutralize clinical/treatment wording is narrowed: intact attributable wording is handled under the specific-claim rule, while the missing tail remains fail-closed.
- **D8:** Bamboo remains publication-blocked on treatment identity until Area Specific versus Full Body truth is confirmed. Clinical/treatment wording is not automatically neutralized wholesale; objective claims are assessed individually once the correct source/service identity is known.
- **D11:** Clinical/treatment efficacy, recovery, safety, outcome, physiological and duration claims are reviewed at the specific-claim level. Supported exact wording may remain. Unsupported or disputed claims return for an explicit keep/rewrite/remove decision. D11 no longer requires blanket neutralization or withholding of an otherwise intact whole description solely because such claims exist.

## Reviewability

This policy can be reviewed at any time. Review does not require undoing PR #392/#393 evidence work or changing already preserved provenance. A future policy change should:

1. identify the exact service/claim or policy rule being reconsidered;
2. preserve the underlying Goldie source and audit evidence;
3. record the new business decision through Control & Reconciliation; and
4. update Tracker/Master only if durable authority changes.

## Remaining gates

- Psoas remains source-blocked until Goldie Support/backend history supplies the uncapped stored value/history or confirms no longer value exists.
- Bamboo remains identity-blocked until business confirms Area Specific versus Full Body.
- Individual objectively testable claims lacking retained support remain decision-gated at the sentence/claim level.
- Exact publication mutations remain a CRM & Identity controlled unit; this Control reconciliation does not publish anything.
- Project Tracker and Master Status must be reconciled after this policy is merged so their Goldie-description entries reflect the narrowed D5/D8/D11 authority without disturbing newer unrelated state.

## Next action

After PR #415 is merged and the control ledgers are reconciled, CRM & Identity should prepare an exact-source-first publication/drafting matrix using the already-verified PR #392/#393 evidence. Preserve intact source descriptions verbatim by default, remove practitioner personal phone details, isolate only genuinely unsupported/disputed objective claims for decision, keep Psoas/Bamboo source-truth gates fail-closed, and return the exact proposed publication set for controlled approval/implementation.

No publication mutation is authorized by this reconciliation or by the subsequent drafting matrix itself.
