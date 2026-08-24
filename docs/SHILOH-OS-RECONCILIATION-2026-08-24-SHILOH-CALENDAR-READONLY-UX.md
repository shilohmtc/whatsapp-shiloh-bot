# Shiloh OS — Booking & Admin UX — Calendar Read-Only UX Completion

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Previous / acceptance owner: **00 — Control & Reconciliation**
Authorized by: PR #455
Status: **IMPLEMENTED / TESTED / MERGED / VERIFIED LIVE / RECONCILED — SECURE STAFF ACCESS DEPENDENCY RETURNED TO CONTROL**

## Controlled unit

`SHILOH-CALENDAR-READONLY-UX`

Authoritative starting main was **`7ae4941c96e81c6c5da3bef8fb8b11ffc976ee20`**, PR #455's Control acceptance of the read-only projection and authorization of the Day/Week/Agenda UX.

## Security inspection before implementation

Current Express/CommonJS main was inspected before writing the UX.

Findings:

- `src/middleware/adminAuth.js` protects the existing `/admin` HTTP API with server-side `ADMIN_API_KEY` checked against `x-admin-key`;
- the application stack contains no proven browser-safe staff login/session mechanism such as a staff session middleware;
- `app.js` does not establish a browser staff identity or trusted session context for Calendar use;
- `/calendar/:token.ics` is an existing separate appointment-share/export route and must remain separate.

Therefore the Control security contingency applied: implement the complete read-only UX, but keep real production scheduling access fail-closed until a secure browser staff identity/session boundary exists.

## Application implementation

Implementation branch: `feat/shiloh-calendar-readonly-ux`.

Application PR: **#456 — Build read-only Shiloh Calendar Day Week Agenda UX**.

Application merge: **`533907a704e29106ef67852ddedd800164521cc5`**.

PR #456 added:

- `src/services/calendarReadOnlyUx.js` — thin read-only server adapter over `schedulingEngine.listTimeline(...)`;
- `src/presentation/calendarReadOnlyUx.js` — framework-free server-rendered Shiloh Calendar HTML/CSS;
- `src/routes/calendarReadOnlyUx.js` — default-off, server-viewer-gated GET route;
- `tests/calendar-readonly-ux.test.js` — focused UX/security/no-mutation proof;
- one focused Calendar UX CI step;
- a separate `/calendar/read-only` mount while preserving the existing `/:token.ics` handler.

## Day / Week / Agenda behavior

**Day** renders a recognizable operational Calendar with practitioner lanes, working-time context and distinct timeline cards. Multi-practitioner appointments are shown once in a shared booking band rather than duplicated per lane.

**Week** renders seven compact days over the same SchedulingTimeline truth, retaining practitioner identity and provenance on each item.

**Agenda** renders chronological seven-day read-only scheduling truth and is optimized for faster scanning and narrower screens.

Read-only controls are Today, previous/next period, Day/Week/Agenda switching and permitted-practitioner filtering.

The adapter calls `schedulingEngine.listTimeline(...)` for every view. Filtering happens only after SchedulingTimeline has already resolved the viewer-permitted staff set; requesting a practitioner outside that server-authorized set fails closed.

No independent appointment SQL, availability calculation, schedule interpretation or Google conflict classification was added.

## Canonical scheduling semantics

PR #380 remains authoritative. A multi-practitioner appointment remains one canonical appointment with all authoritative staff assignments. The UI does not create pseudo-appointments for individual lanes.

PR #395 remains authoritative. Google provider conflicts are consumed from SchedulingTimeline and rendered visibly as **non-canonical Google-only busy** with PR #395 classification provenance. They are not treated as Shiloh appointments.

Working windows, blocks, approved leave, clinic closures and holidays are rendered from the accepted SchedulingTimeline output. Provider/timeline failure returns an explicit fail-closed unavailable state rather than an incomplete Calendar.

## Secure access boundary

The production route is intentionally not staff-accessible yet.

`SHILOH_CALENDAR_READONLY_UX_ENABLED` is false unless explicitly configured as `true`. When false, the route returns 404 before any SchedulingTimeline read.

Even if a later authorized change enables that flag, PR #456 requires a trusted server component to attach:

`Symbol.for('shiloh.calendar.server.viewer')`

with `authenticated: true`, source `server_staff_session`, and a server-derived viewer object. Without that trusted context the route returns an unavailable response before SchedulingTimeline is called.

The browser cannot authorize itself through query parameters, headers, staff IDs or calendar scopes. `ADMIN_API_KEY` / `x-admin-key` is not embedded into HTML, JavaScript, cookies, localStorage, sessionStorage or query parameters.

The response is no-store and uses restrictive CSP, no-referrer, nosniff and frame-deny headers.

