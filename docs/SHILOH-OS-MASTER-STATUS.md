# Shiloh OS — Master Project Status

Updated: 2026-08-17 16:19 SAST
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + `docs/SHILOH-OS-RECONCILIATION-2026-08-16-LATE.md` on `main` first, verify applicable production/provider state, then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate. Obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Permanent governance remains: provider lead-time early in feature planning; known finite client/admin choices are button/list-first when practical; natural language remains fallback into the same canonical handlers; no speculative provider submissions; no manufactured appointments/evidence.

## Current production / deployment baseline

GitHub `main` is currently **`9ec976c202852a0f01e4b9b735f00abcdc85bbfd`** (PR #278, `Show start times clearly for manual admin bookings`). PR #278 CI passed before merge.

Fresh Render reconciliation at 16:19 SAST found production **live at `4e64ba9b7a9c8ac0c44b74698edf2e1a43a95d30`** (PR #276, `Add confirmation before admin booking changes`). Render service `shiloh-whatsapp-bot` is active, on `main`, with auto-deploy enabled. Therefore GitHub and production are temporarily **not converged**: PR #277 (`2bc06e2977289ff5e304921cc3255fc006014e2d`, confirmed reschedule commit-path repair) and PR #278 (`9ec976c...`, manual start-time picker presentation) are merged on `main` but were not yet shown live by Render at the reconciliation check.

Do not claim #277 or #278 production-live until Render proves a deployment containing them. The last production-live runtime commit is #276 / `4e64ba9...`; the latest desired runtime state is `9ec976c...`.

Provider state was not freshly re-proven during this reconciliation. Latest authoritative provider evidence remains:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **PENDING / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.

The proactive historical Finalize shortcut therefore remains fail-closed on the action-template provider gate. Ordinary **Admin → Appointments → Finalize past visits** remains available.

## Admin polish — 🟢 IMPLEMENTED; latest booking refinements awaiting Render convergence

The normal WhatsApp Admin surface remains button/list-first where practical. Appointments priority remains **Finalize past visits → Make a booking → Manage a booking → Today's clients → Tomorrow's clients**. `Find an available time` is integrated into Make a booking; Walk-in remains removed from normal navigation.

Historical finalization exposes **Completed, No-show, Cancelled, No charge, Service change, Adjust price, Reschedule, Leave unresolved**. Service change records the actual treatment performed, preserves original-service history, supports optional final-price adjustment including R0, and finalizes through the canonical completed path.

Reports remain **Today's report + Earnings** with role-aware access and completed-only accounting. `Client details` remains in More; Calendar integrity remains diagnostic rather than everyday UX. Christel controls shared Christel/Abigail pricing; Marietjie controls her own. Schedule governance remains Abigail request/Christel approval, Christel own/clinic controls, and Marietjie independent own availability.

### Admin booking / manage-booking refinement lineage — 🟢 MERGED / 🟠 production convergence

The 17 August continuation after the earlier client/catalogue work materially improved Admin booking and rescheduling:
- #272 `a659aa9068d955e39d9da5fa1d3e219dbace9aee` — next-available reschedule UX.
- #273 `4e426bcfe609ef1388bdcda1027e0ebe13910931` — direct same-day time changes.
- #274 `ef5658fc98663e5a4a4aedfbd26f7b2da7fee0e7` — direct date + time rescheduling.
- #275 `57e75005a9060219c993f2387710d0e907cec108` — durable typed reschedule context across restarts.
- #276 `4e64ba9b7a9c8ac0c44b74698edf2e1a43a95d30` — explicit confirmation before Admin booking changes; this is the latest commit freshly verified live on Render.
- #277 `2bc06e2977289ff5e304921cc3255fc006014e2d` — confirmed reschedule commit-path repair; merged on `main`, not yet proven live at 16:19.
- #278 `9ec976c202852a0f01e4b9b735f00abcdc85bbfd` — Admin/manual booking start-time-first presentation; merged on `main`, CI passed, not yet proven live at 16:19.

PR #278 does **not** weaken availability. The existing authoritative `listAvailableSlots(... intervalMinutes: 15)` candidate generation remains intact. It changes the WhatsApp row from a treatment-window-first title such as `08:30–10:15` to primary start time **`08:30`** with description **`Ends 10:15 · available start`**, plus guidance that the full treatment must fit the practitioner diary and clinic schedule. It adds no appointment mutation, override, or double-booking path. Thus a quarter-hour start is shown only when the full service window is authoritatively available.

Do not redo #272–#278. The immediate technical gate is deployment convergence and then normal production/handset evidence for the corrected confirmed-change path and start-time presentation.

## Attendance finalization authority — 🟢 IMPLEMENTED

Canonical certification authority remains:
- **Christel:** finalizes Christel + Abigail appointments only.
- **Marietjie:** finalizes Marietjie appointments only.
- **Abigail:** does not finalize appointments.
- Other admins do not gain attendance-certification authority merely from broad Admin visibility.

This is enforced server-side at finalization time. Attendance reminders remain restricted to Christel and Marietjie and certification-compatible practitioner ownership.

## Historical manual bookings — 🟢 IMPLEMENTED

Historical manual bookings create the canonical CRM appointment and synchronize configured Google Calendar paths while suppressing ordinary client booking notification. Historical appointments remain unresolved/scheduled for later authorized certification. Existing clinic/practitioner/service/conflict validation remains in force. Runtime lineage includes `0e75f73d058b09a502994c22193981afda3bf660`. Do not redo this work.

## Historical attendance 2026-08-01 through 2026-08-15 — 🔵 HUMAN FINAL REVIEW ACTIVE

The read-only production audit established **53 appointments**: 31 finalized, 4 cancelled, 17 unresolved/routable, plus one unresolved exception #558 mapped historically to `SHILOH MTC`. With approval, the 31 prior Completed/No-show visits were reopened for final human certification with audit/history preserved; the 4 cancelled visits remained untouched and the 17 already-unresolved visits remained unresolved.

Immediately after reopening there were **48 properly routable unresolved visits**. That is historical checkpoint evidence, not a guaranteed current count. Re-query before quoting current remaining totals.

Reopened IDs: `327, 328, 329, 330, 331, 334, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 349, 350, 351, 352, 357, 485, 486, 553, 554, 556, 557, 559, 562`.

Earlier unresolved routing evidence: Christel `353, 548, 355, 356, 487, 359, 551, 564`; Marietjie `326, 332, 333, 335, 555, 348, 354, 550, 358`.

### #558 — 🔴 FAIL-CLOSED historical exception

Appointment **#558 on 2026-08-06** remains unresolved with historical practitioner `SHILOH MTC`. Never silently assign it to Christel or Marietjie. Establish the real practitioner from authoritative appointment/service/history or human evidence before correction/finalization.

## Historical finalization shortcut — 🟠 PROVIDER GATE

The proactive role-aware Finalize shortcut is implemented with recipient-specific count, direct authorized queue action, idempotent send ledger, and retry-safe failed delivery. Ordinary Admin finalization remains canonical regardless of proactive delivery.

Latest authoritative provider evidence still has **`shiloh_staff_finalization_actions_v1` PENDING / UTILITY**. Do not send or claim proactive shortcut availability until a fresh provider check proves APPROVED.

## Universal client entry / lifecycle / discovery — 🟢 VERIFIED; do not redo

The 17 August universal welcome, registered/legacy Book appointment routing, eligible-practitioner DISTINCT ordering, booking/cancellation action-button parity, practitioner directory, category ordering/count polish, and SQT BioMicroneedling virtual-family presentation were handset-proven and remain completed.

Canonical presentation remains:
- Christel · Massage — Massage Practitioner
- Abigail · Massage — Massage Practitioner
- Marietjie · Esthetician — Aesthetic Practitioner
- Massage Treatments pinned first; Pedicures & Foot Care second; remaining categories alphabetized.
- SQT BioMicroneedling presented as one virtual family with two treatments while underlying CRM identities remain unchanged.

Do not consolidate/rename underlying CRM records merely to reproduce presentation.

## Pa Derik #567 — evidence captured; normal cancellation deferred

Real handset reschedule evidence is captured. The corrected client journey proved clinic-aware date selection, closed-day rejection, authoritative slot selection, comparison, explicit confirmation and success. #567 remains authoritative at **Tuesday 18 August 2026, 08:30–10:15**, Full Body Swedish with Christel. Do not mutate it merely for proof. Normal cancellation remains appropriate only as a genuine action.

## CRM provenance / imported-client identity

CRM48 (Pa Derik) and CRM473 remain legitimate controlled Goldie-imported canonical clients. CRM IDs are not proof of bot registration. CRM1 remains the stronger orphan-like read-only review candidate; do not delete without identity/supersession proof. Unique unverified imported mobiles use the existing-profile claim/verification path; ambiguity remains fail-closed.

## Other standing gates

- Genuine per-route lifecycle delivery evidence remains natural-journey gated where not already observed.
- Follow-up/rating delivery remains genuine completed-visit timing gated.
- Birthday v2 requires genuine eligible CRM birthday/opt-in conditions.
- Google Business Profile API remains deferred at last-authoritative 0 QPM.
- Google Contacts sync remains lower priority; CRM is authoritative.
- Ozow remains waiting for merchant configuration and explicit business rules.
- Destructive privacy execution remains fail-closed pending authority/evidence.

## Exact new-chat continuation state

- GitHub `main`: **`9ec976c...`** (#278).
- Fresh Render live commit at 16:19 SAST: **`4e64ba9...`** (#276). Auto-deploy is enabled, but #277/#278 are not yet proven live. Do not conflate merged with deployed.
- #277 fixes the confirmed reschedule commit path; #278 presents authoritative quarter-hour start times clearly without introducing override/double-booking behaviour.
- Historical attendance remains human-controlled; live remaining count must be re-queried before quoting.
- #558 remains fail-closed.
- `shiloh_staff_finalization_actions_v1` remains PENDING at the latest authoritative provider check; no proactive send until fresh APPROVED evidence.
- Pa Derik #567 remains Tue 18 Aug 08:30–10:15 and must not be mutated merely for proof.
- Completed client welcome/lifecycle/directory/SQT work remains completed and must not be reopened without new evidence.

**Authoritative current state:** source is ahead of production by #277/#278; Render is healthy/live at #276 but deployment convergence is incomplete. Existing human/provider gates remain unchanged.

**Highest-priority continuation item:** verify Render converges to a commit containing #277 and #278; then verify the Admin confirmed-reschedule commit path and start-time-first picker through normal controlled use. In parallel only where relevant, re-check the Meta finalization-actions template and historical-finalization progress before making any new provider/count claim.

**Remaining gate:** deployment evidence first; handset/human evidence for UI behaviour second. Provider and attendance truth remain fail-closed and must not be inferred.