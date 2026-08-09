# Shiloh OS — Production CRM Baseline and Build Plan

**Baseline release:** v1.1.0 — CRM Foundation  
**Phase:** Production CRM  
**Handover source:** `docs/PHASE_HANDOVER_GOLDIE_TO_PRODUCTION_CRM.md`

## 1. Phase objective

Shiloh now moves from historical Goldie migration into forward operational CRM development. Goldie remains source/provenance data during transition; Shiloh is the system being built to become the clinic's operational system of record.

The completed historical migration must remain isolated from normal startup and future CRM design must not be constrained by Goldie's schema or workflows.

## 2. Verified production checkpoint

From the completed handover/final audit:

- 547 canonical Goldie appointments
- 130 canonical Goldie calendar blocks
- 677 matched Goldie appointment source rows
- 143 residual staged source rows retained as a controlled exception backlog
- 0 further safe automatic appointments
- 0 further safe calendar blocks
- 0 duplicate Goldie appointment external IDs
- 0 orphan appointment-service links
- 0 orphan appointment-staff links
- migrations 001–009 applied with matching checksums
- no pending migrations
- no temporary migration/promotion execution flags

Applied migrations 001–009 are immutable history. New schema work begins at migration 010.

## 3. Current repository architecture

### Runtime

- Node.js / CommonJS
- Express API
- PostgreSQL via `pg`
- Render deployment
- Meta WhatsApp webhook integration
- OpenAI-backed assistant
- Pino logging / request context

### Production startup

`app.js` now starts only normal production responsibilities:

- Express/API server
- health/database check
- `/admin` routes
- `/audit-read` routes
- WhatsApp webhook routes
- Goldie sync scheduler while transition requires it
- appointment lifecycle scheduler
- graceful shutdown

Historical reconciliation/promotion services remain available as repository infrastructure but are not run automatically at startup.

### Existing route surfaces

Current operational/admin surface includes:

- documents/knowledge administration
- legacy profile reads/updates
- Goldie sync/import endpoints
- historical client reconciliation and audit endpoints
- appointment lifecycle CRUD/scan/test endpoints
- WhatsApp template test endpoint
- feedback/reviews/customer-satisfaction endpoints
- database status/schema/overview/migration administration

The repository does not yet expose a complete canonical Production CRM API for clients, catalogue, staff, availability and booking administration.

## 4. Current canonical PostgreSQL model

The schema already provides a strong CRM foundation.

### Clients

- `clients`
- `client_contacts`
- `client_reconciliation_queue`
- `client_reconciliation_history`
- `external_client_records`
- `external_records`
- `import_batches`

Key principle: phone/contact values are contact methods, not identity. Shared phone alone never justifies a merge.

### Catalogue and resources

- `locations`
- `service_categories`
- `services`
- `staff`
- `staff_services`

The catalogue supports duration, processing/extra time, fixed/variable pricing, active/inactive state, and external provenance.

### Appointments/calendar

- `appointments`
- `appointment_services`
- `appointment_staff`
- `appointment_status_history`
- `calendar_blocks`
- lifecycle/change-intent tables already present from earlier application work

Appointments support:

- canonical client link
- location
- start/end timestamps
- lifecycle status
- multi-service snapshots
- multi-staff assignments
- total price/currency
- source provenance/external IDs
- status history

Calendar blocks support staff/location, time off/personal events, recurrence source text and provenance.

### Existing conversational/AI data

The repository/database also already contains operational assistant infrastructure including conversation sessions, user profiles, booking intents, appointment change intents, knowledge/document tables and customer-experience data.

## 5. Current architectural strengths

1. Canonical client/contact separation already exists.
2. Appointment model is not tied to one service or one staff member.
3. Historical provenance is retained rather than overwriting canonical data.
4. Service/staff snapshots preserve what was actually booked historically.
5. Audit/status-history foundations already exist.
6. WhatsApp and AI layers are already connected to the same application.
7. Database migration discipline and production audit tooling are established.

## 6. Main production gaps

### A. Canonical Client CRM API

The admin API still emphasizes legacy `user_profiles` and migration reconciliation. Production CRM needs first-class CRUD/search/history endpoints over canonical `clients` and `client_contacts`.

Required capabilities:

- search/list clients
- get full client record
- create client
- update client details/preferences/tags
- add/update/remove contact methods safely
- view appointment history
- view communication/context history
- duplicate warning without automatic merging

### B. Operational Appointment API

The lifecycle endpoints exist, but Production CRM needs a single operator-facing appointment service/API that handles:

