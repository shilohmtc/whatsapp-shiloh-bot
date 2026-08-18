# Shiloh OS — Master Project Status

Updated: 2026-08-18 09:03 SAST
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted or superseded work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-18-PUBLIC-CATALOGUE-POLISH.md`, on `main`; verify applicable production/provider state; then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate. Obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Permanent governance remains: provider lead-time early in feature planning; known finite client/admin choices are button/list-first when practical; natural language remains fallback into the same canonical handlers; no speculative provider submissions; no manufactured appointments/evidence; no duplicate public service source of truth.

## Current production / deployment baseline

GitHub and Render are converged through **`6863958dbf97a6a6f593fc196c284571adf802c6`** (PR #301, `Group plasma specialty categories in one row`). The final #301 branch head passed GitHub Actions CI run **#970** before merge. Render auto-deployed the exact merge commit as **`dep-da1ut3oae00c73c0g18g`** and reported it **LIVE** at 2026-08-18 05:33:32 UTC.

The accepted lineage now includes #277–#280 and the public-catalogue refinement sequence #282–#301. Intermediate visual experiments and earlier specialty-layout variants superseded by the current #301 runtime are historical only; do not reopen them without new evidence or explicit business direction.

Fresh production startup evidence previously established on 17 August remains:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **APPROVED / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.

Provider approval does not itself prove handset delivery or justify manufactured operational messaging; existing authorization, idempotency and genuine-use rules remain in force.

## Public Shiloh service catalogue — 🟢 VERIFIED LIVE through #301

`/book` is the Shiloh-owned public service catalogue and booking entry surface. It remains a read-only projection of canonical Shiloh CRM catalogue data rather than a second service database.

A service is publicly exposed only when the service is active and at least one mapped staff member is active, a practitioner, and client-bookable. The page renders canonical category, service name, duration, price, customer description and booking note. Each treatment action hands the exact canonical service name to the official Shiloh WhatsApp journey. The webpage never claims a slot is available; practitioner/date/time availability remains authoritative only inside the existing booking engine.

### Accepted presentation state

The current accepted #301 page includes:
- reduced conversion-oriented hero and faster treatment access;
- wider desktop catalogue with scannable duration/price cards;
- Massage pinned first and Pedicures & Foot Care second;
- responsive category navigation and WhatsApp guidance/booking actions;
- real Shiloh clinic imagery served from repository assets while treatment cards remain clean;
- the exact uploaded **Inside Shiloh** artwork used as three recurring catalogue signatures;
- responsive specialty-category grouping on desktop/mobile;
- **Profosma Jet Plasma + Plasma Fibroblast Consultation + Plasma Fibroblast Prices** together in one three-column desktop plasma row;
- the two SQT BioMicroneedling categories retained together;
- **HIFU + Vaginal Tightening & Rejuvenation + Neo Pelvic Therapy** retained as the approved three-category specialty row.

PRs #284–#294 contain iterative visual experiments that were subsequently superseded. PRs #298–#300 contain earlier specialty grouping variants superseded by #301. Do not treat those intermediate states as unfinished work.

The established public compatibility contract remains visible: **`Your appointment starts with Shiloh.`** and **`Continue with Shiloh on WhatsApp`**.

## Admin booking and manage-booking — 🟢 IMPLEMENTED / LIVE

The normal WhatsApp Admin surface remains button/list-first where practical. Appointments priority remains **Finalize past visits → Make a booking → Manage a booking → Today's clients → Tomorrow's clients**. `Find an available time` is integrated into Make a booking.

The accepted Admin reschedule lineage includes next-available choices, same-day direct time, explicit date+time input, restart-safe typed context, review-before-write confirmation, corrected confirmed commit, and start-time-first manual booking presentation. Canonical 15-minute candidate generation, clinic hours, practitioner schedule, CRM conflicts and configured Calendar conflicts remain authoritative. Presentation does not create an override or double-booking path.

Historical manual bookings remain supported: canonical CRM + configured Calendar synchronization, no ordinary client booking notification, and unresolved status for later authorized attendance certification.

## Attendance finalization authority — 🟢 IMPLEMENTED

Canonical certification authority remains:
- **Christel:** finalizes Christel + Abigail appointments only.
- **Marietjie:** finalizes Marietjie appointments only.
- **Abigail:** does not finalize appointments.
- Broad Admin visibility does not grant attendance-certification authority.

Historical finalization exposes Completed, No-show, Cancelled, No charge, Service change, Adjust price, Reschedule and Leave unresolved. Service/price changes preserve original history and finalize through canonical guarded paths.

## Historical attendance 2026-08-01 through 2026-08-15 — 🔵 HUMAN FINAL REVIEW ACTIVE

The earlier read-only production audit established 53 appointments: 31 finalized, 4 cancelled, 17 unresolved/routable, plus one unresolved exception #558 mapped historically to `SHILOH MTC`. With approval, the 31 prior Completed/No-show visits were reopened for final human certification with audit/history preserved; cancelled visits were not reopened.

The immediate post-reopen checkpoint was 48 routable unresolved visits. That is historical evidence only. Re-query before quoting a current total.

### #558 — 🔴 FAIL-CLOSED historical exception

Appointment **#558 on 2026-08-06** remains unresolved with historical practitioner `SHILOH MTC`. Never silently assign it to Christel or Marietjie. Establish the real practitioner from authoritative history or explicit human evidence before correction/finalization.

## Historical finalization shortcut — 🟢 PROVIDER APPROVED / operational evidence rules remain

The proactive role-aware Finalize shortcut is implemented with recipient-specific count, direct authorized queue action, idempotent send ledger and retry-safe failed delivery. `shiloh_staff_finalization_actions_v1` is **APPROVED / UTILITY**. Do not translate provider approval into fabricated handset evidence. Ordinary **Admin → Appointments → Finalize past visits** remains canonical.

## Universal client entry / lifecycle / discovery — 🟢 VERIFIED; do not redo

The universal welcome, registered/legacy Book appointment routing, eligible-practitioner ordering, booking/cancellation action-button parity, practitioner directory, category ordering/count polish and SQT BioMicroneedling virtual-family presentation remain completed.

Canonical presentation remains:
- Christel · Massage — Massage Practitioner
- Abigail · Massage — Massage Practitioner
- Marietjie · Esthetician — Aesthetic Practitioner
- Massage Treatments pinned first; Pedicures & Foot Care second; remaining categories alphabetized where that client-directory contract applies.
- SQT BioMicroneedling presented as one virtual family with two treatments while underlying CRM identities remain unchanged.

Do not consolidate/rename underlying CRM records merely to reproduce presentation.

## Pa Derik #567 — evidence captured; do not mutate for proof

Real handset reschedule evidence proved clinic-aware date selection, closed-day rejection, authoritative slot selection, comparison, explicit confirmation and success. The last authoritative state recorded for #567 is **Tuesday 18 August 2026, 08:30–10:15**, Full Body Swedish with Christel. Re-query if current state is needed; do not mutate it merely for evidence.

## CRM provenance / imported-client identity

CRM48 (Pa Derik) and CRM473 remain legitimate controlled Goldie-imported canonical clients. CRM IDs are not proof of bot registration. CRM1 remains an orphan-like read-only review candidate; do not delete without identity/supersession proof. Unique unverified imported mobiles use the existing-profile claim/verification path; ambiguity remains fail-closed.

## Standing gates

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

- GitHub + Render runtime: **`6863958dbf97a6a6f593fc196c284571adf802c6`** (#301) is production-live.
- `/book` remains the live Shiloh-owned CRM-backed public service catalogue and WhatsApp booking entry surface.
- The accepted presentation workstream through #301 is complete; do not redo superseded #284–#300 visual/layout variants.
- Exact Inside Shiloh artwork is used at the three approved signature positions.
- Final desktop specialty layout includes the three plasma categories together, the SQT pair together, and the approved HIFU/rejuvenation/pelvic row; mobile remains responsive/stacked.
- Catalogue presentation changes did not alter canonical service, price, practitioner, availability, Calendar, appointment or WhatsApp booking semantics.
- Historical attendance remains human-controlled; live remaining count must be re-queried before quoting.
- #558 remains fail-closed.
- Completed client welcome/lifecycle/directory/SQT and Admin booking/reschedule work remains completed.

**Authoritative current state:** source and production are converged through PR #301 and the accepted public-catalogue polish workstream is live.

**Highest-priority continuation item:** business review of the current live #301 `/book` experience. Any next refinement must begin from this accepted state rather than recreating superseded experiments.

**Remaining gate:** no engineering gate blocks the current catalogue. Future material commercial/service-rule changes require explicit business approval; attendance/#558/genuine-journey truth remains fail-closed.