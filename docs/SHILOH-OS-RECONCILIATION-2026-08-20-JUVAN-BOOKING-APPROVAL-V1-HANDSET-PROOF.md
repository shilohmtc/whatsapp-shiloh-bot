# Shiloh OS — Reconciliation — Juvan booking approval + booking-confirmation v1 handset proof

Date: 2026-08-20
Status: VERIFIED PRODUCTION / HANDSET-PROVEN
Owning workstream: Booking & Admin UX

## Scope

Production-verify PR #350's canonical Juvan→Jean-Pierre new-booking approval policy and use one genuine intended Juvan booking to prove the polished `shiloh_booking_confirmation_v1` delivery introduced by PR #348. No synthetic booking was manufactured solely for evidence.

## Authoritative code and deployment

- GitHub `main` remained `bb26eb62a719f84cbe0471aa54530e71cb104da9` (merge PR #350, Route canonical Juvan bookings to JP approval) during the controlled handset journey.
- PR #350 CI run #1120 passed 744/744 tests, 0 failed.
- Render production checked out the exact merge SHA and reached LIVE.
- Startup applied and checksum-verified migration `065_juvan_botha_jp_booking_approval.sql`, resolving canonical client ID 845 / display name Juvan Botha and Jean-Pierre admin ID 4 under the guarded identity/admin contract.
- Startup reconfirmed `shiloh_booking_confirmation_v1` configured, provider APPROVED / UTILITY / already_exists, with no submission.
- Google Calendar provider health passed.

## Genuine controlled booking journey

The user confirmed this was a genuine intended booking. Handset and production evidence showed:

1. Juvan entered `BOOKING` and received the normal four-row CRM-backed service discovery list. This stage was non-mutating.
2. Juvan selected Upper Back, Neck & Jaw Release with Christel and chose Friday 21 August 2026 at 16:00.
3. The review screen explicitly stated that nothing was booked yet.
4. Juvan confirmed the details, received Booking Policy & Terms, and explicitly replied `I agree`.
5. Production logged policy acceptance for version `2026-08-11-v1`.
6. Shiloh created booking request #585 in the held/pending-approval state and told Juvan the time was being held while Jean-Pierre reviewed it, explicitly stating the appointment was not yet confirmed.
7. Production sent `shiloh_booking_approval_request_v1` to Jean-Pierre with two quick-reply actions. No final booking-confirmation-v1 send occurred before approval.
8. Jean-Pierre's handset showed the expected approval request for Juvan Botha / Upper Back, Neck & Jaw Release / Christel / Fri 21 Aug 2026 16:00 / Booking #585, with Approve and Decline.
9. Jean-Pierre tapped Approve. Production logged the inbound button decision from the authorized admin number and `status=approved`.
10. Production sent exactly one `shiloh_booking_confirmation_v1` template to Juvan immediately after approval.

## Polished v1 handset evidence

Juvan's handset received one primary booking-confirmation-v1 message containing:

- client: Juvan Botha
- service: Upper Back, Neck & Jaw Release
- practitioner: Christel
- date: Friday, 21 August 2026
- time: 16:00–17:00
- the unchanged approved v1 body, including its existing raw Google Calendar and Apple/Outlook links and RESCHEDULE/CANCEL fallback wording.

The four legacy automatic supplemental groups suppressed by PR #348 did not appear after the template:

- no separate Google Calendar CTA card;
- no separate Apple/Outlook CTA card;
- no separate Reschedule/Cancel interactive block;
- no separate Book another/My appointments/Main menu block.

This is the intended temporary production behavior while booking-confirmation v2 remains provider-gated. The approved Meta v1 provider contract itself was not edited.

## Calendar verification

Connected Google Calendar read-only evidence verified the same deterministic event ID in both production Calendar layers for Friday 21 August 2026 16:00–17:00:

- `Shiloh — Bookings` shared calendar;
- the primary Shiloh calendar used for Christel's production mirror.

Both showed `Upper Back, Neck & Jaw Release — Juvan Botha — Christel`, the same start/end and Shiloh clinic location.

## CRM / audit evidence boundary

The sanctioned Render read-only Postgres query tool was attempted after the booking. It failed before SQL execution because the connection did not negotiate the database's required SSL/TLS (`FATAL: SSL/TLS required`). No write-capable workaround was used.

Therefore this reconciliation does not invent a fresh direct SQL read of appointment #585, the approval row or confirmation-delivery audit row. Canonical booking/approval behavior is supported by the successful guarded production runtime path, production approval/template logs, the confirmed handset state and matching shared/practitioner Calendar mirrors. A later sanctioned direct SQL read may add evidence but is not required to classify the observed approval and v1 delivery behavior.

## Classification

- PR #350 Juvan→Jean-Pierre new-booking approval path: VERIFIED LIVE / HANDSET-PROVEN.
- Pending-before-approval contract: VERIFIED.
- Authorized Jean-Pierre approval decision: VERIFIED.
- `shiloh_booking_confirmation_v1` final delivery after approval: VERIFIED.
- PR #348 suppression of all four automatic supplemental groups: HANDSET-PROVEN.
- Booking #585 Calendar mirror consistency: VERIFIED across both production Calendar layers.
- Fresh direct Postgres row read: unavailable due sanctioned connector TLS failure; not inferred.

## Do not redo

Do not create/cancel/recreate booking #585 merely to repeat this evidence. Do not restore the four legacy v1 supplemental groups. Do not alter the approved Meta v1 contract while it remains the production fallback.

## Remaining gates

- Booking-confirmation v2 remains a separate Meta/provider activation workstream and must not be activated merely from this v1 proof.
- Client-reschedule practitioner approval remains dark/default-off pending its separate Meta/configuration gate and the known reschedule defects must be repaired before further live reschedule testing.
- The Render read-only Postgres TLS limitation remains an evidence-tool limitation, not authorization to use a write-capable workaround.
