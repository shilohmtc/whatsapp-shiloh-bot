# Shiloh OS

Production operating system for Shiloh Massage Therapy and Aesthetic Clinic — WhatsApp AI, booking, CRM and customer care.

## Platform model

- **Shiloh OS** — the complete production platform.
- **Shiloh** — the customer-facing WhatsApp AI assistant.
- **Shiloh CRM** — the authoritative booking and client data layer.
- **Google Calendar** — a synchronized operational calendar, not the primary database.
- **Render** — the production runtime and hosting environment.

## Production handoff

Start here: [`docs/HANDOFF-NEXT-CHAT-2026-08-11.md`](docs/HANDOFF-NEXT-CHAT-2026-08-11.md)

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
