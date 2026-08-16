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

GitHub `main` current application baseline: **`e2e3d943d7291819e4c8e65e68a4816147380549`**.

Render **`dep-da0rph5g1s2s73bp2i90`** is **LIVE** and healthy. `/health` returns 200. `META_LIFECYCLE_PROVISION_ON_START=false` remains fail-closed.

## Current Meta/provider state

🟢 **Provider review gate resolved.** Direct Meta WhatsApp Manager evidence on 2026-08-16 shows the current lifecycle set **Active – Quality pending**; this is an active quality-rating state, not approval-review pending.

Current provider-visible active templates include:
- `shiloh_appointment_followup_v2` — Utility;
- `shiloh_booking_approval_outcome_v1` — Utility;
- `shiloh_booking_declined_v1` — Utility;
- `shiloh_booking_approval_request_v1` — Utility;
- `shiloh_cancellation_confirmation_v1` — Utility;
- `shiloh_reschedule_confirmation_v1` — Utility;
- `shiloh_appointment_reminder_actions_v1` — Utility;
- `shiloh_booking_confirmation_v1` — Utility;
- `shiloh_staff_finalization_v1` — Utility;
- `shiloh_birthday_wish_v2` — Marketing;
- `shiloh_birthday_wish_v1` — Marketing;
- legacy `appointment_followup` — Utility.

Current-generation production wiring is enabled for booking confirmation, approval request/outcome/decline, reschedule confirmation, cancellation confirmation, reminder actions, follow-up v2, birthday v2 and staff finalization. Legacy variants are fallback/non-canonical where retained.

Provider-active/configured does **not** by itself prove real delivery. Each lifecycle route remains genuine-journey evidence-gated until its exact production send is naturally observed.

## At-a-glance

| ID | Workstream | State | Evidence / next action |
|---|---|---|---|
| JUVAN-E2E | Juvan beginning-to-end controlled client acceptance | 🔵 ACTIVE | Clean reset/baseline established. Continue client-perspective booking through CRM, approval, Calendar, current templates, corrected reschedule/closed-day path and normal cancellation. |
| META-LIFECYCLE | Current lifecycle template package | 🟢 CONFIGURED / 🟠 per-route evidence | Meta UI shows Active – Quality pending. Current generation is production-configured. Verify each send naturally; do not manufacture journeys. |
| META-BOOKING | Booking confirmation template | 🟢 VERIFIED provider/config | `shiloh_booking_confirmation_v1` provider-reported APPROVED / UTILITY and configured in production. |
| META-STAFF | Staff finalization template | 🟢 VERIFIED provider/config | `shiloh_staff_finalization_v1` provider-reported APPROVED / UTILITY. |
| APP-RESILIENCE | Approval recovery / discoverability | 🟢 VERIFIED | Recovery/resend machinery remains; visible Pending approvals menu entry removed from normal Admin presentation. |
| ADMIN-CLEANUP | Production Admin test cleanup | 🟢 VERIFIED | Chenique/Dummy reset clutter and Pending approvals menu entry removed; Juvan reset retained for Christel + Jean-Pierre as controlled fixture reset. |
| APP-PADERIK | Pa Derik #567 | 🟠 WAITING normal cancellation | Real handset reschedule evidence captured. Appointment now Tue 18 Aug 2026 08:30–10:15 on Shiloh Bookings + primary Calendar. Leave unchanged until Pa Derik is available to cancel through Shiloh normally. |
| C1-RESCHEDULE-UX | Closed-day + reschedule loop repair | 🟢 VERIFIED core UX | Pa Derik handset proves date → daypart → available time → explicit compare/confirm → success. Closed-day guard is production-live for booking and reschedule. |
| C1-ACTION-HELPER | Post-reschedule supplemental action helper | 🟢 FIXED / 🟠 fresh natural evidence | Pa Derik exposed `ensureToken is not a function`; export fixed at `e2e3d943...`, live on Render. Re-prove naturally with Juvan; do not re-mutate #567 for proof. |
| C1-POSTBOOK-UX | Post-confirmation client actions | 🟢 VERIFIED / one evidence nuance | Core navigation/button-first behaviour live. Current-generation post-confirmation/template action chain to be exercised in Juvan journey. |
| C1-BUTTON-FIRST-RATING | In-session rating UX | 🟠 WAITING genuine evidence | Production-live; await next genuine applicable follow-up/rating journey. |
| C1-FOLLOWUP-V2 | Button-first appointment follow-up template | 🟠 WAITING genuine delivery | `shiloh_appointment_followup_v2` active and production-configured; verify only after genuine completed-visit lifecycle timing. |
| C1-REMINDER-ACTIONS | Actionable reminder template | 🟠 WAITING genuine delivery | `shiloh_appointment_reminder_actions_v1` active/configured; verify on a naturally due reminder. |
| C1-CANCEL-TEMPLATE | Cancellation confirmation template | 🟠 WAITING genuine delivery | Active/configured. Verify during a genuine normal Shiloh cancellation, preferably Juvan or #567 when appropriate. |
| C1-RESCHEDULE-TEMPLATE | Reschedule confirmation template | 🟠 WAITING post-normalization delivery | Active/configured. Pa Derik reschedule happened before current-generation normalization, so his handset success message is not sufficient proof of this exact template. |
| C1-APP-ORD | Ordinary approval combinations | 🟠 WAITING | Genuine future evidence only; never manufacture appointments. |
| BIRTHDAY-V2 | Canonical birthday template | 🟠 WAITING genuine eligibility | Active/configured as v2; obey CRM birthday + opt-in/business rules. Do not trigger artificially in Juvan test. |
| A1-20260814 | 14 Aug reminder finalizations | 🟢 VERIFIED | #562 Completed; #357 No-show; duplicate replay rejected. |
| A1-HIST | Older attendance backlog | 🟠 WAITING | Explicit authorized human truth per visit; never infer/bulk-finalize. |
| GCONTACTS | CRM → Google Contacts | ⚪ READY | Lower priority; CRM remains authoritative. |
| GBP | Google Business Profile API | ⏸️ DEFERRED | Last authoritative quota 0 QPM; revisit on Google follow-up email/quota change. |
| E1 | Ozow | 🟠 WAITING | Merchant config + approved business rules required. |
| PRIV | Destructive privacy execution | 🟠 WAITING | Fail closed pending authority/evidence. |

