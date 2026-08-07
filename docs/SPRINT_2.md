# Sprint 2 — Persistent Conversation Memory

This sprint replaces in-memory conversation sessions with PostgreSQL-backed persistence.

## What changed

- Added the `pg` PostgreSQL client.
- `src/services/memory.js` now stores each WhatsApp user's latest OpenAI `response_id` in PostgreSQL.
- `src/services/ai.js` now awaits persistent session reads/writes.
- The `conversation_sessions` table is created automatically on first use.

## Required Render environment variable

Set `DATABASE_URL` on the `shiloh-whatsapp-bot` web service to the **Internal Database URL** of the Render PostgreSQL database named `shiloh-memory`.

## Persistence test

1. Send: `My favourite colour is green.`
2. Ask: `What is my favourite colour?`
3. Confirm Shiloh answers `green`.
4. Restart or redeploy the Render web service.
5. Ask again: `What is my favourite colour?`
6. Confirm Shiloh still answers `green`.

If step 6 passes, persistent conversation memory is working.
