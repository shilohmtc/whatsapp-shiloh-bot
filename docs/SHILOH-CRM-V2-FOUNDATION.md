# Shiloh CRM V2 foundation

CRM V2 is the clean operational client master. It starts empty, resolves clients only by exact normalized mobile, and does not consult or migrate legacy CRM identity.

## Canonical data contract

`crm_v2_clients` owns:

- permanent `id`;
- `name` for display and operator search only;
- unique active `normalized_mobile` in South African E.164 digits (`27` plus nine digits, with a mobile prefix of `6`, `7`, or `8`);
- nullable `date_of_birth` and `gender` for a `minimal` profile;
- required date of birth and gender for a `registered` profile;
- `mobile_verified_at`, set from a verified inbound WhatsApp sender interaction rather than a persistent identity-evidence state machine;
- `source`, `status`, server-derived `provenance`, and timestamps.

The partial unique index `uq_crm_v2_clients_active_mobile` enforces one active client per normalized mobile. Archived rows retain history and do not prevent a later active record from claiming that mobile.

## Canonical service contract

`src/services/crmV2ClientService.js` is the only client-resolution domain boundary for Calendar and WhatsApp integrations:

- `createClient({ name, mobile, actorReference })` creates a `minimal` staff client or returns the exact existing active client/conflict;
- `resolveExactMobile(mobile)` returns `found`, `not_found`, or `conflict` from CRM V2 only;
- `searchClients({ query, status, limit })` provides non-authoritative operator search by name/mobile;
- `getClientById(clientId)` returns a canonical CRM V2 ID;
- `updateClient(...)` updates permitted fields, resets mobile verification when mobile changes, and fails closed on active-mobile conflict;
- `archiveClient(...)` is the non-destructive delete operation;
- `completeRegistration(...)` performs `minimal -> registered` with name, date of birth, and gender;
- `recordVerifiedWhatsAppInteraction({ mobile, occurredAt })` records inbound sender verification without creating identity-evidence rows;
- `registerWhatsAppClient(...)` atomically exact-resolves the inbound sender and completes the existing client or creates a registered WhatsApp-origin client.

The PostgreSQL repository serializes mobile ownership with a namespaced transaction advisory lock and relies on the partial unique index as the final concurrency guard.

No new HTTP route or staff permission is added by this foundation. WS-10 and WS-30 should call the domain service from their already-authenticated workflows rather than duplicating repository SQL. Any future public or staff-facing CRM V2 route requires its owning workstream to apply the appropriate current authentication, authorization, origin, and CSRF controls.

## WS-10 Calendar seam

Migration `084_clean_crm_v2_foundation.sql` adds nullable `appointments.crm_v2_client_id`. It does not populate or otherwise mutate any appointment row.

A later WS-10 cutover should:

1. use `resolveExactMobile` or `createClient` for the explicit booking choice;
2. write `crm_v2_client_id` for a new V2 booking and leave legacy `client_id` null;
3. continue reading existing future appointments through their current `client_id` and stored `source_client_name` snapshots;
4. require its separately owned booking-time final-mobile acknowledgement before confirmation messaging.

This permits old and new future appointments to remain operable without bulk client or appointment migration. It is a transition seam, not a permanent dual-resolution design.

## WS-30 WhatsApp seam

WS-30 should take the verified inbound sender mobile from the provider envelope and pass it directly to `registerWhatsAppClient`. The client never retypes the sender number. Exact CRM V2 match completes the same record; no exact match creates a new registered record. Normal handling must never consult Goldie, aliases, `user_profiles`, or legacy identity evidence.

## Legacy isolation and retirement path

The CRM V2 migration contains no legacy backfill, and the V2 repository queries only `crm_v2_clients`. Existing legacy records and appointments remain unchanged.

After WS-10 and WS-30 have cut over under separate authorization, the following identity components are candidates for controlled retirement from normal runtime paths:

- legacy `clients` and `client_contacts` client resolution;
- `client_identity_verifications` and operator-confirmed authority services;
- `client_facing_name_authorities` and `client_name_aliases` authority/search coupling;
- legacy `user_profiles` onboarding identity;
- Goldie client imports, reconciliation queues, fuzzy/alias matching, and identity repair services;
- booking-context identity evidence and confirmation-safe state machinery used only by the superseded model.

Physical deletion, production data reset, historical migration, and cutover are explicitly outside this foundation package.
