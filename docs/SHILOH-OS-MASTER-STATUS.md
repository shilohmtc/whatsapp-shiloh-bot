# Shiloh OS — Master Project Status

Updated: 2026-08-17 13:28 SAST
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + `docs/SHILOH-OS-RECONCILIATION-2026-08-16-LATE.md` on `main` first, verify applicable production/provider state, then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate. Obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Permanent governance remains: provider lead-time early in feature planning; known finite client/admin choices are button/list-first when practical; natural language remains fallback into the same canonical handlers; no speculative provider submissions; no manufactured appointments/evidence.

## Current production baseline

Latest runtime-semantic application commit verified live on Render: **`0fba72068423e03a0c68fbb806ca1bb59d00ee48`** (`Fix SQT client-list SQL ordering`). PR #261 CI passed before merge. Render auto-deployed that exact commit, Shiloh started normally, and repeated `/health` checks returned HTTP 200.

Documentation-only reconciliation commits after `0fba720...` may advance GitHub `main`/Render without changing runtime semantics. Treat `0fba720...` as the application baseline until a later runtime change is deliberately merged.

Fresh Render startup provider evidence at this baseline confirmed:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **PENDING / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.

The proactive historical Finalize shortcut therefore remains fail-closed on the action-template provider gate. Ordinary **Admin → Appointments → Finalize past visits** remains available.

## Admin polish — 🟢 IMPLEMENTED / production-live

The normal WhatsApp Admin surface has been simplified and made button/list-first where practical.

### Appointments
Visible priority is:
1. **Finalize past visits**
2. **Make a booking**
3. **Manage a booking**
4. Today's clients
5. Tomorrow's clients

`Find an available time` is not an everyday standalone option; Make a booking checks authoritative availability as part of the booking flow. Walk-in is removed from normal navigation.

Historical finalization now exposes the polished outcome set for authorized finalizers:
1. **Completed** — Client attended as booked
2. **No-show** — Client did not attend
3. **Cancelled** — Appointment was cancelled
4. **No charge** — Client attended; R0 charge and R0 earnings
5. **Service change** — A different treatment was performed
6. **Adjust price** — Change the final amount charged
7. **Reschedule** — Move the appointment to another date/time
8. **Leave unresolved** — Save no final outcome yet

Service change records the actual treatment performed, preserves the original service in audit/history, supports optional final-price adjustment including R0, and finalizes through the canonical completed path.

### Reports
Top-level Reports is simplified around **Today's report** and **Earnings**. Earnings uses role-aware drill-down when multiple authorized reports exist and goes directly to the sole report when only one is authorized. Earnings remain completed-only; unresolved historical attendance therefore keeps affected reporting provisional rather than silently counting visits.

### Clients / More
Visible dummy-test clutter was removed. Juvan remains the single retained controlled CRM regression reset for Christel/Jean-Pierre while acceptance testing still requires it. `Client details` is a read-only full authorized CRM view and was moved to **More**. `Calendar integrity` and generic `Help` are removed from normal More navigation; integrity capability remains available diagnostically rather than as everyday staff UX.

Pieter and Savanna were removed from normal operational staff/service surfaces. Historical records/capability are not rewritten merely to make menus cleaner.

### Services and pricing
Christel controls the shared Christel/Abigail pricing because Abigail works for Christel and their service pricing is intentionally the same. Marietjie controls pricing for her own services. Service selection is list/button-first where practical rather than requiring staff to type a service name.

### Schedule governance
Generic schedule administration was replaced with business-role semantics:
- **Abigail:** Request leave / time off. A request remains Pending and must not affect booking availability until Christel approves it.
- **Christel:** Leave requests + own availability/time off + controlled clinic closures where applicable.
- **Marietjie:** own availability/time off; no Christel approval dependency because Marietjie is an independent room renter.
- Fixed Staff hours are configuration, not everyday WhatsApp Admin controls.
- Freelancer availability is removed from normal Schedule navigation.
- Existing appointment conflicts must be surfaced before Abigail leave approval; approval must never silently cancel/reschedule clients.
- Approved/confirmed unavailability feeds the same authoritative availability layer used by booking/reschedule; no parallel leave calendar.

Migration `056_staff_leave_approval_workflow.sql` and role-aware Schedule services/tests are present on `main`.

