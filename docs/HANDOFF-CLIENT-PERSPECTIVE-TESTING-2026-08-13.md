# Shiloh OS — Client Perspective Testing Handoff

Date: 2026-08-13
Track: **Client Perspective Testing**
Purpose: finish a focused end-to-end client-facing production audit without mixing it into the remaining Admin checklist.

## Authoritative current state

Treat these as authoritative in this order for this track:

1. GitHub `main`
2. Render production
3. Shiloh CRM
4. Google Calendar
5. Real WhatsApp client acceptance evidence

Current production baseline:

- GitHub `main` includes PR #155.
- Production commit: `7a2250060a18cac97871ffbfac825cfc36ef8ea0`.
- Render deploy `dep-d9uop78ae00c738jn2og` is `live` on that exact commit.
- PR #155 fixed the PostgreSQL practitioner lookup failure exposed by the live Dummy Test HIFU flow.
- The service-family-first client booking UX is live:
  - Beauty & Aesthetics → Marietjie
  - Massage → Christel or Abigail, constrained by current CRM mapping
  - Lymphatic Drainage → Abigail only
- Actual treatment names remain CRM-derived, not hard-coded.
- New-client registration supports both sequential entry and bundled full-name/mobile/DOB input.
- Registration completion resumes directly into client booking discovery instead of treating `appointment` as a treatment.
- `List treatments` and `List your staff` recover correctly during an active booking instead of being misparsed as service names.
- Christel/Jean-Pierre can reset Chenique/Juvan test-client identities through the guarded Admin flow.
- `Dummy Test` is the preferred dedicated work-time client simulation identity for this audit.

## Operating rule for this track

Apply the **safe self-test-first engineering rule automatically**:

- inspect GitHub/Render/CRM/Calendar first;
- use non-mutating regression/production reads before asking for human testing;
- do not infer client choices, appointment attendance, or payment truth;
- when a live WhatsApp action is genuinely required, ask for **one exact client action at a time**;
- if an earlier 🟡 item is human/external-truth blocked, preserve it and continue automatically to the next actionable ⬜ item;
- only change production code when evidence establishes a defect;
- every production change follows branch → regression → PR → green CI → merge → exact Render deploy/health verification.

## Status legend

- ✅ completed / production-verified
- 🟡 blocked on live human/external truth; do not guess
- ⬜ genuinely actionable now

# New prioritized checklist — Client Perspective Testing

## 1. 🟡 Resume the live Dummy Test booking after PR #155

Goal: prove the exact defect exposed in production is fixed from the client’s real WhatsApp account.

Required human acceptance when convenient:

- From the existing Dummy Test conversation, retry the Beauty & Aesthetics → HIFU path.
- Expected result: no generic error; Shiloh should revalidate HIFU against CRM, resolve Marietjie as the sole eligible practitioner, and continue toward date/time availability.

Do not block the rest of the audit while waiting for this acceptance.

## 2. ⬜ Non-mutating end-to-end route audit for all three service families

Prove, from code + regression + authoritative mappings where readable:

- Beauty & Aesthetics only exposes active CRM treatments genuinely mapped to Marietjie.
- Massage only exposes active massage treatments genuinely mapped to Christel and/or Abigail.
- Lymphatic Drainage only exposes active lymphatic treatments genuinely mapped to Abigail.
- A stale/forged family/service/practitioner interactive ID fails closed.
- Single-practitioner treatments skip unnecessary practitioner questions.
- Multi-practitioner Massage treatments offer only currently eligible practitioners plus `Any available` where appropriate.
- `Back`, `Menu`, `Home`, and equivalent escape paths do not leave stale booking state that can accidentally confirm an old selection.

## 3. ⬜ Client registration acceptance matrix

Audit and regression-lock:

- all required registration fields in one message;
- sequential registration across multiple messages;
- labelled bundled input (`Name`, `Mobile`, `DOB`);
- supported South African mobile formats (`0…`, `27…`, `+27…`);
- invalid/ambiguous mobile handling;
- invalid/future/impossible DOB handling;
- existing canonical client recognition;
- matched-but-incomplete client completion;
- prevention of accidental client-profile merging when a supplied mobile belongs to another canonical client;
- correct post-registration transition into service-family discovery.

## 4. ⬜ CRM catalogue fidelity audit from the client perspective

Verify that what clients see matches current operational truth:

- active/inactive service filtering;
- duration and displayed price/range formatting;
- Beauty/Aesthetics classification;
- Massage classification;
- Lymphatic classification;
- no service appears under an ineligible practitioner;
- no practitioner appears for a service they cannot currently perform;
- client-facing naming is readable and professional.

If the Render Postgres connector is unavailable, do not guess; use repository fixtures/regressions and resume authoritative DB comparison when the connector recovers.

