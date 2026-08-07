# Changelog

All notable changes to Shiloh are documented in this file.

This project follows Semantic Versioning: MAJOR.MINOR.PATCH.

## [1.0.1] - 2026-08-07

### Maintenance
- Upgraded the official OpenAI JavaScript/TypeScript SDK from the 5.x line to `7.1.0`.
- Regenerated `package-lock.json` and verified a clean `npm ci` install on Node.js 24.14.1.
- Kept the existing Responses API integration and customer-facing behavior unchanged.

## [1.0.0] - 2026-08-07

### Shiloh AI Receptionist — Production Baseline

#### Added
- Meta WhatsApp Cloud API webhook integration and outbound messaging.
- OpenAI Responses API integration with persistent conversation continuity.
- PostgreSQL-backed long-term conversation memory and customer profiles.
- Clinic knowledge retrieval with vector search and Goldie knowledge synchronization.
- Clinic-only scope guardrails and business knowledge prioritization.
- Intelligent booking preference collection, service validation, date/time parsing, therapist preferences, confirmation summaries, and Goldie handoff.
- Existing-appointment reschedule and cancellation flows with persistent state and confirmation safeguards.
- Appointment lifecycle infrastructure for reminders and post-visit follow-ups.
- Customer Experience Intelligence: ratings, private feedback collection, Google review workflow, unresolved-feedback tracking, and admin analytics endpoints.
- Protected admin API endpoints and production health endpoint.
- Structured production logging and OpenAI token-usage observability.

#### Production hardening
- Render Starter deployment baseline.
- Node.js runtime pinned to 24.14.1.
- Deterministic production installs via `npm ci`.
- Render health checks configured to `/health`.
- PostgreSQL persistence verified across service restarts.
- Automatic GitHub-to-Render deployments.

#### Notes
- WhatsApp proactive reminder/follow-up templates are prepared in Meta and can be enabled once approved.
- Goldie remains the booking system of record for v1.0.0 while Project Shiloh OS is developed as the long-term replacement.

