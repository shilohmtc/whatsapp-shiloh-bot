# Shiloh OS — Reconciliation — Admin UX standardization

Date: 2026-08-20
Owning workstream: Booking & Admin UX
Application PR: #371
Application merge: `75f58950c86b2afbcc0bdb25240c4b4eeac1a188`
CI: #1173 — success
Production status at draft creation: pending exact-SHA Render convergence; do not treat this document as verified-live authority until the final reconciliation commit records completed production verification.

## Scope

User-authorized Admin UX presentation standardization for WhatsApp interactive Admin menus. This controlled unit changes presentation and category grouping only; it does not change booking permissions, CRM authority, appointment mutation semantics, Calendar behavior, Meta/provider contracts, service IDs, prices, durations or practitioner mappings.

## Implemented application behavior

- Admin interactive action copy is normalized to short, consistent labels and concise one-line descriptions.
- `Make a booking` is presented as `New booking`.
- `Manage a booking` is presented as `Manage booking`.
- top-level Admin section descriptions and back-navigation copy are standardized.
- the new-booking escape action is presented as `Cancel new booking — Exit without creating a booking`.
- existing-appointment cancellation remains `Cancel booking`; the #367 canonical cancellation state machine, reason requirement, explicit confirmation and appointment-scoped semantics are unchanged.
- the Admin new-booking category previously presented as `Massage & Body` is presented as `Body Treatments`.
- `Neo Pelvic Therapy`, `Vaginal Tightening & Rejuvenation`, and `Ozone & Far Infrared` are grouped into `Body Treatments` from the already-authoritative service rows loaded for the current Admin booking scope.
- the regrouping preserves canonical service IDs and does not create a second catalogue source or mutate CRM service records.
- existing body-treatment subgroup assignments are preserved where possible; the three explicitly approved services are presented within `Body Technology`.
- WhatsApp remains authoritative for native font family, font size, row spacing and selector rendering. Shiloh standardizes copy/content only.

## Implementation structure

- `src/services/adminUxStandardization.js`
  - pure presentation normalization;
  - exact approved Body Treatments regrouping;
  - duplicate prevention;
  - explicit new-booking cancellation disambiguation.
- `src/bootstrap/adminUxStandardizationPatch.js`
  - wraps the final Admin interactive router after the existing Block time patch;
  - rewrites the newly-created Admin booking category session once, using the canonical service rows already loaded by the existing booking flow;
  - preserves the durable booking session and all downstream booking authority.
- `package.json`
  - preloads the standardization patch after `adminBlockTimePatch.js` for both production and development starts.

## Regression evidence

PR #371 CI run #1173 completed successfully.

Added regression coverage proves:

- two existing Massage & Body services plus the three explicitly approved services become five Body Treatments services in the representative grouping contract;
- moved services are removed from their former presentation groups;
- duplicate target service rows are not created;
- `Cancel new booking` is limited to the new-booking escape action;
- existing appointment `Cancel booking` presentation is preserved;
- standardized Admin action labels/descriptions are deterministic;
- Body Treatments headings/category labels are consistent;
- the standardization preload runs after the existing Block time patch.

## Production verification

PENDING at draft creation.

Required before reconciliation merge:

- Render deploy must reach LIVE on exact merge `75f58950c86b2afbcc0bdb25240c4b4eeac1a188`;
- startup must complete without a new application error;
- `/health` must remain healthy;
- existing Google Calendar/provider health must remain intact where surfaced by startup/health evidence;
- no real appointment, cancellation, CRM service mutation or fabricated handset journey is required or permitted merely to prove this presentation change.

## Durable authority after production verification

Once exact-SHA production verification is completed, Tracker should record this unit as VERIFIED LIVE and Master should record the durable Admin presentation contract:

- concise standardized Admin interactive copy;
- `New booking` / `Manage booking` terminology;
- `Cancel new booking` for abandoning a pending new booking only;
- `Cancel booking` retained for existing appointment cancellation;
- `Body Treatments` presentation grouping including the three explicitly approved services;
- WhatsApp-native typography remains provider-controlled.

## Remaining gates / non-goals

- no change to practitioner-approved reschedule provider gate;
- no change to booking confirmation v1/v2 provider state;
- no change to Goldie description publication approval;
- no change to Manage Client cancellation-return proposal unless separately implemented;
- no CRM service-record mutation was used for this presentation grouping.