## Pa Derik #567 exact state

- Confirmed booking was handset-proven earlier.
- Corrected reschedule journey was handset-proven on 2026-08-16.
- Appointment is now **Tue 18 Aug 2026, 08:30–10:15**, Full Body Swedish with Christel.
- Google Calendar matches on **Shiloh — Bookings** and **primary**; no matching 17 Aug event was found in the checked window.
- Reschedule preserved the old appointment until explicit `Confirm reschedule`.
- Supplemental post-send action generation failed at that time with `ensureToken is not a function`; core CRM/Calendar mutation still succeeded.
- Import/export defect fixed in `e2e3d943...`; live production deploy `dep-da0rph5g1s2s73bp2i90` is healthy.
- Do not reschedule #567 again merely for evidence.
- Remaining action: cancel #567 through normal Shiloh cancellation when Pa Derik is available.

## Juvan exact acceptance scope

Track the controlled journey across:
1. client WhatsApp/provider behaviour;
2. Render processing/log evidence;
3. CRM identity/appointment state through guarded application truth;
4. pending hold / practitioner approval state;
5. Google Calendar shared/practitioner propagation;
6. booking confirmation and current Meta lifecycle sends;
7. post-confirmation button-first actions;
8. corrected closed-day/reschedule UX;
9. supplemental action helper after the `ensureToken` fix;
10. normal cancellation and cancellation confirmation.

Routine screenshots are not required. Use machine-visible authority where possible and request handset evidence only where UI/human truth cannot otherwise be established or where the user notices a discrepancy.

Direct Render Postgres read-only querying remains unavailable because of the connector SSL/TLS handshake; do not infer DB state from that failure. Reconcile CRM through Shiloh application/audit/log evidence and correlated appointment/Calendar state until direct SQL becomes available.

## Exact continuation

- #561 cancelled historical — never recreate.
- #564 confirmed — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #567 rescheduled and authoritative at Tue 18 Aug 2026 08:30–10:15; cancellation deferred until Pa Derik available.
- #562 Completed and #357 No-show resolved.
- Admin cleanup complete; Juvan is the only retained visible controlled reset.
- Dummy Test calendar cleanup complete; no known 2026 Dummy Test events remain across checked calendars.
- Seven-template Meta review gate is resolved; do not describe current lifecycle templates as pending review unless new provider evidence says so.
- Current lifecycle template generation is production-configured; per-route genuine-delivery evidence remains separate.
- Reschedule closed-day/loop repair complete and handset accepted for core UX.
- Supplemental action-token defect fixed and deployed; fresh natural evidence pending.
- Render final live deploy: `dep-da0rph5g1s2s73bp2i90` on `e2e3d943...`.
- Google Business Profile API remains parked at last-authoritative 0 QPM.

**Authoritative current state:** `main` is reconciled to `e2e3d943...`; Render `dep-da0rph5g1s2s73bp2i90` is live and healthy; current-generation Meta lifecycle templates are active/configured; Pa Derik #567 is handset-verified through corrected reschedule and Calendar-synced at Tue 18 Aug 08:30–10:15; the supplemental action helper defect is fixed live; normal #567 cancellation is deferred until Pa Derik is available; Juvan E2E is the active controlled workstream.

**Highest-priority genuinely actionable item:** 🔵 **Continue Juvan E2E acceptance from the clean baseline**, specifically exercising current template wiring and the repaired reschedule/closed-day/supplemental-action path before normal cancellation cleanup.

## Guardrails

GitHub `main`, Render production, CRM, Google Calendar, Meta/provider evidence and explicit real WhatsApp/human evidence are authoritative. Preserve historical attendance, payment, privacy and genuine lifecycle-delivery gates fail-closed. Never recreate cancelled test appointments or mutate #567 merely for proof.
