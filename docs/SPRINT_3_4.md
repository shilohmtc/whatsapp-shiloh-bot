# Sprint 3.4 — Prompt orchestration and memory intelligence

## Goal

Unify current-message intent, structured user profile, business knowledge, and conversation history with deterministic precedence rules.

## Source priority

1. Current user message for explicit corrections or new personal facts.
2. Structured user profile for durable personal facts.
3. Business knowledge for business facts, policies, prices, services, hours, and procedures.
4. Conversation history for continuity only; it must not override higher-priority sources.

If authoritative sources conflict and the correct answer is unclear, Shiloh should ask for clarification instead of guessing.

## End-to-end tests

### Personal correction

1. Tell Shiloh: `My favourite drink is rooibos tea.`
2. Confirm Shiloh recalls rooibos tea.
3. Then say: `Actually, my favourite drink is coffee.`
4. Ask: `What is my favourite drink?`
5. Expected: coffee.

### Business knowledge versus personal preference

1. Upload a knowledge document containing: `The clinic's standard welcome drink is water.`
2. Keep the user's favourite drink set to coffee.
3. Ask: `What is my favourite drink?` Expected: coffee.
4. Ask: `What is the clinic's standard welcome drink?` Expected: water.

### Restart durability

1. Restart/redeploy Render.
2. Ask the personal and business questions again.
3. Expected: the same answers, with profile and business knowledge kept separate.
