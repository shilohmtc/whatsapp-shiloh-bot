# Shiloh OS — Reconciliation — Goldie Wave B Publication Decision

Date: 2026-08-24
Owning workstream: 00 — Control & Reconciliation
Implementation owner: 20 — CRM & Identity
Status: 15 CLAIM-LEVEL ROWS APPROVED FOR BOUNDED IMPLEMENTATION / 5 ROWS HOLD / WAVE C FAIL-CLOSED
Publication mutation performed by this reconciliation: none

## Authority verified

Control independently verified current GitHub `main` at `2109bebf87a187aff0030ff7d94d07bd405112ba`, where PR #446 records Wave A as verified live / complete / do not redo. PR #445 and migration `075_goldie_wave_a_customer_descriptions.sql` remain the guarded publication implementation pattern.

Control re-read the PR #441 publication decision, PR #440 52-row drafting matrix, PR #415/#436 exact-source-first policy, current Engineering Governance, current Master/Tracker state, the retained hashed Goldie source transcription from `export (33).csv` SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16`, and PR #442's exact Wave B draft artifact.

PR #442 remains an unmerged drafting artifact and is not authority. Its Wave A hold analysis was superseded by PR #445/#446. Its Wave B text was reviewed as proposal evidence only.

A bounded repository search found no newer retained operational/scope authority for the three scope-gated rows and no qualified clinical/compliance substantiation for the two high-risk rows. Those gates remain closed.

## Governing review rule

PR #441 remains binding:

- rewrite objective claim material at claim level by default;
- remove a claim where neutral wording would still assert an unsupported objective result;
- preserve unaffected intact source wording wherever practical;
- remove practitioner personal contact fragments;
- do not invent source, treatment identity, suitability, or clinical truth;
- Wave C remains fail-closed.

Control found that PR #442's safety direction was correct, but five drafts changed more unaffected wording than necessary or introduced new process framing not present in source. Those five are marked `REWRITE` below and replaced here with exact Control-approved final wording. The remaining ten are approved exactly as drafted in PR #442.

## Per-row Wave B decision

### 1. `e4510fa9-579f-46dd-8fff-107c00748597` — Medi-Heel Pedicure (No Gel Toes) & Foot Massage

**Decision: REWRITE — exact replacement below is APPROVED.**

Reason: PR #442 correctly removed unsupported medical/safety/outcome claims but unnecessarily rewrote unaffected descriptive structure.

Exact approved final description:

```text
An Elim MediHeel callus removal pedicure is a premium, 9-step treatment focused on stubborn, thick, and dead skin on the heels without blades. Using a specialized alkaline callus tonic, this restorative, luxurious spa experience includes ingredients like urea and AHA.
Key Features and Treatment Elements
• No Blades/Filing: Uses a keratolytic alkaline solution as part of the callus-care process.
• Tonic Application: A 10-minute application of the tonic forms part of the treatment.
• Treatment Ingredients: Features Alpha
Hydroxy Acids (AHA) and Urea as part of the treatment protocol.
```

The approved mechanical repair `blades.Using` → `blades. Using` is subsumed by this claim-level sentence rewrite. No `medical-grade`, `safe`, callus-dissolving, guaranteed-result or long-lasting-result assertion may be restored.

### 2. `8814ad67-f670-4c4b-ae22-2cb1233afb96` — Toe Gel Application

**Decision: REWRITE — exact replacement below is APPROVED.**

Reason: preserve the source's unaffected `lightweight, fast-drying` process wording while removing strength/duration guarantees.

Exact approved final description:

```text
Tone Gel is a lightweight, fast-drying gel application for colour and shine, providing a polished nail finish.
+- 200 colours to choose from
```

No six-week, chip-resistant, nail-strength or long-lasting guarantee may be restored without retained support.

### 3. `b534a8e5-3fe1-46e9-9ca0-bba116e6bf53` — Medi-Heel Pedicure (With Gel Toes) & Foot Massage

**Decision: APPROVE** PR #442 exact draft.

Exact approved final description:

```text
Medi-Heel Pedicure offers a blade-free 9-step foot-care treatment using AHA and urea, focused on callus care and hydration. Topped up with a Gel Application for colour and a polished finish.
```

### 4. `074c7773-2e78-4761-a9c6-c72dc02f7994` — Profosma Jet Plasma

**Decision: REWRITE — exact replacement below is APPROVED.**

Reason: PR #442 introduced assessment/suitability planning language not present in the attributable source. Neutralize claims without inventing a new process.

Exact approved final description:

```text
Purpose: This is a non-surgical plasma-based aesthetic treatment for the face and body. It uses cold, low-atmospheric plasma. The device works without needles or anesthesia.

Face, Neck, Decolletage treatment:

Face to Jawline R5500 (1 Cycle = 3 treatments) 1h30 per treatment
Neck & decolletage R5500 (1Cycle = 3 treatments) 1h30 per treatment
R8500 (2 Cycles = 6 treatments)
R12500 (3 Cycles = 9 Treatments)

Body Treatment:
Consultation R400 (30Min)
```

