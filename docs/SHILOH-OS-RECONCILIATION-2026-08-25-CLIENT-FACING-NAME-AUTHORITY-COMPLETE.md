# Shiloh OS — Reconciliation — Client-Facing Name Authority Complete

Date: 2026-08-25
Owning workstream: 20 — CRM & Identity
Controlled unit: `SHILOH-CLIENT-FACING-NAME-AUTHORITY`
Status: COMPLETE / VERIFIED LIVE / DO NOT REDO

## Authority

Control authorization is PR #488 — `Authorize client-facing name authority` — merged as `d58847775f352a5289592ea07ee2107d2909779a`.

The ratified architectural authority is:

1. one canonical `clients.id` remains identity authority;
2. imported/Goldie labels remain provenance and searchable aliases rather than automatic current-name authority;
3. one active evidence-backed current client-facing name may exist per canonical client;
4. promotion is permitted only from explicit client confirmation, verified registration/intake evidence, or authorized audited staff correction supported by direct evidence;
5. WhatsApp profile names, Calendar text, fuzzy matches, historical appointment names and Goldie provenance alone are insufficient for promotion;
6. client-facing name resolution is centralized for Calendar and outbound communications;
7. `clients.display_name` is a compatibility/cache projection only, not independent authority;
8. no current authority means neutral client-facing wording;
9. no heuristic mass-cleaning, historical appointment snapshot rewrite or duplicate-client correction is permitted.

Existing imported-contact identity remediation remains COMPLETE / DO NOT REDO.

PR #489 Control Cockpit and PR #491 Primary Human Authority were merged while implementation was in progress. Final PR #490 CI tested the generated merge ref against the newer main containing that governance, so those newer authorities were preserved rather than overwritten.

## Implemented schema and evidence contract

PR #490 — `Establish evidence-backed client-facing name authority` — implemented the controlled unit.

Implementation branch:

`crm/client-facing-name-authority-20260825`

Exact final branch head:

`02ca6a34e8c2914af041e84adcb0d2a531d1a60c`

Migration:

`080_client_facing_name_authority.sql`

The migration creates two distinct stores.

### `client_name_aliases`

This preserves historical/search provenance for the same canonical `client_id`, including:

- pre-authority `clients.display_name` values;
- explicitly reconciled Goldie labels linked through existing external-record reconciliation;
- prior authoritative names preserved during later promotion/revocation.

Alias presence is search/provenance evidence only. It cannot promote a current name.

### `client_facing_name_authorities`

This stores evidence-backed current-name authority with:

- canonical `client_id`;
- exact current name and normalized form;
- strict evidence type;
- non-empty evidence reference;
- attributable actor;
- promotion timestamp;
- revocation/supersession history.

Allowed evidence types are exactly:

- `explicit_client_confirmation`;
- `verified_registration_intake`;
- `audited_staff_correction`.

Audited staff correction additionally requires an attributable staff actor. A partial unique index enforces at most one active authority row per canonical client.

## Bounded migration / backfill classification

Migration 080 performs **zero current-name promotion**.

It snapshots existing labels into the alias/provenance store only. It does not:

- insert any current-name authority row;
- update `clients.display_name`;
- infer identity/name authority from phones, fuzzy matches, Calendar text or appointment history;
- rewrite appointments or appointment snapshots;
- create clients;
- perform a one-off correction for any named client.

This is the required NO-HEURISTIC-PROMOTION backfill classification.

## Promotion, revocation and audit rules

Central service:

`src/services/clientFacingNameAuthority.js`

Promotion:

- validates the canonical client;
- rejects evidence outside the exact Control allowlist;
- requires direct evidence metadata;
- locks the client and active authority transactionally;
- preserves the previous compatibility label and prior authority as aliases where applicable;
- revokes/supersedes the prior active authority rather than deleting history;
- inserts the new authority;
- updates `clients.display_name` only after authoritative promotion as a compatibility/cache projection;
- emits a CRM audit event.

Revocation:

- requires an attributable actor and reason;
- preserves the former current name as an alias;
- marks the authority revoked rather than deleting it;
- clears the compatibility projection;
- emits a CRM audit event.

No generic SQL name-correction path was introduced.

## Centralized resolver contract

The same service provides centralized resolution by canonical client, exact unique phone and appointment.

Resolver behavior:

- exactly one active evidence-backed authority -> return that current client-facing name and authority id;
- no active authority -> return neutral/no-name state;
- ambiguous phone ownership -> fail closed;
- never fall back to imported labels, `clients.display_name`, WhatsApp profile names, fuzzy matches or historical appointment snapshots.

This separates staff-side search/discovery from outbound client-facing name authority.

## `clients.display_name` compatibility strategy

`clients.display_name` remains for compatibility only.

It is no longer an independent source for client-facing communication. Authorized promotion owns the projection update; explicit revocation clears it. Migration 080 leaves all existing values unchanged so legacy data is not silently re-certified.

Admin search can still surface compatibility labels and aliases for staff discovery, but explicitly labels non-authoritative matches as search/provenance information.

## Downstream convergence inventory

The implementation converges the required consumers on the centralized authority:

- Google Calendar booking creation and update re-resolve by canonical appointment/client and ignore supplied legacy client-name text;
- booking confirmations resolve by canonical client and use neutral wording if no authority exists;
- appointment reminders resolve through the centralized phone-to-canonical-client authority and use neutral wording if no authority exists;
- follow-ups use the same reminder/lifecycle resolver;
- booking-change notifications resolve current authority instead of `display_name` or appointment snapshots;
- approved-reschedule confirmations resolve current authority instead of `display_name` or appointment snapshots;
- customer-care, birthday and loyalty communication resolve current authority;
- admin client lookup searches the alias store without converting a match into name authority.

Historical appointment snapshots remain unchanged.

