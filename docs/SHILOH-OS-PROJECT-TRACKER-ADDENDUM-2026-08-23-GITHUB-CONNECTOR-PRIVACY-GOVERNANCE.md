# Shiloh OS — Project Tracker Addendum — GitHub Connector Privacy Governance

Date: 2026-08-23

This bounded addendum supplements `docs/SHILOH-OS-PROJECT-TRACKER.md` without replacing unrelated Tracker authority.

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| GOVERNANCE-GITHUB-CONNECTOR-PRIVACY | Control & Reconciliation + all specialist workstreams | 🟢 GOVERNANCE IMPLEMENTED / MERGE-GATED | Business authorization recorded for a permanent cross-workstream rule. `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md` now distinguishes GitHub connector technical permission, Shiloh business authorization, and ChatGPT/platform privacy confirmation; requires minimum-necessary GitHub payloads; prohibits weakening global connector permissions merely to suppress privacy prompts; and requires already-authorized controlled units to resume after any unavoidable platform confirmation without requesting duplicate Shiloh authorization. This unit changes repository governance documentation only. Final authority is merge-gated by normal CI. |

## Scope preservation

This governance rule does not expand authority for production mutations, destructive actions, irreversible business decisions, security-sensitive changes, provider writes, or work outside an authorized controlled unit.

No GitHub connector permission, global plugin permission, application code, CRM data, appointment/attendance state, provider configuration, Render environment value, or database state is changed by this unit.

## Completion path

`governance edit → bounded reconciliation records → CI → merge → exact docs auto-deploy verification → final Control checkpoint`
