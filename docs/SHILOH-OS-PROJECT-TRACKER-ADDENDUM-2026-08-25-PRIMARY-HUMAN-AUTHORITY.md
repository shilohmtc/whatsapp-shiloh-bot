# Shiloh OS Project Tracker Addendum — Primary Human Authority

Date: 2026-08-25

Controlled unit: `SHILOH-OS-PRIMARY-HUMAN-AUTHORITY`

Owner: **00 — Control & Reconciliation**

Status: **COMPLETE AFTER MERGE — GOVERNANCE STANDARD ACTIVE**

## Authorization

JP explicitly authorized: `Authorize Shiloh OS Primary Human Authority`.

## Control outcome

The Shiloh OS primary human authority model is:

- **JP — System Owner / Super Admin**
- **Christel — Operations Admin**

Core rule: **Shiloh OS is built primarily for JP to govern and Christel to operate.**

## Scope

This unit establishes governance and product-design authority only.

It does not change runtime permissions, credentials, roles, Meta assets, Render configuration, database state, CRM records, appointments, Calendar events, GitHub repository permissions or external-provider settings.

## Durable boundaries

JP retains authority over governance, security/production boundaries, permission/role changes, structural system changes and destructive/irreversible actions.

Christel is the primary clinic operations administrator and should be able to execute normal Calendar, booking, CRM and communication workflows without routine JP intervention, subject to existing safeguards and capability-specific authorization.

Christel cannot self-escalate and has no implied authority over Meta infrastructure, Render configuration, database structure, security credentials or system-governance changes.

## Product acceptance requirement

Future material capabilities must define:

- JP governance/admin path;
- Christel operational/admin path;
- normal operational authority;
- JP-only/security-sensitive authority;
- audit/fail-closed/non-self-escalation behavior.

## Do not redo / do not infer

Do not reopen completed Booking or imported-contact identity units because of this governance decision.

Do not infer that current external/runtime permissions already match the new model. Concrete permission implementation requires separate bounded authority.

## Current dependent work

- 20 — CRM & Identity remains ACTIVE on `SHILOH-CLIENT-FACING-NAME-AUTHORITY`.
- 30 — WhatsApp & Meta remains WAITING EXTERNAL on Meta Business Support.
- 10 — Booking & Admin UX remains COMPLETE / FROZEN.
- 40 — Production & DevOps remains observer/evidence owner when routed.

## Completion gate

This governance unit is complete when:

1. the primary-human-authority standard is merged;
2. Project Tracker and Master Status addenda are merged;
3. Control Cockpit is updated to expose JP / Christel principal roles;
4. exact-head CI is green;
5. post-merge main CI is green.

No production role mutation is required for this governance completion gate.