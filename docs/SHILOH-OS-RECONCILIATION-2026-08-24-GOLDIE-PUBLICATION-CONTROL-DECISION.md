# Shiloh OS — Reconciliation — Goldie Publication Control Decision

Date: 2026-08-24
Owning workstream: Control & Reconciliation
Implementation owner: CRM & Identity
Status: WAVE A AUTHORIZED / WAVE B CLAIM-LEVEL REDRAFT AUTHORIZED / WAVE C FAIL-CLOSED
Publication mutation performed by this reconciliation: none

## Authority verified before decision

Control independently re-read current GitHub `main` at `acb90baec0c58523b825e7655e83c364841cab9d`, PR #440 and its complete 52-service drafting matrix, the applicable Master Status and Project Tracker authority, PR #415 / PR #436 exact-source-first policy, the 2026-08-21 Goldie business-approval reconciliation, and Engineering Governance.

PR #440 is merged, its CI #1324 / workflow `32707564441` / job `97371817870` passed on Node 24.14.1, including focused maintenance-framework tests 12/12 and full non-mutating regression 913/913. Exact Render deploy `dep-da607kid0e5s73c0vgk0` is LIVE on commit `acb90baec0c58523b825e7655e83c364841cab9d`. The post-deploy production log window contains no error-level entries and records Google Calendar provider health passing.

No newer authority conflicts with the Goldie exact-source-first policy or the PR #440 drafting matrix.

## Matrix arithmetic correction

The PR #440 row-level matrix contains **18** rows explicitly classified `VERBATIM`, not 17. The aggregate summary and handoff count of 17 is therefore a documentation arithmetic defect.

This Control decision does not reopen or repeat PR #392/#393 source evidence. It uses the explicit row-level classifications as authority and identifies the approved Goldie IDs individually to eliminate ambiguity.

The 18 `VERBATIM` rows are matrix rows:

`3, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 25, 26, 28, 34, 35, 36`.

## Decision A — Wave A

**APPROVED FOR BOUNDED PUBLICATION IMPLEMENTATION.**

Wave A is exactly the following 20 Goldie service rows and no others.

### Exact-source VERBATIM — 18 rows

