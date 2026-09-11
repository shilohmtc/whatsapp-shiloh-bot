# Assistant Knowledge & FAQ V1

Controlled unit: #884.

## Authority boundary

This unit adds a small source-controlled clinic FAQ/policy authority for stable clinic-owned facts that are not already owned by transactional Shiloh systems.

Do **not** place any of the following in `src/config/clinicFaqPolicy.js`:

- service names or active/inactive state;
- prices or durations;
- practitioner/service eligibility or roster authority;
- booking availability, appointment state or mutation rules;
- client/profile records;
- changing third-party or Heidelberg-local facts.

Those continue to come from their existing canonical Shiloh authorities. A mixed question such as “How much is a massage and do you have snacks?” is deliberately deferred to the normal assistant path so CRM pricing remains authoritative; the FAQ layer contributes only the snack-policy status.

## Policy lifecycle

Each FAQ entry is either:

- `confirmed`: has an approved answer and provenance and may answer directly; or
- `unconfirmed`: recognizes the topic but intentionally has no answer. Shiloh must say the maintained policy is not available rather than infer a rule.

A policy should move from `unconfirmed` to `confirmed` only when the clinic owner has supplied or approved the stable answer. Keep wording concise and operational. If a fact changes frequently or belongs to a transactional service, do not move it here.

Initial V1 intentionally leaves refreshments/cooldrinks, snacks, champagne/alcohol and individual companion rules unconfirmed because no authoritative owner statement was found during reconstruction. The retained owner-provided professional/non-sexual conduct policy is the initial confirmed entry.

## Evaluation pack

`tests/fixtures/assistant-faq-v1-evals.json` is the durable evaluation set. `tests/assistant-faq-v1.test.js` proves:

- confirmed-policy answers;
- typo matching;
- slang/colloquial matching;
- ambiguity clarification;
- unsupported-policy rejection;
- canonical price/booking precedence;
- provider-free production-path integration.

The dedicated `Assistant Knowledge FAQ V1 Proof` pull-request workflow runs this pack on the exact PR head.

## Owner conversation check after Control release

Control should ask the owner to run these in the real WhatsApp assistant after release:

1. `Is it professional?` — should state that Shiloh services are strictly professional and non-sexual, without adding invented details.
2. `do u have cooldrnks?` — should say the policy is not maintained yet and ask the client to confirm with the clinic team.
3. `got champers?` — same safe unknown-policy behavior.
4. `can my mate come along?` — same safe unknown-policy behavior until the owner approves a companion rule.
5. `can i bring my pet with me?` — unsupported policy should fail closed rather than invent an answer.
6. `how much is a massage and do you have snacks?` — price must still come from canonical current service authority; snack policy must not be guessed.
7. `can i book a massage tomorrow?` — booking/availability must continue through the canonical booking flow rather than the FAQ resolver.

Owner acceptance should assess factual accuracy, tone and whether the unknown-policy fallback feels appropriately helpful. Any newly approved hospitality answer should be added as a separately reviewable policy-data edit, not buried in the assistant prompt.