- create booking
- edit date/time
- assign client
- assign one or more services
- assign one or more staff members
- pricing snapshots
- status transitions
- cancellation/no-show/completion
- conflict checks
- audit trail

### C. Availability engine

There is not yet a single authoritative availability engine combining:

- service duration
- staff-service eligibility
- staff working hours
- appointments
- calendar blocks/time off
- location/resource constraints
- buffers/processing/extra time

This is the critical dependency for replacing Goldie's booking calendar.

### D. Operational Catalogue API

Need canonical admin CRUD for:

- service categories
- services
- pricing
- duration/buffers
- active/inactive state
- staff-service assignments

Historical inactive Goldie services must remain distinguishable from currently bookable services.

### E. Staff schedule/resources

Need production concepts for:

- staff working hours
- recurring availability
- exceptions/time off
- service eligibility
- active/inactive practitioners

### F. Booking workflow integration

Existing booking-intent intelligence needs to call the canonical CRM/availability/appointment services rather than operate as an isolated conversational feature.

### G. Operator/admin interface

The backend currently has admin APIs but no complete clinic CRM operator UI. A practical clinic dashboard will be required for daily use.

### H. Goldie decommission boundary

`startGoldieSyncScheduler()` remains active during transition. It must eventually be switched from operational dependency to optional archive/import tooling and then disabled once Shiloh becomes authoritative.

## 7. Production CRM architecture rule

From this point forward, business logic should be organized behind canonical domain services rather than direct route/controller SQL or Goldie-specific logic.

Target domain boundary:

- `clientService`
- `catalogueService`
- `staffService`
- `availabilityService`
- `appointmentService`
- `bookingService`
- `communicationService`
- `auditService`

WhatsApp, admin API and future web UI should all call the same domain services.

## 8. Build sequence

### CRM-1 — Operational CRM API Foundation

Goal: make the existing canonical database usable as an actual CRM backend.

Deliverables:

1. Canonical client read/search API
2. Canonical client create/update API
3. Client appointment-history endpoint
4. Canonical catalogue read API
5. Canonical staff read API
6. Canonical appointment read/detail API
7. Consistent API response/error/audit patterns
8. No schema change unless a concrete gap is found

Acceptance:

- clinic data can be read from canonical tables without using legacy profile APIs
- Goldie historical staging/reconciliation tables are not required for daily CRM reads
- no write path can accidentally merge clients by phone alone

### CRM-2 — Availability and Scheduling Core

Goal: establish one authoritative availability calculation.

Expected schema addition begins with migration `010` if needed for working-hours/availability rules.

Deliverables:

- staff working-hours model
- recurring schedules + exceptions
- appointment conflict calculation
- calendar-block conflict calculation
- service/staff eligibility
- duration/buffer calculation
- API for available slots

### CRM-3 — Production Booking Writes

Goal: safely create and modify real Shiloh bookings.

Deliverables:

- transactional appointment creation
- service/staff snapshot creation
- price calculation/snapshot
- status-history write
- idempotency/concurrency protection
- reschedule/cancel workflow
- audit trail

### CRM-4 — WhatsApp Booking Integration

Goal: connect conversational booking intents to the same availability and booking services used by operators.

### CRM-5 — Operator CRM UI

Goal: daily clinic dashboard for clients, calendar, bookings, services and staff.

### CRM-6 — Goldie Operational Cutover

Goal: formally make Shiloh authoritative, disable operational Goldie sync, retain archive/reconciliation tooling only for provenance.

## 9. Immediate first implementation

Start with CRM-1, specifically the canonical read layer before adding new writes.

Recommended first endpoints:

- `GET /admin/crm/clients`
- `GET /admin/crm/clients/:id`
- `GET /admin/crm/clients/:id/appointments`
- `GET /admin/crm/services`
- `GET /admin/crm/staff`
- `GET /admin/crm/appointments`
- `GET /admin/crm/appointments/:id`

These endpoints should be read-only initially and return canonical production data only. Historical source/provenance may be included as metadata but must not drive identity resolution.

## 10. Database inspection note

The repository migrations and final production audit provide the authoritative current schema/checkpoint. During this baseline inspection, Render's direct read-only Postgres connector returned an SSL/TLS-required connection error, so no unverified direct SQL result is claimed here. The existing protected database overview/schema endpoints remain available for operational verification when needed.

## 11. Definition of CRM-1 complete

CRM-1 is complete when the clinic has a stable, canonical, read-oriented CRM API covering clients, services, staff and appointments, with clear separation from legacy profiles and historical Goldie reconciliation infrastructure. That API becomes the base for availability, booking writes, WhatsApp integration and the operator interface.
