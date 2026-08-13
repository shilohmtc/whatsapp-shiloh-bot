# Shiloh OS — Client Perspective Reconciliation Delta — 2026-08-13

Status: subordinate reconciliation evidence for `docs/SHILOH-OS-MASTER-STATUS.md`; it does not replace the Master. The Master itself was not partially overwritten because the connected GitHub complete-file write surface could not safely carry the full ledger. Fold this delta into the Master at the next safe complete-file reconciliation opportunity.

## Authority and baseline

Operational truth remains GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human evidence.

As of this reconciliation, GitHub `main` and Render production are positively aligned on `e5c73a626f83c18f3641f7724ed4fec73dc4cfb7` from PR #174 (`Fix client availability practitioner query`). Render deploy `dep-d9v0roht0dsc73bo8lt0` is `live`.

## Real Dummy Test evidence already established

The real dedicated Dummy Test WhatsApp journey positively established all of the following:

- an unregistered inbound WhatsApp number is detected without asking the client to re-enter that number;
- first-time registration accepted the bundled reply `Dummy Test, 14 May 1990, Female`;
- registration transitioned directly into booking discovery;
- the genuine four-family list displayed `Beauty & Aesthetics`, `Massage`, `Lymphatic Drainage`, and `Elim MediHeel Pedicures`;
- selecting Beauty & Aesthetics routed to the Marietjie-owned family and client-friendly treatment prompt;
- the real Beauty & Aesthetics treatment list opened with CRM-derived treatment rows, durations, price display data, and pagination;
- after PR #172 deployed, real WhatsApp re-acceptance verified materially more readable long treatment names, consistently formatted simple Rand prices/ranges, and explicit `Next treatments →` / `Go to page 2 of 4` navigation;
- Dummy Test selected **HIFU**, and Shiloh correctly presented **Practitioner: Marietjie** plus Today/Tomorrow/date input before the availability lookup defect described below occurred.

These are explicit real acceptance facts and must not be downgraded back to code-only status in later reconciliation.

## Treatment-list presentation defect and repair

The real Beauty & Aesthetics treatment list originally exposed a presentation defect:

- long canonical treatment names were heavily truncated by the 24-character WhatsApp row-title limit;
- simple price/range values were displayed inconsistently, including examples such as `R1250 - R2200`, `1000 - 1200`, `350 - 450`, and `R500-R1250`;
- the navigation row `More treatments →` with description `Page 2 of 4` was ambiguous about whether it described the current page or the destination.

PR #172 repaired only this presentation surface. The deployed adapter preserves materially more canonical treatment-name text in the row description, normalizes only simple numeric amount/range strings into consistent Rand presentation, preserves non-numeric CRM `display_price` text unchanged, uses explicit next-page destination copy, and preserves stable interactive IDs. Real WhatsApp re-acceptance subsequently passed.

The service-family CRM selection SQL, family ownership rules, practitioner eligibility predicates, booking-intent semantics, and canonical CRM data were not changed by PR #172.

## Availability lookup defect and production repair

After HIFU → Marietjie, Dummy Test selected **Tomorrow**. Real production returned the generic `Sorry, I'm having trouble responding right now. Please try again in a moment.` response. Render application logs established the exact cause rather than treating this as a no-slot result:

- request time: 2026-08-13 20:23 South Africa time;
- PostgreSQL error `42P10`: `for SELECT DISTINCT, ORDER BY expressions must appear in select list`;
- failure location: `resolveEligibleStaff()` in `src/services/clientBookingAvailability.js`, called by `authoritativeSlotsForIntent()`;
- the failing query selected `DISTINCT st.id, st.display_name` while ordering first by `CASE LOWER(st.display_name) ...`, which PostgreSQL rejects under DISTINCT unless the ORDER BY expression is part of the select list;
- no booking was created and no availability conclusion may be inferred from that failed request.

PR #174 repaired this query without weakening CRM truth. It replaced `SELECT DISTINCT` with ordinary selection plus `GROUP BY st.id, st.display_name`, preserving deduplication while leaving `staff_services`, active practitioner status, `resource_type = 'practitioner'`, `client_bookable = TRUE`, therapist scoping and staff ordering intact.

Self-test-first evidence is explicit:

- commit `b8b15980088b7924d0ab7338c3bb1a87bf643536` added the regression before implementation;
- PR CI #429 failed with the regression against the pre-fix query;
- implementation commit `db6becbde2b8efa481149c014f3fc0709753911a` applied the narrow SQL correction;
- PR CI #430 completed successfully on the corrected branch candidate;
- final PR patch inspection showed only the query correction plus the regression test;
- PR #174 squash-merged as `e5c73a626f83c18f3641f7724ed4fec73dc4cfb7`;
- Render auto-deployed that exact SHA and deployment `dep-d9v0roht0dsc73bo8lt0` reached `live`.

## Current Product-Critical Gate

Client Perspective Testing remains 🔵 ACTIVE / PRODUCT-CRITICAL. Engineering deployment does not close real availability acceptance.

The exact next real WhatsApp evidence is to continue the **same Dummy Test HIFU → Marietjie booking intent** and re-enter the availability step for the already-selected future date. Do not reset Dummy Test and do not repeat already accepted registration/catalogue work unless the client UI itself requires re-opening the treatment flow to refresh state. The production outcome must now be either authoritative available slots or an authoritative no-slot response—not the prior SQL exception.

If availability succeeds, continue the same journey through slot selection → booking → canonical CRM appointment → Google Calendar mirrors → real WhatsApp confirmation → view booking → reschedule → cancellation → lifecycle/template communications. Any new shared-path defect becomes the immediate engineering priority; never bypass it by direct CRM or Calendar mutation.

## WAITING / fail-closed preservation

No unavailable truth was promoted by this reconciliation:

- A1 remains WAITING for genuine Completed / No-show truth for the six known Christel/Abigail attendance finalizations;
- A3 and D1 remain provider-state verification gates until exact Meta template status is positively established;
- E1 Ozow remains WAITING for merchant/account configuration and explicit payment/deposit/refund/gift-voucher rules;
- destructive privacy execution remains disabled;
- CRM catalogue/practitioner eligibility remains authoritative and fail-closed; no treatment or practitioner may be invented from presentation copy;
- the failed Tomorrow request is not evidence of Marietjie's availability or unavailability.

## Reconciliation instruction

`docs/SHILOH-OS-PROJECT-TRACKER.md` is reconciled alongside this delta. This file must be folded into `docs/SHILOH-OS-MASTER-STATUS.md` when the connector can safely perform a complete Master-file write; until then it is a clearly subordinate delta, not a competing master ledger.