No zero-downtime, collagen/elastin stimulation, acne/pigmentation/sagging efficacy, visible-result, long-lasting-result, or efficacy-based cycle recommendation may be restored without retained support.

### 5. `9726c400-234d-489a-9e5c-d247c21e4a85` — Plasma Fybroblast

**Decision: REWRITE — exact replacement below is APPROVED.**

Reason: PR #442 correctly removed contact and unsupported claims but added new consultation/planning wording and removed a source-described treatment response that was not part of the isolated claim set.

Exact approved final description:

```text
Plasma Fybroblast
Purpose: Fybroblast therapy is a plasma-based aesthetic treatment using a pen-like device that creates a small electric arc (plasma) just above the skin under local anesthesia. Plasma creates small, controlled superficial treatment points on the skin.

Tiny carbon crusts form on the spots treated, which typically fall off within a few days.
```

Practitioner personal contact remains excluded. No immediate tissue-contraction, collagen/elastin-production, rejuvenation, wrinkle/lesion-removal, optimal-result, treatment-count efficacy, or three-year-duration claim may be restored without retained support.

### 6. `49730b6c-133d-4e60-b98c-d33a1091d02d` — Pressotherapy Single Session

**Decision: APPROVE** PR #442 exact draft.

```text
Pressotherapy is a non-invasive compression treatment using a specialized suit fitted over the limbs and abdomen and connected to a controlled air-pressure system. During the session, the suit gently inflates and deflates in a rhythmic sequence, creating a massage-like compression experience.
```

### 7. `8d5ee63d-8caa-45aa-b2d3-2a91d2478672` — Ozone & Far Infrared Therapy

**Decision: REWRITE — exact replacement below is APPROVED.**

Reason: PR #442 introduced `wellness treatment` positioning not present in source. Remove unsupported recovery claims and contacts without adding a new characterization.

```text
Ozone & Far Infrared Therapy.
Packages available.
```

Both practitioner-contact fragments remain excluded. No illness, injury, muscle-recovery or post-surgery recovery claim may be restored without retained support.

### 8. `c830d602-0e71-499e-9348-114584c8a985` — SQT Anti-Aging Rejuvenation / Revitalizing Beauty BioMicroneedling

**Decision: APPROVE** PR #442 exact draft.

```text
1. SQT Anti-Aging Rejuvenation BioMicroneedling
Treatment focus:
• Mature-skin rejuvenation
• Fine-line and wrinkle appearance
• Firmness-focused skincare

Skin types/concerns considered during consultation:
• Mature Skin
• Dry Skin
• Sensitive Skin
• Combination Skin
R2585 (Full Face to Jawline) (1H30)
R2585 (Jawline to Breast) (1H30)

2. SQT Revitalizing Beauty BioMicroneedling
Treatment focus:
• Texture and tone-focused skincare
• Pigmentation appearance
• Revitalising skincare

Skin types/concerns considered during consultation:
• Hyperpigmentation
• Oily Skin
• Sensitive Skin & Compromised Skin
• Combination Skin
R1785(Full Face to Jawline) (1H30)
R1785 (Jawline to Breast) (1H30)
```

### 9. `46043512-d1df-4169-92b4-132160fca809` — Sports Massage Full Body

**Decision: APPROVE** PR #442 exact draft.

```text
A full-body sports massage using focused massage and stretch techniques across multiple muscle groups. The session is tailored to the client’s activity level, areas of tension, comfort and treatment goals.
Ideal for athletes, active individuals, or clients seeking focused bodywork across the full body.
```

### 10. `e8c5bf09-c583-4bcc-9da9-a560180cf776` — Stretch Mark Microneedling Consultation

**Decision: APPROVE** PR #442 exact draft.

```text
Purpose: Consultation to assess stretch-mark or scar concerns, discuss microneedling suitability, treatment planning and pricing.
Pricing on consultation R400 (30 min consultation)
```

### 11. `69805dfe-8238-47d2-8b1d-f154f0033e27` — HIFU (High Intensity Focused Ultrasound)

**Decision: APPROVE** PR #442 exact draft.

```text
Face, Neck & Decolletage
Purpose: HIFU (High Intensity Focused Ultrasound) is an ultrasound-based aesthetic treatment for the face, neck and decolletage. The treatment area, suitability and session plan are confirmed during assessment.

R2950 (Full Face to Jawline)
R900 (Neck)
Pre & Post in salon treatments included.
```

### 12. `61a0a7db-426d-4ecf-94ff-9fd6855f384d` — Full Body Swedish

**Decision: APPROVE** PR #442 exact draft.

```text
Experience a relaxing 90-minute full body Swedish massage using gentle, rhythmic strokes tailored to your comfort and preferences.
```

### 13. `2d5b6147-ee9f-4a97-8e27-6270751c2673` — Targeted Area-Specific Sports Massage

**Decision: APPROVE** PR #442 exact draft.

