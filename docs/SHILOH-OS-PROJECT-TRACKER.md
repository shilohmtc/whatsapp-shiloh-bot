# Shiloh OS — Project Tracker

Updated: 2026-08-16
Purpose: concise operational dashboard. Master is the detailed current ledger; do not redo completed work.

## Canonical status system

| State | Meaning |
|---|---|
| 🟢 VERIFIED | Completed with sufficient authoritative evidence. |
| 🔵 ACTIVE | Work currently being executed. |
| ⚪ READY | Actionable now, but not currently being executed. |
| 🟠 WAITING | Requires human/provider/external/genuine-journey truth before advancing. |
| 🔴 DEFECT / HOLD | Proven problem or unsafe state; fail closed until repaired and re-verified. |
| ⏸️ DEFERRED | Deliberately postponed by explicit project decision. |

## Governance

At the start of each new Shiloh OS chat: read Master + Tracker on GitHub `main`, reconcile applicable authoritative systems, state authoritative current state, identify the single highest-priority genuinely actionable item and why it is next, then obtain explicit approval before substantial work.

After that initial approval, continue the approved workstream without repeated approval requests at ordinary engineering, PR, merge, deploy, controlled provider/configuration, verification, repair, or housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authoritative evidence, or an existing fail-closed evidence gate.

Automatic continuation: short waits are re-checked directly; longer waits may use a narrow condition-watch. Failure/ambiguity remains fail-closed.

Provider lead-time: identify foreseeable WhatsApp templates during feature planning and submit them early enough for provider review to run in parallel with engineering. Do not submit speculative templates for undefined business semantics.

Button-first UX: known finite client actions should use WhatsApp buttons/lists when supported. Natural language remains fallback. Interactive controls must route into canonical handlers.

## Current production baseline

GitHub `main` current application baseline: **`f6612e632f2d5db6018af1601e6aba1727ab5fec`** (`Improve imported-client first WhatsApp verification`). Production is verified live and healthy; `/health` returns 200. `META_LIFECYCLE_PROVISION_ON_START=false` remains fail-closed.

## Current Meta/provider state

🟢 **Provider review gate resolved.** Direct Meta WhatsApp Manager evidence on 2026-08-16 shows the current lifecycle set **Active – Quality pending**; this is an active quality-rating state, not approval-review pending.

Current-generation production wiring is enabled for booking confirmation, approval request/outcome/decline, reschedule confirmation, cancellation confirmation, reminder actions, follow-up v2, birthday v2 and staff finalization. Legacy variants are fallback/non-canonical where retained. Provider-active/configured does not by itself prove real delivery; each route remains genuine-journey evidence-gated until naturally observed.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| JUVAN-E2E | Juvan beginning-to-end controlled client acceptance | 🔵 ACTIVE | Clean reset/baseline established. Continue client-perspective booking through CRM, approval, Calendar, templates, completed post-confirmation UX, corrected reschedule/closed-day path and normal cancellation. |
| CRM-IMPORTED-CLAIM | Existing Goldie client first WhatsApp verification | 🟢 FIXED / 🟠 natural evidence | `f6612e63...` live. Unique imported mobile + compatible name promotes same contact to verified WhatsApp; ambiguity/conflict fails closed. Await natural never-before-verified imported client; do not reset a real client for proof. |
| CRM-PROVENANCE | CRM48 / CRM473 provenance | 🟢 VERIFIED | Both are legitimate controlled `goldie_import` canonical clients, not bot registrations. Keep. |
| CRM1-REVIEW | CRM1 orphan-like provenance | ⚪ READY | Only stronger orphan-like candidate found. Read-only identity/supersession check still needed; do not delete without proof. |
| META-LIFECYCLE | Current lifecycle template package | 🟢 CONFIGURED / 🟠 per-route evidence | Meta UI shows Active – Quality pending. Verify sends naturally; do not manufacture journeys. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING normal cancellation | Real handset reschedule evidence captured. Appointment Tue 18 Aug 2026 08:30–10:15 on Shiloh Bookings + primary Calendar. Leave unchanged until Pa Derik is available. |
| C1-RESCHEDULE-UX | Closed-day + reschedule loop repair | 🟢 VERIFIED core UX | Pa Derik handset proves date → daypart → available time → explicit compare/confirm → success. Closed-day guard live for booking/reschedule. |
| C1-ACTION-HELPER | Post-reschedule supplemental action helper | 🟢 FIXED / 🟠 fresh natural evidence | `ensureToken` export fixed at `e2e3d943...`; re-prove naturally with Juvan; do not re-mutate #567 for proof. |
| C1-POSTBOOK-UX | Post-confirmation client UX package | 🟢 COMPLETE | `Book another treatment`, `My appointments`, `Main menu` plus natural-language equivalents are production-live. Historical Meta/Google pause is resolved and must not be carried forward as an active blocker. |
| C1-BUTTON-FIRST-RATING | In-session rating UX | 🟠 WAITING genuine evidence | Production-live; await next genuine applicable follow-up/rating journey. |
| C1-FOLLOWUP-V2 | Button-first appointment follow-up template | 🟠 WAITING genuine delivery | Active/configured; verify only after genuine completed-visit lifecycle timing. |
| C1-REMINDER-ACTIONS | Actionable reminder template | 🟠 WAITING genuine delivery | Active/configured; verify on a naturally due reminder. |
| C1-CANCEL-TEMPLATE | Cancellation confirmation template | 🟠 WAITING genuine delivery | Active/configured. Verify during genuine normal Shiloh cancellation. |
| C1-RESCHEDULE-TEMPLATE | Reschedule confirmation template | 🟠 WAITING post-normalization delivery | Active/configured. Pa Derik reschedule preceded normalization, so exact-template delivery remains unproven. |
| C1-APP-ORD | Ordinary approval combinations | 🟠 WAITING | Genuine future evidence only; never manufacture appointments. |
| BIRTHDAY-V2 | Canonical birthday template | 🟠 WAITING genuine eligibility | Active/configured as v2; obey CRM birthday + opt-in/business rules. |
| A1-20260814 | 14 Aug reminder finalizations | 🟢 VERIFIED | #562 Completed; #357 No-show; duplicate replay rejected. |
| A1-HIST | Older attendance backlog | 🟠 WAITING | Explicit authorized human truth per visit; never infer/bulk-finalize. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Lower priority; CRM remains authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last authoritative quota 0 QPM; revisit on Google follow-up/quota change. |
| E1 | Ozow | 🟠 WAITING | Merchant config + approved business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Imported-client verification exact state

