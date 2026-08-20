# Shiloh OS — Reconciliation: Couples Massage self-service

Date: 2026-08-20
Owner: Booking & Admin UX
Application PR: #380 — Add atomic Couples Massage self-service
Application merge SHA: `2e387e5f1000774d97046a516c1c7d19e93cd947`
Final CI: #1196 — success
Production deploy: `dep-da3l8gtbedkc73dn51e0` — LIVE on exact application SHA

## Business authority

The approved customer-facing Couples Massage contract is now:

- **Service:** Couples Massage
- **Duration:** 90 minutes
- **Price:** R1,080
- **Required practitioners:** Abigail + Christel together
- **Availability:** offer a time only when both practitioners are simultaneously available for the full 90-minute interval
- **Booking identity:** one registered lead Shiloh client plus companion name and South African mobile number
- **Companion mobile purpose:** appointment-scoped `booking_backup` only if Shiloh cannot reach the lead client about that booking
- **Marketing consent:** false; merely supplying the companion number does not establish marketing consent or a general CRM contact identity

## Canonical service foundation

Migration `070_couples_massage_self_service.sql` was applied and checksum-verified during the first #380 production startup.

Production verification established:

- canonical service ID **66**;
- name **Couples Massage**;
- `external_source='shiloh_special'`;
- `external_id='couples-massage-v1'`;
- category **Massage**;
- status active;
- duration 90 minutes with no hidden processing/extra-time buffer;
- price `1080.00`;
- exact practitioner mappings:
  - Abigail staff #1 — active/client-bookable;
  - Christel staff #3 — active/client-bookable;
- companion contact role `booking_backup`;
- companion `marketingConsent=false`.

The migration fails closed if another conflicting Couples Massage service identity exists or if an unapproved extra practitioner mapping is present.

## Client journey

`Massage Treatments → Couples & Packages → Couples Massage` is now a genuine self-service flow rather than the earlier assisted-only placeholder.

The client sees **90 min • R1,080 • Abigail & Christel** before choosing a date. Shiloh then:

1. offers open clinic dates;
2. computes the exact intersection of Abigail and Christel's 90-minute availability;
3. offers only shared future times;
4. captures companion name;
5. captures a companion South African mobile number distinct from the lead client's WhatsApp number;
6. explains that the number is a booking-only backup contact and not marketing consent;
7. shows a review screen with service, duration, price, therapists, time, lead client, companion and backup number;
8. requires the existing Shiloh Booking Policy & Terms acceptance before appointment creation.

The canonical Couples Massage service row is suppressed from the ordinary single-practitioner WhatsApp massage lists, preserving one intentional client entry path through Couples & Packages. Sports Massage Package remains independently owned by the existing canonical `sports-massage-monthly` package/entitlement/session flow.

## Atomic two-practitioner booking

Confirmation creates one canonical parent appointment, one Couples Massage service snapshot and two practitioner allocations:

- Abigail — position 1;
- Christel — position 2.

Before mutation Shiloh acquires stable-order advisory locks for both practitioners and rechecks, for the full 90-minute interval:

- clinic hours;
- each practitioner's authoritative working schedule/exceptions;
- CRM appointment conflicts;
- `calendar_blocks` conflicts;
- shared Google Calendar availability;
- each practitioner's Google Calendar availability.

If either practitioner is no longer available, neither side of the booking is created and the client must select another time.

On success Shiloh creates the shared booking Calendar event and both practitioner Calendar mirrors. If the guarded creation path fails after a Calendar side effect, compensation removes any created practitioner/shared events rather than leaving a partial booking.

The existing client-booking approval infrastructure remains authoritative. Position-1 Abigail remains the assigned practitioner/Primary for ordinary approval semantics; standing Juvan Primary + Jean-Pierre Backup + first-decision-wins authority is unchanged.

## Companion contact/privacy boundary

`appointment_companions` stores the companion name/mobile against the appointment with:

- `contact_role='booking_backup'`;
- `marketing_consent=false`;
- a database constraint preventing that row from becoming marketing consent.

The Couples flow does **not** insert the companion number into `client_contacts` and does not silently register the companion as a Shiloh CRM client.

Current authority is capture/storage for appointment-specific fallback contact. **#380 does not establish an automatic WhatsApp fallback-send rule based on delivery failure.** A future automation that messages the companion would require a separately defined trigger/consent/provider boundary.

## Cancellation and reschedule safety

Because Couples Massage has two practitioner allocations, #380 also hardens cancellation behavior:

- canonical Admin cancellation still requires a reason and explicit confirmation, then locks every assigned practitioner and removes every practitioner Calendar mirror;
- client cancellation detects multi-staff appointments at final confirmation, locks all assigned practitioners and removes shared + practitioner Calendar mirrors;
- existing client self-service rescheduling already fails closed when `staff_count != 1`, so a Couples Massage cannot be silently rescheduled as if it had one practitioner. Clinic assistance remains required for multi-practitioner rescheduling until separately designed.

No real appointment was cancelled or rescheduled merely to prove these safeguards.

## CI and production evidence

PR #380 final head `b93021e63e028c18c7504e561e96137be5179a9c` passed CI **#1196**. It merged as `2e387e5f1000774d97046a516c1c7d19e93cd947`.

Render auto-deploy `dep-da3l8gtbedkc73dn51e0` checked out that exact merge SHA, built successfully and reached **LIVE**.

Startup evidence established:

- migration 070 `applied=true` and `checksumVerified=true`;
- service ID 66 / Couples Massage / 90 minutes / `1080.00` / Massage;
- Abigail #1 + Christel #3 are the exact active/client-bookable practitioner mappings;
- companion role `booking_backup`, marketing false;
- Google Calendar provider health passed;
- migration 069 remained checksum-valid with Jaw Release active, Abigail still unmapped, Christel remaining mapped and 13 linked appointments preserved;
- Juvan controlled identity remained BOUND to the current pointer, presently client 845 / suffix 1564 / JP admin 4;
- Juvan approval contract remained `assigned_practitioner_primary_jean_pierre_backup_first_decision_wins`;
- practitioner-approved client rescheduling remained `featureEnabled=false`;
- repeated `/health` requests returned HTTP 200.

## Evidence boundary

No genuine Couples Massage appointment, companion identity, booking decision, Calendar event or handset journey was manufactured merely for implementation proof. Production evidence is the checksum-tracked foundation, exact runtime/deploy verification and non-mutating regression suite. A future natural real client booking can supply genuine journey evidence without creating artificial operational data.

## Durable continuation

Preserve these rules unless explicit later business authority supersedes them:

- Couples Massage = 90 min / R1,080 / exact Abigail + Christel;
- offer only simultaneous full-duration availability;
- one lead client + companion name/mobile;
- companion mobile is booking-only backup, not marketing consent and not an automatic CRM identity;
- confirmation is one atomic parent appointment with both practitioner allocations;
- cancellation must clear both practitioner allocations' Calendar mirrors;
- multi-practitioner reschedule remains fail-closed/assisted;
- no automatic companion fallback messaging is claimed by this unit;
- Sports Massage Package remains canonical and separate under Couples & Packages.