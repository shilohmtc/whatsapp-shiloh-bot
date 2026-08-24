# Shiloh OS — Master Status Addendum — Shiloh Calendar Read-Only UX

Date: 2026-08-24
Owning implementation workstream: **10 — Booking & Admin UX**
Control/dependency owner after implementation: **00 — Control & Reconciliation**
Foundation architecture: PR #451
Control ratification / Calendar-first future-product authority: PR #452
SchedulingTimeline application authority: PR #453
Projection Control acceptance / UX authorization: PR #455
Read-only Calendar UX application authority: PR #456 / **`533907a704e29106ef67852ddedd800164521cc5`**
Durable state: **READ-ONLY DAY/WEEK/AGENDA UX IMPLEMENTED AND DEPLOYED / STAFF BROWSER ACCESS FAIL-CLOSED**

## Durable operational state

PR #456 implements the first recognizable Shiloh-owned Calendar presentation layer without introducing a second scheduling source of truth or any Calendar mutation authority.

The production codebase now contains lightweight server-rendered **Day**, **Week** and **Agenda** views at the separate `/calendar/read-only` route. All real scheduling content is obtained through a thin server adapter over `schedulingEngine.listTimeline(...)`; the UX contains no independent appointment SQL, availability algorithm, schedule interpretation or Google conflict classifier.

The presentation includes working-time context, canonical appointments, blocks, approved leave/unavailability, clinic closures/public holidays, practitioner filtering, Today/period navigation and explicit provenance. Provider/timeline failure is shown as an explicit fail-closed unavailable state rather than silently dropping conflicts.

PR #380 remains the durable multi-practitioner booking/allocation authority. A shared appointment remains one canonical appointment containing every authoritative assignment and is presented once as a shared booking. PR #395 remains the durable practitioner/shared Google conflict classifier; Google-only busy remains non-canonical provider enrichment and is visibly labelled as such.

## Browser security boundary

The current application still does **not** provide a proven browser-safe staff/Admin login or session boundary for Calendar use.

The existing `/admin` HTTP API's `ADMIN_API_KEY` / `x-admin-key` model remains separate and must not be converted into a browser credential. PR #456 does not expose, serialize or store that key anywhere in the Calendar presentation.

The Calendar route is protected by two independent fail-closed conditions:

1. `SHILOH_CALENDAR_READONLY_UX_ENABLED` is false unless explicitly set to `true`;
2. even when enabled, the route requires trusted server-side authenticated viewer context attached using `Symbol.for('shiloh.calendar.server.viewer')` and source `server_staff_session` before it will call SchedulingTimeline.

No current production middleware supplies this context. Browser-provided `calendarScope`, `staffId`, headers or query parameters therefore cannot establish Calendar authorization.

This means the Calendar UX is **real implemented application code but not yet a staff-usable production browser capability**. Its production deploy is safe because absent the secure session boundary it cannot return scheduling data. The secure browser staff identity/session mechanism is a separate dependency that requires Control routing and later authorization before activation.

The route also sends no-store/no-referrer/CSP/frame-deny security headers and exposes GET-only read navigation. There is no appointment, reschedule, cancellation, block, leave, schedule or Google mutation method in this slice.

## Existing authority preserved

`/calendar/:token.ics` remains the existing appointment-scoped share/export route and is unchanged in purpose and behavior.

Existing WhatsApp/Admin booking, client booking, rescheduling, cancellation, appointment approvals, schedule/leave/block owners, Google shared/practitioner mirrors and provider fail-closed behavior remain unchanged.

The future Calendar-first staff/Admin booking rule from PR #452 remains a future guarded-mutation invariant only. PR #456 does not authorize or implement it.

## Verification authority

PR #456 CI **#1356** / workflow run **32738644960** / job **97467479413** passed on Node **24.14.1**:

- maintenance framework **12/12**;
- accepted SchedulingTimeline parity **6/6**;
- focused Calendar UX security/no-mutation **8/8**;
- full regression **945/945**, 0 failed, 0 cancelled, 0 skipped;
- npm audit: **0 vulnerabilities**.

Render auto-deploy **`dep-da659kqd0e5s73c6h780`** reached **LIVE** on exact application merge **`533907a704e29106ef67852ddedd800164521cc5`**, finishing **2026-08-24T14:28:12.143915Z**.

The new instance `srv-d9qbfmk9v7es73emgam0-hf282` logged **Google Calendar provider health check passed**, then **Shiloh started**, returned root HTTP 200 and repeatedly returned `/health` HTTP 200 after startup and deploy cutover.

No real scheduling, CRM, WhatsApp or Google Calendar mutation was manufactured for proof. No environment change was made to activate the Calendar browser route.

## Do not redo / do not broaden

Do not rebuild the Day/Week/Agenda UX independently of SchedulingTimeline, duplicate shared appointments for rendering, reimplement PR #395, expose the Admin API key to a browser, trust browser-supplied viewer scope, or add Calendar mutations under this completed slice.

## Next durable dependency

**Secure browser staff/Admin identity and session boundary** is the next gating dependency before staff can genuinely use Shiloh Calendar in production.

Control should determine the correct owner and authorize a bounded secure-access unit. After that boundary is implemented and verified, the existing PR #456 UX can be activated without redesigning scheduling truth or the three read-only views. Calendar mutations remain a later separate Control decision.