1. `082a3806-3b46-4469-88b8-68b5df95e82b` — Derma Fusion Clarity Facial
2. `592f0d7d-5a54-4f01-a7ee-c10fb0715140` — Basic Facial-Acne Congested/Hormonal Break out skin:
3. `1c7cdc7c-67b2-4c44-b999-1b900d27ca3c` — Dermaplane facial
4. `8caf9baa-c5b0-4b8a-b45e-b10ca2367c50` — Brightening Facial (Pigmentation)
5. `3a5d1f78-4213-401a-b279-e674608c5c5b` — Clarity Facial (Black heads, White heads & Acne
6. `178ff19a-a260-4915-af76-09c4f6884c39` — Formulage Brightening Peel
7. `ca73086c-7a7a-47f8-90e4-992dfc8dd040` — Calm & Clear Facial
8. `d2adf221-5d19-43ff-bd7b-281aa21b2428` — Eternal Glow Facial
9. `f87d46dc-f525-409e-beb2-784c56769ae6` — Contour Lift Facial
10. `0dd673be-ab70-4694-8727-08debcae60b5` — Hydrate & Plump Facial
11. `598c88c9-af8b-47b4-a22f-b2af1a905cfd` — Acne Detox Facial
12. `975999ce-a6cc-45c4-a0ed-9f4de0f3ec5b` — Hybrid Facial
13. `71d29944-2474-4034-a232-5b14503c5eda` — Sculp Delux
14. `a5af84f7-e1d3-4e5f-afef-a1e7a26e4caa` — Firm & Lift
15. `29a37095-3263-4ce2-a3b5-2b6525804de5` — Derma Peel Brightening
16. `f3e682e1-6a03-4623-83e6-935752b27196` — Permanant Makeup- Lips:
17. `7537cf00-0777-44a0-a04a-ce2ff3fbf2a6` — Areola reconstruction
18. `175c91c9-562e-4aa7-87eb-8f918462ce7f` — Waxing

For these 18 rows, the publication implementation must use the exact attributable Goldie Description from the already-verified PR #392/#393 source evidence, byte-for-byte / Unicode-for-Unicode, with no tone rewrite, shortening, claim addition or other semantic modification.

### Deterministic MECHANICAL — 2 rows

19. `3f92913f-e670-4a75-8f0a-fc2d9d401eb5` — Permanent Makeup - Eyeliner:
   - exact source plus one added `)` after the Thick line Top touch-up duration `2H00`;
   - no other character/content change.
20. `cf51772d-9dbc-48c4-98d4-4fbc50fefbde` — Permanent Makeup - Brows:
   - exact source with only the stray `)` immediately after `R2150` removed from the combined-brows touch-up line;
   - no other character/content change.

No other row is authorized for publication by Decision A.

## Decision B — Wave B

### Evidence finding

A bounded repository check found **no retained substantiation or qualified clinical/compliance review artifact** supporting the objective medical, therapeutic, efficacy, recovery, safety, outcome, physiological or duration claims isolated by PR #440.

Under PR #415 / PR #436, Goldie provenance establishes attributable source lineage but is not, by itself, substantiation for an objectively testable claim. Therefore Control does **not** approve any isolated objective Wave B claim unchanged solely because it appears in the Goldie source.

### Business disposition

**REWRITE at claim level by default; REMOVE when a faithful neutral rewrite would still assert an unsupported objective result; HOLD where operational/clinical scope truth is itself unresolved.**

The exact-source-first rule remains binding: every unaffected part of each intact source Description stays verbatim. CRM & Identity must not wholesale rewrite an otherwise intact description.

#### Claim-level neutral-redraft set

CRM & Identity is authorized to prepare exact proposed final wording for the isolated claims in these rows, preserving all unaffected source wording verbatim:

- #1 Medi-Heel Pedicure (No Gel Toes) & Foot Massage — neutralize/remove medical-grade, safety, callus-dissolving and long-lasting-result assertions; the `blades.Using` → `blades. Using` spacing repair is approved as mechanical.
- #2 Toe Gel Application — remove or qualify the unsupported fixed six-week chip-resistant/durability promise. Do not publish a guaranteed duration without retained support.
- #4 Medi-Heel Pedicure (With Gel Toes) & Foot Massage — neutralize/remove the isolated medical/safety/outcome claims; deterministic malformed quotation punctuation may be repaired while preserving all unaffected source text.
- #5 Profosma Jet Plasma — neutralize/remove unsupported mechanism, outcome, zero-downtime, visible-result and fixed-cycle/regimen assertions.
- #6 Plasma Fybroblast — practitioner personal contact line must be removed; neutralize/remove unsupported tissue-contraction, lesion, collagen/elastin, rejuvenation and result-duration assertions.
- #7 Pressotherapy Single Session — neutralize/remove unsupported lymphatic/circulation/toxin/metabolic-waste mechanism or elimination assertions.
- #9 Ozone & Far Infrared Therapy — remove both practitioner-contact fragments; neutralize/remove unsupported illness/injury/post-surgery recovery claims.
- #22 SQT Anti-Aging Rejuvenation / Revitalizing Beauty BioMicroneedling — neutralize/remove unsupported lifting/firming, pigmentation, cell-turnover and other objective outcome claims while preserving factual treatment description.
- #24 Sports Massage Full Body — neutralize/remove injury-prevention, faster-recovery, circulation/range-of-motion and performance outcome assertions where not merely descriptive of treatment focus.
- #30 Stretch Mark Microneedling Consultation — neutralize/remove unsupported scar/stretch-mark outcome claims; preserve factual consultation/treatment-process description.
- #37 HIFU (High Intensity Focused Ultrasound) — neutralize/remove unsupported lift/tighten/contour, collagen-stimulation, wrinkle/elasticity, long-lasting-result, no-pain and no-downtime assertions.
- #39 Full Body Swedish — neutralize benefit claims so they describe intended focus/experience rather than guaranteed physiological outcomes; unsupported improved-circulation assertions must not remain as objective fact.
- #43 Targated Area Specific Sports Massage — mechanical service-name correction `Targated` → `Targeted` is approved; neutralize/remove unsupported pain-reduction, recovery, mobility and performance outcome assertions.
- #46 Soothing & Restorative Pregnancy Massage — do not publish blanket safety/suitability guarantees; neutralize unsupported pain/discomfort and circulation outcome assertions. Factual pregnancy-massage process wording may remain.
- #50 Cupping Area Specific — neutralize/remove unsupported healing and circulation outcome assertions; preserve factual treatment/process wording.

CRM & Identity must return the **exact changed sentences/final descriptions** for these rows to Control before publication. This decision authorizes redrafting, not publication of wording that has not yet been reviewed.

#### Scope-gated rows

The following rows remain **BLOCKED FOR PUBLICATION** until the exact operational/clinical scope truth is explicitly confirmed. Claim wording may be redrafted in parallel, but the row may not publish merely because copy is ready:

- #27 `367dbc36-5af0-43e3-a3ec-3e382cb4954a` — Lip Plump Treatment: confirm the clinic's authorized operational/suitability pathway for local anaesthetic, needling and hyaluronic-acid procedure scope.
- #29 `c97eda93-c42f-471c-a1fc-5f35207c0c86` — GF Needling with Growth Factors under Local Anesthetic: confirm anaesthetic/procedure/suitability scope; objective outcome claims require neutral redraft/removal unless later substantiated/reviewed.
- #31 `c7b12afc-a0ba-497b-affb-ab03b2958a73` — VHC Standard Needling with Vitamins under Local Anesthetic: same scope confirmation; objective outcome claims require neutral redraft/removal unless later substantiated/reviewed.

#### High-risk clinical-claim rows

The following rows remain **BLOCKED FOR PUBLICATION** pending qualified clinical/compliance review and retained substantiation or an exact neutral rewrite that removes treatment/outcome claims requiring such support:

- #40 `068c0963-27db-418c-ad44-3a10431076b7` — Pelvic floor strengthening: incontinence, bladder-control, post-labour, menstrual-pain and sexual-vitality treatment/outcome claims.
- #41 `0c86a08f-68e9-49f6-a33d-6ff5bc9870ea` — HIFU: urinary-incontinence, pressure-leak, vaginitis, menopausal-thinning, lichen-sclerosus, sexual-function and genital-tightening treatment/outcome claims.

Control does not authorize unchanged publication of those claims on present evidence.

## Decision C — Wave C

The following rows remain fail-closed. Exact closure evidence is:

- #8 `46a55851-84cf-491e-a7a3-ed19b2817e1e` — `Priced according to area`: **BLOCKED** until the parent treatment identity is established from authoritative business/source truth. Only after identity is confirmed may the missing parenthesis be mechanically balanced.
- #10 `7030909c-df55-4c38-bb44-ce7b57b74cd5` — Basic Facial-Hydrationw/Pigmentation...: **BLOCKED** until exact corrected source/business wording for `Hydrationw` and any other corruption is supplied. The leading practitioner personal contact line remains excluded.
- #23 `f21db849-78c6-45a5-ab87-fa99050fb495` — SQT Resurfacing / Nourishing Hydrating BioMicroneedling: **BLOCKED** until exact section-numbering/service mapping truth is confirmed; claim decisions follow after mapping truth closes.
- #38 `d42f5e34-b3c1-4ff3-9206-0fc97823d02e` — Facial Lymphatic Drainage Massage: **PRESERVE BLANK** under current authority. Not a publication defect. New copy requires a separate explicit authoring + approval decision.
- #42 `9f2f6452-f1ce-4525-88f2-3dc57f74caa6` — Quick Relieve: Back & Neck (45 min): **BLOCKED** until exact missing/incomplete consent-parenthetical wording is recovered or explicitly replaced by approved business wording; then claim-level benefit wording must be reviewed.
- #44 `b5c96105-f534-406d-89ec-68e78c65cf8b` — Upper Back, Neck & Jaw Release: **BLOCKED** until exact corrected/replacement wording for the demonstrated corrupted fragments is supplied and approved; do not infer reconstruction.
- #45 `21a1fc85-6a5b-433e-b689-7bff12c7e2af` — Hot Stone Masage: **BLOCKED** until exact correction for `can ca fatigue` is supplied/approved; physiology claims remain claim-level review items.
- #47 `729fc549-c353-48ac-9cbc-abba4cc2ed66` — Renew & Revive Leg and Foot Massage: **BLOCKED** until exact corrected wording/retained-symbol decision closes the broken-fragment source gate; circulation/tension claims then receive claim-level review.
- #48 `1d734e8b-d21e-44c3-9a3f-b2a7165a7787` — retired Full Body Sports Massage: **FINAL PRESERVE BLANK / DO NOT AUTHOR**.
- #49 `b39dcaf1-7894-40e0-8a51-c7ab4eba553a` — Lower Back & Hip & Psoas Release: **BLOCKED** until Goldie Support/backend history provides the uncapped stored value/history or explicitly confirms that no longer source exists. The current exact 1,000-character value ending `deep physica` must not be autocompleted.
- #51 `6a0c9c5e-d7e7-4a82-8795-e8281a0bd526` — Bamboo Sports Massage Area Specific: **BLOCKED** until business/source truth confirms Area Specific versus Full Body identity/copy. Do not infer identity. Claims are reviewed only after the identity gate closes.
- #52 `90baece3-1520-4368-b772-eaba08e1a511` — Lymphatic Drainage Reset Package: **PRESERVE BLANK** under current authority. Service-photo wording is not Description source. New copy requires separate authoring + approval.

## Publication implementation boundary

This Control decision authorizes **only Wave A's exact 20-row bounded publication set** for implementation by CRM & Identity.

It does not itself mutate Goldie, CRM, PostgreSQL, application code, Render, WhatsApp or provider state.

Before any write, CRM & Identity must independently verify current `main`, the current catalogue targets and selected publication mechanism, and fail closed on target/source drift. The implementation must be exact-ID scoped and must not touch Wave B or Wave C rows.

If publication requires a database or infrastructure execution mechanism that CRM & Identity cannot safely own, return that exact dependency to Control / Production & DevOps rather than creating a new generic write path.

Wave B redrafting may proceed in parallel, but no Wave B row may publish until its exact final wording/scope disposition is returned to Control and explicitly approved.

## Recommendation and priority

Control accepts CRM's three-wave sequencing with the corrected Wave A count.

If Shiloh OS were my own project, I would publish the clean Wave A set now, while immediately drafting the narrow Wave B claim edits in parallel, and keep Wave C fail-closed. This delivers useful catalogue content without allowing unsupported clinical claims or unresolved source truth to ride along with clean descriptions.

This should be done **now**. The owning implementation workstream is **20 — CRM & Identity**. Production / DevOps remains a dependency only if the selected write mechanism requires infrastructure execution outside CRM's existing safe publication path.

## Completed / do not redo

- PR #392/#393 Goldie source/export/editor evidence;
- 52-service source reconciliation;
- PR #415 exact-source-first policy;
- PR #436 policy reconciliation;
- PR #440 drafting matrix, except the corrected aggregate VERBATIM arithmetic noted here;
- imported-contact remediation through PR #435;
- Gate 1 / Gate 2 / Stage 1 / Stage 2;
- migrations 072/074;
- PR #437/#438/#439 PostgreSQL maintenance architecture/framework authority unless capability materially changes.

## Next owner

**20 — CRM & Identity** owns Wave A implementation and Wave B exact final redrafting under the boundaries above.
