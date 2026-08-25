# Project Tracker Addendum — Calendar New-Client Provisional Booking

Date: 2026-08-25

## Controlled unit

`SHILOH-CALENDAR-NEW-CLIENT-PROVISIONAL-BOOKING`

Owner: 10 — Booking & Admin UX  
Control: 00 — Control & Reconciliation  
User authorization: JP explicitly authorized this enhancement.

Status: **COMPLETE — MERGED / CI GREEN / VERIFIED LIVE.**

## Purpose

Allow Christel's authenticated Calendar → Create booking surface to safely handle a genuinely new client when canonical CRM lookup returns no match, without introducing a second CRM or appointment-write authority.

## Terminal implementation authority

- PR #486 — Add guarded Calendar new-client booking path.
- Implementation branch: `feat/calendar-new-client-provisional-booking`
- Exact final branch head: `28e443d38a362f8522eac0ae6a5c5e09f71ec6f7`
- Exact base: `6e743f0af084d9c777bdfa691c8eef19ae536426`
- Authoritative application/main SHA: `4ce09f62ce00ac469f822a4dee31389e6b45f523`
- Exact verified-live Render deploy: `dep-da6idh95efls73cs7620`

## Functional contract

- Zero-result CRM search remains read-only and creates no client.
- New-client details remain a browser draft until guarded Review booking.
- Review accepts either one canonical CRM client ID or one new-client draft, never both.
- New-client resolution delegates to the existing `adminProvisionalClient` canonical authority.
- South African mobile is normalized and checked against canonical CRM before creation.
- One exact existing-mobile match reuses that canonical client.
- Ambiguous mobile ownership fails closed and creates nothing.
- A genuine new client creates a provisional incomplete CRM profile with unverified mobile identity.
- The resulting canonical client ID enters the existing guarded `prepareAdminBooking` path.
- Prepare denial/error removes an unused newly created provisional client.
- Edit/discard cancels the pending canonical booking review and removes an unused provisional client.
- Existing canonical clients are never removed by provisional cleanup.
- Failed final confirmation cleans an unused provisional only after canonical pending-session removal.
- Successful appointment creation retains the provisional client as legitimate booked CRM history.
- Final appointment writes remain exclusively inside the existing canonical Admin booking engine.

## Preserved safeguards

Christel-only emergency authority, secure browser session, same-origin and CSRF guards, no public new-client creation endpoint, no direct appointment insert, provider eligibility, clinic/staff schedule checks, stale-slot revalidation, CRM conflicts, shared Google Calendar, practitioner Google Calendar, and existing `shiloh_calendar` confirmation source remain authoritative.

No database migration. No Render configuration change.

## Executable proof

- Calendar new-client acceptance: 14/14 passed.
- Existing emergency booking acceptance: 20/20 passed.
- Full regression: 1061/1061 passed; 0 failed.
- PR #486 CI #1421: run `32812528062`, job `97694505703` — SUCCESS.
- Post-merge main CI #1422: run `32812638074`, job `97694821844` — SUCCESS.

## Production verification

- Render deploy `dep-da6idh95efls73cs7620` is LIVE at application commit `4ce09f62ce00ac469f822a4dee31389e6b45f523`.
- New instance reached `Shiloh started`.
- Google Calendar provider health passed.
- Owning-specialist return records repeated `/health` HTTP 200 responses on the new instance.
- Control's read-only Render verification found no error-level logs after deployment.
- No synthetic production client or appointment was created for acceptance.

## Residual operational observation — not a completion gate

First genuine new-client use is an operational observation only. Do not create a synthetic production client or appointment solely to prove the already-tested path.

## Completion / do not reopen

00 — Control & Reconciliation accepts this controlled unit as COMPLETE. Do not reopen, recreate, or redo the implementation absent new production defect evidence or a separately authorized controlled unit.

Any later mobile Calendar layout/presentation polish is separate lower-priority 10 — Booking & Admin UX work and is not a blocker to this completion.
