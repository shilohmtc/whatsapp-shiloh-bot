# Shiloh OS — Master Status Addendum — Client-Facing Name Authority Complete

Date: 2026-08-25
Owning workstream: 20 — CRM & Identity
Controlled unit: `SHILOH-CLIENT-FACING-NAME-AUTHORITY`
Master Status recommendation: LIVE / COMPLETE / DO NOT REDO

## Durable state

Shiloh OS now has separate durable authorities for canonical client identity and current client-facing name.

Canonical identity remains `clients.id` under the existing verified-client/import-remediation authority.

Current client-facing name now comes only from the active evidence-backed row in `client_facing_name_authorities`. Imported/Goldie, historical and compatibility labels are not current-name authority and remain searchable through `client_name_aliases`/controlled compatibility surfaces.

Allowed current-name promotion evidence is exactly:

- explicit client confirmation;
- verified registration/intake evidence;
- authorized audited staff correction supported by direct evidence.

WhatsApp profile names, Calendar text, fuzzy matches, historical appointment names and imported Goldie provenance alone remain insufficient.

## Live implementation authority

Control authorization:
PR #488

Implementation:
PR #490

Final implementation branch head:
`02ca6a34e8c2914af041e84adcb0d2a531d1a60c`

Application merge/main at cutover:
`a88ba2c7962af4dffb53886904d1ab325b09ae14`

Migration:
`080_client_facing_name_authority.sql`

Production deployment:
`dep-da6l97dbedkc73frmqj0`

Production status:
LIVE

Initial production cutover verified:

- migration checksum exact;
- alias table live;
- authority table live;
- one-active-name invariant live;
- 1,631 aliases preserved;
- 0 active current-name authorities at migration cutover;
- no heuristic promotion;
- Shiloh and Google Calendar provider health succeeded;
- bounded post-cutover error query clean.

CI authority:
- workflow run `32827526932`;
- job `97738729274`;
- SUCCESS;
- full regression 1070/1070;
- focused client-facing-name authority 9/9;
- maintenance framework 12/12;
- npm audit 0 vulnerabilities.

## Runtime contract

`clients.display_name` is compatibility/cache projection only. Client-facing readers must use the centralized resolver.

The centralized resolver is authoritative for:

- Calendar client-name presentation on current booking events;
- booking confirmations;
- reminders;
- follow-ups;
- booking-change confirmations;
- approved-reschedule confirmations;
- customer-care/birthday/loyalty outbound communication.

No active authority means neutral client-facing wording.

Verified WhatsApp registration/intake may promote the submitted name using direct registration evidence in the same canonical-client transaction. Subsequent promotion/revocation preserves history and emits audit evidence.

Admin lookup may search aliases for staff discovery but alias presence never promotes a current client-facing name.

## Preserved boundaries

Existing imported-contact identity remediation and migration 074 remain COMPLETE / DO NOT REDO.

Historical appointment snapshots remain historical and are not rewritten.

No duplicate-client correction mechanism was created.

No heuristic mass-cleaning or direct SQL name-correction mechanism was created.

The `Ma Marinda` case remains evidence-gated: no one-off patch is live; the same canonical client must be reused; imported/historical aliases remain preserved; a corrected current name requires direct approved evidence.

The Render read-only PostgreSQL connector TLS defect remains separate and TLS must not be weakened.

## Operational consequence

All future current client-facing-name changes should use the evidence-backed authority lifecycle. Direct edits to `clients.display_name` must not be treated as sufficient current-name authority.

## Reconciliation routing

00 — Control & Reconciliation should accept this durable live state and update the 00-owned Control Cockpit projection. If new direct evidence supports a specific client-name correction, Control may authorize that bounded action back to 20 — CRM & Identity.
