# Shiloh OS — Master Project Status

Updated: 2026-08-16 19:26 SAST
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` on `main` first, verify applicable production/provider state, then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate. Obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Permanent governance remains: provider lead-time early in feature planning; known finite client/admin choices are button/list-first when practical; natural language remains fallback into the same canonical handlers; no speculative provider submissions; no manufactured appointments/evidence.

## Current production baseline

Application baseline before this documentation reconciliation: **`03c11fade6e2b37e627bfc33c2d47368363ef308`** (`Provision and schedule historical finalization shortcut`) on GitHub `main` and verified **live** in Render on 2026-08-16. CI for that application commit completed successfully. This Master/Tracker reconciliation itself is documentation-only and will advance `main` without changing runtime semantics.

Render startup evidence for `03c11fade...` confirmed the ordinary staff-finalization template `shiloh_staff_finalization_v1` as **APPROVED / UTILITY**. It also submitted the new shortcut template `shiloh_staff_finalization_actions_v1`, which was **PENDING / UTILITY** at the last authoritative check. The historical shortcut scheduler is live but fail-closed until provider approval is proven.

## Admin polish — 🟢 IMPLEMENTED / production-live

The normal WhatsApp Admin surface has been simplified and made button/list-first where practical.

### Appointments
Visible priority is:
1. **Finalize past visits**
2. **Make a booking**
3. **Manage a booking**
4. Today's clients
5. Tomorrow's clients

`Find an available time` is not an everyday standalone option; Make a booking checks authoritative availability as part of the booking flow. Walk-in is removed from normal navigation. Finalize past visits supports Completed, No-show, Reschedule, or leaving unresolved rather than forcing a false attendance outcome.

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

Canonical certification authority is now:
- **Christel:** finalizes Christel + Abigail appointments only.
- **Marietjie:** finalizes Marietjie appointments only.
- **Abigail:** does not finalize appointments.
- Other admins do not gain attendance-certification authority merely from broad Admin visibility.

This is enforced server-side at finalization time, not only hidden in menus. Attendance reminders are likewise restricted to Christel and Marietjie and use certification-compatible practitioner ownership.

## Historical attendance 2026-08-01 through 2026-08-15 — 🔵 HUMAN FINAL REVIEW ACTIVE

A read-only production audit first established **53 appointments** in this date window: 31 already finalized, 4 cancelled, 17 unresolved and correctly routable, plus one unresolved exception (#558) mapped historically to `SHILOH MTC`.

With explicit approval, the **31 previously finalized Completed/No-show visits were deliberately reopened** so Christel and Marietjie can perform the final human attendance certification through the polished Admin workflow. The prior outcomes were not erased: audit/history provenance was preserved and a new history event records the deliberate reopening. The 4 cancelled visits were left untouched. The 17 already-unresolved visits were left unresolved.

Therefore the controlled historical review now contains **48 properly routable unresolved visits**: the 31 reopened + 17 already awaiting finalization. Christel receives only the Christel/Abigail subset; Marietjie receives only her own subset. Reporting/earnings for these visits remains provisional until the authorized practitioner finalizers certify them.

The 31 reopened appointment IDs are:
`327, 328, 329, 330, 331, 334, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 349, 350, 351, 352, 357, 485, 486, 553, 554, 556, 557, 559, 562`.

Earlier unresolved production audit routing was Christel 8 (`353, 548, 355, 356, 487, 359, 551, 564`) and Marietjie 9 (`326, 332, 333, 335, 555, 348, 354, 550, 358`). Those visits remain part of the current 48-visit human review unless subsequently finalized by the authorized practitioner after this reconciliation.

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

The new Meta Utility template is **`shiloh_staff_finalization_actions_v1`**. Last authoritative provider evidence at 2026-08-16 ~17:22 UTC: submission succeeded and status was **PENDING**. Do not send or claim availability until a fresh provider check proves **APPROVED**. This gate is independent of the already-approved `shiloh_staff_finalization_v1` template.

## Pa Derik #567 — evidence captured; normal cancellation remains deferred

Real handset evidence for Pa Derik's reschedule was captured. The corrected core journey is proven: clinic-aware date selection → valid open date → daypart → authoritative slot → current/proposed comparison → explicit Confirm reschedule / Keep appointment → success.

The Sunday/relative-date defect is fixed: a closed Sunday must not be offered as a usable reschedule date; closed dates are rejected before availability search; stale candidate state clears when choosing another date. Supplemental `ensureToken` post-send defect was separately fixed after the core mutation had succeeded.

#567 remains authoritative at **Tuesday 18 August 2026, 08:30–10:15**, Full Body Swedish with Christel. Do not mutate it merely for proof. Normal Shiloh cancellation remains appropriate only when Pa Derik is available for that genuine action.

## CRM provenance / imported-client identity

CRM IDs are canonical Shiloh IDs, not proof of bot registration. CRM48 (Pa Derik) and CRM473 are legitimate controlled Goldie-imported canonical clients and must not be removed merely because they did not originate through first-time bot registration. CRM1 remains the stronger orphan-like read-only review candidate; do not delete without identity/supersession proof.

Imported Goldie clients with a unique matching mobile but no verified WhatsApp contact now enter an existing-profile claim/verification path rather than being treated as already verified. Safe title prefixes are tolerated; ambiguous/conflicting identity remains fail-closed. Natural first-contact acceptance remains evidence-gated; do not reset a real imported client merely to manufacture proof.

## Meta / WhatsApp template state

Earlier direct Meta evidence established the existing lifecycle templates as active/current-generation production wiring, with genuine per-route delivery evidence still separate. Canonical lifecycle names include booking confirmation, booking approval request/outcome/decline, reschedule confirmation, cancellation confirmation, reminder actions, follow-up v2, birthday v2, and `shiloh_staff_finalization_v1`.

**New exception:** `shiloh_staff_finalization_actions_v1` is a newly submitted proactive shortcut template and was still **PENDING** at the last authoritative provider check. Do not generalize the earlier resolved lifecycle review gate to this new template.

All provider/human-evidence gates remain fail-closed. Provider-configured or provider-active does not equal handset delivery proof.

## Juvan controlled acceptance — 🔵 AVAILABLE, no longer the immediate priority

Juvan remains the retained controlled CRM/client regression identity and can be used for beginning-to-end client-perspective booking acceptance across WhatsApp/provider behaviour, Render, CRM, approval/hold, Calendar, post-confirmation UX, corrected reschedule/closed-day behaviour and cancellation. Routine screenshots are not required; request screenshots only for UI/human truth or when the user sees something unexpected.

However, the immediate operational priority moved ahead of Juvan: the 1–15 August attendance backlog has deliberately been reopened for Christel/Marietjie final certification and the proactive shortcut is waiting on its Meta approval gate. Do not lose Juvan scope; resume it after the attendance/provider continuation point unless the user reprioritizes.

## Other standing gates

- Genuine per-route lifecycle delivery evidence remains natural-journey gated where not already observed.
- Birthday v2 requires genuine eligible CRM birthday/opt-in conditions; never artificially trigger.
- Google Business Profile API remains deferred at last-authoritative 0 QPM until Google evidence changes.
- Google Contacts sync remains lower priority; CRM is authoritative.
- Ozow remains waiting for merchant configuration and explicit business rules; do not submit speculative payment templates.
- Destructive privacy execution remains fail-closed pending authority/evidence.

## Exact new-chat continuation state

- Runtime application commit `03c11fade...` was verified live; CI passed. Documentation reconciliation commits after it do not change runtime semantics.
- Admin polish is substantially complete.
- Finalization authority: Christel → Christel+Abigail; Marietjie → Marietjie; Abigail → none.
- 31 historical finalizations from 1–15 Aug were reopened with history preserved; combined routable human-review backlog is 48 visits before any subsequent practitioner action.
- 4 cancelled visits remain untouched.
- #558 remains fail-closed pending practitioner evidence.
- `shiloh_staff_finalization_actions_v1` was PENDING at last provider check; proactive shortcut must not send until APPROVED.
- Ordinary Admin → Appointments → Finalize past visits is already usable by Christel/Marietjie.
- Pa Derik reschedule evidence is captured; Sunday/loop defect is fixed; #567 awaits normal cancellation only when genuinely appropriate.
- Juvan controlled E2E remains available after the immediate attendance/provider checkpoint.

**Authoritative current state:** runtime `03c11fade...` is production-live/CI-green; Admin polish and role-scoped attendance certification are implemented; the 1–15 August historical attendance cohort has been deliberately reopened for Christel/Marietjie final human review; #558 is the sole known unroutable historical exception; the new proactive finalization button template is provider-PENDING at last check and therefore fail-closed.

**Highest-priority genuinely actionable item for the new chat:** first re-check production health and Meta status for **`shiloh_staff_finalization_actions_v1`**. If Meta proves APPROVED, verify the role-aware Christel/Marietjie shortcut can proceed and then track their real historical finalization progress/evidence. If it remains PENDING, do not block ordinary Admin finalization; keep the shortcut gated and continue only with safe actionable work chosen from the Tracker.
