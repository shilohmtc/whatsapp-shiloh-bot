# Master Status Addendum — Emergency Christel Calendar Booking

Date: 2026-08-25

## Durable operational decision

Calendar remains the target staff/Admin operational booking surface. Canonical Shiloh/Postgres appointment state remains the source of truth and all booking mutations must use the existing guarded booking owner.

Meta staff-OTP/template convergence is no longer a prerequisite for delivering Christel's browser Calendar booking capability.

Temporary emergency access architecture is authorized for Christel only:
- initiation from her existing canonical authenticated Shiloh Admin WhatsApp identity;
- short-lived, high-entropy, single-use bootstrap bound server-side to canonical `staff_admin_accounts.id = 2`;
- exchange into the existing opaque server-side browser session;
- existing cookie, CSRF, expiry, rotation, revocation and current-authority checks remain authoritative;
- no public/no-auth Calendar and no browser-supplied authority.

Calendar Create Booking may be implemented now for Christel, limited to canonical eligible bookings for Christel and Abigail through the existing scheduling engine and existing availability/conflict/CRM/provider/approval guards.

The current `/calendar/read-only` implementation itself remains GET-only until the new controlled Create Booking slice is merged and verified.

Not authorized by this decision: broad staff rollout, reschedule/cancel/drag-drop, schedule/block/leave mutations, practitioner reassignment, Google authority reduction/removal, or clinic-wide auth bypass.
