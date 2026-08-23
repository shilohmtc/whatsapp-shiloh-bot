# Shiloh OS — Reconciliation — GitHub Connector Privacy Governance

Date: 2026-08-23
Owner: 00 — Control & Reconciliation
Status: VERIFIED / COMPLETE

## Authoritative decision

Shiloh OS permanently distinguishes three separate controls:

1. GitHub connector technical permission.
2. Shiloh business authorization for a controlled unit.
3. ChatGPT/platform privacy or data-sharing confirmation.

A platform privacy confirmation is not a new Shiloh authorization gate and is not evidence that the GitHub connector permission was reduced.

Once a substantial Shiloh controlled unit has been authorized, routine in-scope GitHub execution continues automatically through the controlled-work completion protocol. The same business authorization must not be repeatedly requested merely because the next step is a branch, file write, pull request, merge, or reconciliation action.

## Permanent cross-workstream rule

All five Shiloh OS workstreams must:

- read and follow `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md` on current `main`;
- treat GitHub technical permission, Shiloh authorization, and platform privacy confirmation as distinct controls;
- keep GitHub write payloads to the minimum authoritative information required;
- prefer role/decision wording such as `business authorization recorded` instead of unnecessary personal identifiers;
- avoid full phone numbers, addresses, credentials, secrets, client personal data, or other identifying/sensitive information unless genuinely required and appropriate for the repository record;
- not weaken global connector/plugin permissions merely to suppress privacy confirmations;
- if a platform privacy confirmation still physically blocks an already-authorized action, treat it only as a platform interaction gate and resume the same authorized unit after confirmation without asking for new Shiloh business authorization.

## Non-expansion of authority

This rule does not authorize production mutations, destructive actions, irreversible business decisions, security-sensitive changes, provider writes, or work outside the current authorized scope.

All existing business authorization, provider, human-truth, safety, privacy, security, production, destructive-action and scope gates remain authoritative.

## Implementation and evidence

Canonical governance file updated:

`docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`

The rule is placed directly after the Authoritative-state rule so every specialist workstream encounters it during required governance inspection.

Delivery evidence:

- PR #423 — `Add permanent GitHub connector privacy governance`
- implementation/reconciliation merge: `31f51c7bc6ac307fb00fd938cd65a1e4cf995275`
- CI #1288 / run `32637357517` / job `97189009523`
- Node `24.14.1`
- full non-mutating regression: **887 passed / 0 failed / 0 cancelled / 0 skipped**
- exact documentation auto-deploy: `dep-da5dq6jbc2fs73aokl0g` — LIVE

## No operational mutation

This governance unit does not change:

- GitHub connector permission settings;
- global plugin permissions;
- application code;
- CRM/client data;
- appointments or attendance;
- Meta/provider configuration;
- Render environment values;
- database schema or data.

Only repository governance documentation and reconciliation records changed.

## Closure

This governance rule is permanent shared authority. Do not ask for duplicate Shiloh authorization merely because an already-authorized controlled unit reaches an ordinary GitHub execution step. Do not treat platform privacy confirmation as business authorization. Do not broaden connector permissions merely to suppress privacy prompts.
