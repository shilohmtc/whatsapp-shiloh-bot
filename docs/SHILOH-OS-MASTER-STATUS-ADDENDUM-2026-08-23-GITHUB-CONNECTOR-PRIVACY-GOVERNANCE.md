# Shiloh OS — Master Status Addendum — GitHub Connector Privacy Governance

Date: 2026-08-23
Status: VERIFIED / COMPLETE

This bounded addendum supplements `docs/SHILOH-OS-MASTER-STATUS.md` without replacing unrelated Master authority.

## Durable governance authority

Across all Shiloh OS workstreams, the following controls are distinct:

1. GitHub connector technical permission.
2. Shiloh business authorization for a controlled unit.
3. ChatGPT/platform privacy or data-sharing confirmation.

A platform privacy confirmation is not a new Shiloh authorization gate and is not evidence that GitHub technical permission has been reduced.

Once a controlled unit has received the required business authorization, routine in-scope GitHub execution continues automatically through the established completion protocol. Duplicate business authorization must not be requested merely because the next authorized step is a branch, file write, pull request, merge, or reconciliation action.

## GitHub payload minimization

GitHub writes must contain only the minimum authoritative information needed for the repository record. Prefer role- or decision-based wording over unnecessary personal identifiers. Do not place full phone numbers, addresses, credentials, secrets, client personal data, or other identifying/sensitive information into GitHub writes unless genuinely required and appropriate to the controlled scope.

Global connector/plugin permissions must not be weakened or broadened merely to suppress platform privacy prompts. If an unavoidable platform confirmation physically blocks an already-authorized GitHub action, it is a platform interaction gate only; after it is satisfied, the same controlled unit resumes without a new business-authorization request.

## Authority boundary

This governance rule does not authorize production mutations, destructive actions, irreversible business decisions, security-sensitive changes, provider writes, or work outside the authorized scope. Existing approval, provider, human-truth, security, privacy, production, destructive-action and scope gates remain authoritative.

## Canonical rule and evidence

Canonical authority:

`docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`

Every specialist workstream is required to inspect current Engineering Governance on GitHub `main`; this rule is therefore part of the permanent cross-workstream operating model.

Evidence:

- PR #423 merged as `31f51c7bc6ac307fb00fd938cd65a1e4cf995275`
- CI #1288 / run `32637357517` / job `97189009523`
- Node `24.14.1`
- full non-mutating regression: 887/887 passed
- exact documentation auto-deploy `dep-da5dq6jbc2fs73aokl0g` reached LIVE

## Operational non-change

No connector permission setting, application code, production data, provider configuration, Render environment value, appointment/attendance state, or database state changed by this documentation-only governance unit.

## Closure

Permanent authority is established. Platform privacy confirmations may still exist as platform controls; they do not reopen or supersede this governance rule.
