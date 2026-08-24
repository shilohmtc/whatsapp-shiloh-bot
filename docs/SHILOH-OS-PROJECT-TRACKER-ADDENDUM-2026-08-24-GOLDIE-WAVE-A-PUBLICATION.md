# Shiloh OS — Project Tracker Addendum — Goldie Wave A Publication

Date: 2026-08-24
Owner: 20 — CRM & Identity
Next owner: 00 — Control & Reconciliation

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| GOLDIE-WAVE-A-PUBLICATION | CRM & Identity | 🟢 VERIFIED LIVE / COMPLETE / DO NOT REDO | PR #445 merged as `e4505570f625e14af94ddb5bda8e1d20bfb14a6c`. Migration 075 applied/checksum-verified from retained Goldie source SHA `fdcba9cf...`. Production guard verified exact 20/20 descriptions, 19 active/public-catalogue eligible, 1 inactive/non-bookable historical Waxing, practitioner mappings preserved and all non-target descriptions unchanged. CI #1334: 12/12 focused framework + 919/919 full regression. Exact Render deploy `dep-da61bq1t0dsc73cr1d4g` LIVE. Wave B/C untouched. |
| GOLDIE-WAVE-B-PUBLICATION | Control & Reconciliation → CRM & Identity | 🟠 WAITING CONTROL DECISION | Wave B exact neutral redrafts exist, but PR #441 authorizes drafting only. Control must return explicit per-row APPROVE / REWRITE / HOLD dispositions before any publication. |
| GOLDIE-WAVE-C | Control & Reconciliation / CRM & Identity | 🔴 HOLD | Psoas source truncation, Bamboo identity mismatch, active lymphatic blanks, retired Sports Massage blank and corrupted/incomplete source remain fail closed. No inference or publication. |
| RENDER-POSTGRES-READONLY-TLS | Production / DevOps observer | 🔴 DEFECT / UNCHANGED | First-party read-only Render PostgreSQL query remains blocked by the known TLS integration defect. TLS was not weakened and no alternate arbitrary SQL/write path was created. |

## Preservation boundary

Wave A publication changed only the approved `services.customer_description` values (plus row `updated_at`) for the exact 20 PR #441 Goldie UUIDs. Names, prices, durations, service status, practitioner mappings, clients, appointments, Calendar, WhatsApp and provider state were preserved.

Historical broad Waxing remains inactive, unmapped/non-bookable and history-preserving.

Do not redo PR #392/#393, PR #415, PR #436, PR #440, PR #441, PR #445, the 52-service source comparison, Psoas/Bamboo evidence, imported-contact remediation through PR #435, Gate/Stage work, or migrations 072/074/075.