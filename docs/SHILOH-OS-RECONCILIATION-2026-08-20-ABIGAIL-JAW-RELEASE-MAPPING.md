# Shiloh OS — Reconciliation — Abigail Jaw Release Mapping

Date: 2026-08-20
Owning workstream: Booking & Admin UX

## Controlled business decision

`Upper Back, Neck & Jaw Release` must no longer appear under Abigail's practitioner services. The service itself remains valid; this is a practitioner-mapping correction only.

## Application lineage

### PR #375 — guarded mapping migration

- Merge SHA: `6337ba701f1bc3e534219ec20c5dd20d5dce837b`
- CI run #1181: successful.
- Added migration `069_remove_abigail_jaw_release_mapping.sql`.
- Exact canonical target:
  - service ID `31`;
  - `Upper Back, Neck & Jaw Release`;
  - Goldie external ID `b5c96105-f534-406d-89ec-68e78c65cf8b`.
- The migration deletes only Abigail's `staff_services` row for that exact service and fails closed on ambiguous/missing Abigail or target-service identity.
- It preserves the canonical service row, non-Abigail mappings and linked appointment history.

The first #375 production deploy proved code/startup health but did not itself prove migration 069 execution because Shiloh does not generically execute every SQL file merely because it exists in `migrations/`.

### PR #376 — startup application and post-state verification

- Merge SHA: `5e187c6b531881d82ea1bfe1840b0b891d11518f`
- CI run #1183: successful.
- Added checksum-tracked startup bootstrap for migration 069 using the established `schema_migrations` pattern.
- The correction runs after the existing Christel service-catalogue bootstrap and verifies the post-state transactionally.

## Production evidence

Render deploy `dep-da3k4m2jobas73ctkp10` reached LIVE on exact PR #376 merge SHA.

At `2026-08-20T18:07:48.325Z`, production emitted explicit authoritative post-state evidence:

- migration: `069_remove_abigail_jaw_release_mapping.sql`;
- `applied=true`;
- checksum verified;
- applied at `2026-08-20T18:07:48.315Z`;
- service ID `31`;
- service name `Upper Back, Neck & Jaw Release`;
- Goldie external ID `b5c96105-f534-406d-89ec-68e78c65cf8b`;
- service status remains `active`;
- Abigail resolved as staff ID `1`;
- `abigailMapped=false`;
- remaining practitioner mapping is Christel, staff ID `3`, active practitioner, client-bookable;
- linked appointment count remains `13`.

The bootstrap also verifies that canonical service metadata, all non-Abigail mappings and linked appointment count are unchanged across the correction transaction.

## Production health / preserved authority

On the same #376 instance:

- Google Calendar provider health passed;
- practitioner-approved rescheduling remained feature-off (`featureEnabled=false`);
- Juvan remained BOUND to the current controlled pointer with assigned-practitioner Primary + Jean-Pierre Backup + first terminal decision wins;
- repeated `/health` requests returned HTTP 200;
- no Calendar event, appointment, provider template, client identity or genuine WhatsApp journey was manufactured for proof.

## Durable authority

Effective production catalogue authority is now:

- `Upper Back, Neck & Jaw Release` remains an active canonical service.
- Abigail is **not** an eligible practitioner for that service.
- Christel remains the current eligible/client-bookable practitioner mapping proven by the #376 startup post-state.
- Historical appointments remain preserved; this correction must not be interpreted as deleting or rewriting appointment history.

## Evidence boundary

The sanctioned Render Postgres read-only connector still fails before SQL execution with `FATAL: SSL/TLS required`. No direct pre-change row claim is inferred from that failed connector. The accepted authoritative mutation/post-state evidence is the guarded production startup transaction and its explicit verified result above.

## Next-specialist checkpoint

This controlled unit is complete once Tracker/Master reconciliation is merged. No further Booking & Admin UX action is required for Jaw Release unless the business later changes practitioner eligibility again.