- CRM numbers are canonical CRM IDs, not WhatsApp registration IDs.
- CRM48 (Pa Derik) and CRM473 were created through the controlled Goldie migration and are legitimate records.
- Pa Derik handset evidence proved the old first-contact UX could confuse imported identity with verified WhatsApp identity, reject `Derik` vs `Pa Derik`, and fail to retain DOB from `2 oct 64 male`.
- `f6612e63...` replaces that path with explicit imported-profile claim/verification for unique unverified Goldie mobile matches.
- Safe title/prefix variants are tolerated; unsafe partial names still fail closed.
- Natural DOB+gender parsing now supports two-digit years with validity/age safeguards.
- Successful verification links/promotes the existing contact on the same CRM; no duplicate client is created.
- Ambiguous/conflicting identity requires clinic verification.
- Natural human acceptance remains pending; do not manufacture by resetting Pa Derik or another real client.

## Pa Derik #567 exact state

- Corrected reschedule journey handset-proven on 2026-08-16.
- Appointment now **Tue 18 Aug 2026, 08:30–10:15**, Full Body Swedish with Christel.
- Google Calendar matches on Shiloh — Bookings and primary.
- Supplemental post-send action generation failed at that time with `ensureToken is not a function`; core mutation succeeded.
- Defect fixed in `e2e3d943...`; current production includes that fix.
- Do not reschedule #567 again merely for evidence. Remaining action is normal cancellation when Pa Derik is available.

## Juvan exact acceptance scope

Track the controlled journey across client WhatsApp/provider behaviour; Render; CRM identity/appointment state; pending hold/practitioner approval; Google Calendar propagation; booking confirmation/current Meta lifecycle sends; completed post-confirmation button-first actions; corrected closed-day/reschedule UX; supplemental action helper after the `ensureToken` fix; and normal cancellation/cancellation confirmation.

Routine screenshots are not required. Use machine-visible authority where possible and request handset evidence only where UI/human truth cannot otherwise be established or the user notices a discrepancy.

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #567 rescheduled and authoritative at Tue 18 Aug 2026 08:30–10:15; cancellation deferred until Pa Derik available.
- #562 Completed and #357 No-show resolved.
- Admin cleanup complete; Juvan is the only retained visible controlled reset.
- CRM48 and CRM473 are legitimate Goldie imports; CRM1 remains review-only.
- Imported-client first-WhatsApp verification repair is live at `f6612e63...`; natural human evidence remains pending.
- Seven-template Meta review gate resolved; current lifecycle generation production-configured; per-route genuine-delivery evidence remains separate.
- **Post-confirmation client UX package is complete; no Meta/Google implementation blocker remains for that package.**
- Reschedule closed-day/loop repair complete and handset accepted for core UX.
- Supplemental action-token defect fixed; fresh natural evidence pending.
- Historical attendance remains human-truth gated.
- Google Business Profile API remains parked at last-authoritative 0 QPM.

**Authoritative current state:** `main` application baseline is `f6612e63...`; production is live/healthy; imported-client verification repair is live; CRM48/CRM473 are legitimate Goldie imports; CRM1 is review-only; post-confirmation client UX is complete; current Meta lifecycle generation is active/configured; Pa Derik #567 remains at Tue 18 Aug 08:30–10:15 awaiting normal cancellation; Juvan E2E is the active controlled workstream.

**Highest-priority genuinely actionable item:** 🔵 **Continue Juvan E2E acceptance from the clean baseline**, specifically exercising completed post-confirmation UX, current template wiring and repaired reschedule/closed-day/supplemental-action path before normal cancellation cleanup. Imported-client claim proof waits naturally and does not block Juvan.

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar, Meta/provider evidence and explicit real WhatsApp/human evidence are authoritative. Preserve historical attendance, payment, privacy and genuine lifecycle-delivery gates fail-closed. Never recreate cancelled test appointments or mutate #567 merely for proof.
