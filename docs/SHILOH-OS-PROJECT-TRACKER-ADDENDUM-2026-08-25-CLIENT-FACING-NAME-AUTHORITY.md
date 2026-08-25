# Shiloh OS — Project Tracker Addendum

## Controlled unit
`SHILOH-CLIENT-FACING-NAME-AUTHORITY`

## Owning workstream
20 — CRM & Identity

## Status
**AUTHORIZED FOR BOUNDED DESIGN + IMPLEMENTATION — NOT YET IMPLEMENTED**

## Control decision
Canonical client linkage and current client-facing name are separate authorities.

A correct canonical `clients.id` linkage does not make every value in `clients.display_name` authoritative for client-facing use. Imported/historical Goldie labels may remain useful provenance/search aliases while being insufficient as current-name authority.

## Durable boundaries
- Keep one canonical `clients.id`; do not create duplicate clients to correct a name.
- Preserve Goldie/imported labels as provenance and searchable aliases.
- `source='goldie_import'` remains provenance, not identity/name verification.
- Imported labels, WhatsApp profile names, fuzzy matches, Calendar text and historical appointment snapshots alone are insufficient to promote a current client-facing name.
- Promotion may come only from explicit client confirmation, verified registration/intake evidence, or an authorized audited staff correction supported by direct evidence.
- Establish one active evidence-backed current client-facing name per canonical client.
- If no verified/current name exists, downstream client-facing communication must use neutral wording rather than an unverified imported label.
- `clients.display_name` may remain only as a controlled compatibility/cache field if required; it must not remain an independent authority.
- Calendar, booking confirmations, reminders, follow-ups and other outbound surfaces must converge on one centralized client-facing-name resolver.
- No heuristic mass-cleaning or automatic promotion of imported labels.
- Do not rewrite historical appointment snapshots.

## Existing completed authority — DO NOT REDO
- imported-contact identity remediation;
- normalized-phone ambiguity repair;
- canonical-client reuse/deduplication authority;
- Goldie provenance retention and original-source preservation.

## Required implementation return from 20
- schema/evidence contract;
- alias/provenance preservation model;
- promotion/revocation/audit rules;
- centralized resolver contract;
- compatibility treatment of `clients.display_name`;
- bounded migration/backfill classification with no heuristic promotion;
- downstream consumer convergence inventory;
- focused and full regression evidence;
- controlled deployment and production verification;
- final Project Tracker and Master Status reconciliation recommendation.

## Production mutation state
**NONE AUTHORIZED OR PERFORMED BY THIS CONTROL DECISION.**

The specific “Ma Marinda” example must not be patched as a one-off absent direct evidence establishing the correct current client-facing name.
