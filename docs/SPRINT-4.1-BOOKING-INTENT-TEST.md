# Sprint 4.1 — Booking Intent & Slot Collection

## Goal
Shiloh should collect a customer's requested service, preferred date and preferred time in a durable PostgreSQL booking-intent record before handing the customer to Goldie for live availability and final confirmation.

## WhatsApp test
1. Send: `I want to book a Swedish massage.`
2. Shiloh should ask for a preferred day/date.
3. Reply: `Saturday`
4. Shiloh should ask for a preferred time.
5. Reply: `10:00`
6. Shiloh should summarize the service/date/time and provide the Shiloh Goldie booking link.

## Persistence test
1. Start a booking request and provide only the service.
2. Restart/redeploy Render.
3. Reply with the requested date.
4. Shiloh should continue the existing booking flow rather than starting over.

## Cancellation test
During an active booking flow, send `never mind` or `cancel`.
Shiloh should clear the pending booking request and return to normal clinic assistance.

## Important limitation
Sprint 4.1 does not create or reserve a Goldie appointment. It collects intent and hands off to the public Goldie booking page for live availability. A direct Goldie availability/booking API integration is deferred until a supported API or integration method is available.
