# Shiloh OS — Project Tracker Addendum — Client-Facing Name Authority Complete

Date: 2026-08-25
Owning workstream: 20 — CRM & Identity
Controlled unit: `SHILOH-CLIENT-FACING-NAME-AUTHORITY`
Tracker status recommendation: COMPLETE / VERIFIED LIVE / DO NOT REDO

## Completed scope

Control authority PR #488 has been implemented by PR #490 and verified live in production.

Durable outcomes:

- canonical `clients.id` remains identity authority;
- imported/Goldie and historical names are preserved as searchable aliases/provenance;
- one active evidence-backed current client-facing name is supported per canonical client;
- permitted promotion evidence is limited to explicit client confirmation, verified registration/intake, or attributable audited staff correction backed by direct evidence;
- migration 080 performs alias-only backfill and zero heuristic promotion;
- `clients.display_name` is compatibility/cache projection only;
- central resolver is used by Calendar, booking confirmations, reminders, follow-ups, booking-change confirmations, approved-reschedule confirmations and customer-care outbound flows;
- no current authority produces neutral wording rather than an imported label;
- verified WhatsApp registration/intake promotes the submitted name through the authority service inside the existing identity transaction;
- admin name search includes aliases without promoting them;
- historical appointment snapshots remain unchanged;
- no duplicate clients were created to correct names;
- no one-off `Ma Marinda` correction was made.

## Evidence

Implementation branch:
`crm/client-facing-name-authority-20260825`

Final implementation head:
`02ca6a34e8c2914af041e84adcb0d2a531d1a60c`

Implementation PR:
#490 — `Establish evidence-backed client-facing name authority`

Implementation merge:
`a88ba2c7962af4dffb53886904d1ab325b09ae14`

CI:
- run `32827526932`;
- job `97738729274`;
- SUCCESS;
- maintenance framework 12/12;
- focused authority suite 9/9;
- full regression 1070/1070;
- 0 failures / cancellations / skips;
- npm audit 0 vulnerabilities.

Render production deployment:
`dep-da6l97dbedkc73frmqj0`

Exact deployed commit:
`a88ba2c7962af4dffb53886904d1ab325b09ae14`

Status: LIVE

Migration 080 production cutover proof:
- checksum verified;
- alias/authority tables present;
- one-active-name index present;
- 1,631 aliases preserved;
- 0 active name authorities at initial cutover;
- heuristic promotion false.

Post-cutover app error query: no error/critical/alert/emergency logs.

## Do not redo

Do not reopen imported-contact identity remediation, migration 074, PR #488 architecture, PR #490 implementation or migration 080 unless new defect evidence exists.

Do not mass-clean names, infer authority from imported labels/WhatsApp profile/Calendar/history, rewrite historical snapshots, create duplicate clients or directly edit `clients.display_name` as current-name authority.

## Remaining gates

Individual client-name correction remains evidence-gated operational work. In particular, `Ma Marinda` remains unpatched until direct evidence establishes the correct current name; the existing canonical client must be reused and historical/import aliases preserved.

The separate Render read-only PostgreSQL connector TLS defect is not a blocker for this completed unit and must not be worked around by weakening TLS.

## Next owner

00 — Control & Reconciliation should accept the completed unit and reflect it in the 00-owned Control Cockpit. Future evidence-backed individual corrections return to 20 only after exact authority/evidence is available.
