# Shiloh OS — Master Status Addendum — Goldie Exact-Source-First Description Policy

Date: 2026-08-24
Owning workstream: Control & Reconciliation
Status: VERIFIED DURABLE BUSINESS POLICY

## Durable current authority

PR #415 / merge `626b23d00871dc78c498e42baaffe7eeb11546ef` ratifies the reviewable **exact-source-first** business policy for Goldie service descriptions after explicit refresh against the newer repository authority.

The durable contract is:

1. Intact, attributable Goldie service descriptions remain verbatim by default when preparing client-facing publication proposals.
2. Accurate source wording is not rewritten merely for tone or generic caution because it discusses treatment or therapeutic purpose.
3. Objectively testable medical, therapeutic, efficacy, recovery, safety, outcome, physiological or duration claims are assessed at the specific-claim level.
4. Where adequate retained support exists, exact source wording may remain.
5. Unsupported or disputed objective claims return to Control/business for an explicit keep/rewrite/remove decision; the remainder of an intact description is not automatically neutralized or withheld.
6. Missing, truncated or corrupted source is never invented or auto-completed.
7. Practitioner personal phone numbers remain excluded from public descriptions.
8. Mechanical corrections remain controlled and preserve source wording otherwise.
9. Demonstrably corrupted or misplaced text requires controlled exception handling and exact approval.
10. Policy ratification and drafting authority are separate from publication authority. PR #415 does not authorize a bulk or individual publication mutation.

## D1-D11 reconciliation

Preserve D1-D4, D6-D7 and D9-D10 where still applicable.

D5, D8 and D11 are narrowed by the newer exact-source-first policy:

- **D5:** Psoas remains unpublished because its exact source is truncated at 1,000 characters and the tail is unresolved. This source-truth gate remains fail-closed, but intact attributable treatment wording is not subject to blanket neutralization.
- **D8:** Bamboo remains blocked until Area Specific versus Full Body treatment identity is confirmed. Once correct source identity exists, claims are reviewed individually rather than wholesale-neutralized.
- **D11:** objective clinical/treatment claims require claim-level support/review. Supported exact wording may remain; unsupported/disputed claims require explicit business disposition. The presence of such claims alone does not require withholding an otherwise intact whole description.

## Preserved evidence and gates

- PR #392/#393 source/export/editor evidence is authoritative and **DO NOT REDO**.
- The two active lymphatic Description fields remain confirmed blank unless separately authored and approved.
- Retired Full Body Sports Massage remains intentionally blank.
- Psoas source remains exactly 1,000 characters ending `deep physica`; missing tail remains unresolved and must not be invented.
- Bamboo Area Specific versus Full Body remains a truth gate.
- No publication mutation is authorized until CRM & Identity returns the exact proposed publication set and Control/business approves the applicable final descriptions/claim dispositions.

## Separation from imported-contact identity authority

The completed imported-contact / CRM identity remediation through PR #435 is separate and remains **COMPLETE / DO NOT REDO**. `goldie_import` client creation/import provenance and durable client verification are not service-description publication authority. PR #415 changes none of Gate 1, Gate 2, the 552 archived legacy zero-history imported records, the intentionally verified remaining active zero-history imported client, or migrations 072/074.

## Verification evidence

- Refreshed PR #415 head: `d9d7fafad6dd36d570e095defd3f74dc9953e33e`.
- CI #1314 / workflow `32704504780` / job `97362648061`: Node 24.14.1, non-mutating regression 901/901 passed.
- Merge: `626b23d00871dc78c498e42baaffe7eeb11546ef`.
- Exact Render auto-deploy: `dep-da5vmt3bc2fs73b6rpag`, **LIVE** on that merge commit.

## Next owner

**CRM & Identity** prepares the exact-source-first drafting/publication matrix from preserved PR #392/#393 evidence and returns the exact proposed publication set to Control & Reconciliation. This is drafting/review work only; publication remains separately controlled.
