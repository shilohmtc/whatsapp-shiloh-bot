# Shiloh OS

Production WhatsApp booking, CRM and customer-care system for Shiloh Massage Therapy and Aesthetic Clinic.

## Production handoff

Start here: [`docs/HANDOFF-NEXT-CHAPTER-2026-08-10.md`](docs/HANDOFF-NEXT-CHAPTER-2026-08-10.md)

Goldie migration/reference manifest: [`docs/GOLDIE-EXPORT-MANIFEST-2026-08-10.md`](docs/GOLDIE-EXPORT-MANIFEST-2026-08-10.md)

## Runtime

- Node.js 24.14.1
- Express
- PostgreSQL
- Meta WhatsApp Cloud API
- OpenAI Responses API
- Google Calendar OAuth integration
- Render production hosting

## Production invariants

- Shiloh CRM is the booking source of truth.
- Google Calendar is a synchronized operational view, not the primary database.
- Staff/service authorization is enforced in CRM before booking mutations.
- Migration/reconciliation work must not send client messages unless explicitly intended.
- Secrets and raw client exports must never be committed to Git.
