# Shiloh OS — Master Status Addendum — Goldie Wave A Publication

Date: 2026-08-24
Authority type: durable live catalogue state
Owner: 20 — CRM & Identity
Status: VERIFIED LIVE / COMPLETE / DO NOT REDO

## Current durable state

PR #445 is the implementation authority for the already-approved PR #441 Wave A set.

Current application merge for this unit:

`e4505570f625e14af94ddb5bda8e1d20bfb14a6c`

Exact production deploy:

`dep-da61bq1t0dsc73cr1d4g` — LIVE

Migration:

`075_goldie_wave_a_customer_descriptions.sql`

Production verified:

- exact 20 PR #441 Goldie UUID targets resolved canonically;
- exact 20/20 approved customer descriptions stored;
- 19 targets remain active and public-catalogue eligible;
- historical broad Waxing remains inactive and non-bookable;
- practitioner mappings preserved;
- target service metadata preserved except approved description/row update timestamp;
- all non-target descriptions preserved;
- no client, appointment, Calendar, WhatsApp or provider mutation;
- retained Goldie source SHA-256 `fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16` remains the publication source authority.

Final CI #1334 / run `32714349691` / job `97392322019` passed Node 24.14.1, focused maintenance framework 12/12 and full regression 919/919 with zero failures/cancellations/skips.

## Boundaries that remain authoritative

Wave B remains drafting/redraft only until Control returns exact per-row publication decisions.

Wave C remains fail closed. Do not infer or publish Psoas missing text, Bamboo identity, blank lymphatic descriptions, retired Sports Massage blank, or corrupted/incomplete source wording. Do not restore practitioner personal phone numbers.

Migration 074 verified-client authority remains unchanged and continues to run before migration-075 publication verification on startup. Migration 075 must not be executed through generic `db:migrate`; its guarded bootstrap requires the transaction-local PR441 authority marker.

The Render read-only PostgreSQL connector TLS defect remains unresolved and TLS must not be weakened.

## Reuse rule

Future catalogue publication work should reuse the exact-ID/checksum/precondition/transaction/postcondition pattern established by PR #445 rather than building a new arbitrary SQL or production-write surface. The mechanism is scoped and authorization-bound; it is not blanket permission to mutate catalogue or database state.

This addendum supersedes older Master statements that described Goldie Wave A publication as pending. It does not supersede the still-open Wave B and Wave C gates.