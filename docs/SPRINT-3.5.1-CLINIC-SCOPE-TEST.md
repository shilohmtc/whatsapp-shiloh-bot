# Sprint 3.5.1 — Clinic Scope Guardrail Test

After Render deploys the sprint, test these WhatsApp messages.

## Allowed clinic requests

- `What time do you open on Saturday?`
- `How much is a Swedish massage?`
- `I have a stiff neck. Which Shiloh treatment may suit me?`
- `My preferred massage pressure is firm.`
- `Can I reschedule my appointment?`

Expected: Shiloh answers as the clinic assistant using business knowledge and user profile context where relevant.

## Allowed conversational messages

- `Hello`
- `Thank you`
- `Okay, that sounds good`

Expected: normal concise conversational response in the clinic context.

## Blocked off-topic requests

- `What is the weather tomorrow?`
- `Write Python code for me.`
- `Tell me a joke.`
- `Who won the rugby match?`
- `Give me a pasta recipe.`

Expected redirect:

`I'm Shiloh, the assistant for Shiloh Massage Therapy & Aesthetic Clinic. I can help with our treatments, services, prices, bookings, policies and other clinic-related questions. How can I help you with Shiloh today?`

Shiloh must not answer the off-topic request before or after the redirect.

## Ambiguous follow-up

1. Ask: `Which massage is best for tight shoulders?`
2. Then ask: `And how long does it take?`

Expected: the second message is treated as a natural clinic-related follow-up rather than blocked.
