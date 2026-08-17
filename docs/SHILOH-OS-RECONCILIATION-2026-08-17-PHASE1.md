# Shiloh OS — Reconciliation 2026-08-17 Phase 1

Reconciled: 2026-08-17 18:58 SAST

## Authority checked

- GitHub `main`
- GitHub Actions CI
- Render production deploy and application startup logs
- Existing Shiloh CRM-backed catalogue contracts

## Production convergence

PR #280, **Build Phase 1 Shiloh public service catalogue**, passed CI and merged to `main` as **`5d8b2c2350a554656cc416ecbe289f9374e3305a`**.

Render auto-deployed that exact commit as deployment **`dep-da1jqoe1egvs73aagcug`** and reported it **LIVE** at 2026-08-17 16:57:34 UTC. The new instance started successfully, `/health` returned HTTP 200, and Render reported the primary URL live.

Source and production are therefore converged for the Phase 1 public catalogue runtime.

## Phase 1 public catalogue — VERIFIED LIVE

`/book` is now the Shiloh-owned public service catalogue and booking entry surface.

The page is a read-only projection of canonical Shiloh catalogue data. Public rows are restricted to:

- `services.status = 'active'`
- at least one mapped active `staff` row
- `staff.resource_type = 'practitioner'`
- `staff.client_bookable = TRUE`

The public page renders canonical service category, name, duration, price, customer description and booking note. Each treatment CTA opens the official Shiloh WhatsApp booking journey with the exact canonical service name preselected. Availability is not asserted on the webpage; it remains authoritative only inside the existing Shiloh availability/booking flow.

No appointment data, availability rules, pricing truth, service mappings or practitioner eligibility were mutated by this workstream.

## Phase 1 visual contract

The page now ships with the approved real Shiloh reception photograph as the primary hero image through the committed `/assets/booking/reception.svg` asset. Promotional posters are intentionally excluded from the permanent service catalogue. Additional clinic/category/treatment photographs may be added progressively without changing the catalogue data model.

## Compatibility and regression evidence

The first Phase 1 CI run exposed one legacy landing-page copy regression. The page was repaired to retain the established public contract:

- `Your appointment starts with Shiloh.`
- `Continue with Shiloh on WhatsApp`

The corrected head **`105cce9d4afd4030217d85ec9cf13704e150fb0a`** passed CI run **#918** before merge. The full non-mutating test suite passed.

## Provider evidence refreshed during deploy

Fresh Render startup evidence from the production instance reported:

- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**
- `shiloh_staff_finalization_actions_v1` — **APPROVED / UTILITY**
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**

This supersedes the prior reconciliation that still listed `shiloh_staff_finalization_actions_v1` as PENDING. Provider approval alone does not manufacture handset delivery evidence; proactive use remains subject to the existing authorized-recipient, idempotency and genuine operational rules.

## Earlier deployment convergence resolved

The previously outstanding #277 confirmed-reschedule commit repair and #278 manual start-time presentation were already superseded by later live commits before Phase 1. The current live runtime contains their lineage. They must not be treated as outstanding deployment work.

## Human / evidence gates unchanged

- Historical attendance remains human-controlled; re-query before quoting a current unresolved count.
- Appointment #558 remains fail-closed until the real historical practitioner is established.
- Pa Derik #567 must not be mutated merely for proof.
- Genuine lifecycle/follow-up/birthday evidence remains genuine-journey gated where not already observed.
- Destructive privacy execution remains fail-closed.

## Exact continuation state

**Authoritative current runtime:** GitHub + Render converged through **`5d8b2c2350a554656cc416ecbe289f9374e3305a`** (PR #280).

**Completed now:** Shiloh-owned Phase 1 public service catalogue at `/book`, canonical CRM-backed service projection, exact-service WhatsApp handoff, active/client-bookable exposure guard, mobile-first branded presentation, and initial approved Shiloh clinic imagery.

**Next catalogue evolution:** review the live Phase 1 page with the business, then progressively add approved clinic/category/treatment photographs and any presentation-only refinements. Do not create a second service source of truth.

**Remaining hard gates:** human attendance truth, #558 practitioner identity, genuine journey evidence, and any future material business-rule or commercial changes.