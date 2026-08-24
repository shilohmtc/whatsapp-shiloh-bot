# Shiloh OS — Goldie Exact-Source-First Drafting / Publication Matrix

Date: 2026-08-24
Owning workstream: CRM & Identity
Observer / final publication decision owner: Control & Reconciliation
Status: DRAFTING COMPLETE / PUBLICATION NOT AUTHORIZED

## Authority and source contract

This matrix implements the PR #415 / PR #436 exact-source-first policy against the already-completed PR #392/#393 source evidence. It does not repeat the source audit and does not mutate Goldie, CRM, the public catalogue, application code, PostgreSQL, Render, Calendar or WhatsApp.

Authoritative source population:

- Goldie export: `export (33).csv`
- SHA-256: `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`
- Comparison extract: `Services.csv`
- SHA-256: `f5f15b774b766b111236176e44040e7fc99bb1624f71b07117ea861380697e08`
- Population: 52 exact Goldie IDs / 52 exact names; 49 nonblank Description values; 3 exact blanks; no unmatched rows; no exact duplicate descriptions.

For rows marked `VERBATIM`, the exact proposed public Description is the Description field from the authoritative export, byte-for-byte / Unicode-for-Unicode, with no tone rewrite, shortening or neutralisation.

For rows marked `CLAIM_DECISION`, the exact source remains the drafting baseline. Only the identified objective claim(s) may be changed, and only after Control/business gives an explicit keep/rewrite/remove disposition. The rest of the source remains verbatim.

For rows marked `MECHANICAL`, only the named mechanical change is proposed. All other source characters remain unchanged.

For rows marked `HOLD`, no publication text is approved for that service until the named truth/source/corruption gate closes.

Practitioner personal phone details are never copied into this repository matrix. Where the source contains them, the transformation is specified structurally so the final public text can be derived without preserving personal contact data here.

## 52-service drafting/publication matrix

