# Shiloh

Production operating system for Shiloh Massage Therapy and Aesthetic Clinic — WhatsApp AI, booking, CRM and customer care.

## Platform model

- **Shiloh** — the complete clinic system.
- **Shiloh Workspace** — the human operating surface for authorized clinic staff.
- **Shiloh Control** — governance, engineering, release and reconciliation.
- **Shiloh AI Assistant** — the customer-facing WhatsApp assistant.
- **Shiloh CRM** — the authoritative booking and client data layer.
- **Google Calendar** — a synchronized operational calendar, not the primary database.
- **Render** — the production runtime and hosting environment.

## Start here

For current work, reconstruct from current `main`, issues, PRs and production evidence:

- [Shiloh Control Rules](docs/SHILOH_CONTROL_RULES.md) — canonical operating governance.
- [#611 — Control ledger](https://github.com/shilohmtc/whatsapp-shiloh-bot/issues/611) — current active units, execution gates and next actions.
- [#879 — Roadmap and owner acceptance](https://github.com/shilohmtc/whatsapp-shiloh-bot/issues/879) — product sequencing and remaining human checks.
- [#762 — Product inbox](https://github.com/shilohmtc/whatsapp-shiloh-bot/issues/762) — raw ideas and value triage.

Roadmap placement is not engineering authorization. Released work and owner acceptance are separate states. Chat history supports context but does not override current repository or production evidence.

## Historical references

Dated handoffs, Master Status, Project Tracker and Shiloh OS documents describe their recorded checkpoints. They remain historical evidence; use the current entry points above to resume work.

- [August 11 handoff](docs/HANDOFF-NEXT-CHAT-2026-08-11.md)
- [Goldie migration/reference manifest](docs/GOLDIE-EXPORT-MANIFEST-2026-08-10.md)

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
