# Shiloh OS — Master Project Status

Updated: 2026-08-18
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted or superseded work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CUSTOMER-CHANGE-CONFIRMATIONS.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on `main`; verify applicable production/provider state; then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate. Obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Permanent governance remains: operational screenshots are diagnostic evidence by default and must not trigger image generation unless visual creation/editing is explicitly requested; production defects follow trace → authoritative evidence → root cause → guarded repair → regression/E2E → CI → deploy → production verification → reconciliation; provider lead-time is considered early; known finite client/admin choices are button/list-first where practical; natural language remains fallback into the same canonical handlers; no speculative provider submissions; no manufactured appointments/evidence; no duplicate public service source of truth.

## Current production / deployment baseline

The accepted functional catalogue lineage remains through **PR #301 / `6863958dbf97a6a6f593fc196c284571adf802c6`**. PR **#302**, **Fail closed cleanly when Google Calendar auth expires**, passed CI run **#975** and merged as **`bee0bdcd71f7dae768a78e6e5cfcd5ec5ddf76c9`**. PR **#303**, **Send WhatsApp confirmations after booking changes**, passed CI run **#982** and merged as **`632ec4780489a97349b41a85567fa13b18d9ca35`**.

Render auto-deployed PR #303 as **`dep-da21jsdg1s2s73c1ju60`**. The production instance started the customer-change notification scheduler and retained a healthy Google Calendar provider probe.

Fresh provider evidence retains:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **APPROVED / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.
- `shiloh_cancellation_confirmation_v1` — **APPROVED**.
- `shiloh_booking_update_v1` — **PENDING** after successful production submission on 2026-08-18.

Provider approval does not itself prove handset delivery or justify manufactured operational messaging.

## Public Shiloh service catalogue — 🟢 VERIFIED LIVE through #301

`/book` remains the Shiloh-owned public service catalogue and booking entry surface, projected read-only from canonical Shiloh CRM catalogue data. Public eligibility remains active service + at least one active practitioner who is client-bookable. Availability remains authoritative only inside the booking engine.

Accepted presentation remains the #301 state: reduced hero; wider scannable catalogue; Massage first and Pedicures & Foot Care second; responsive navigation and WhatsApp actions; real clinic imagery with clean treatment cards; exact Inside Shiloh artwork at three signature positions; plasma three-card row; SQT pair; approved HIFU + Vaginal Tightening & Rejuvenation + Neo Pelvic Therapy row. PRs #284–#300 contain superseded visual/layout variants and are not outstanding work.

The public compatibility contract remains **`Your appointment starts with Shiloh.`** and **`Continue with Shiloh on WhatsApp`**.

## Admin booking and manage-booking — 🟢 VERIFIED LIVE

The normal WhatsApp Admin surface remains button/list-first where practical. Appointments priority remains **Finalize past visits → Make a booking → Manage a booking → Today's clients → Tomorrow's clients**. `Find an available time` is integrated into Make a booking.

The accepted Admin reschedule lineage includes next-available choices, same-day direct time, explicit date+time input, restart-safe typed context, review-before-write confirmation, corrected confirmed commit, start-time-first manual booking presentation, canonical 15-minute candidate generation, clinic hours, practitioner schedule, CRM conflicts and configured Calendar conflicts.

### Google Calendar provider guard and recovery — 🟢 VERIFIED LIVE

A real Admin **Manage booking → Change practitioner** journey exposed expired/revoked Google OAuth credentials. PR #302 added fail-closed provider handling plus a read-only startup/recurring Google Calendar health probe. The Google Auth app was confirmed External/Testing, moved to **In production**, and the production OAuth Client ID / Client Secret / Refresh Token chain was reconciled.

Fresh Render startup evidence reports **`Google Calendar provider health check passed`**.

Real WhatsApp evidence verified booking **#570** end to end: practitioner changed to **Christel**, the **Google Calendar event was updated**, and the booking preserved **Linda Dr**, **Sports Massage — Package Session**, **2026/08/21 14:30–15:20**, and **R0.00**. Do not mutate #570 again merely for proof.

The PR #302 fail-closed guard and health probe are permanent protection and must remain even while the provider is healthy.

### Customer confirmations after Admin changes — 🟢 IMPLEMENTED / LIVE; 🟠 UPDATE TEMPLATE PENDING

PR #303 adds customer-facing WhatsApp confirmation coverage after successful Admin changes to service, practitioner, date/time, booked price, and cancellation. New bookings continue using the existing booking-confirmation path and were not reimplemented.

For service/practitioner/date-time/price changes, Shiloh records a durable audit-event-idempotent outbox item only after the canonical mutation succeeds. The latest authoritative appointment state is then sent using `shiloh_booking_update_v1` once Meta reports that UTILITY template **APPROVED**. The message includes current service, practitioner, date, 24-hour time range, booked price and booking number. Admin cancellation uses the existing `shiloh_cancellation_confirmation_v1` template.

The queue is retryable and does not use proactive free-text fallback. A failed/blocked CRM or Calendar mutation does not queue a client message. The Manage booking copy now states that successful saved changes queue the customer's latest WhatsApp confirmation.

