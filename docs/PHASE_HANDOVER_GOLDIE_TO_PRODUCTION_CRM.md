# Shiloh OS Phase Handover: Goldie Migration → Production CRM

**Checkpoint date:** 2026-08-09  
**Repository:** `shilohmtc/whatsapp-shiloh-bot`  
**Status:** Goldie historical migration and reconciliation phase complete

## 1. Executive handover

The Goldie historical-data migration is complete under the project's conservative reconciliation policy. Shiloh must now be treated as the operational system being developed forward; Goldie data is historical source/provenance data rather than the architecture for the new CRM.

The migration phase deliberately did **not** force ambiguous historical records into canonical production data. Residual records remain staged until new identity or service evidence exists.

## 2. Verified production checkpoint

Final read-only production audit reported `overallPass: true`.

- Canonical Goldie appointments: **547**
- Canonical Goldie calendar blocks: **130**
- Matched Goldie appointment source rows: **677**
- Residual/unmatched staged source rows: **143**
- Further safe automatic appointments: **0**
- Further safe calendar blocks: **0**
- Duplicate Goldie appointment external IDs: **0**
- Orphan appointment-service links: **0**
- Orphan appointment-staff links: **0**
- Pending migrations: **0**
- Temporary execution flags configured at audit: **none**

## 3. Database migration checkpoint

Migrations `001` through `009` were applied and all recorded checksums matched at the final audit:

1. `001_baseline.sql`
2. `002_crm_clients.sql`
3. `003_crm_catalogue_resources.sql`
4. `004_goldie_service_catalogue.sql`
5. `005_crm_appointments_calendar.sql`
6. `006_external_identity_reconciliation.sql`
7. `007_historical_goldie_services.sql`
8. `008_historical_goldie_nail_brow_services.sql`
9. `009_historical_goldie_services_third_tranche.sql`

Applied migration files are immutable history. Any future schema/catalogue change must use a new migration rather than editing an already-applied migration.

## 4. Residual exception backlog

The 143 staged rows are a controlled exception backlog, not a failed migration. Final blocker counts overlap where a row has multiple blockers:

- unresolved client name: **73**
- no service resolution: **39**
- partial service resolution: **19**
- ambiguous client name: **17**
- multiple named clients: **2**
- non-appointment type: **1**
- invalid time range: **1**
- blank client: **1**
- blank services: **1**

Disposition: retain these records with source provenance. Revisit only when new evidence makes a deterministic resolution possible.

## 5. Identity/reconciliation safety policy

These rules remain part of the production data-governance baseline:

- Identity evidence comes first.
- A shared phone number alone never justifies merging two clients.
- Ambiguous identities remain unresolved unless decisive evidence appears.
- Historical source records and reconciliation history must be retained for auditability.
- Do not increase migration completion percentages by weakening identity rules.
- Service aliases/historical services require evidence-backed mappings.
- Internal/non-service markers such as historical `Personal` must not be silently converted into normal bookable services.

## 6. Production startup consolidation

At this handover, `app.js` was consolidated so normal application startup no longer executes the historical Goldie reconciliation/promotion/audit pipeline automatically.

Normal startup is responsible for:

- Express/API startup
- health/database check endpoint
- webhook routes
- admin/audit-read routes
- Goldie sync scheduler (while still required during transition)
- appointment lifecycle scheduler
- graceful shutdown

Historical migration/reconciliation services remain repository infrastructure for provenance, audit and controlled exception work, but are not part of routine startup execution.

## 7. What must not happen next

- Do not rerun historical promotions merely because the application restarts.
- Do not edit migrations `001`–`009` after application.
- Do not treat the 143 residual rows as a requirement to reach zero staged rows.
- Do not make Goldie's schema/workflows the design target for the new CRM.
- Do not make ambiguous client merges automatically.

## 8. Production CRM phase objective

Build Shiloh OS into the clinic's operational CRM and booking system so the clinic can progressively stop depending on Goldie.

Initial architecture/workstream scope:

1. Canonical client CRM and client history
2. Operational appointment/calendar management
3. Service catalogue and pricing
4. Staff/resources and availability
5. Booking rules and booking workflow
6. WhatsApp-assisted booking and client communication
7. Admin/operator interface
8. Reporting and operational audit trail
9. Goldie transition/decommission plan

## 9. New-phase entry procedure

The Production CRM phase should begin by inspecting the **current repository and current PostgreSQL schema**, not by designing from memory. Produce an architecture baseline that maps existing tables, services, routes, schedulers, integrations and operational gaps before adding new modules.

Recommended new-chat kickoff:

> Continue Shiloh OS. Goldie migration is complete. Start the Production CRM Phase by inspecting the current GitHub repository and PostgreSQL implementation, consolidate the production baseline, and define the next build plan. Use `docs/PHASE_HANDOVER_GOLDIE_TO_PRODUCTION_CRM.md` as the formal handover checkpoint.

## 10. Definition of this checkpoint

This checkpoint means the historical Goldie migration is closed as a production migration project. The residual exception backlog remains auditable and recoverable, but it is no longer a blocker for forward CRM development.
