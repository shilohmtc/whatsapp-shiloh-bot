# Shiloh OS — Reconciliation — Practitioner Calendar Conflict Classification

Date: 2026-08-21
Owner: Booking & Admin UX
Status: VERIFIED LIVE

## Scope

This reconciliation records the bounded Booking & Admin UX correction delivered by PR #395. The change corrects false practitioner Google Calendar blocking while preserving clinic-wide/shared Calendar conflict protection. It does not broaden booking entitlement, practitioner identity authority, clinic hours, schedules, CRM conflict rules, `calendar_blocks`, or Calendar mutation authority.

## Accepted implementation

PR #395, **Fix practitioner calendar conflict classification**, merged to `main` as `485ed97d8812fc291c71493dd1bb652b5da42f05` from source commit `89ae2f6cbe0df7c1dae8f471f9b9aeb1f2d8b64c`.

The implementation classifies practitioner-calendar events against the assigned practitioner instead of treating an unrelated practitioner's event as a clinic-wide conflict. Shared/clinic-wide Calendar conflicts remain blocking. Existing fail-closed Google Calendar health and booking guards remain authoritative.

## Verification

- Focused pre-merge tests: 30/30 passed.
- Full pre-merge regression: 856/856 passed.
- GitHub Actions CI run #1228 completed successfully; the `test` job and `Run non-mutating regression tests` step passed.
- Render production service: `shiloh-whatsapp-bot`, branch `main`, auto-deploy on commit.
- Exact production deploy: `dep-da4a75lckfvc738ghpmg`.
- Render checked out exact merge commit `485ed97d8812fc291c71493dd1bb652b5da42f05` and reached `live`.
- Startup/runtime logs reported the service live and repeated `/health` requests returned HTTP 200.
- The post-deploy booking integrity scan completed normally with `bookingLike=0` and `scanned=0`.

## Safety / non-mutation evidence

No appointment, schedule, CRM record, or Google Calendar event was changed merely to prove this correction. No synthetic booking or Calendar event was manufactured for verification.

The change preserves:

- clinic-wide/shared Calendar blocks;
- practitioner-specific Calendar conflict protection for the practitioner actually assigned to the booking;
- canonical CRM appointment conflicts and `calendar_blocks`;
- practitioner schedules/exceptions and clinic-hours rules;
- Google Calendar fail-closed provider health behavior;
- all existing booking entitlement and approval rules;
- multi-staff booking/cancellation Calendar safety established by prior accepted authority.

## Durable rule

A busy event on practitioner A's practitioner Calendar must not, by itself, make practitioner B unavailable. A shared/clinic-wide blocking event remains clinic-wide. The booking flow must continue to fail closed when the relevant assigned-practitioner Calendar, shared Calendar, provider health, or canonical conflict evidence cannot be safely resolved.

## Supersession / continuation

PR #395 is the current application authority for practitioner Calendar conflict classification and supersedes the older application baseline only for this bounded behavior. All unrelated PR #388/#389 and later documentation/provider/catalogue authority remains preserved where not superseded.

Do not redo the 30-test focused verification, 856-test regression, or manufacture operational data merely to reproduce evidence. Future investigation should begin from current GitHub `main`, this reconciliation, Master, Project Tracker and Engineering Governance, and should verify only evidence that could have changed.