## 5. ⬜ Date/time availability and Calendar conflict audit

Non-mutating first, then controlled Dummy Test acceptance if necessary:

- date interpretation and timezone correctness for South Africa;
- no past slots;
- no slot outside practitioner availability/business rules;
- Google Calendar conflicts excluded;
- appointment duration/processing/extra-time respected;
- `Any available` resolves only to genuinely eligible practitioners with availability;
- stale availability cannot be confirmed after it is no longer available;
- retry/reselection path is understandable to a client.

## 6. ⬜ Controlled booking creation acceptance with Dummy Test

Only after items 2–5 are clean enough to justify a mutating acceptance test:

- create one clearly identifiable Dummy Test appointment through real WhatsApp;
- verify exact CRM appointment row;
- verify exact Google Calendar event and practitioner/calendar ownership;
- verify client confirmation wording;
- verify no duplicate appointment/event is created by webhook retries or repeated confirmation;
- clean up only through normal supported cancellation/test-cleanup behavior, preserving audit truth.

## 7. ⬜ Client self-service appointment management audit

Using non-mutating tests first and controlled Dummy Test records where necessary:

- view/upcoming appointment behavior;
- cancel flow and confirmation;
- reschedule flow;
- no cross-client appointment access;
- no stale appointment action can mutate a different/new appointment;
- CRM and Calendar remain synchronized after allowed changes.

## 8. ⬜ Client communication lifecycle audit

Audit client-facing operational communication paths:

- booking confirmation;
- reminder scheduling/template readiness;
- follow-up behavior;
- no reminder/follow-up for cancelled/non-applicable appointments;
- no accidental duplicate sends;
- message copy remains client-friendly and does not expose internal/admin terminology.

Keep any provider/template dependency fail-closed and mark it 🟡 if live verification requires external approval.

## 9. ⬜ Error recovery / conversational resilience audit

Test the client journey when the client:

- types instead of tapping buttons;
- changes their mind mid-flow;
- asks for `services`, `treatments`, `staff`, `menu`, or `home` during a booking;
- sends an unknown treatment;
- sends an unknown practitioner;
- chooses an obsolete interactive button;
- pauses and returns later;
- repeats a prior message.

Goal: recover to a useful authoritative client path without inventing service/staff/availability truth.

## 10. ⬜ Client privacy and data-minimization acceptance

Confirm the client-facing flow only requests/stores/displays what is required:

- full name, mobile/WhatsApp identity, DOB, booking selections and necessary operational history;
- no unnecessary sensitive information in WhatsApp replies/logs;
- phone masking remains in application logs;
- no client can retrieve another client’s profile/appointment details;
- test identities remain clearly distinguishable from real clients where operationally appropriate.

## 11. ⬜ Final Client Perspective release gate

Close this track only when:

- every actionable ⬜ item is completed or explicitly converted to a documented 🟡 external/human-truth blocker;
- the real Dummy Test happy path completes registration → service family → treatment → practitioner resolution → date/time → confirmation without unexplained fallback errors;
- one controlled booking is verified in both CRM and Google Calendar;
- cancellation/reschedule behavior is verified safely;
- all code changes are on `main`, CI green, and Render production is on the exact expected commit;
- remaining external blockers are documented separately and fail closed.

# Recommended next sequence in the new chat

1. Confirm GitHub `main` and Render are still aligned to the latest production commit.
2. Treat checklist item #1 as 🟡 until the user supplies the next real Dummy Test WhatsApp result.
3. Proceed automatically with item #2 using non-mutating code/regression/authoritative-data inspection.
4. Only ask the user for the next live WhatsApp action when backend evidence cannot establish the answer.
5. Update this checklist in GitHub as findings become ✅ / 🟡 / newly discovered ⬜ work.

# New-chat start prompt

Use this exact prompt in a new chat titled **Client Perspective Testing**:

> **Shiloh OS — Client Perspective Testing**
>
> Continue the dedicated client-facing production audit from `docs/HANDOFF-CLIENT-PERSPECTIVE-TESTING-2026-08-13.md`.
>
> Treat GitHub `main`, Render production, Shiloh CRM, Google Calendar and real WhatsApp acceptance evidence as authoritative.
>
> Do not redo completed work.
>
> Apply the safe self-test-first engineering rule automatically.
>
> Read the **New prioritized checklist — Client Perspective Testing**.
>
> Start with the highest-priority genuinely actionable **⬜** item. If an earlier **🟡** item is externally or human-truth blocked, preserve its fail-closed state and continue automatically.
>
> Before making changes, briefly tell me:
> 1. the authoritative current state;
> 2. which checklist item is next;
> 3. why that is the correct next item.
>
> Then proceed automatically.