Fresh production provider evidence after PR #303: `shiloh_cancellation_confirmation_v1` is **APPROVED**; newly submitted `shiloh_booking_update_v1` is **PENDING**. Therefore cancellations are provider-ready, while service/practitioner/date-time/price confirmations remain durably queued until Meta approval. Do not claim delivery until genuine post-approval evidence exists and do not mutate a real booking merely for proof.

## Attendance finalization authority — 🟢 IMPLEMENTED

Canonical certification authority remains:
- **Christel:** finalizes Christel + Abigail appointments only.
- **Marietjie:** finalizes Marietjie appointments only.
- **Abigail:** does not finalize appointments.
- Broad Admin visibility does not grant attendance-certification authority.

Historical finalization exposes Completed, No-show, Cancelled, No charge, Service change, Adjust price, Reschedule and Leave unresolved. Service/price changes preserve original history and finalize through canonical guarded paths.

## Historical attendance 2026-08-01 through 2026-08-15 — 🔵 HUMAN FINAL REVIEW ACTIVE

Earlier audit: 53 appointments = 31 finalized, 4 cancelled, 17 unresolved/routable, plus one unresolved exception #558 historically mapped to `SHILOH MTC`. The 31 prior Completed/No-show visits were approved for reopening with audit/history preserved; cancelled visits were not reopened. The immediate post-reopen 48 routable count is historical evidence only; re-query before quoting a current total.

### #558 — 🔴 FAIL-CLOSED historical exception

Appointment **#558 on 2026-08-06** remains unresolved with historical practitioner `SHILOH MTC`. Never silently assign it to Christel or Marietjie. Establish the real practitioner from authoritative history or explicit human evidence before correction/finalization.

## Completed client/lifecycle/directory work — do not redo

Universal welcome, registered/legacy Book appointment routing, eligible-practitioner ordering, booking/cancellation action-button parity, practitioner directory, category ordering/count polish, SQT BioMicroneedling virtual-family presentation, Admin booking/reschedule, and 24-hour presentation remain completed.

Canonical practitioner presentation remains:
- Christel · Massage — Massage Practitioner
- Abigail · Massage — Massage Practitioner
- Marietjie · Esthetician — Aesthetic Practitioner

Do not consolidate/rename underlying CRM records merely to reproduce presentation.

## Existing evidence and provenance

Pa Derik #567 real handset reschedule evidence remains accepted; last recorded state was Tuesday 18 August 2026, 08:30–10:15, Full Body Swedish with Christel. Re-query if current state is needed; do not mutate for evidence.

CRM48 (Pa Derik) and CRM473 remain legitimate controlled Goldie-imported canonical clients. CRM IDs are not proof of bot registration. CRM1 remains an orphan-like read-only review candidate; do not delete without identity/supersession proof. Unique unverified imported mobiles use the existing-profile claim/verification path; ambiguity remains fail-closed.

## Standing gates

- `shiloh_booking_update_v1` Meta approval remains a provider gate before service/practitioner/date-time/price customer-update messages can be delivered.
- Historical attendance remains explicit human truth.
- #558 remains fail-closed.
- Genuine per-route lifecycle evidence remains natural-journey gated where not already observed.
- Follow-up/rating delivery remains genuine completed-visit timing gated.
- Birthday v2 requires genuine eligible CRM birthday/opt-in conditions.
- Google Business Profile API remains deferred at last-authoritative 0 QPM.
- Google Contacts sync remains lower priority; CRM is authoritative.
- Ozow remains waiting for merchant configuration and explicit business rules.
- Destructive privacy execution remains fail-closed pending authority/evidence.

## Exact new-chat continuation state

- PR #303 customer-change notification architecture is **LIVE** in Render production.
- `shiloh_cancellation_confirmation_v1` is **APPROVED**; Admin cancellation confirmations are provider-ready.
- `shiloh_booking_update_v1` is **PENDING**; qualifying service/practitioner/date-time/price update messages stay queued until Meta approval.
- Google Calendar OAuth/provider health is **🟢 VERIFIED HEALTHY**; fresh production probe passed.
- Admin practitioner change is **🟢 VERIFIED LIVE** via real booking #570; Calendar event update succeeded.
- PR #302 provider guard/health probe remains permanent protection; do not remove or bypass it.
- `/book` remains the accepted live CRM-backed public catalogue through #301; do not redo superseded #284–#300 variants.
- Historical attendance remains human-controlled; #558 remains fail-closed.

**Authoritative current state:** customer-change confirmations are engineered, regression-covered, merged and deployed. Cancellation confirmation is provider-ready; ordinary booking-update confirmation is waiting for Meta approval of `shiloh_booking_update_v1`.

**Highest-priority continuation item:** re-check Meta provider status for `shiloh_booking_update_v1`; once APPROVED, allow the existing retry queue to deliver qualifying genuine updates and capture natural operational evidence without manufacturing an appointment change.

**Remaining gates:** Meta approval for the booking-update template, human attendance/#558/genuine-journey truth, and explicit approval for material commercial/service/business-rule changes remain fail-closed.