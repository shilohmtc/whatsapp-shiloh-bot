# Shiloh OS — Reconciliation — Christel Saturday Availability

Date: 2026-08-22
Owning workstream: Booking & Admin UX
Status: COMPLETE / VERIFIED LIVE

## Incident

At approximately 11:37 SAST on 2026-08-22, a genuine production availability lookup for Christel → Full Body Swedish → Saturday 29 August 2026 returned no authoritative bookable slots even though current business truth is that Christel is available 08:00–14:00 and has no genuine blocking event.

PR #395 / `485ed97d8812fc291c71493dd1bb652b5da42f05` remains durable authority for practitioner Google Calendar conflict classification and was not reopened or weakened.

## Read-only diagnosis

A bounded sanitized runtime diagnostic proved the pre-Google candidate path for 2026-08-29:

- holiday count: 0
- clinic override count: 0
- clinic windows: 1
- Christel base staff windows: 0
- recurring closures: 0
- schedule exceptions: 0
- inherited regular-staff clinic window: 1
- effective windows: 1
- 90-minute raw candidates at 15-minute intervals: 19
- after schedule exceptions: 19
- after CRM appointments: 19
- after `calendar_blocks`: 0
- overlapping appointments: 0
- overlapping `calendar_blocks`: 1
- Google Calendar was not reached because the pre-Google candidate set was already empty.

A second sanitized read identified the sole blocker as:

- `calendar_blocks.id = 141`
- practitioner: Christel
- `block_type = time_off`
- interval: 2026-08-29 08:00 SAST through 2026-08-30 00:00 SAST
- title: `FMA Course`
- source: `goldie_import`
- no Shiloh block creation/update audit action was present.

This stale imported block contradicted JP's confirmed current business truth for Christel's diary. No appointment, staff schedule exception, recurring closure, Google Calendar event, or genuine Shiloh block was implicated.

## Controlled repair

PR #404 introduced forward migration `073_remove_stale_christel_goldie_fma_block.sql` plus focused regression coverage. The first Render startup attempt failed closed because the migration also constrained imported `created_at` / `updated_at` metadata; no production row was changed by that failed deploy.

PR #405 narrowed only those non-authoritative metadata predicates. The final migration still requires the exact proven row identity: id 141, Christel, `time_off`, exact interval, title `FMA Course`, and source `goldie_import`. CI #1248 passed before merge.

Exact application merge: `8bfaf91d91f1f02ce5369f9e7781c0ea110d6e21`.
Exact Render deploy: `dep-da4n8mfavr4c739nqfbg` reached LIVE.

Production startup evidence:

- migration 073: `applied=true`, `checksumVerified=true`
- Christel 2026-08-29 overlapping block count after repair: 0
- raw candidates: 19
- after schedule exceptions: 19
- after appointments: 19
- after blocks: 19
- canonical availability: `available`
- canonical slot count: 19
- Google Calendar enabled: true
- Google Calendar conflict count for this lookup: 0

No real appointment or Calendar event was manufactured for verification.

## Durable result

Christel → Full Body Swedish → Saturday 29 August 2026 now has authoritative 90-minute availability within the confirmed 08:00–14:00 clinic envelope when no genuine conflict exists. The availability gate order remains unchanged. Real appointments, schedule exceptions, recurring closures, `calendar_blocks`, and Google Calendar conflicts continue to block availability when authoritative.

PR #395 remains the durable practitioner-Calendar classification authority and must not be redone because of this incident.

## Completed / do not redo

- Root cause is proven as stale `goldie_import` `calendar_blocks.id=141`, not Google Calendar classification.
- Migration 073 is applied and checksum-verified in production.
- The stale row is removed; do not recreate it from legacy Goldie state.
- Focused regression retains the 90-minute Saturday 08:00–14:00 semantics and all existing conflict gates.
- Temporary production diagnostic hooks are removed by the reconciliation cleanup PR; diagnostic source is not durable runtime behavior.
