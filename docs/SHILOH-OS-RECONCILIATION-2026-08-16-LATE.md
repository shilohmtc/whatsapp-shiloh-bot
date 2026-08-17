# Shiloh OS — Late 16 August 2026 Reconciliation

Updated through 2026-08-17 13:28 SAST.

This is the authoritative continuation reconciliation after the 16 August Master/Tracker snapshot. Read it together with `docs/SHILOH-OS-MASTER-STATUS.md` and `docs/SHILOH-OS-PROJECT-TRACKER.md`. Where runtime/provider/client-UX state below is newer, this note supersedes the older baseline statements without reopening completed work.

## Current production baseline

Latest runtime-semantic application commit verified live on Render: **`0fba72068423e03a0c68fbb806ca1bb59d00ee48`** (`Fix SQT client-list SQL ordering`). PR #261 CI passed before merge. Render auto-deployed that exact commit, Shiloh started normally, and repeated `/health` checks returned HTTP 200.

Any documentation-only reconciliation commit after `0fba720...` may advance GitHub `main`/Render without changing runtime semantics; treat `0fba720...` as the application baseline until a later runtime change is deliberately merged.

Fresh Render startup provider evidence at this baseline:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **PENDING / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.

The proactive historical Finalize shortcut therefore remains fail-closed on the action-template provider gate. Ordinary Admin → Appointments → Finalize past visits remains available.

## Completed work preserved from the earlier reconciliation

### Historical manual bookings — production live

Historical manual bookings create the canonical CRM appointment and synchronize Google Calendar while suppressing ordinary client booking notification. They remain unresolved/scheduled for later authorized certification. Existing clinic/practitioner/service/conflict validation remains in force.

Runtime lineage includes `0e75f73d058b09a502994c22193981afda3bf660` (`Sync historical admin bookings to Google Calendar`). Do not redo this work.

### Historical finalization parity + Service change — production live

The role-authorized historical finalization workflow exposes Completed, No-show, Cancelled, No charge, Service change, Adjust price, Reschedule, and Leave unresolved. Service change records the treatment actually performed while preserving the original service in audit/history and supports optional final-price adjustment including R0. Certification authority remains Christel → Christel+Abigail, Marietjie → Marietjie, Abigail → none.

Runtime lineage includes `41bda2ae2b57cb72dddc1addfecb45ba3e01dcb7`. Do not redo this work.

### Universal WhatsApp client welcome — production live and handset-proven

The universal welcome remains the canonical greeting-only first-contact model for registered and genuinely new clients, with existing identity/claim safeguards preserved. During 17 August acceptance, the registered-client handset path exposed two defects which were repaired rather than worked around:

- Meta interactive-body length was brought within provider limits (`d633e692817442c77ec117b3ae108c42fc4cdd6d`).
- Both current and already-delivered legacy **Book appointment** payloads now route directly into service discovery (`8be1627b6f9ff920e83b6ad6a368f1d1e9a81805`, `4ad77d606574c9e4361732e63a51fd5fedecaa58`).
- Eligible-practitioner DISTINCT ordering was repaired (`1d55b32e1bdd55e51414e6ceb120b459f8b0da5f`).

Handset evidence subsequently proved the booking journey from the registered-client entry surface through categories, service selection, eligible practitioner selection, date, authoritative availability, preference confirmation, policy acceptance, approval hold, confirmation, reminder and cancellation.

## Client lifecycle button parity — production live

PR lineage commit `834cf43cef158053c81511f982cdd96a27d5d2de` reconciled the Pa Derik-tested lifecycle surfaces rather than inventing new behaviour.

- Booking confirmation delivery restores the existing appointment-action controls rather than degrading to raw action text.
- Cancellation presents a button-first rebooking action instead of relying only on `BOOK` text.
- Existing natural-language fallback remains valid and routes into the same canonical handlers.
- The repair is parity restoration; it does not alter booking identity, approval authority or appointment semantics.

The controlled Dummy Test journey on 17 August proved booking #574 through approval and final confirmation, reminder action buttons, and normal cancellation. The test appointment is cancelled; do not recreate it merely for proof.

## Client practitioner directory polish — production live and handset-verified

Commit `aba25983fa7b4a6a05207db86e434de1f9c2dd82` removed internal `Client-bookable Shiloh practitioner` wording from the client directory while preserving canonical practitioner metadata and eligibility.