Verified WhatsApp registration/intake now creates name authority inside the existing identity-verification transaction using `verified_registration_intake` evidence. Registration no longer independently writes `clients.display_name`; the authority service owns that compatibility projection.

## Specific “Ma Marinda” case

No one-off `Ma Marinda` correction was implemented or deployed.

The same canonical client must be reused. Existing historical/import labels remain aliases/provenance. A corrected current client-facing name may be promoted only when direct Control-approved evidence exists through the new authority mechanism.

This evidence gate is deliberate and is not an implementation blocker.

## Focused and regression test evidence

Focused authority contract suite:

`tests/client-facing-name-authority.test.js`

It covers:

- separate alias/current-name stores;
- zero heuristic promotion in migration 080;
- centralized resolver authoritative/neutral behavior;
- ambiguous phone fail-closed behavior;
- strict promotion evidence allowlist;
- audited staff attribution;
- alias preservation before compatibility projection;
- verified-intake authority promotion;
- Calendar/confirmation/reminder/follow-up convergence;
- alias search without promotion;
- fail-fast migration 080 startup verification.

Two existing regression assertions that required the superseded direct-name behavior were updated to assert PR #488 authority instead; their surrounding identity/reclaim safeguards remain intact.

Final CI:

- workflow run `32827526932`;
- job `97738729274`;
- conclusion: SUCCESS;
- Node 24.14.1;
- maintenance framework: 12/12 passed;
- client-facing name authority focused tests: 9/9 passed;
- Calendar/new-client/security focused suites passed;
- full non-mutating regression: 1070/1070 passed;
- 0 failed / 0 cancelled / 0 skipped;
- npm audit: 0 vulnerabilities.

## Merge / repository authority

PR #490 merged as:

`a88ba2c7962af4dffb53886904d1ab325b09ae14`

This was the authoritative application main at production cutover.

## Controlled production deployment

Render auto-deploy:

`dep-da6l97dbedkc73frmqj0`

Exact commit:

`a88ba2c7962af4dffb53886904d1ab325b09ae14`

Started:

`2026-08-25T08:38:53.590416Z`

Finished:

`2026-08-25T08:39:33.05212Z`

Status: LIVE

The production fail-fast startup verifier applied migration 080 and emitted:

- `appliedNow=true`;
- `checksumVerified=true`;
- `aliasTable=true`;
- `authorityTable=true`;
- `oneActiveIndex=true`;
- `aliasCount=1631`;
- `activeAuthorityCount=0` at initial cutover;
- `heuristicPromotionPerformed=false`;
- applied at `2026-08-25T08:39:19.249Z`.

The `activeAuthorityCount=0` value is the cutover proof that the migration did not silently certify any pre-existing imported/legacy name. Legitimate later evidence-backed registration/intake or correction events are allowed to create authority rows and must not be mistaken for migration backfill.

The same startup reverified migration 074 and the existing staff-session, Calendar and Goldie guards without changing their durable authority. Google Calendar provider health passed, Shiloh started successfully, health requests returned 200, and Render declared the service live.

A bounded post-cutover app-log query for error/critical/alert/emergency levels returned no logs.

The separate Render read-only PostgreSQL connector TLS defect remains outside this unit and TLS was not weakened.

## Completed / do not redo

The following is COMPLETE / VERIFIED LIVE / DO NOT REDO:

- PR #488 architectural authorization;
- PR #490 implementation;
- migration 080 schema/alias-only cutover;
- centralized resolver contract;
- evidence-backed promotion/revocation/audit mechanism;
- `clients.display_name` compatibility projection strategy;
- required Calendar/confirmation/reminder/follow-up convergence;
- alias-backed admin search;
- verified registration/intake promotion path;
- CI and Render production verification.

Do not redo the earlier imported-contact identity remediation or migration 074. Do not mass-promote existing labels. Do not create a duplicate client or rewrite historical appointment snapshots to correct a name.

Future current-name changes must use the evidence-backed authority mechanism rather than direct `clients.display_name` mutation.

## What this now enables

Shiloh OS can now distinguish two previously conflated facts: **which canonical client a record belongs to** and **which evidence-backed current name may be used when communicating with that client**.

Imported/Goldie and historical labels remain useful for staff search without silently becoming client-facing truth. Verified intake can promote a current name transactionally, superseded names retain audit/provenance history, and outbound Calendar/WhatsApp flows share one resolver instead of independently deciding what a client should be called.

For clients with no authoritative current name, Shiloh now fails safely into neutral wording rather than exposing an unverified imported label. JP does not need to manually clean imported names, patch Calendar text, create replacement clients, or maintain per-channel naming rules.

This does not authorize heuristic mass-cleaning, arbitrary CRM name changes, direct SQL corrections or an evidence-free `Ma Marinda` correction.

## Reconciliation status

Project Tracker reconciliation: final dated completion addendum included with this reconciliation unit. Recommendation: record `SHILOH-CLIENT-FACING-NAME-AUTHORITY` as COMPLETE / VERIFIED LIVE / DO NOT REDO, with evidence-gated individual name correction as normal future operation rather than an implementation completion gate.

Master Status reconciliation: final dated durable-state addendum included with this reconciliation unit. Recommendation: record evidence-backed client-facing-name authority as LIVE and treat `clients.display_name` as compatibility/cache only.

Control Cockpit projection is owned by 00 — Control & Reconciliation under PR #489 and is therefore not mutated by workstream 20. 00 should project this completed state after accepting the handoff.

## Next owner

00 — Control & Reconciliation should accept this completed controlled unit, retain the evidence gates and project the completion into its Control Cockpit. If direct evidence later establishes a specific corrected current name, 00 may authorize the bounded evidence-backed correction and return that concrete action to 20 — CRM & Identity.
