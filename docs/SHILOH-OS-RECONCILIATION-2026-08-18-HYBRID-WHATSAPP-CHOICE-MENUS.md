# Shiloh OS — Reconciliation — Hybrid WhatsApp Choice Menus

Date: 2026-08-18
Owning workstream: Booking & Admin UX
Observers: WhatsApp / Meta Integration for provider and genuine handset behaviour; Control & Reconciliation for shared continuity; Production / DevOps for deployment evidence.

## Authority and evidence reviewed

- GitHub `main` through the prior menu-label reconciliation PR #321 / `d074c99db557fc03e7951655010d837f14ee3c14`.
- Master Status, Project Tracker, latest WhatsApp Menu Label Polish reconciliation, and Engineering Governance on `main`.
- The genuine production screenshot showing that each sequential WhatsApp list message arrived immediately but still required its own list-button tap.
- Meta's current interactive-message contract: reply buttons expose up to three choices directly; list messages retain a separate action button and are required for larger choice sets.
- Current webhook transport and inbound routing for `button_reply` and `list_reply`.
- Current Admin booking-scope guard and representative Admin/client dynamic menu builders.
- GitHub Actions CI #1037 and Render deploy `dep-da29l28ae00c73957t30`.

The screenshot was diagnostic evidence only. No image generation, booking, appointment change, CRM write or attendance action was used to manufacture proof.

## Accepted hybrid choice rule

Applicable Admin and client list interactions are presentation-hybridized only after existing authorization and booking-scope filtering:

- one to three safely distinguishable choices use immediately visible WhatsApp reply buttons;
- four or more choices remain WhatsApp lists;
- full row titles and descriptions remain visible in the message body when reply buttons are used;
- only the button label is compacted to Meta's 20-character limit;
- choices remain a list when compact labels would collide, the reply-button body would exceed the provider limit, or the producer explicitly requires list presentation;
- original action IDs are preserved, so the same canonical handlers, entitlement checks and final validation paths process the selection.

WhatsApp controls its client UI. Shiloh cannot programmatically open a list sheet. This hybrid reduces the extra opening tap where the provider's reply-button contract allows it; it does not promise that four-or-more-choice lists will auto-open.

## Implementation

PR #322 adds `src/presentation/whatsappChoicePresentation.js` and invokes it at the shared webhook send boundary after `scopeAdminBookingInteractive`.

The presenter is shared across Admin and client interactive results. It does not alter any underlying menu builder or canonical handler. Existing `button_reply` routing already carries the preserved IDs into the same application path used by list replies.

The change is presentation-only. It does not alter JP or any other Admin entitlement, practitioner scope, service eligibility, availability, booking preparation or confirmation, CRM identity, database enforcement, Google Calendar, customer templates or attendance authority.

## Verification

- PR #322 merged as `e4bf61f60cac4fd98492f846e37e07c07d3219e5`.
- CI run #1037 passed **656 / 0**.
- Regression covers one-to-three conversion, action-ID preservation, four-or-more list fallback, compact-label collision fallback, explicit list opt-out, representative Admin/client practitioner choices, and the required ordering after the booking-scope guard.
- Render deploy `dep-da29l28ae00c73957t30` reached **LIVE**.
- No post-deployment error-level logs were present.
- Google Calendar provider health passed.
- Production `/health` reported application and database status `ok`.
- Fresh startup provider evidence kept `shiloh_booking_update_v1` **PENDING** and cancellation confirmation **APPROVED**.

These checks verify merged code and production service health. They do not claim a post-fix handset journey. Natural WhatsApp use may confirm which small menus render as reply buttons; do not create or mutate operational records for evidence.

## Completed — do not redo

The shared hybrid-choice presenter is live. Do not add separate Admin/client cardinality implementations, change action IDs for presentation, bypass the booking-scope guard, force reply buttons past provider limits, or claim WhatsApp list sheets can auto-open.

PR #320's full-label rule remains authoritative. JP's #318 entitlement remains unchanged: Christel-equivalent authorized Admin operations, Christel+Abigail booking scope only, and no finalization. Appointment #558 remains fail-closed with historical practitioner `SHILOH MTC`.

## Remaining gates and ownership

- Genuine handset rendering is a natural-evidence gate observed by WhatsApp / Meta Integration; no manufactured journey.
- `shiloh_booking_update_v1` approval remains a Meta provider gate.
- Historical attendance and #558 remain explicit human-truth gates.
- CRM & Identity owns any future canonical identity or practitioner conflict; Control & Reconciliation tracks the dependency.

Project Tracker and Master reconciliation are required and completed because #322 establishes a durable shared Admin/client WhatsApp choice-presentation rule.
