# Sprint 4.3 — Booking Handoff Quality

## Goal
Verify that Shiloh presents booking details clearly, asks the customer to confirm them before handoff, supports simple edits, and clearly states that Goldie remains the source of truth for live availability and final booking.

## Test 1 — Confirmation step
Send:

`I want to book a Swedish massage tomorrow afternoon.`

Expected:
- Shiloh verifies the service.
- Shiloh resolves tomorrow to a real date.
- Shiloh shows a polished summary.
- Therapist defaults to `Any available therapist` if none was supplied.
- Shiloh asks the customer to reply YES before providing the Goldie handoff.

Reply:

`YES`

Expected:
- Shiloh provides the Goldie booking URL.
- Shiloh clearly says the appointment is not yet reserved.

## Test 2 — Edit before handoff
Start another booking and reach the confirmation step, then reply:

`change the time to 3pm`

Expected:
- Shiloh updates the time.
- Shiloh shows the revised summary and asks for confirmation again.

## Test 3 — Therapist preference
Send:

`I want to book a hot stone massage next Friday at 2pm with Christel.`

Expected:
- Therapist preference appears in the summary.
- Shiloh asks for confirmation before the Goldie link.

## Test 4 — Cancel before confirmation
At the confirmation step send:

`cancel`

Expected:
- The in-progress booking intent is cleared.
- No Goldie handoff is sent.
