# Shiloh OS — Control & Reconciliation — Calendar Projection Acceptance

Date: 2026-08-24
Owning workstream: **00 — Control & Reconciliation**
Next implementation owner: **10 — Booking & Admin UX**
Supporting dependency: **40 — Production & DevOps** only when infrastructure, access, performance or observability support is actually required
Status: **PROJECTION ACCEPTED / READ-ONLY CALENDAR UX AUTHORIZED**

## Authority reviewed

Control independently reviewed the completed `SHILOH-CALENDAR-READONLY-PROJECTION` against:

- PR #451 — Shiloh Calendar foundation architecture;
- PR #452 — Control ratification and Calendar-first future-product authority;
- PR #453 — application implementation, merge `7ba0b488314fb9f9138043be45192179582e1b41`;
- PR #454 — implementation reconciliation, merge/current reviewed main `862ecd3ddb7e42babdfee5a536afda4c86c7a4e2`.

## Control acceptance

Decision: **ACCEPT** `SHILOH-CALENDAR-READONLY-PROJECTION` as **VERIFIED LIVE / COMPLETE / DO NOT REDO**.

Independent evidence supports the completed unit:

- PR #453 was based on the exact PR #452 authority baseline and merged the bounded `schedulingEngine`/`SchedulingTimeline` implementation;
- the scheduling facade delegates existing availability authority instead of introducing a competing availability algorithm;
- `listTimeline({from,to,viewer,staffIds})` is bounded and permission-filtered;
- canonical appointments preserve `appointment_staff` multi-practitioner semantics under PR #380;
- Google external-busy is consumed through the existing PR #395 classification owner and remains explicitly non-canonical;
- missing/unknown viewer scope fails closed;
- projection SQL is SELECT-only and no Calendar mutation service was introduced;
- CI #1350 passed maintenance 12/12, focused SchedulingTimeline parity/no-mutation 6/6 and full regression 937/937 with zero failures, cancellations or skips and zero npm vulnerabilities;
- application Render deploy `dep-da64st49v7es73fnf37g` reached live on exact PR #453 application merge;
- reconciliation CI #1352 passed;
- current reconciliation Render deploy `dep-da650ck9v7es73fnjjm0` is live on exact PR #454 merge, with successful build, Google Calendar provider health, `Shiloh started`, root HTTP 200 and repeated `/health` HTTP 200;
- the bounded reviewed startup window contained no production error logs;
- Project Tracker and Master Status were reconciled by PR #454.

No additional production mutation proof is required for this read-only unit. Do not manufacture appointments, CRM changes, WhatsApp sends, schedule/block/leave changes or Google Calendar writes merely to re-prove it.

## Next bounded unit authorized

Control authorizes **`SHILOH-CALENDAR-READONLY-UX`** for implementation **now** by **10 — Booking & Admin UX**.

The purpose of this unit is to turn the verified `SchedulingTimeline` into the first recognizable Shiloh-owned Calendar experience while preserving the read-only migration boundary.

### Required user experience

Implement three views over the same `SchedulingTimeline` contract:

1. **Day** — operational practitioner lanes/columns with working-time context and clear timeline items.
2. **Week** — compact multi-day scheduling overview using the same canonical/non-canonical semantics.
3. **Agenda** — chronological list optimized for scanning, accessibility and smaller screens.

All views must consume `schedulingEngine.listTimeline(...)` or a thin server-side adapter over it. They must not introduce parallel appointment, availability, conflict or provider queries that become a second scheduling interpretation.

### Required visual/semantic distinctions

The UI must distinguish at minimum:

- canonical Shiloh appointments;
- canonical Shiloh blocks;
- approved leave/unavailability;
- clinic/location closures and applicable public holidays;
- working windows/exceptions;
- Google-only external busy as **non-canonical external provider state**.

Multi-practitioner appointments remain one canonical appointment with their authoritative assignments. Do not duplicate one appointment into independent pseudo-appointments merely to draw practitioner lanes.

