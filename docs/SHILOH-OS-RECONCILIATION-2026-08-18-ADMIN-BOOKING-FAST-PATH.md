# Shiloh OS — Reconciliation — 2026-08-18 — Admin booking fast path

Purpose: authoritative continuation handoff after the 2026-08-18 Admin booking defects, provisional-client fast path, and removal of the unnecessary Christel↔Abigail cross-confirm handoff.

## Production truth

Current Render production commit: `cb59fc67e09b5ac0afeb12c987bbaf7d41332f14` (PR #310, remove unnecessary Christel-Abigail cross-confirm handoff). Deployment reached LIVE. Fresh startup evidence showed the cross-confirm preload removed, `/health` returning 200, `Google Calendar provider health check passed`, `shiloh_booking_confirmation_v1` APPROVED, `shiloh_cancellation_confirmation_v1` APPROVED, and `shiloh_booking_update_v1` still PENDING.

## Completed work — do not redo

- PR #304 / `278aab397aa750af94e2b1d9df49cb82e75bd29d`: repaired Admin typed-time selection and stale empty time-picker pagination. `14:00` and `2pm` normalize through the authoritative slot set; typed input cannot bypass clinic hours, practitioner schedule, CRM conflicts, or configured Google Calendar conflicts.
- PR #305 / `4767d2823ab41e7f803b5bc4bbdb043e7030dcd7`: improved canonical Admin client-name resolution without auto-creating or silently merging identities.
- PR #306 / `507c3f492dc22e2c7767b8bac24128665f8ac73f`: added safe lookup through already-reconciled Goldie external identities to their canonical Shiloh client; unresolved external identities remain fail-closed.
- PR #307 / `55c2f00b1470a095ec78c675eaa368bdbd53dc51`: added the fast Admin new-client fallback. When no canonical client exists, Admin can reserve for a new client using minimum name + South African mobile; the mobile is duplicate-checked before creating a clearly marked provisional CRM client. The appointment is still not created until explicit booking confirmation.
- PR #308 / `fdcbae48577b464bf67442b36dcc1ea8155d2c69`: cleans up an unused provisional client if booking preparation fails or Admin cancels before confirmation, provided that provisional record has no appointment. Existing clients and provisional clients with appointments are never deleted by this cleanup.
- The real Stephan Erasmus journey demonstrated the intended fast path through service/practitioner/date/time selection, provisional CRM client creation and final review. Christel then confirmed the booking herself. Do not cancel or recreate that appointment merely for evidence.
- PR #309 / `fa4e403ac60fa6828b0da977784f0a04d6f08fe7` briefly introduced Christel↔Abigail cross-confirm handoff.
- PR #310 / `cb59fc67e09b5ac0afeb12c987bbaf7d41332f14` removed that handoff after the operating decision that it is unnecessary. This removal is the accepted state.

## Accepted operating rule

The Admin who prepares a pending booking confirms that booking. This does not restrict practitioner choice: Christel may create and confirm a booking for Abigail, Abigail may create and confirm a booking for Christel, and an authorized business Admin may create/confirm a booking for an eligible practitioner. Final CRM, clinic-hours, practitioner-schedule, conflict, shared Google Calendar and practitioner-calendar guards remain authoritative.

When an Admin must secure a slot for a genuinely new client, the preferred flow is:

`choose service/practitioner/date/time → search client → no match → Reserve new client → name + mobile → duplicate check → provisional canonical client → review → explicit Confirm booking`.

Do not require a fully completed client profile before reserving a legitimate appointment. Do not silently create duplicates. Richer profile/onboarding data may be completed later through the established client identity/registration path.

## Related completed provider/customer-confirmation state

PR #302 Calendar fail-closed guard and provider health probe remain permanent protection. Google Calendar OAuth is currently healthy.

PR #303 customer-change confirmations remain live. Cancellation confirmation is provider-ready. Service/practitioner/date-time/price update notifications are durable/queued behind `shiloh_booking_update_v1`, whose latest provider status is PENDING. Do not use proactive free-text fallback or manufacture a booking change for proof.

## Standing gates

- `shiloh_booking_update_v1` Meta approval remains the highest external provider gate for ordinary booking-change confirmations.
- Historical attendance remains explicit human truth.
- Appointment #558 remains fail-closed until the real practitioner is established.
- Genuine lifecycle/follow-up/birthday delivery evidence remains natural-journey gated.
- Google Business Profile API remains deferred at the last-authoritative 0 QPM.
- Ozow remains waiting for merchant configuration/business rules.
- Destructive privacy actions remain fail-closed pending authority/evidence.

## Exact new-chat checkpoint

1. **Authoritative current state:** production is LIVE on PR #310 / `cb59fc67...`. Admin typed-time selection, canonical/Goldie-aware lookup, provisional new-client reservation, and unused-provisional cleanup are completed. Cross-confirm handoff is intentionally removed.
2. **Highest-priority continuation item:** re-check Meta status for `shiloh_booking_update_v1`; if still pending, continue the next approved Shiloh OS workstream without reopening the completed Admin-booking repairs.
3. **Why it is next:** the Admin booking defects found in this journey are repaired, CI/deploy verified, and the unnecessary cross-confirm branch has been removed; remaining notification delivery depends on Meta.
4. **Remaining gates:** Meta booking-update approval; human attendance/#558 truth; genuine operational delivery evidence; explicit approval for material commercial/service/business-rule changes.

New chats must read this reconciliation together with `docs/SHILOH-OS-MASTER-STATUS.md`, `docs/SHILOH-OS-PROJECT-TRACKER.md`, and `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md` on `main` before the first new controlled action.