# Shiloh OS — OpenAI API retention control

Last reviewed: 2026-08-11

## Current Shiloh use

Shiloh uses the OpenAI Responses API for general conversational replies and persists the returned response ID locally so `previous_response_id` can provide short multi-turn continuity.

The general conversation request currently uses `store: true`. OpenAI's current official data-controls documentation states that Responses API application state is retained for at least 30 days when stored, while API data is not used for model training by default unless the customer opts in. Standard abuse-monitoring logs may also be retained for up to 30 days. Eligible approved customers can use Modified Abuse Monitoring or Zero Data Retention; under Zero Data Retention, `store` is treated as `false`.

Official source: https://platform.openai.com/docs/models/default-usage-policies-by-endpoint

## Shiloh local retention policy

The local `conversation_sessions` mapping is operational continuity state, not durable client memory.

- Default maximum local reuse window: **24 hours**.
- Configurable through `CONVERSATION_SESSION_TTL_HOURS` for operational testing, but hard-bounded to **1–168 hours**.
- A stale mapping is deleted on attempted reuse and is never passed as `previous_response_id`.
- A background cleanup runs hourly and deletes abandoned stale mappings even when the client never messages again.
- Cleanup logs aggregate counts only; it does not log client phone numbers or response IDs.

Durable personal facts belong in Shiloh's deliberately governed structured CRM/profile fields, subject to the AI-context allowlist. OpenAI response IDs are not a durable memory store.

## Remaining P-PRIV-2 work

1. Evaluate replacing stored Responses state with a locally managed, short, explicitly minimised context using `store:false`.
2. Do not switch production conversation state until synthetic multi-turn tests demonstrate that core clinic follow-ups remain correct.
3. If stricter OpenAI retention controls become eligible for the Shiloh API project, assess Modified Abuse Monitoring / Zero Data Retention before enabling them.
4. Never ingest client conversations or client records into the permanent business-knowledge/vector-document store.