Current handset-proven presentation:
- **Christel · Massage** — Massage Practitioner
- **Abigail · Massage** — Massage Practitioner
- **Marietjie · Esthetician** — Aesthetic Practitioner
- **Book now** — Start with a service or preference

Marietjie's canonical approved public title remains `Esthetician`; `Aesthetic Practitioner` is the descriptive client-facing role line. Do not rewrite canonical practitioner identity as part of presentation polish.

## Client category directory polish — production live and handset-verified

Commit `177be81eae3f3414d1668b2bd901b8f63ee7b65c` established deterministic client-facing category presentation:

1. **Massage Treatments** pinned first (canonical category remains `Massage`).
2. **Pedicures & Foot Care** pinned second.
3. Remaining client categories alphabetized.
4. Client subtitles use `treatment` / `treatments` rather than internal `active service(s)` wording.
5. Existing two-page WhatsApp pagination is preserved.

This is presentation ordering only; canonical category IDs/names and booking routing remain authoritative underneath.

## SQT BioMicroneedling taxonomy reconciliation — COMPLETE / handset-verified

The CRM contained two numbered one-treatment categories (`1. SQT BioMicroneedling` and `2. SQT BioMicroneedling`). Handset inspection established that they contained two distinct canonical services rather than duplicate records. The safe repair therefore groups them at the client presentation layer instead of mutating CRM taxonomy.

Commit `d1267da2fcc13748769403df37a8c3cf204802bf` presents one virtual client family:

- **SQT BioMicroneedling** — 2 treatments

while retaining each original service/category identity underneath.

Commit `0e7cd9ad1e3cbe4b52d7f45eccbe7829de12d7cc` removed the CRM ordering prefixes (`1.` / `2.`) from the SQT treatment display names and alphabetized the cleaned labels client-side only.

That first label-polish query exposed a production PostgreSQL `42P10` error because `SELECT DISTINCT` was ordered by an expression not present in the select list. PR #261 / commit **`0fba72068423e03a0c68fbb806ca1bb59d00ee48`** repaired the query by ordering on the already-selected cleaned `name` alias and aligned regression coverage with the DISTINCT-safe SQL.

Final handset evidence at 13:28 SAST proved the unified category opens successfully and shows both treatments without numeric prefixes, in alphabetical order, with existing canonical commercial data preserved:

- **SQT Anti-Aging Rejuvenation…** — 90 min · R1785–R2585
- **SQT Resurfacing BioMicroneedling…** — 90 min · R1785–R1840

The SQT reconciliation is **complete**. Do not consolidate or rename the underlying CRM service/category records merely to reproduce the client presentation.

## Provider and human gates preserved

- Historical attendance truth remains human-certified; never infer attendance.
- Appointment #558 remains fail-closed until the actual practitioner is established from authoritative evidence.
- Live unresolved historical counts are dynamic; re-query before quoting a current count.
- `shiloh_staff_finalization_actions_v1` remains **PENDING / UTILITY** at the latest authoritative production startup check. Do not send or claim the proactive shortcut until fresh provider evidence proves APPROVED.
- Pa Derik #567 remains subject only to genuine normal cancellation when appropriate; do not mutate it for proof.
- Genuine lifecycle delivery evidence remains distinct from code/configuration state.
- Birthday/follow-up/reminder evidence remains natural-journey gated where not already observed.
- Google Business Profile API, Ozow, destructive privacy execution and other standing external gates remain as recorded in Master/Tracker unless newer authoritative evidence is obtained.

## Continuation state

**Authoritative current state:** runtime-semantic baseline `0fba720...` is production-live and healthy; universal client entry and repaired booking route are live; lifecycle appointment-action parity is restored; practitioner/category discovery polish is handset-verified; SQT BioMicroneedling grouping and label cleanup are handset-verified complete; historical attendance/provider gates remain fail-closed where previously recorded.

**Highest-priority continuation:** return to the highest-priority unresolved operational workstream rather than redoing the client discovery repairs. First re-check the dynamic Meta state for `shiloh_staff_finalization_actions_v1` and current historical-finalization progress before making claims or actions there. If the template remains PENDING, ordinary Admin finalization remains available and another safe Tracker item may proceed.

**Do not redo:** historical calendar sync, finalization menu/service-change parity, universal welcome, registered Book appointment routing, eligible-practitioner ordering, lifecycle button parity, practitioner-directory polish, category ordering/count polish, or SQT taxonomy/label repair.