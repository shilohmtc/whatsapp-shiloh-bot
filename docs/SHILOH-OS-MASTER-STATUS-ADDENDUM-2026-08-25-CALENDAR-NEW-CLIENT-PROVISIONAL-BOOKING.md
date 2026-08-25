# Master Status Addendum — Calendar New-Client Provisional Booking

Date: 2026-08-25

## Terminal durable state

`SHILOH-CALENDAR-NEW-CLIENT-PROVISIONAL-BOOKING` is **COMPLETE — MERGED / CI GREEN / VERIFIED LIVE.**

Owner: 10 — Booking & Admin UX  
Control: 00 — Control & Reconciliation  
JP explicitly authorized the enhancement.

Implementation authority:
- PR #486 — Add guarded Calendar new-client booking path.
- Final branch head: `28e443d38a362f8522eac0ae6a5c5e09f71ec6f7`
- Exact base: `6e743f0af084d9c777bdfa691c8eef19ae536426`
- Authoritative application/main SHA: `4ce09f62ce00ac469f822a4dee31389e6b45f523`
- Exact verified-live Render deploy: `dep-da6idh95efls73cs7620`

## Durable operational outcome

Christel's authenticated Calendar → Create booking surface can now safely handle both:

1. one selected canonical CRM client; or
2. a genuinely new-client draft when canonical CRM lookup returns no match.

The browser does not become a new CRM authority. A zero-result search remains read-only. New-client details remain browser-local until guarded Review booking, where the server resolves the draft through the existing `adminProvisionalClient` canonical authority.

## Canonical identity / provisional-client behaviour

Before creating a provisional client, the South African mobile is normalized and checked against canonical CRM ownership.

- One exact existing-mobile match reuses the canonical client.
- Ambiguous ownership fails closed and creates nothing.
- A genuine new client creates a provisional incomplete CRM profile with unverified mobile identity.
- Existing canonical clients are never eligible for provisional cleanup.
- Prepare denial/error, edit/discard, and failed confirmation remove an unused newly created provisional only under the bounded cleanup contract.
- Successful appointment creation retains the provisional client as legitimate booked CRM history.

This preserves canonical CRM identity authority and avoids duplicate client creation where a unique canonical mobile match already exists.

## Booking authority

After new-client resolution, the canonical client ID enters the existing guarded `prepareAdminBooking` flow. Final appointment creation remains exclusively inside the existing canonical Admin booking engine.

The enhancement does not add a direct appointment insert path and does not weaken:
- client/service/practitioner eligibility;
- clinic schedule;
- staff schedule;
- stale-slot revalidation;
- CRM appointment-conflict checks;
- shared Google Calendar conflict checks;
- practitioner Google Calendar conflict checks.

The existing `shiloh_calendar` confirmation source remains authoritative.

## Security / scope boundaries

The existing Christel-only emergency authority remains in force. Calendar remains private and authenticated. Secure browser-session, same-origin and CSRF protections remain mandatory. No public new-client creation endpoint was introduced.

No database migration and no Render configuration change were required.

## Verification authority

- Calendar new-client acceptance: 14/14.
- Emergency booking acceptance: 20/20.
- Full regression: 1061/1061, 0 failed.
- PR #486 CI #1421 / run `32812528062` / job `97694505703`: SUCCESS.
- Post-merge main CI #1422 / run `32812638074` / job `97694821844`: SUCCESS.

Production deploy `dep-da6idh95efls73cs7620` is LIVE at `4ce09f62ce00ac469f822a4dee31389e6b45f523`. The new instance reached `Shiloh started`, Google Calendar provider health passed, the owning-specialist return records repeated `/health` HTTP 200, and Control found no post-deploy error-level logs in the bounded verification window.

No synthetic production new-client or appointment was created for verification.

## Operational observation / preserved closure

First genuine new-client use is normal operational observation, not an implementation completion gate. Do not manufacture a production client or appointment solely for proof.

Do not reopen or recreate this implementation absent new production defect evidence or a separately authorized controlled unit.

Any future mobile Calendar layout/presentation polish is a separate lower-priority 10 — Booking & Admin UX unit and does not block this durable completion.
