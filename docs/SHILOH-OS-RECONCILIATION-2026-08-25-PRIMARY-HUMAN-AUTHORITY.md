# Shiloh OS Control Reconciliation — Primary Human Authority

Date: 2026-08-25

Controlled unit: `SHILOH-OS-PRIMARY-HUMAN-AUTHORITY`

Owner: **00 — Control & Reconciliation**

## Authorization

JP explicitly authorized the governance unit.

## Authoritative decision

- **JP = System Owner / Super Admin**
- **Christel = Operations Admin**

System principle: **JP governs Shiloh OS; Christel operates Shiloh OS.**

This model is intentionally asymmetric. Christel receives broad operational authority without implied authority to change the system's own governance, security, infrastructure or permission boundaries.

## Scope accepted

The unit establishes:

- primary human principals;
- governance-vs-operations separation;
- least-privilege rule for other staff;
- technical-principal non-human-authority rule;
- future product acceptance requirements for JP and Christel;
- explicit separation between governance ratification and concrete runtime permission changes.

## Safety / no unauthorized mutation

This unit performs documentation/governance reconciliation only.

It does not:

- alter GitHub repository permissions;
- alter Render roles/configuration;
- alter Meta tokens, system users, assets, WABA or phone registration;
- alter database roles/schema/data;
- alter application runtime roles;
- alter CRM records or client names;
- create, modify or cancel appointments;
- send external messages;
- weaken authentication or security controls.

Concrete role/permission alignment, if later required, must be separately authorized and implemented by the owning specialist.

## Existing units preserved

- Emergency Christel Calendar booking: COMPLETE / DO NOT REDO.
- Calendar provisional new-client booking: COMPLETE / DO NOT REDO.
- Imported-contact identity remediation: COMPLETE / DO NOT REDO.
- Client-facing-name authority: ACTIVE under 20 — CRM & Identity.
- Meta provider verification: WAITING EXTERNAL / Meta Support Required.

## Reconciliation requirement

Project Tracker, Master Status and Control Cockpit must converge on the same principal model and must not imply that governance authority automatically equals technical permissions already granted in each external system.

## Terminal disposition

After merge and green CI:

**COMPLETE — PRIMARY HUMAN AUTHORITY GOVERNANCE ACTIVE**

Any future runtime permission implementation is a separate controlled unit, not a reopening of this governance decision.