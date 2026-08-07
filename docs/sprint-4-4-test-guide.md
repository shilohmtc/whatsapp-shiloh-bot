# Sprint 4.4 — Reschedule & Cancel Intelligence

## Reschedule test

1. Send: `I want to reschedule my appointment.`
2. When asked for the current appointment date, reply with a real or test date such as `Saturday`.
3. When asked for the new date, reply `next Tuesday`.
4. When asked for the new time, reply `3pm`.
5. Confirm the summary is correct and reply `YES`.
6. Shiloh must state that the appointment has **not** been changed directly and explain how to use the Goldie appointment-management link or sign in via the Shiloh Goldie booking page.

## Cancellation test

1. Send: `I want to cancel my appointment.`
2. Give the current appointment date when asked.
3. Confirm the cancellation summary.
4. Reply `YES`.
5. Shiloh must not claim the appointment is cancelled. It should direct the client to Goldie's Cancel link / client account and mention that Shiloh's cancellation policy may apply.

## Abort test

During either flow, reply `STOP` before confirmation. Shiloh must clear only the appointment-change request and explicitly state that the Goldie appointment was not changed.

## Safety requirement

Shiloh does not currently have a Goldie API that can modify live appointments. Goldie remains the source of truth for the actual appointment, live availability, cancellation and rescheduling.
