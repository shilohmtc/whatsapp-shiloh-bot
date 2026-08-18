# Shiloh OS — Reconciliation — WhatsApp Menu Label Polish

Date: 2026-08-18
Owning workstream: Booking & Admin UX
Observers: WhatsApp / Meta Integration for genuine handset presentation; Control & Reconciliation for continuity.

## Authority and evidence reviewed

- GitHub `main` through merged PR #320 / `90cbc79362183cff8ea9ef3116aac52e3f312f7f`.
- Master Status, Project Tracker, previous JP Booking Entitlement reconciliation, and Engineering Governance on `main`.
- The production screenshot showing Admin **Choose service** rows with ellipsized treatment titles and empty descriptions.
- Current list transport validation: row title maximum 24 characters, optional description maximum 72, button label maximum 20, and section title maximum 24.
- Current Admin and client dynamic list producers across booking, booking management, finalization, pricing, approvals, discovery, packages, booking changes, availability and rescheduling.
- GitHub Actions CI #1033 and Render deployment `dep-da29chegekts7391fq90`.

The screenshot was diagnostic evidence only. No image generation was used.

## Accepted presentation rule

Applicable dynamic WhatsApp list rows use one shared presentation contract:

- keep the required title concise and within 24 characters;
- put the full canonical treatment, service, package or client wording in the optional description whenever it fits within 72 characters;
- include price, duration, date, practitioner or other secondary detail only when it does not force a fitting canonical label to be shortened;
- explicitly ellipsize labels longer than the provider's 72-character description limit;
- leave static labels unchanged when they already display in full;
- never rename or mutate canonical CRM data merely to fit a WhatsApp menu.

The provider limits mean arbitrary wording cannot be unlimited. The accepted goal is the fullest faithful presentation possible within the list contract, without extra permissions or unsafe navigation.

## Implementation

PR #320 adds `src/presentation/whatsappListRowPresentation.js` and applies it to:

- Admin Make a booking service/client rows;
- Admin Manage a booking appointment and replacement-service rows;
- historical finalization appointment and actual-service rows;
- services/pricing and pending-approval rows;
- client treatment discovery and massage-package rows;
- client booking-change, availability and rescheduling rows.

Static labels that already fit were retained. The change is presentation-only and does not alter entitlement, practitioner scope, availability, booking preparation/confirmation, CRM identity, database enforcement, Calendar writes or attendance authority.

## Verification

- PR #320 merged as `90cbc79362183cff8ea9ef3116aac52e3f312f7f`.
- CI run #1033 passed **648 / 0**.
- The new regression covers shared limits, the screenshot-equivalent Admin service list, representative Admin/client menu builders and adoption across every producer in scope.
- Render deploy `dep-da29chegekts7391fq90` reached **LIVE**.
- No post-deployment error-level logs were present.
- Google Calendar provider health passed.
- Production `/health` reported application and database status `ok`.

These checks verify merged code and production service health. They do not claim a post-fix handset view. Natural WhatsApp use may provide that evidence; do not create a booking, mutate an appointment or finalize attendance merely for proof.

## Completed — do not redo

The applicable Admin/client dynamic menu-label rule is centralized and live. Do not restore empty descriptions for long service rows, add duplicate local truncation policies, rename CRM services for display, weaken entitlement/availability guards, or reopen #320 without newer contradictory evidence.

JP's #318 entitlement remains unchanged: Christel-equivalent authorized Admin operations, Christel+Abigail booking scope only, and no finalization. Appointment #558 remains fail-closed with historical practitioner `SHILOH MTC`.

## Remaining gates and ownership

- Genuine handset presentation is a natural-evidence gate observed by WhatsApp / Meta Integration; no manufactured journey.
- `shiloh_booking_update_v1` approval remains a Meta provider gate.
- Historical attendance and #558 remain explicit human-truth gates.
- CRM & Identity owns any future canonical-label or identity conflict; Control & Reconciliation tracks cross-workstream dependencies.

Project Tracker and Master reconciliation are required and completed because #320 establishes a durable shared menu-presentation rule.