The already-approved mechanical service-name correction `Targated` → `Targeted` remains authoritative.

```text
Targeted Area Specific Sports Massage uses focused sports-massage techniques on a selected body area, tailored to the client’s comfort, activity level and treatment goals.
```

### 14. `406d85e9-4d36-42d3-9611-ab1834038662` — Soothing & Restorative Pregnancy Massage

**Decision: APPROVE** PR #442 exact draft.

```text
A gentle full body soft-touch massage designed for pregnancy. Performed in a side-lying position with pregnancy pillows for comfort, the treatment focuses on areas such as the lower back and hips and uses slow, flowing massage movements for a calm, supportive treatment experience.
```

This is descriptive positioning only; it is not a blanket pregnancy safety/suitability guarantee.

### 15. `409ef0e8-2063-47b2-86db-ca0af30787de` — Cupping Area Specific

**Decision: APPROVE** PR #442 exact draft.

```text
Experience our Cupping Area Specific therapy, using cupping techniques on a selected body region as part of a focused bodywork session. Treatment is tailored to the client’s comfort and treatment goals.
```

## HOLD rows — no publication authority

### `367dbc36-5af0-43e3-a3ec-3e382cb4954a` — Lip Plump Treatment
**Decision: HOLD.** No newer authoritative operational/suitability pathway was found for local anaesthetic, needling and hyaluronic-acid procedure scope.

### `c97eda93-c42f-471c-a1fc-5f35207c0c86` — GF Needling with Growth Factors under Local Anesthetic
**Decision: HOLD.** Anaesthetic/procedure/suitability scope remains unverified; objective outcome claims remain subject to the neutral-redraft rule.

### `c7b12afc-a0ba-497b-affb-ab03b2958a73` — VHC Standard Needling with Vitamins under Local Anesthetic
**Decision: HOLD.** Same unresolved anaesthetic/procedure/suitability gate.

### `068c0963-27db-418c-ad44-3a10431076b7` — Pelvic floor strengthening
**Decision: HOLD.** No retained qualified clinical/compliance review or substantiation was found for the pelvic-health treatment/outcome claims, and no exact neutral replacement is approved by this decision.

### `0c86a08f-68e9-49f6-a33d-6ff5bc9870ea` — intimate HIFU
**Decision: HOLD.** No retained qualified clinical/compliance review or substantiation was found for urinary/vaginal/lichen-sclerosus/sexual-function/genital-tightening claims, and no exact neutral replacement is approved by this decision.

## Exact implementation authorization

CRM & Identity is authorized to implement **exactly the 15 approved descriptions above and no other Wave B row** using the established PR #445 guarded catalogue-publication pattern.

Before mutation, CRM must independently verify:

- current GitHub `main` and newer authority;
- all 15 exact Goldie UUID → canonical CRM target mappings;
- current description preconditions and source/checksum evidence;
- no source or target drift;
- active/inactive/public-catalogue state is preserved unless separately authorized;
- non-target descriptions and practitioner mappings remain unchanged.

Implementation must fail closed on missing/duplicate target, mapping drift, unexpected current description, source/checksum mismatch, or any row outside the exact 15.

Do not create a generic SQL endpoint, arbitrary SQL path, startup dispatcher, broad database permission or new publication mechanism. Reuse the exact-ID/checksum/precondition/transaction/postcondition guarded pattern from PR #445.

No practitioner personal phone/contact detail may be restored.

## Wave C remains fail-closed

All PR #441 Wave C gates remain unchanged, including Psoas missing-tail truth, Bamboo Area Specific vs Full Body identity, blank-description preservation, corrupted/incomplete-source gates, and retired Sports Massage blank preservation.

## Recommendation and priority

**Recommended option: implement the exact 15-row approved Wave B set now.**

If Shiloh OS were my own project, I would publish these 15 neutral, bounded descriptions now using the proven PR #445 pattern, while keeping the five scope/high-risk rows and all Wave C rows held. This improves catalogue completeness without weakening clinical, source-truth or authorization gates.

Owner and sequence: **20 — CRM & Identity is next**, immediately after this Control reconciliation. No other workstream should build a new write mechanism.

## Completed / do not redo

- Wave A through PR #445/#446 and migration 075 — COMPLETE / VERIFIED LIVE / DO NOT REDO.
- PR #392/#393 source/export/editor evidence — DO NOT REDO.
- PR #415/#436 exact-source-first policy — preserve.
- PR #440 52-row matrix — preserve.
- PR #441 Wave A/B/C Control authority — preserved and narrowed here only for the exact Wave B final wording.
- Psoas/Bamboo/blank/corruption Wave C gates — preserve.

## What this now enables

Shiloh OS now has an exact, review-complete **15-row Wave B publication set** that CRM & Identity may implement without returning to Control for another wording round, provided the pre-write target/source checks pass. The five scope/high-risk rows are still unavailable for publication, and Wave C remains blocked. This is publication authorization for these exact descriptions only; it is not general database-write authority.
