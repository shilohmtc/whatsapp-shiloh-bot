# Shiloh OS — Master Status Addendum — Goldie Wave B Publication Decision

Date: 2026-08-24
Authority type: durable catalogue publication authority
Owner: 00 — Control & Reconciliation
Implementation owner: 20 — CRM & Identity
Status: 15 EXACT DESCRIPTIONS AUTHORIZED / IMPLEMENTATION PENDING / 5 ROWS HOLD / WAVE C FAIL-CLOSED

## Durable current state

Wave A remains COMPLETE / VERIFIED LIVE / DO NOT REDO under PR #445/#446 and migration `075_goldie_wave_a_customer_descriptions.sql`.

Control has now completed the required Wave B wording review. Exactly 15 claim-level Wave B rows have exact final descriptions approved for bounded CRM implementation. The exact descriptions are recorded in:

`docs/SHILOH-OS-RECONCILIATION-2026-08-24-GOLDIE-WAVE-B-PUBLICATION-DECISION.md`

This changes the prior durable state that described all Wave B wording as drafting/redraft only. It does not record the 15 descriptions as live; implementation and production verification are still pending.

## Exact authorized Wave B IDs

- `e4510fa9-579f-46dd-8fff-107c00748597`
- `8814ad67-f670-4c4b-ae22-2cb1233afb96`
- `b534a8e5-3fe1-46e9-9ca0-bba116e6bf53`
- `074c7773-2e78-4761-a9c6-c72dc02f7994`
- `9726c400-234d-489a-9e5c-d247c21e4a85`
- `49730b6c-133d-4e60-b98c-d33a1091d02d`
- `8d5ee63d-8caa-45aa-b2d3-2a91d2478672`
- `c830d602-0e71-499e-9348-114584c8a985`
- `46043512-d1df-4169-92b4-132160fca809`
- `e8c5bf09-c583-4bcc-9da9-a560180cf776`
- `69805dfe-8238-47d2-8b1d-f154f0033e27`
- `61a0a7db-426d-4ecf-94ff-9fd6855f384d`
- `2d5b6147-ee9f-4a97-8e27-6270751c2673`
- `406d85e9-4d36-42d3-9611-ab1834038662`
- `409ef0e8-2063-47b2-86db-ca0af30787de`

Publication authority is limited to the exact approved text. It is not general permission to edit these descriptions further or to mutate unrelated catalogue/database state.

## Rows still held

The following remain unavailable for publication:

- `367dbc36-5af0-43e3-a3ec-3e382cb4954a` — unresolved local-anaesthetic/needling/hyaluronic-acid operational and suitability scope;
- `c97eda93-c42f-471c-a1fc-5f35207c0c86` — unresolved anaesthetic/procedure/suitability scope;
- `c7b12afc-a0ba-497b-affb-ab03b2958a73` — unresolved anaesthetic/procedure/suitability scope;
- `068c0963-27db-418c-ad44-3a10431076b7` — pelvic-health clinical claims lack retained qualified review/substantiation or an approved neutral final description;
- `0c86a08f-68e9-49f6-a33d-6ff5bc9870ea` — intimate-HIFU clinical claims lack retained qualified review/substantiation or an approved neutral final description.

## Wave C and privacy boundaries

All PR #441 Wave C gates remain fail-closed and unchanged:

- do not infer Psoas missing text;
- do not infer Bamboo Area Specific vs Full Body identity/copy;
- preserve confirmed blank descriptions unless separately authored and approved;
- preserve retired Sports Massage blank;
- do not reconstruct corrupted or incomplete source wording by inference;
- do not restore practitioner personal phone/contact details.

## Implementation mechanism

CRM & Identity must reuse the guarded publication pattern established by PR #445: exact target IDs, source/checksum binding, explicit current-state preconditions, bounded transaction, postconditions, and fail-closed behavior.

Do not create a generic SQL endpoint, arbitrary SQL write path, startup maintenance dispatcher, broad database role or new publication mechanism.

The currently known Render read-only PostgreSQL connector TLS limitation remains a separate capability issue and must not be weakened or misrepresented as solved by this publication authority.

## Reconciliation boundary

This Master addendum records **authorized future publication state**, not verified-live Wave B content. Once CRM implements and production verifies the exact 15 descriptions, CRM must reconcile the Master again to record the verified live catalogue state and implementation evidence.
