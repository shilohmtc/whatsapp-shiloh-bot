# Shiloh OS — Master Project Status

Updated: 2026-08-17 18:58 SAST
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-17-PHASE1.md`, on `main`; verify applicable production/provider state; then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate. Obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Permanent governance remains: provider lead-time early in feature planning; known finite client/admin choices are button/list-first when practical; natural language remains fallback into the same canonical handlers; no speculative provider submissions; no manufactured appointments/evidence; no duplicate public service source of truth.

## Current production / deployment baseline

GitHub and Render are converged through **`5d8b2c2350a554656cc416ecbe289f9374e3305a`** (PR #280, `Build Phase 1 Shiloh public service catalogue`). PR #280 passed the full non-mutating CI suite before merge. Render auto-deployed the exact merge commit as **`dep-da1jqoe1egvs73aagcug`** and reported it LIVE. The new runtime started successfully and `/health` returned HTTP 200.

The earlier #277 confirmed-reschedule commit-path repair and #278 start-time-first Admin manual booking presentation are contained in the current live lineage. Their previous deployment-convergence gate is closed. Do not reopen #272–#279 without new evidence.

Fresh production startup evidence on 17 August reported:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **APPROVED / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.

This supersedes the older PENDING state for `shiloh_staff_finalization_actions_v1`. Provider approval does not itself prove a handset send or justify manufactured operational messaging; existing authorization, idempotency and genuine-use rules remain in force.

## Public Shiloh service catalogue — 🟢 VERIFIED LIVE

`/book` is now the Shiloh-owned public service catalogue and booking entry surface. It replaces Goldie as the intended public catalogue direction without copying Goldie into a second database.

The page is a read-only projection of canonical Shiloh CRM catalogue data. A service is publicly exposed only when:
- the service is active;
- at least one mapped staff member is active;
- that staff member is a practitioner; and
- that practitioner is client-bookable.

The page renders canonical category, service name, duration, price, customer description and booking note. Each **Book this treatment** action hands the exact canonical service name to the official Shiloh WhatsApp journey. The webpage never claims a slot is available; practitioner/date/time availability remains authoritative only inside the existing booking engine.

Phase 1 ships with an approved real Shiloh reception photograph as the primary hero image. Promotional posters are excluded from the permanent catalogue. Additional approved clinic/category/treatment photography can be added progressively without changing the catalogue data model.

The established public landing-page compatibility contract remains visible: **`Your appointment starts with Shiloh.`** and **`Continue with Shiloh on WhatsApp`**. The final Phase 1 branch head `105cce9...` passed CI run #918 before merge.

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

The proactive role-aware Finalize shortcut is implemented with recipient-specific count, direct authorized queue action, idempotent send ledger and retry-safe failed delivery. Fresh production startup evidence now shows `shiloh_staff_finalization_actions_v1` **APPROVED / UTILITY**.

Do not translate provider approval into fabricated handset evidence. Use the shortcut only under its existing authorized-recipient and genuine operational conditions. Ordinary **Admin → Appointments → Finalize past visits** remains canonical.

## Universal client entry / lifecycle / discovery — 🟢 VERIFIED; do not redo

The universal welcome, registered/legacy Book appointment routing, eligible-practitioner ordering, booking/cancellation action-button parity, practitioner directory, category ordering/count polish and SQT BioMicroneedling virtual-family presentation remain completed.

Canonical presentation remains:
- Christel · Massage — Massage Practitioner
- Abigail · Massage — Massage Practitioner
- Marietjie · Esthetician — Aesthetic Practitioner
- Massage Treatments pinned first; Pedicures & Foot Care second; remaining categories alphabetized.
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

- GitHub + Render runtime: **`5d8b2c2350a554656cc416ecbe289f9374e3305a`** (#280) is production-live.
- `/book` is the live Shiloh-owned CRM-backed public service catalogue and WhatsApp booking entry surface.
- Only active services with an active client-bookable practitioner can appear publicly.
- Phase 1 uses the approved Shiloh reception photograph; additional category/treatment imagery is a presentation evolution, not a catalogue-data rewrite.
- #277/#278 deployment convergence is resolved and must not be treated as outstanding.
- `shiloh_staff_finalization_actions_v1` is now freshly evidenced **APPROVED / UTILITY**.
- Historical attendance remains human-controlled; live remaining count must be re-queried before quoting.
- #558 remains fail-closed.
- Completed client welcome/lifecycle/directory/SQT work remains completed.

**Authoritative current state:** source and production are converged through Phase 1 public catalogue launch. Provider action-template approval is refreshed. Human-truth gates remain separate.

**Highest-priority continuation item:** business review of the live `/book` experience, followed by approved presentation refinements and progressive clinic/category/treatment photography. Preserve canonical Shiloh CRM as the sole service source of truth.

**Remaining gate:** no engineering gate blocks Phase 1. Future material commercial/service-rule changes require explicit business approval; attendance/#558/genuine-journey truth remains fail-closed.