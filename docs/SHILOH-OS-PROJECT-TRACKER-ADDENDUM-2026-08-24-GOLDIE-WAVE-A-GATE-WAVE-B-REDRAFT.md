# Shiloh OS — Project Tracker Addendum — Goldie Wave A Gate + Wave B Redraft

Date: 2026-08-24
Owner: 20 — CRM & Identity
Next owner: 00 — Control & Reconciliation

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| GOLDIE-WAVE-A-PUBLICATION | CRM & Identity → Control & Reconciliation | 🔴 DEFECT / HOLD | PR #441 exact 20-row Wave A contains broad Goldie `Waxing` (`175c91c9-562e-4aa7-87eb-8f918462ce7f`), while current durable Tracker/PR #386 authority requires that same historical service remain inactive, unmapped and non-bookable. `/book` publishes only active services with an active client-bookable practitioner. No production write occurred. Recommended Control resolution: hold Waxing and ratify the remaining 19 exact rows for CRM implementation. |
| GOLDIE-WAVE-B-REDRAFT | CRM & Identity → Control & Reconciliation | 🟢 DRAFT COMPLETE / PUBLICATION NOT AUTHORIZED | Exact neutral proposed descriptions for all 15 PR #441 claim-level Wave B rows are documented in `docs/SHILOH-OS-GOLDIE-WAVE-B-EXACT-REDRAFT-2026-08-24.md`. Control must return per-row approve/rewrite/hold decisions before publication. Scope-gated, high-risk and Wave C rows remain fail closed. |
| RENDER-POSTGRES-READONLY-TLS | Production / DevOps observer | 🔴 DEFECT / UNCHANGED | First-party read-only Render PostgreSQL preflight failed before SQL execution with the known TLS integration defect (`unexpected EOF` / SSL/TLS required). TLS was not weakened and no alternate unsafe path was used. This unit did not reassess or expand assistant PostgreSQL capability. |

## Preservation boundary

No Goldie description, CRM catalogue row, service status, practitioner mapping, database row, appointment, Calendar event, WhatsApp state or provider content changed in this unit.

Do not redo PR #392/#393, the 52-service source comparison, PR #415, PR #436, PR #440 except its corrected count, PR #441, PR #386 Waxing preservation authority, Psoas/Bamboo evidence, lymphatic blanks, retired Full Body Sports Massage blank, imported-contact remediation through PR #435, Gate/Stage work, or migrations 072/074.

Master Status was reviewed and does not require mutation because live catalogue authority/state did not change.