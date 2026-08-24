# Shiloh OS — Reconciliation — Goldie Wave A Gate + Wave B Redraft

Date: 2026-08-24
Owning workstream: 20 — CRM & Identity
Decision owner / next owner: 00 — Control & Reconciliation
Status: WAVE A BLOCKED PRE-WRITE / WAVE B REDRAFT COMPLETE / NO PUBLICATION MUTATION

## Authority reviewed

CRM independently re-read the current GitHub authority at `5ab9a79340bc368f7141934229f8a2ac20dde497`, including Engineering Governance, current Master/Tracker authority, PR #440 matrix, PR #441 Control reconciliation and the existing catalogue implementation.

The canonical CRM-backed public description target is `services.customer_description`. The public `/book` catalogue loads only services that are `active` and have at least one active practitioner mapping with `client_bookable = TRUE`. Canonical Goldie mapping is preserved by `services.external_source = 'goldie'` plus exact `services.external_id`.

The existing safest repository mechanism for a bounded catalogue data mutation is a specifically named, checksum-tracked migration/bootstrap with transactional preconditions and postconditions. Production does not automatically apply every pending migration at normal startup. No generic SQL endpoint, arbitrary SQL path, broad credential, startup migration dispatcher or new infrastructure surface is required or authorized.

## Wave A pre-write gate — BLOCKED

PR #441 authorizes an exact 20-row Wave A set: 18 VERBATIM rows plus 2 deterministic mechanical rows. One of those exact rows is Goldie ID:

`175c91c9-562e-4aa7-87eb-8f918462ce7f` — `Waxing`.

However, current durable CRM authority independently preserved by the Project Tracker and PR #386 requires the broad historical `Waxing` service to remain **inactive, unmapped and non-bookable**, with its linked historical appointments preserved. It must not be reactivated, replaced or remapped by inference.

Those two authorities cannot both be satisfied as written because the public `/book` catalogue requires an active service with an active client-bookable practitioner mapping. Therefore:

- reactivating/remapping the Waxing row would breach the durable Waxing preservation authority;
- silently excluding Waxing would alter Control's exact 20-row implementation authority;
- CRM must fail closed before the first production write.

**No Wave A service description, service status, practitioner mapping, CRM row, appointment, Calendar event, WhatsApp state or provider content was changed.**

## Production verification constraint

CRM attempted the available first-party **read-only** Render PostgreSQL query capability against only the exact 20 authorized Goldie IDs to satisfy the current-value/mapping preflight. The connector failed before SQL execution with the already-known TLS integration defect (`unexpected EOF` / server requires SSL/TLS).

CRM did not weaken TLS, did not retry through an unsafe route, and did not create any write capability. This connector defect does not itself authorize bypassing the Wave A conflict; the decisive block is the contradictory current Waxing authority above.

## Recommended Control disposition

**Recommended now:** hold/remove the broad historical Waxing row from Wave A and ratify the remaining 19 exact rows for bounded CRM implementation, while explicitly preserving the current inactive/unmapped/non-bookable Waxing authority.

If Shiloh OS were my own project, this is the option I would choose. It is the least invasive resolution, avoids resurrecting a broad historical service or inventing a practitioner mapping, preserves historical appointment semantics, and lets the otherwise clean publication set proceed.

The alternative — make broad Waxing public — should not be done unless Control explicitly supersedes the prior preservation decision and separately defines the intended active status and exact practitioner/client-bookable mapping.

Owner/sequence: 00 Control decision first; then 20 CRM implementation of the newly ratified exact set. This remains the current primary sequence.

## Wave B exact redraft — COMPLETE / NOT AUTHORIZED FOR PUBLICATION

CRM prepared the requested exact neutral redraft proposal for the 15 claim-level rows in:

`docs/SHILOH-OS-GOLDIE-WAVE-B-EXACT-REDRAFT-2026-08-24.md`

The proposal removes or neutrally rewrites unsupported objective efficacy, physiological, recovery, safety, outcome and duration claims; applies the already-approved `blades.Using` → `blades. Using` and `Targated` → `Targeted` corrections where applicable; and excludes practitioner personal contact fragments.

Wave B remains **publication not authorized**. Control must return an explicit per-row approve/rewrite/hold disposition before any Wave B publication.

Scope-gated Lip Plump / GF Needling / VHC Needling, the high-risk Pelvic Floor / Intimate HIFU rows, and all Wave C truth/blank/corruption gates remain unchanged and fail closed.

## Completed / do not redo

Do not redo:

- PR #392/#393 exact source/export/editor verification;
- completed 52-service comparison;
- PR #415 exact-source-first policy;
- PR #436 policy reconciliation;
- PR #440 drafting matrix except its already-corrected aggregate count;
- PR #441 Control decision itself;
- Psoas truncation evidence;
- Bamboo identity evidence;
- two active lymphatic blank Description facts;
- retired Full Body Sports Massage blank;
- imported-contact remediation through PR #435;
- Gate 1 / Gate 2 / Stage 1 / Stage 2;
- migrations 072/074;
- PR #386 Marietjie detailed waxing audit / broad Waxing preservation authority.

## Reconciliation

Project Tracker reconciliation: a dated addendum is included with this unit.

Master Status reconciliation: reviewed. **No Master mutation is required in this CRM unit because no live catalogue or production authority changed.** If Control changes the exact publication authority, Control should reconcile that decision; if the subsequent CRM implementation changes live public catalogue state, that implementation must reconcile Master Status.

## Next owner

00 — Control & Reconciliation.

Control must resolve the Wave A Waxing contradiction and review the Wave B exact proposed descriptions. After Control ratifies a new exact Wave A set, route it back to 20 — CRM & Identity for bounded implementation.