## Attendance finalization authority — 🟢 IMPLEMENTED

Canonical certification authority is:
- **Christel:** finalizes Christel + Abigail appointments only.
- **Marietjie:** finalizes Marietjie appointments only.
- **Abigail:** does not finalize appointments.
- Other admins do not gain attendance-certification authority merely from broad Admin visibility.

This is enforced server-side at finalization time, not only hidden in menus. Attendance reminders are likewise restricted to Christel and Marietjie and use certification-compatible practitioner ownership.

## Historical manual bookings — 🟢 IMPLEMENTED / production-live

Historical manual bookings create the canonical CRM appointment and synchronize Google Calendar while suppressing ordinary client booking notification. Practitioner-calendar mirroring follows the configured calendar path. Historical appointments remain unresolved/scheduled for later authorized certification. Existing clinic/practitioner/service/conflict validation remains in force.

Runtime lineage includes `0e75f73d058b09a502994c22193981afda3bf660` (`Sync historical admin bookings to Google Calendar`). Do not redo this work.

## Historical attendance 2026-08-01 through 2026-08-15 — 🔵 HUMAN FINAL REVIEW ACTIVE

A read-only production audit first established **53 appointments** in this date window: 31 already finalized, 4 cancelled, 17 unresolved and correctly routable, plus one unresolved exception (#558) mapped historically to `SHILOH MTC`.

With explicit approval, the **31 previously finalized Completed/No-show visits were deliberately reopened** so Christel and Marietjie can perform the final human attendance certification through the polished Admin workflow. Prior outcomes were not erased: audit/history provenance was preserved and a new history event records the deliberate reopening. The 4 cancelled visits were left untouched. The 17 already-unresolved visits were left unresolved.

Immediately after reopening, the controlled historical review contained **48 properly routable unresolved visits**: the 31 reopened + 17 already awaiting finalization. That number is historical evidence, **not a guaranteed current live count**. Re-query/recount before quoting current remaining totals because Christel or Marietjie may have finalized visits since then.

The 31 reopened appointment IDs are:
`327, 328, 329, 330, 331, 334, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 349, 350, 351, 352, 357, 485, 486, 553, 554, 556, 557, 559, 562`.

Earlier unresolved production audit routing was Christel 8 (`353, 548, 355, 356, 487, 359, 551, 564`) and Marietjie 9 (`326, 332, 333, 335, 555, 348, 354, 550, 358`).

### #558 — 🔴 FAIL-CLOSED historical exception

Appointment **#558 on 2026-08-06** remains unresolved with historical practitioner mapping `SHILOH MTC`. It must not be silently assigned to Christel or Marietjie. Establish who actually performed the visit from authoritative appointment/service/history or human evidence before any practitioner correction/finalization.

## Historical finalization shortcut — 🟠 PROVIDER GATE

A proactive, role-aware WhatsApp shortcut has been implemented for Christel and Marietjie:
- recipient-specific pending count;
- one **Finalize past visits** button;
- button opens that recipient's authorized finalization queue directly;
- idempotent send ledger;
- failed WhatsApp delivery is released for retry rather than falsely marked sent;
- ordinary **Admin → Appointments → Finalize past visits** remains canonical and available regardless of proactive delivery.

The Meta Utility template **`shiloh_staff_finalization_actions_v1`** remains **PENDING / UTILITY** at the latest authoritative 17 August production startup check. Do not send or claim proactive shortcut availability until a fresh provider check proves **APPROVED**. This gate is independent of the already-approved `shiloh_staff_finalization_v1` template.

## Universal WhatsApp client welcome — 🟢 PRODUCTION-LIVE / handset-proven

The universal welcome is the canonical greeting-only first-contact model for registered and genuinely new clients, with existing identity/claim safeguards preserved.

17 August acceptance exposed and repaired three concrete defects:
- Meta interactive-body length was brought within provider limits (`d633e692817442c77ec117b3ae108c42fc4cdd6d`).
- Both current and already-delivered legacy **Book appointment** payloads now route directly into service discovery (`8be1627b6f9ff920e83b6ad6a368f1d1e9a81805`, `4ad77d606574c9e4361732e63a51fd5fedecaa58`).
- Eligible-practitioner DISTINCT ordering was repaired (`1d55b32e1bdd55e51414e6ceb120b459f8b0da5f`).

Handset evidence subsequently proved the registered-client journey through categories, service selection, eligible practitioner selection, date, authoritative availability, preference confirmation, policy acceptance, approval hold, confirmation, reminder and cancellation. Do not redo those repairs merely for proof.

## Client lifecycle button parity — 🟢 PRODUCTION-LIVE / verified

Commit `834cf43cef158053c81511f982cdd96a27d5d2de` restored the Pa Derik-tested appointment-action parity rather than creating a new lifecycle model.

- Booking confirmation delivery exposes the existing appointment-action controls instead of degrading to raw action text.
- Cancellation exposes a button-first rebooking action rather than relying only on typed `BOOK`.
- Natural-language fallbacks remain valid and route into the same canonical handlers.

The controlled Dummy Test journey on 17 August proved booking #574 through approval and final confirmation, reminder action buttons and normal cancellation. The test appointment is cancelled; do not recreate it merely for proof.

## Client practitioner directory — 🟢 PRODUCTION-LIVE / handset-verified

Commit `aba25983fa7b4a6a05207db86e434de1f9c2dd82` removed internal `Client-bookable Shiloh practitioner` wording while preserving canonical practitioner metadata and eligibility.

Current handset-proven presentation:
- **Christel · Massage** — Massage Practitioner
- **Abigail · Massage** — Massage Practitioner
- **Marietjie · Esthetician** — Aesthetic Practitioner
- **Book now** — Start with a service or preference

Marietjie's canonical approved public title remains `Esthetician`; `Aesthetic Practitioner` is the descriptive client-facing role line.

## Client category directory — 🟢 PRODUCTION-LIVE / handset-verified

Commit `177be81eae3f3414d1668b2bd901b8f63ee7b65c` established deterministic client presentation:
1. **Massage Treatments** pinned first while canonical category remains `Massage`.
2. **Pedicures & Foot Care** pinned second.
3. Remaining client categories alphabetized.
4. Subtitles use `treatment` / `treatments` rather than internal `active service(s)` wording.
5. Existing two-page WhatsApp pagination remains intact.

This is presentation-only; canonical category IDs/names and booking routing remain authoritative underneath.

## SQT BioMicroneedling taxonomy reconciliation — 🟢 COMPLETE / handset-verified

The CRM contained two numbered one-treatment categories (`1. SQT BioMicroneedling` and `2. SQT BioMicroneedling`). Handset inspection proved they contained two distinct canonical services rather than duplicate records.

The safe client presentation now groups them into one virtual family:
- **SQT BioMicroneedling** — 2 treatments

Commit `d1267da2fcc13748769403df37a8c3cf204802bf` groups the categories without changing underlying service/category identity. Commit `0e7cd9ad1e3cbe4b52d7f45eccbe7829de12d7cc` removes the `1.` / `2.` prefixes from treatment display labels and alphabetizes them client-side only.

That label-polish query exposed PostgreSQL error `42P10` because `SELECT DISTINCT` was ordered by a non-selected expression. PR #261 / runtime baseline **`0fba72068423e03a0c68fbb806ca1bb59d00ee48`** repaired the query by ordering on the already-selected cleaned `name` alias and aligned regression coverage with the DISTINCT-safe SQL.

Final handset evidence at 13:28 SAST proved successful rendering with canonical commercial data preserved:
- **SQT Anti-Aging Rejuvenation…** — 90 min · R1785–R2585
- **SQT Resurfacing BioMicroneedling…** — 90 min · R1785–R1840

This reconciliation is complete. Do not consolidate or rename the underlying CRM records merely to reproduce the client presentation.

## Pa Derik #567 — evidence captured; normal cancellation remains deferred

Real handset evidence for Pa Derik's reschedule was captured. The corrected core journey is proven: clinic-aware date selection → valid open date → daypart → authoritative slot → current/proposed comparison → explicit Confirm reschedule / Keep appointment → success.

The Sunday/relative-date defect is fixed: a closed Sunday must not be offered as a usable reschedule date; closed dates are rejected before availability search; stale candidate state clears when choosing another date. Supplemental `ensureToken` post-send defect was separately fixed after the core mutation had succeeded.

#567 remains authoritative at **Tuesday 18 August 2026, 08:30–10:15**, Full Body Swedish with Christel. Do not mutate it merely for proof. Normal Shiloh cancellation remains appropriate only when Pa Derik is available for that genuine action.

## CRM provenance / imported-client identity

CRM IDs are canonical Shiloh IDs, not proof of bot registration. CRM48 (Pa Derik) and CRM473 are legitimate controlled Goldie-imported canonical clients and must not be removed merely because they did not originate through first-time bot registration. CRM1 remains the stronger orphan-like read-only review candidate; do not delete without identity/supersession proof.

Imported Goldie clients with a unique matching mobile but no verified WhatsApp contact enter an existing-profile claim/verification path rather than being treated as already verified. Safe title prefixes are tolerated; ambiguous/conflicting identity remains fail-closed. Natural first-contact acceptance remains evidence-gated; do not reset a real imported client merely to manufacture proof.

## Meta / WhatsApp template state

Fresh production startup evidence at the runtime baseline confirmed:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **PENDING / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.

Earlier direct Meta evidence established the broader lifecycle package as configured/current-generation production wiring, with genuine per-route delivery evidence still separate. Provider-configured or provider-active does not equal handset delivery proof.

All provider/human-evidence gates remain fail-closed.

## Juvan controlled acceptance — ⚪ READY, no longer immediate priority

Juvan remains the retained controlled CRM/client regression identity and can be used for beginning-to-end client-perspective acceptance across WhatsApp/provider behaviour, Render, CRM, approval/hold, Calendar, post-confirmation UX, corrected reschedule/closed-day behaviour and cancellation.

Routine screenshots are not required; request them only for UI/human truth or when the user sees something unexpected. Resume only after the immediate attendance/provider checkpoint unless the user explicitly reprioritizes.

## Other standing gates

- Genuine per-route lifecycle delivery evidence remains natural-journey gated where not already observed.
- Follow-up/rating delivery remains genuine completed-visit timing gated where not already observed.
- Birthday v2 requires genuine eligible CRM birthday/opt-in conditions; never artificially trigger.
- Google Business Profile API remains deferred at last-authoritative 0 QPM until Google evidence changes.
- Google Contacts sync remains lower priority; CRM is authoritative.
- Ozow remains waiting for merchant configuration and explicit business rules; do not submit speculative payment templates.
- Destructive privacy execution remains fail-closed pending authority/evidence.

## Exact new-chat continuation state

- Runtime-semantic application baseline **`0fba720...`** is verified production-live and healthy; documentation-only commits after it do not change runtime semantics.
- Admin polish, historical manual calendar sync, historical finalization parity/service-change, universal welcome, registered Book appointment routing, eligible-practitioner ordering, lifecycle action-button parity, practitioner-directory polish, category ordering/count polish, and SQT taxonomy/label repair are **completed**. Do not redo them.
- Finalization authority remains Christel → Christel+Abigail; Marietjie → Marietjie; Abigail → none.
- The 1–15 August historical cohort remains a human-certified workstream. The 48-routable count was the immediate post-reopen count and is now dynamic; re-query before quoting current remaining totals.
- Four cancelled visits from the original audit remain untouched.
- #558 remains fail-closed pending real practitioner evidence.
- `shiloh_staff_finalization_actions_v1` remains PENDING at the latest authoritative provider check; proactive shortcut must not send until APPROVED.
- Ordinary Admin → Appointments → Finalize past visits is already usable by Christel/Marietjie.
- Pa Derik reschedule evidence is captured; #567 awaits only genuine normal cancellation when appropriate.
- Juvan controlled E2E remains available after the immediate attendance/provider checkpoint.

**Authoritative current state:** runtime-semantic baseline `0fba720...` is production-live and healthy; client entry/discovery/action repairs completed on 17 August are handset-verified; historical attendance truth remains human-controlled; #558 remains fail-closed; the proactive finalization-actions template remains provider-PENDING at the latest authoritative check.

**Highest-priority genuinely actionable item for the new chat:** first re-check production health, current Meta status for **`shiloh_staff_finalization_actions_v1`**, and current historical-finalization progress. If Meta proves APPROVED, verify the role-aware shortcut path and track real Christel/Marietjie finalization progress. If it remains PENDING, keep it fail-closed; ordinary Admin finalization remains available and another safe Tracker item may proceed.
