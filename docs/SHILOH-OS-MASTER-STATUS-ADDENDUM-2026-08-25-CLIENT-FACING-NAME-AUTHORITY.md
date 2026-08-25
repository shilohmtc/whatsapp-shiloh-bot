# Shiloh OS — Master Status Addendum

## Capability
`SHILOH-CLIENT-FACING-NAME-AUTHORITY`

## Status
**AUTHORIZED — IMPLEMENTATION PENDING UNDER 20 — CRM & IDENTITY**

## Durable architectural authority
Shiloh must distinguish canonical client identity from current client-facing name authority.

- `clients.id` remains the canonical client linkage.
- Imported/historical labels remain retained evidence/provenance/search aliases and do not automatically become current client-facing names.
- One active evidence-backed current client-facing name should be resolved per canonical client.
- Accepted promotion evidence is limited to explicit client confirmation, verified registration/intake evidence, or authorized audited staff correction based on direct evidence.
- WhatsApp profile names, fuzzy matches, historical appointment names, Calendar text and Goldie provenance alone are not sufficient promotion evidence.
- Downstream client-facing surfaces must consume a centralized resolver rather than reading `clients.display_name` as independent authority.
- `clients.display_name` may remain a compatibility/cache projection only if controlled by the new authority layer.
- Where no verified/current name exists, use neutral client-facing wording.
- Historical appointment snapshots remain immutable history.
- No heuristic mass-cleaning or duplicate-client creation is permitted for name correction.

## Relationship to existing CRM authority
Existing imported-contact identity remediation, canonical-client reuse, normalized-phone ambiguity repair and provenance retention remain **COMPLETE / DO NOT REDO**.

This unit extends presentation/name authority; it does not reopen canonical identity linkage.

## Current implementation state
No schema, resolver, backfill or production-name mutation is ratified as complete yet. 20 must return a bounded implementation with executable evidence before this capability can move to COMPLETE.

## Priority
High, but separate from already-completed Calendar booking implementation. It should be completed before broad expansion of client-facing outbound messaging so that unverified imported labels do not propagate across reminders, confirmations and follow-ups.
