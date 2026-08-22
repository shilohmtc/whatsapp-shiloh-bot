# Shiloh OS — Reconciliation — CRM Onboarding Normalized Phone Ambiguity

Date: 2026-08-22
Owner: CRM & Identity
Shared-state owner: Control & Reconciliation
Status: VERIFIED LIVE

## Scope

This reconciliation records the completed production repair for the WhatsApp onboarding PostgreSQL `42702` failure `column reference "normalized_phone" is ambiguous`. It closes the previously recorded `CRM-ONBOARDING-NORMALIZED-PHONE-AMBIGUITY` defect/hold. The application investigation, repair, regression, CI, merge and production deployment are complete and must not be redone merely for reconciliation.

PR #395 remains the durable authority for practitioner Google Calendar conflict classification. PR #399 does not alter that rule or any unrelated Booking/Admin, provider, catalogue, attendance or business-approval authority.

## Triggering production evidence

On 2026-08-22 production recorded three WhatsApp onboarding failures. PostgreSQL raised code `42702` with `column reference "normalized_phone" is ambiguous` while `completeOnboarding()` was performing the canonical `client_contacts` insert through `processActiveSession()` and the WhatsApp webhook path. Generic `/health` remained HTTP 200, so service health alone did not close the application-path defect.

## Authoritative root cause

Applied migration `067_controlled_juvan_registration_rebind.sql` had installed a `BEFORE INSERT/UPDATE` trigger on `client_contacts`. Its PL/pgSQL function declared a local variable named `normalized_phone` and evaluated:

`WHERE d.normalized_phone = normalized_phone`

PostgreSQL treated the unqualified identifier as ambiguous and raised `42702` before ordinary onboarding could complete.

Migration 067 was not edited because applied migrations are checksum-authoritative.

## Accepted repair

PR #399, **Fix CRM onboarding normalized phone ambiguity**, merged to `main` as `26ace1027e10f40e41d0f5d981e72f4a55a972c6`.

The repair adds forward migration `072_client_onboarding_controlled_demo_phone_ambiguity.sql`. Migration 072 replaces only `guard_and_rebind_controlled_demo_contact()` and uses `v_normalized_phone` for the local PL/pgSQL value, removing the identifier collision without weakening the existing controlled-identity guards. Startup checksum/application sequencing explicitly applies migration 072 after the established controlled-identity migrations.

The repair preserves:

- canonical CRM contact ownership;
- duplicate/contact conflict guards;
- controlled Juvan identity ownership;
- the existing-bound-client guard;
- WhatsApp-onboarding-only unbound rebind;
- atomic approval-policy pointer rebind;
- controlled identity audit event; and
- fail-closed approval-policy pointer consistency.

## Verification

- PR #399 GitHub Actions CI run **#1236** passed.
- CI used Node **24.14.1**.
- Full non-mutating regression passed **860/860**, with **0 failed** and **0 skipped**.
- Four focused regression cases passed:
  1. historical migration 067 collision is captured;
  2. migration 072 removes the PL/pgSQL collision without weakening guards;
  3. ordinary onboarding retains canonical contact creation and duplicate handling; and
  4. startup applies migration 072 after the established controlled-identity migrations.

## Production verification

- Render auto-deploy: `dep-da4me5qd0e5s73bobfm0`.
- Exact deployed application commit: `26ace1027e10f40e41d0f5d981e72f4a55a972c6`.
- Deploy reached **LIVE** at `2026-08-22T09:09:08Z`.
- Startup logged migration 072 with `applied=true` and `checksumVerified=true`.
- Historical migrations 065–068 remained `checksumVerified=true`.
- Controlled Juvan identity remained BOUND.
- Existing assigned-practitioner Primary + Jean-Pierre Backup + first-decision-wins approval authority remained verified.
- Service logged `Shiloh started`.
- Repeated `/health` requests returned HTTP 200.
- A bounded post-cutover Render log search from `2026-08-22T09:09:08Z` through `09:09:55Z` returned zero `normalized_phone` matches.

The zero-match window is bounded error-absence evidence; it is not a manufactured end-to-end client-onboarding journey and must not be represented as one.

## Safety / non-mutation evidence

No real CRM identity, appointment, Google Calendar event, booking, or WhatsApp provider state was created or mutated merely to prove this repair or reconciliation. No genuine Juvan reset/re-registration was performed for evidence.

## Durable authority

PR #399 / `26ace1027e10f40e41d0f5d981e72f4a55a972c6` is the current accepted **application-code authority** as of this reconciliation. It supersedes PR #395 only as the overall application baseline because it is newer application code; it does not supersede PR #395's bounded practitioner-Calendar classification rule.

PR #395 / `485ed97d8812fc291c71493dd1bb652b5da42f05` remains the durable authority for practitioner Google Calendar conflict classification: an unrelated practitioner's practitioner-Calendar event does not, by itself, block the assigned practitioner; shared/clinic-wide and relevant assigned-practitioner conflicts remain blocking, with all standing fail-closed provider and canonical-conflict guards preserved.

Any later documentation-only reconciliation merge and its automatic Render deploy are time-bounded deployment evidence only. A documentation-only commit must not supersede PR #399 / `26ace1027e10f40e41d0f5d981e72f4a55a972c6` as application authority. Exact current GitHub/Render convergence must be re-verified at continuation time.

## Continuation

`CRM-ONBOARDING-NORMALIZED-PHONE-AMBIGUITY` is **🟢 VERIFIED LIVE / COMPLETE**. Do not reopen the root-cause investigation, edit migration 067, replay PR #399, manufacture a client onboarding, or mutate real CRM/booking/Calendar/WhatsApp state merely to reproduce proof. Future work must begin from current GitHub `main`, Master Status, Project Tracker, this reconciliation and Engineering Governance, preserving any newer authoritative evidence.