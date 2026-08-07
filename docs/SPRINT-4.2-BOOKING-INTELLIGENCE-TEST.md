# Sprint 4.2 — Smarter Booking Intelligence

## What is added
- Natural South Africa date understanding for `today`, `tomorrow`, `next Friday`, weekdays, and common numeric dates.
- Daypart understanding for `morning`, `afternoon`, and `evening`.
- Therapist preference capture (for example, `with Sarah` or `any therapist`).
- Service validation against Shiloh's current business knowledge before handoff.
- Clearer booking summary with resolved calendar date.
- No claim of live availability; Goldie remains the source for final slot confirmation.

## WhatsApp test
1. Send: `I want to book a Swedish massage tomorrow afternoon.`
2. If asked for a therapist, reply: `Any therapist is fine.`
3. Shiloh should summarize the service, resolved date, preferred time/daypart and therapist preference, then provide the Goldie booking link.

## Natural date test
Send: `I want to book a hot stone massage next Friday at 2pm.`
Shiloh should resolve `next Friday` to an actual YYYY-MM-DD date in Africa/Johannesburg time.

## Unknown service test
Send: `I want to book a helicopter massage tomorrow at 10am.`
Shiloh should not present the made-up service as valid. It should explain that it cannot verify that service in Shiloh's current business information and ask the client to choose a listed Shiloh treatment.

## Therapist test
Send: `I want to book a Swedish massage with any therapist Saturday morning.`
The therapist preference should be included in the final summary.

## Restart test
Start a booking, stop after giving only the service and date, restart Render, then continue with the time. The booking state should survive.
