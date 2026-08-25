# Shiloh OS — Control Authorization

## Controlled unit
`SHILOH-CLIENT-FACING-NAME-AUTHORITY`

## Owner
20 — CRM & Identity

## Control decision
**APPROVED FOR BOUNDED DESIGN + IMPLEMENTATION**

The systemic CRM finding is accepted: canonical client linkage and current client-facing name are distinct authorities. Shiloh must not repair isolated imported labels as one-off presentation edits when the same structural gap can affect the wider imported-contact population.

## Authorized design
1. Keep one canonical `clients.id`.
2. Preserve imported/Goldie labels as immutable provenance/search aliases.
3. Imported labels do not automatically establish current-name authority.
4. Establish one active evidence-backed current client-facing name per client.
5. Permit promotion only from explicit client confirmation, verified registration/intake evidence, or authorized audited staff correction based on direct evidence.
6. Do not treat WhatsApp profile names, Calendar text, fuzzy matches, historical appointment names or Goldie provenance alone as sufficient.
7. Centralize resolution for Calendar, booking confirmations, reminders, follow-ups and other client-facing communication.
8. Treat `clients.display_name` only as controlled compatibility/cache if retained.
9. Use neutral client-facing wording when no verified/current name exists.
10. Do not mass-clean names heuristically and do not rewrite historical appointment snapshots.

## Required safeguards
- canonical-client reuse remains mandatory;
- no duplicate client creation for name correction;
- original imported values remain retained;
- migration/backfill may classify evidence but may not heuristically promote imported labels;
- all promotions/corrections must be attributable and auditable;
- downstream readers must fail safely when no authoritative current name exists.

## Not authorized by this decision
- any direct production name edit;
- one-off correction of “Ma Marinda” without direct evidence;
- heuristic bulk rewrite;
- historical snapshot rewrite;
- reopening completed imported-contact identity remediation.

## Return gate
20 must return schema/evidence design, resolver implementation, migration/backfill classification, downstream convergence, focused/full regression, exact PR/CI/merge authority, controlled deployment and production verification before Control marks this unit COMPLETE.