The interface should use familiar high-value Calendar conventions where they reduce training cost, but must not clone Goldie, Fresha, Google Calendar or another product. Shiloh differentiation should remain grounded in explainable scheduling truth, provenance, multi-practitioner clarity, permission-aware views and provider-state clarity.

### Read-only controls authorized

The slice may add only non-mutating controls such as:

- Today;
- previous/next date period;
- Day / Week / Agenda switching;
- filtering among practitioners already permitted for the authenticated viewer;
- opening a read-only appointment/timeline detail panel if the same viewer is authorized to see the displayed fields.

### Mutation holds remain binding

This authorization does **not** permit:

- creating a booking from Calendar;
- rescheduling or cancelling from Calendar;
- drag-and-drop mutation;
- changing service or practitioner assignment;
- creating/removing blocks;
- creating/changing leave;
- changing clinic or practitioner schedules;
- Google Calendar writes;
- reducing Google conflict authority;
- removing shared/practitioner Google mirrors;
- bidirectional Google appointment authority;
- making Google Calendar optional.

Those remain later Control decisions.

## Secure browser access gate

Control identified a new implementation constraint while inspecting current main.

The current `/admin` HTTP API uses the shared `ADMIN_API_KEY` supplied as an `x-admin-key` header. Current main does not contain a proven browser-safe staff login/session boundary.

Therefore:

- **the shared `ADMIN_API_KEY` must never be embedded, serialized or persisted in Calendar HTML, JavaScript, browser storage or query parameters;**
- Calendar viewer scope must be derived server-side from authenticated Shiloh staff/Admin identity and must never be trusted from arbitrary browser-supplied `calendarScope`/`staffId` values;
- do not expose appointment/client scheduling detail through a public unauthenticated Calendar endpoint;
- the existing `/calendar/:token.ics` appointment-share route is a separate tokenized export surface and must not be repurposed into the operational Calendar application;
- if an existing browser-safe staff identity/session mechanism cannot be reused, the Calendar UX may still be implemented, tested, merged and deployed **feature-gated/default-off**, but production access to scheduling detail must remain disabled;
- in that case, return the exact secure-access dependency to Control instead of weakening authorization or leaking a shared secret.

This security gate does not cancel the UX implementation. It prevents an otherwise-correct read-only Calendar from becoming an insecure production data surface.

## Technology direction

Current main is an Express/CommonJS service without a frontend application framework. For this bounded read-only slice, prefer a lightweight server-rendered or framework-free HTML/CSS/JavaScript implementation unless a materially necessary reason for a frontend framework is demonstrated.

Do not introduce a major SPA/build-system dependency merely to draw the first Calendar views. The goal of this slice is to validate Shiloh's scheduling experience against authoritative timeline truth with minimal architectural surface area.

## Required verification

At minimum, tests must prove:

- Day, Week and Agenda render from the same `SchedulingTimeline` authority;
- permission/viewer scope fails closed server-side;
- no browser secret leakage, especially no `ADMIN_API_KEY` exposure;
- no Calendar mutation endpoint/control is reachable in this slice;
- PR #380 multi-practitioner representation remains coherent;
- PR #395 external busy remains visually and semantically non-canonical;
- provider/timeline failure renders an explicit unavailable/degraded state rather than guessed scheduling truth;
- date/view navigation and permitted practitioner filtering do not mutate scheduling state;
- the implementation preserves existing `/calendar/:token.ics`, booking, WhatsApp and Google mirror behavior.

Run focused UX/security/no-mutation tests and the full regression suite before merge.

## Priority and sequencing

Do this **now** as the next Calendar priority.

If Shiloh OS were my own project, I would build this bounded read-only UI before any Calendar mutation. It gives the team the first real Shiloh scheduling surface, lets the product language and information hierarchy be tested against canonical truth, and keeps rollback trivial. I would not trade away secure browser identity simply to make the page publicly accessible sooner.

After this unit, return to **00 — Control & Reconciliation** for acceptance. Control will then decide the secure production-access/parity-observability gate and only later authorize guarded delegated actions.
