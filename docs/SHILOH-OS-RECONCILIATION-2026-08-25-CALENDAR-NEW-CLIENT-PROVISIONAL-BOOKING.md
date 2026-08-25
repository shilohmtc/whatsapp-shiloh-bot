# Shiloh OS Reconciliation — Calendar New-Client Provisional Booking

Date: 2026-08-25

## Control decision

Controlled unit: `SHILOH-CALENDAR-NEW-CLIENT-PROVISIONAL-BOOKING`

Owning implementation workstream: 10 — Booking & Admin UX  
Reconciliation owner: 00 — Control & Reconciliation

Terminal status: **COMPLETE**.

JP explicitly authorized this enhancement. The completed implementation is accepted as a separately authorized enhancement to the already-completed emergency Christel Calendar booking capability; it does not reopen or recreate that prior controlled unit.

## Authority accepted by Control

- PR #486 — Add guarded Calendar new-client booking path.
- Branch: `feat/calendar-new-client-provisional-booking`
- Final head: `28e443d38a362f8522eac0ae6a5c5e09f71ec6f7`
- Base: `6e743f0af084d9c777bdfa691c8eef19ae536426`
- Application/main SHA: `4ce09f62ce00ac469f822a4dee31389e6b45f523`
- Verified-live Render deploy: `dep-da6idh95efls73cs7620`

## Accepted executable evidence

- Calendar new-client acceptance: 14/14.
- Emergency booking acceptance: 20/20.
- Full regression: 1061/1061, 0 failed.
- PR #486 CI #1421: run `32812528062`, job `97694505703` — SUCCESS.
- Post-merge main CI #1422: run `32812638074`, job `97694821844` — SUCCESS.

Control independently confirmed PR #486 merged at the stated head/base/merge SHA and confirmed Render deploy `dep-da6idh95efls73cs7620` LIVE on the stated application SHA. Control also confirmed `Shiloh started`, successful Google Calendar provider health, and no error-level logs after deployment in the bounded verification window. The owning-specialist production return records repeated `/health` HTTP 200.

## Accepted functional result

The Calendar Create Booking surface now preserves read-only canonical CRM search while allowing a genuinely new-client draft to be resolved only at guarded Review booking through the existing provisional-client authority.

Identity resolution remains fail-closed: one exact canonical mobile match is reused, ambiguous ownership creates nothing, and a genuinely new client becomes a provisional incomplete CRM profile with unverified mobile identity.

Cleanup is bounded to unused provisionals created by the current review flow. Existing canonical clients are never deleted by provisional cleanup. A successfully booked provisional is retained as legitimate CRM history.

Final appointment writes remain exclusively within the existing canonical Admin booking engine and all existing eligibility, scheduling, stale-slot, CRM conflict, shared Google Calendar and practitioner Google Calendar safeguards remain authoritative.

## Production safety

No database migration. No Render configuration change. No synthetic production client or appointment was created.

First genuine new-client use is an operational observation only and is not a completion gate.

## Reconciliation disposition

Project Tracker: reconciled to terminal COMPLETE by the companion addendum in this Control PR.

Master Status: reconciled to terminal COMPLETE by the companion addendum in this Control PR.

Do not reopen, recreate, or redo this implementation absent new production defect evidence or a separately authorized controlled unit.

Mobile Calendar layout/presentation polish, if later desired, is separate lower-priority 10 — Booking & Admin UX work.