There are no POST/PUT/PATCH/DELETE Calendar UX routes, no form mutation and no client-side scheduling JavaScript.

## Deterministic verification

PR #456 CI run: **#1356**.

Workflow run ID: **32738644960**.

Job ID: **97467479413**.

Node: **24.14.1**.

Results:

- maintenance framework: **12/12 passed**;
- SchedulingTimeline focused parity: **6/6 passed**;
- Calendar UX focused security/no-mutation suite: **8/8 passed**;
- full `npm test`: **945/945 passed**, 0 failed, 0 cancelled, 0 skipped;
- `npm ci`: 174 packages installed, 175 audited, **0 vulnerabilities**.

The focused Calendar UX suite proves:

1. Day/Week/Agenda all use the same SchedulingTimeline server adapter;
2. default-off production state and missing server staff session fail closed before SchedulingTimeline;
3. `ADMIN_API_KEY`, `x-admin-key` and browser credential storage cannot leak into Calendar HTML;
4. PR #380 multi-practitioner appointments render once with all assignments intact;
5. PR #395 Google-only busy is visibly non-canonical;
6. provider/timeline failure produces explicit unavailable state without raw provider leakage;
7. practitioner filtering cannot exceed the server-permitted set and does not rewrite canonical assignments;
8. navigation is GET-only/read-only and `/calendar/:token.ics` remains intact.

The complete regression suite also preserves existing booking, WhatsApp, provider, Calendar mirror and scheduling behavior.

## Production verification

Render service: `shiloh-whatsapp-bot` / `srv-d9qbfmk9v7es73emgam0`.

Auto-deploy: **`dep-da659kqd0e5s73c6h780`**.

Trigger: `new_commit`; no manual duplicate deploy was triggered.

Render checked out exact application merge **`533907a704e29106ef67852ddedd800164521cc5`**, used Node **24.14.1**, completed `npm ci` with **0 vulnerabilities**, built successfully and reached **LIVE** at **2026-08-24T14:28:12.143915Z**.

New instance: `srv-d9qbfmk9v7es73emgam0-hf282`.

Verified evidence:

- **Google Calendar provider health check passed** at approximately `2026-08-24T14:28:00.146Z`;
- **Shiloh started** at approximately `2026-08-24T14:28:01.220Z`;
- root `HEAD /` returned HTTP **200**;
- repeated new-instance `GET /health` returned HTTP **200** after startup and cutover, including approximately `14:28:10.796Z`, `14:28:15.799Z` and `14:28:20.795Z`.

No environment variable was changed to activate Calendar access. No appointment, schedule, block, leave, CRM record, WhatsApp message or Google Calendar event was created/rescheduled/cancelled/deleted for proof.

## What this completion does and does not deliver

The Day/Week/Agenda Calendar is now a real implemented and production-deployed application capability, not merely an architecture document or mock-up. However, it is intentionally **not yet a genuinely staff-usable production Calendar**, because Shiloh does not yet have the required browser-safe staff session/identity boundary.

Accordingly, this unit removes future UX implementation work but does **not yet remove current staff reliance on existing operational surfaces such as Google Calendar/WhatsApp Admin for live scheduling work**.

Once Control authorizes and a specialist implements a secure server-side staff browser session that can supply the trusted viewer context, this same UX can be activated and can immediately reuse canonical SchedulingTimeline truth without rebuilding Day/Week/Agenda.

Calendar mutation work remains separately unauthorized.

## Authority preserved / do not redo

- PR #451: foundation architecture.
- PR #452: Control ratification and future Calendar-first booking rule.
- PR #453: SchedulingTimeline read projection.
- PR #454: projection implementation reconciliation.
- PR #455: Control acceptance and read-only UX authorization.
- PR #456: read-only Day/Week/Agenda UX application authority.
- PR #380: multi-practitioner booking/allocation semantics.
- PR #395: Google practitioner/shared conflict classification.

Do not redo the read-only projection or Day/Week/Agenda implementation, expose the Admin API key to a browser, trust browser-supplied staff scope, duplicate multi-practitioner appointments, weaken Google authority or introduce Calendar mutations as part of this completed unit.

## Recommendation and next owner

Recommendation: **accept and freeze PR #456 now; solve secure browser staff identity/session next, before any Calendar mutation work.**

If Shiloh OS were my project, I would not proceed to drag/drop or Calendar-native booking while nobody can safely authenticate to the read surface. The secure-access boundary is now the highest-value dependency because it converts the already-built Calendar from deployed-but-inactive code into a genuinely usable staff capability without changing scheduling truth.

Next owner: **00 — Control & Reconciliation** to accept the implementation, choose the correct specialist for secure browser staff/Admin authentication/session, and separately authorize any activation after that dependency is proven.
