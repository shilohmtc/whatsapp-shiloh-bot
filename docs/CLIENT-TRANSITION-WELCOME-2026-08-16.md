# Existing-client WhatsApp transition welcome

## Purpose
Existing clients may already associate the clinic WhatsApp number with Christel or the previous manual messaging workflow. The transition welcome reassures them that they are still on the correct number and explains that Shiloh now manages this WhatsApp channel.

## Behaviour
- Applies only to an existing, active, fully registered client resolved uniquely by the inbound WhatsApp/mobile contact.
- Applies only to a greeting-only inbound message, so direct booking, cancellation, reschedule, or other operational requests are not blocked by the transition copy.
- Sends the transition explanation once.
- Persists `whatsapp_transition_welcome_sent_at` in `clients.custom_attributes` only after the WhatsApp send succeeds.
- Subsequent greetings fall through to the normal concise Shiloh welcome/booking experience.
- New or incomplete clients continue through the existing onboarding flow unchanged.

## Direct human contact
The transition copy states:

`Calls & SMS: 066 239 9138`

It does not say that WhatsApp is unavailable, because the client is already speaking to Shiloh on the clinic WhatsApp channel.
