# Shiloh OS — Project Tracker Addendum — Read-Only Calendar UX Authorization

Date: 2026-08-24
Control owner: **00 — Control & Reconciliation**
Implementation owner: **10 — Booking & Admin UX**
Supporting dependency: **40 — Production & DevOps** when required
State: **🟢 PROJECTION ACCEPTED / READ-ONLY UX AUTHORIZED**

## Completed unit accepted

`SHILOH-CALENDAR-READONLY-PROJECTION` is **🟢 VERIFIED LIVE / COMPLETE / CONTROL ACCEPTED / DO NOT REDO**.

Durable authorities:

- PR #451 — Calendar foundation architecture;
- PR #452 — Control ratification and Calendar-first future-product rule;
- PR #453 / `7ba0b488314fb9f9138043be45192179582e1b41` — read-only `SchedulingTimeline` application implementation;
- PR #454 / `862ecd3ddb7e42babdfee5a536afda4c86c7a4e2` — implementation reconciliation and current reviewed main.

Project Tracker and Master Status completion addenda from PR #454 remain authoritative for the implemented projection.

## Next controlled unit

`SHILOH-CALENDAR-READONLY-UX`

State: **🟢 AUTHORIZED FOR IMPLEMENTATION**

Owner: **10 — Booking & Admin UX**

Priority: **NOW — next Calendar unit**

### Authorized scope

Build the first read-only Shiloh Calendar experience using the accepted `SchedulingTimeline` as the sole scheduling read model:

- Day view;
- Week view;
- Agenda view;
- Today and bounded previous/next navigation;
- switching among Day / Week / Agenda;
- filtering among practitioners already permitted for the authenticated viewer;
- optional read-only detail presentation for fields the same viewer is authorized to see;
- clear visual distinction between appointments, blocks, leave/unavailability, closures/holidays, working windows/exceptions and Google-only external busy;
- responsive/accessible operational presentation appropriate for desktop, tablet and smaller screens;
- Shiloh-specific product design using familiar calendar conventions without cloning competitor products.

### Mandatory architecture boundary

All views must consume `schedulingEngine.listTimeline(...)` or a thin server-side adapter over it.

Do not create independent SQL/provider/availability/conflict logic in the Calendar presentation layer.

PR #380 multi-practitioner semantics and PR #395 Google conflict classification remain unchanged.

### Browser security gate

Current main has no proven browser-safe staff login/session boundary. The existing `/admin` API is protected by a shared `ADMIN_API_KEY` header and is not itself a suitable browser identity mechanism.

Therefore:

- never embed or persist `ADMIN_API_KEY` in browser-delivered content or storage;
- viewer identity/scope must be resolved server-side from authenticated Shiloh identity;
- never trust browser-supplied scope/staff identity as authorization;
- never expose scheduling/client detail through a public unauthenticated Calendar route;
- preserve existing `/calendar/:token.ics` as a separate tokenized appointment-share route;
- if no browser-safe staff session can be reused, complete the read-only UX behind a default-off/internal feature gate and return the exact access-boundary dependency to Control rather than weakening security.

### Explicit holds

Still not authorized:

- Calendar booking creation;
- Calendar reschedule/cancellation;
- drag/drop mutation;
- service/practitioner reassignment;
- schedule writes;
- block writes;
- leave writes;
- Google Calendar writes;
- reduction/removal of Google conflict or mirror authority;
- bidirectional Google appointment authority;
- Google optionality.

### Verification gate

Before merge, require:

- focused Day/Week/Agenda consistency tests;
- permission fail-closed tests;
- no browser-secret leakage tests;
- no-mutation surface tests;
- PR #380 representation tests;
- PR #395 non-canonical external-busy presentation tests;
- degraded/unavailable provider state tests;
- preservation tests for `/calendar/:token.ics` and existing booking/Google behavior;
- full non-mutating regression suite.

Then complete the normal controlled path:

implement → focused tests → full regression → repair until green → PR → CI → merge → exact Render verification → provider/health verification → Project Tracker reconciliation → Master reconciliation only if durable architectural/operational state materially changes → return to Control.

## Next checkpoint

After `SHILOH-CALENDAR-READONLY-UX` is implemented and reconciled, return to **00 — Control & Reconciliation**.

Control will decide whether the next unit is secure production access/parity-observability hardening or another prerequisite revealed by implementation. Calendar mutations remain later authority only.