| # | Goldie ID | Service | Proposed handling | Exact transformation / gate | Control state |
|---:|---|---|---|---|---|
| 1 | `e4510fa9-579f-46dd-8fff-107c00748597` | Medi-Heel Pedicure (No Gel Toes) & Foot Massage | CLAIM_DECISION + MECHANICAL | Preserve source except propose one spacing repair: `blades.Using` → `blades. Using`. Claim-level decision remains for medical-grade/safety/callus-dissolving/long-lasting-result wording. | Decision required |
| 2 | `8814ad67-f670-4c4b-ae22-2cb1233afb96` | Toe Gel Application | CLAIM_DECISION | Preserve source. Isolate the objectively testable six-week chip-resistant/durability wording for keep/rewrite/remove. | Decision required |
| 3 | `082a3806-3b46-4469-88b8-68b5df95e82b` | Derma Fusion Clarity Facial | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 4 | `b534a8e5-3fe1-46e9-9ca0-bba116e6bf53` | Medi-Heel Pedicure (With Gel Toes) & Foot Massage | CLAIM_DECISION + MECHANICAL | Preserve source claim wording pending decision. Correct malformed quotation punctuation only after exact Control approval. | Decision required |
| 5 | `074c7773-2e78-4761-a9c6-c72dc02f7994` | Profosma Jet Plasma | CLAIM_DECISION | Preserve source; isolate mechanism/outcome/zero-downtime/visible-result/cycle-regimen claims. | Decision required |
| 6 | `9726c400-234d-489a-9e5c-d247c21e4a85` | Plasma Fybroblast | CLAIM_DECISION + REMOVE_CONTACT | Delete only the source line containing the practitioner personal contact number; preserve all other source text pending claim decisions on tissue contraction, lesions, collagen/elastin, rejuvenation and result duration. | Decision required |
| 7 | `49730b6c-133d-4e60-b98c-d33a1091d02d` | Pressotherapy Single Session | CLAIM_DECISION | Preserve source; isolate lymphatic/circulation/toxin/metabolic-waste mechanism and elimination claims. | Decision required |
| 8 | `46a55851-84cf-491e-a7a3-ed19b2817e1e` | Priced according to area | HOLD + MECHANICAL | Parent treatment identity is not established. Do not publish until identity is confirmed. Then propose balancing the missing parenthesis in the Naso Labial Folds line only. | Truth decision required |
| 9 | `8d5ee63d-8caa-45aa-b2d3-2a91d2478672` | Ozone & Far Infrared Therapy | CLAIM_DECISION + REMOVE_CONTACT | Remove both trailing practitioner-contact fragments, including the personal phone line and duplicate contact-only fragment; preserve preceding source wording. Isolate illness/injury/post-surgery recovery claims. | Decision required |
| 10 | `7030909c-df55-4c38-bb44-ce7b57b74cd5` | Basic Facial-Hydrationw/Pigmentation Targeted Break out skin: | HOLD + REMOVE_CONTACT | Delete only the leading practitioner name/phone line. Remaining source contains ambiguous/corrupted wording (`Hydrationw`) that must not be guessed; exact corrected wording requires business/source truth. | Exact wording required |
| 11 | `592f0d7d-5a54-4f01-a7ee-c10fb0715140` | Basic Facial-Acne Congested/Hormonal Break out skin: | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 12 | `1c7cdc7c-67b2-4c44-b999-1b900d27ca3c` | Dermaplane facial | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 13 | `8caf9baa-c5b0-4b8a-b45e-b10ca2367c50` | Brightening Facial (Pigmentation) | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 14 | `3a5d1f78-4213-401a-b279-e674608c5c5b` | Clarity Facial (Black heads, White heads & Acne | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 15 | `178ff19a-a260-4915-af76-09c4f6884c39` | Formulage Brightening Peel | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 16 | `ca73086c-7a7a-47f8-90e4-992dfc8dd040` | Calm & Clear Facial | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 17 | `d2adf221-5d19-43ff-bd7b-281aa21b2428` | Eternal Glow Facial | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 18 | `f87d46dc-f525-409e-beb2-784c56769ae6` | Contour Lift Facial | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 19 | `0dd673be-ab70-4694-8727-08debcae60b5` | Hydrate & Plump Facial | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 20 | `598c88c9-af8b-47b4-a22f-b2af1a905cfd` | Acne Detox Facial | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 21 | `975999ce-a6cc-45c4-a0ed-9f4de0f3ec5b` | Hybrid Facial | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 22 | `c830d602-0e71-499e-9348-114584c8a985` | 1. SQT Anti-Aging Rejuvenation BioMicroneedling + SQT Revitalizing Beauty BioMicroneedling | CLAIM_DECISION | Preserve source; isolate anti-aging, lifting/firming, pigmentation and cell-turnover outcome claims. | Decision required |
| 23 | `f21db849-78c6-45a5-ab87-fa99050fb495` | 2. SQT Resurfacing BioMicroneedling + SQT Nourishing Hydrating BioMicroneedling | HOLD + CLAIM_DECISION | Section numbering/service mapping is not safely inferable. Also isolate acne/scarring/stretch-mark/skin-barrier/cell-turnover claims. The missing closing parenthesis may be mechanically repaired only after mapping truth is confirmed. | Truth + claim decisions required |
| 24 | `46043512-d1df-4169-92b4-132160fca809` | Sports Massage Full Body | CLAIM_DECISION | Preserve source; isolate adhesions, injury-prevention, faster-recovery, circulation/range-of-motion and performance claims. | Decision required |
| 25 | `71d29944-2474-4034-a232-5b14503c5eda` | Sculp Delux | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 26 | `a5af84f7-e1d3-4e5f-afef-a1e7a26e4caa` | Firm & Lift | VERBATIM | Publish proposal = exact source Description. Do not silently reinterpret product/procedure labels. | Ready for Control approval |
| 27 | `367dbc36-5af0-43e3-a3ec-3e382cb4954a` | Lip Plump Treatment | SCOPE_DECISION | Preserve exact procedure list. Local-anaesthetic / needling / hyaluronic-acid scope and suitability pathway require explicit business/clinical operational acceptance before public publication. | Scope decision required |
| 28 | `29a37095-3263-4ce2-a3b5-2b6525804de5` | Derma Peel Brightening | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 29 | `c97eda93-c42f-471c-a1fc-5f35207c0c86` | GF Needling with Growth Factors under Local Anesthetic | CLAIM_DECISION + SCOPE_DECISION | Preserve source; isolate anti-aging/Botox-feeling/hydration/hyperpigmentation/acne-scarring claims and confirm anaesthetic/suitability scope. | Decision required |
| 30 | `e8c5bf09-c583-4bcc-9da9-a560180cf776` | Stretch Mark Microneedling Consultation | CLAIM_DECISION | Preserve source; isolate stretch-mark/atrophic/hypertrophic scar outcome claims. | Decision required |
| 31 | `c7b12afc-a0ba-497b-affb-ab03b2958a73` | VHC Standard Needling with Vitamins under Local Anesthetic. | CLAIM_DECISION + SCOPE_DECISION | Preserve source; isolate anti-aging/hydration/hyperpigmentation/acne-scarring claims and confirm anaesthetic/suitability scope. | Decision required |
| 32 | `3f92913f-e670-4a75-8f0a-fc2d9d401eb5` | Permanent Makeup - Eyeliner: | MECHANICAL | Exact proposal = source with one added `)` after the Thick line Top touch-up duration `2H00`; otherwise byte-for-byte unchanged. | Ready for Control approval |
| 33 | `cf51772d-9dbc-48c4-98d4-4fbc50fefbde` | Permanent Makeup - Brows: | MECHANICAL | Exact proposal = source with only the stray `)` immediately after `R2150` removed from the combined-brows touch-up line; otherwise unchanged. | Ready for Control approval |
| 34 | `f3e682e1-6a03-4623-83e6-935752b27196` | Permanant Makeup- Lips: | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 35 | `7537cf00-0777-44a0-a04a-ce2ff3fbf2a6` | Areola reconstruction | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 36 | `175c91c9-562e-4aa7-87eb-8f918462ce7f` | Waxing | VERBATIM | Publish proposal = exact source Description. | Ready for Control approval |
| 37 | `69805dfe-8238-47d2-8b1d-f154f0033e27` | HIFU (High Intensity Focused Ultrasound | CLAIM_DECISION | Preserve source; isolate lift/tighten/contour, collagen stimulation, sagging/jowls/wrinkles/elasticity, long-lasting result, no-pain and no-downtime claims. | Decision required |
| 38 | `d42f5e34-b3c1-4ff3-9206-0fc97823d02e` | Facial Lymphatic Drainage Massage | HOLD_BLANK | Exact Goldie Description is blank. Preserve blank under current D2 authority unless separately authored and approved. | Preserve blank |
| 39 | `61a0a7db-426d-4ecf-94ff-9fd6855f384d` | Full Body Swedish | CLAIM_DECISION | Preserve source; isolate soothed-muscles, improved-circulation and overall-well-being benefit claims. | Decision required |
| 40 | `068c0963-27db-418c-ad44-3a10431076b7` | Pelvic floor strengthening | CLAIM_DECISION_HIGH | Preserve source; isolate incontinence/bladder-control/post-labour/menstrual-pain/sexual-vitality treatment/outcome claims. | High-priority decision required |
| 41 | `0c86a08f-68e9-49f6-a33d-6ff5bc9870ea` | HIFU | CLAIM_DECISION_HIGH | Preserve source; isolate urinary-incontinence, pressure-leak, vaginitis, menopausal-thinning, lichen-sclerosus, sexual-function and genital-tightening treatment/outcome claims. | High-priority decision required |
| 42 | `9f2f6452-f1ce-4525-88f2-3dc57f74caa6` | Quick Relieve: Back & Neck (45 min) | HOLD + CLAIM_DECISION | Source ends with an incomplete consent parenthetical. Do not invent completion. Separately isolate tension/soothing/posture-related benefit wording. | Exact wording + claim decision required |
| 43 | `2d5b6147-ee9f-4a97-8e27-6270751c2673` | Targated Area Specific Sports Massage | CLAIM_DECISION + MECHANICAL | Draft name correction `Targated` → `Targeted` only; preserve Description source. Isolate pain-reduction/recovery/mobility/performance claims. | Decision required |
| 44 | `b5c96105-f534-406d-89ec-68e78c65cf8b` | Upper Back, Neck & Jaw Release | HOLD + CLAIM_DECISION | Source contains demonstrably corrupted fragments and must not be repaired by inference. Exact business/source rewrite required for those fragments; symptom/outcome claims remain claim-level decisions. | Exact wording + claim decisions required |
| 45 | `21a1fc85-6a5b-433e-b689-7bff12c7e2af` | Hot Stone Masage | HOLD + CLAIM_DECISION | Source contains `can ca fatigue`; do not autocomplete. Exact correction required; circulation/fatigue/fluid/lactic-acid physiology claims remain claim-level decisions. | Exact wording + claim decisions required |
| 46 | `406d85e9-4d36-42d3-9611-ab1834038662` | Soothing & Restorative Pregnancy Massage | CLAIM_DECISION | Preserve source; isolate safety/suitability, pain/discomfort relief and circulation claims. | Decision required |
| 47 | `729fc549-c353-48ac-9cbc-abba4cc2ed66` | Renew & Revive Leg and Foot Massage | HOLD + CLAIM_DECISION | Source contains broken fragments and stray symbols; do not infer replacements. Exact corrected wording/retained-trivia decision required; circulation/tension claims remain claim-level decisions. | Exact wording + claim decisions required |
| 48 | `1d734e8b-d21e-44c3-9a3f-b2a7165a7787` | Full Body Sports Massage | HOLD_BLANK_RETIRED | Retired service Description remains intentionally blank. Do not author or publish replacement wording. | Final preserve blank |
| 49 | `b39dcaf1-7894-40e0-8a51-c7ab4eba553a` | Lower Back & Hip & Psoas Release | HOLD_SOURCE_TRUTH | Exact source/editor text is 1,000 characters ending `deep physica`; missing tail unresolved. Do not autocomplete. Goldie Support/backend history remains the truth gate. Claim review occurs only after source truth closes. | External source gate |
| 50 | `409ef0e8-2063-47b2-86db-ca0af30787de` | Cupping Area Specific | CLAIM_DECISION | Preserve source; isolate muscle-tension relief, circulation and healing claims. | Decision required |
| 51 | `6a0c9c5e-d7e7-4a82-8795-e8281a0bd526` | Bamboo Sports Massage Area Specific | HOLD_IDENTITY + CLAIM_DECISION | Description says Full Body while service is Area Specific. Do not infer correct identity/copy. Once identity is confirmed, isolate inflammation/circulation/lymphatic-flow/mobility/recovery claims at claim level. | Business truth gate |
| 52 | `90baece3-1520-4368-b772-eaba08e1a511` | Lymphatic Drainage Reset Package | HOLD_BLANK | Exact Goldie Description is blank. Preserve blank under current D1 authority unless separately authored and approved. Service-photo wording is not Description source and must not be copied by inference. | Preserve blank |

## Aggregate disposition

The matrix intentionally distinguishes drafting readiness from publication authority.

- `VERBATIM`: 17 rows.
- `MECHANICAL` ready for Control approval without a substantive truth gate: 2 rows (#32, #33).
- `CLAIM_DECISION` / `SCOPE_DECISION` rows: source preserved; only named claims/scope questions remain for decision.
- `HOLD` rows: publication cannot be finalized without source/truth/corruption resolution.
- Exact blanks remain blanks unless a separate authoring decision is made.

The previous 33-row exception workbook remains preserved evidence, but its former blanket medical-claim hold logic is superseded/narrowed by PR #415/#436. This matrix also adds the Toe Gel six-week durability sentence to claim-level review because the current policy applies objective duration claims consistently across the full 52-service population.

## Recommended sequencing

If this were my project, I would approve in three controlled waves rather than wait for every exception:

1. **Wave A — low-risk exact-source set:** approve the 17 VERBATIM rows plus the two deterministic punctuation-only rows (#32/#33). These require no source reconstruction and no substantive wording rewrite.
2. **Wave B — claim-level set:** decide only the isolated objective claims/scope points while preserving each unaffected source Description verbatim. Personal phone lines remain excluded.
3. **Wave C — truth/corruption set:** keep Psoas, Bamboo, the two active blanks and genuinely corrupted/incomplete rows fail-closed until exact source/business truth exists.

This sequencing should be done **now**. It preserves useful client information and prevents a small number of hard gates from blocking the clean majority.

## Authorization boundary

This file is a drafting/review artifact only. It does not authorize publication or mutation. Final publication requires a separate Control/business approval that identifies the exact approved rows and all claim-level dispositions. Any subsequent implementation must verify the current catalogue/source target before writing and must reconcile the resulting durable public-catalogue state.