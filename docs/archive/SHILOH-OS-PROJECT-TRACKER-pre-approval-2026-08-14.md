# Shiloh OS — Project Tracker

Updated: 2026-08-14

Purpose: concise operational dashboard for humans. `docs/SHILOH-OS-MASTER-STATUS.md` remains the detailed permanent project-management ledger and source of task detail. This tracker must never silently replace or close work in the Master.

## Mandatory priority-selection rule

Before ordinary ACTIVE / READY work, identify unresolved production defects and the current **Product-Critical Gate**. Rank by threat to Shiloh's core business function, not merely by workstream number or the technical item that was previously active.

A human/provider-evidence item is genuinely WAITING only while the required evidence is unavailable. If the authorised tester is present and can perform a real WhatsApp acceptance step, that item is actionable for the session. Never infer the result: run the acceptance test and record evidence.

After any blocker/HOLD is removed, re-rank the whole project against operational truth rather than automatically resuming the prior technical item.

## Current Product-Critical Gate

🔵 **Complete real Client Perspective acceptance of the WhatsApp booking and booking-management lifecycle.**

Acceptance sequence: real dedicated client WhatsApp → registration/recognition → service/treatment discovery → authoritative practitioner eligibility/choice → availability → booking → canonical CRM appointment → Google Calendar mirror → real WhatsApp confirmation → view booking → reschedule → cancellation → lifecycle/template communications.

The real Dummy Test journey has now positively completed booking, reschedule and cancellation on the same canonical appointment #561. Continue from the remaining lifecycle/template and registered-return/client-copy acceptance work; do not reset Dummy Test merely to repeat already accepted booking-management steps.

If this real journey exposes a defect, that shared production-path defect becomes the immediate engineering priority: reproduce safely, self-test first, fix, deploy, verify, then resume the same journey.

C1.10 privacy/governance remains open and all implemented safety controls remain mandatory, but it is not the current product-critical execution priority unless it reveals an immediate safety/booking blocker.

## Status system

- 🟢 **VERIFIED** — implemented and supported by sufficient production/acceptance evidence.
- 🔵 **ACTIVE** — currently being worked/audited.
- ⚪ **READY** — genuinely actionable now.
- 🟠 **WAITING** — blocked on unavailable human/provider/external/authoritative truth; never infer completion.
- 🔴 **DEFECT / HOLD** — proven defect/safety issue; progression stops/fails closed until repaired.
- ⏸️ **DEFERRED** — intentionally postponed with explicit reason.

## At-a-glance tracker

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| G1 | Production Postgres continuity | 🟢 VERIFIED | Existing `shiloh-memory` upgraded in place to `Basic-256mb`; Free expiry removed; post-upgrade connections resumed; issue #166 closed. Do not infer HA or tested restore. |
| A1 | Six known Christel/Abigail attendance finalizations | 🟠 WAITING | Genuine Completed / No-show truth: Abigail 2, Christel 4. |
| A2 | Finalization / earnings UX production acceptance | ⚪ READY | Real authorised-account queue/report acceptance; Marietjie self-view still requires real acceptance. |
| A3 | Staff finalization reminder template | 🟢 VERIFIED | Exact Meta Manager evidence shows `shiloh_staff_finalization_v1` as Utility / Active — Quality pending. |
| B1 | Remaining Admin route acceptance | ⚪ READY | Finish only genuinely unverified role-specific WhatsApp paths after product-critical client acceptance. Permission-gated read-only full client detail is now production-live via PR #188 and real Admin acceptance for CRM #836 passed. |
| B2 | JP Admin capability / client-test strategy | ⚪ READY | `JP` means the existing Jean-Pierre identity. Preserve business-admin authority; use dedicated non-admin test identities for genuine client acceptance. |
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Dummy Test passed first-time registration, discovery, booking creation, reschedule and real cancellation of #561. Continue registered-return, remaining client-copy and lifecycle/template acceptance without recreating #561. |
| C2 | Practitioner-information conversational audit | ⚪ READY / IN-JOURNEY | Exercise natural practitioner/service questions during real client acceptance; verify no invention and consistency with CRM booking eligibility. |
| C3 | True first-time booking acceptance | 🟢 BOOKING + RESCHEDULE + CANCELLATION VERIFIED / 🔵 LIFECYCLE ACTIVE | #561 completed its intended real booking-management acceptance and is cancelled. Do not recreate it solely to repeat accepted steps. |
| D0 | P3 customer-care foundation | 🟢 VERIFIED | Backend foundation implemented; real lifecycle/provider acceptance remains part of current client gate. |
| D1 | Birthday automation | 🟠 VERIFY PROVIDER STATE | Owner reports Meta templates are approved; verify exact `shiloh_birthday_wish_v2` status before promoting/sending. |
| E1 | Ozow activation gate | 🟠 WAITING | Merchant/account configuration + explicit payment/deposit/refund/Shiloh gift-voucher rules. |
| E2 | Safe P4 engineering | ⚪ READY (LOWER PRIORITY) | PR #129 foundation complete; do not displace real client acceptance. |
| F1 | Meta keeper portfolio / core ownership | 🟢 VERIFIED | Preserve portfolio `406573210678288`, WABA/app/system-user chain. |
| F2 | Existing Facebook Page consolidation | 🟢 VERIFIED | Preserve consolidated ownership. |
| F3 | Existing Instagram ownership/connection | ⚪ READY | Verify existing `@shiloh_massage_studio` ownership/access before connection; never create a duplicate by assumption. |
| F4 | Portfolio naming / business verification | ⚪ READY | Investigate rejection/legal details before resubmission. |

## Active Client Perspective acceptance board

| Item | State | Meaning |
|---|---|---|
| First WhatsApp client entry UX | 🟢 VERIFIED (CODE/PRODUCTION + REAL DUMMY TEST) | Real Dummy Test established unregistered-number handling without asking the client to re-enter the inbound WhatsApp number. |
| Registered-client initial routing | 🔵 ACTIVE / REAL ACCEPTANCE | First-time Dummy Test registration is proven. Registered-client return recognition still needs its own real WhatsApp acceptance later in the journey. |
| New-client registration | 🟢 VERIFIED (REAL DUMMY TEST) | Dummy Test supplied `Dummy Test, 14 May 1990, Female` as a bundled reply and transitioned directly into booking discovery using the inbound WhatsApp identity. |
| Four service families | 🟢 VERIFIED (REAL DUMMY TEST) | Real WhatsApp exposed `Beauty & Aesthetics`, `Massage`, `Lymphatic Drainage`, `Elim MediHeel Pedicures`; downstream treatment/practitioner truth remains CRM-derived/fail-closed. |
| Beauty & Aesthetics treatment-list presentation | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | PR #172 repaired long-name readability, Rand price/range consistency and pagination wording; real post-deploy screenshots passed. |
| HIFU → Marietjie routing | 🟢 VERIFIED (REAL WHATSAPP) | Dummy Test selected HIFU and Shiloh displayed Marietjie as practitioner with date selection. |
| Client authoritative availability SQL | 🟢 VERIFIED (ENGINEERING + REAL WHATSAPP) | PR #174 repaired PostgreSQL `42P10`; real re-acceptance produced HIFU/Marietjie morning slots and working pagination. |
| New-booking availability client copy | ⚪ POLISH / NOT YET DEPLOYED | The normal booking availability surface still exposes internal CRM/calendar/revalidation terminology and `authoritative now`; preserve availability semantics and polish separately. |
| Dummy Test reset | 🟢 VERIFIED (PRODUCTION TOOLING) | Guarded Dummy Test reset remains available through authorised Admin tooling. Do not reset merely to repeat the completed #561 booking-management journey. |
| Live Dummy Test booking | 🟢 VERIFIED (REAL WHATSAPP + CALENDAR) | Appointment #561 was created for HIFU / Marietjie / Fri 14 Aug 2026, originally 11:00–11:30, after policy `2026-08-11-v1` acceptance. Both Calendar mirrors were independently verified. |
| Booking-confirmation client copy | ⚪ POLISH / NOT YET DEPLOYED | Original booking confirmation exposed appointment/sync/canonical-CRM diagnostics. Regression-first work remains isolated; do not claim production polish until merged/deployed. |
| Live CRM catalogue fidelity | 🟠 VERIFY IN JOURNEY | Real WhatsApp exposed CRM-backed Beauty catalogue rows, durations, prices and HIFU → Marietjie truth. Direct Render Postgres read remains tooling-limited (`SSL/TLS required`); do not guess. |
| Controlled booking creation | 🟢 VERIFIED TO WHATSAPP + BOTH CALENDAR MIRRORS | Appointment #561 creation is supported by WhatsApp success + matching shared/practitioner Calendar mirrors. |
| Bare RESCHEDULE / CANCEL routing | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | Earlier bare-command routing was fixed, and PR #187 subsequently fixed the proven edge where an active reschedule-availability state swallowed a new bare `CANCEL`. Real post-deploy acceptance showed `CANCEL` correctly superseding the stale reschedule state and resolving #561. |
| Reschedule authoritative availability UX | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | PR #178 introduced date → daypart → authoritative slots → selected-slot recheck → existing atomic confirmation. Real WhatsApp exercised the path through slot selection. |
| Reschedule availability client copy | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | PR #179 removed client-facing CRM/calendar/revalidation diagnostics and `authoritative now`; real re-acceptance showed `Choose an available time below. 🌿`, clean HIFU rows and explicit `Go to page 2 of 2`. |
| Reschedule functional mutation | 🟢 VERIFIED TO REAL WHATSAPP + BOTH CALENDAR MIRRORS | Dummy Test selected 10:00 and confirmed. Appointment #561 moved from 11:00–11:30 to 10:00–10:30. `Shiloh — Bookings` and `Shiloh — Marietjie` both showed #561 at 10:00–10:30; the old 11:00 window contained no Dummy Test event. |
| Reschedule confirmation client UX | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | Real acceptance exercised the polished confirmation/keep-appointment flow and PR #184 date-choice controls. Preserve the accepted UX. |
| Cancellation acceptance | 🟢 VERIFIED (REAL WHATSAPP + BOTH CALENDAR MIRRORS) | Real Dummy Test sent `CANCEL`, received explicit confirmation for #561, then sent `YES`. Shiloh confirmed cancellation and independent post-mutation searches showed #561 absent from both `Shiloh — Bookings` and `Shiloh — Marietjie`. No replacement booking was created. |
| Admin client-detail privacy boundary | 🟢 VERIFIED (PRODUCTION + REAL ADMIN) | PR #188 added a separate permission-gated, scope-revalidated, SELECT-only `Find client details #<CRM_ID>` path while preserving masked ordinary search. Real Admin acceptance for CRM #836 returned the canonical contact details and explicitly made no identity/contact changes. |
| Calendar client-mobile presentation | 🟢 DEPLOYED / 🔵 REAL NEXT-BOOKING ACCEPTANCE | PR #189 is live. Future Shiloh-created shared and practitioner Calendar descriptions include the client mobile while titles remain unchanged; Admin bookings resolve from canonical `client_contacts`, client WhatsApp bookings use the uniquely resolved inbound identity, and later Calendar update/reschedule patches preserve the mobile metadata. No retroactive backfill was performed. Verify on the next genuine future booking rather than creating a booking solely for this presentation check. |
| Client communication lifecycle | 🟠 WAITING ON BOOKING TEMPLATE REVIEW + 🔵 IN-JOURNEY | Existing real booking confirmation/reminder evidence remains valid. PR #185 provisioned `shiloh_booking_confirmation_v1`; latest reconciled Meta Manager evidence shows the exact Utility template **In review**. Keep `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE` unset until Active/APPROVED, then activate on Render and real-accept the template. |
| Error recovery / conversational resilience | 🟢 VERIFIED (CODE-LEVEL) | PR #163 deployed. Real provider/WhatsApp acceptance remains part of controlled journeys. |
| Client privacy/data minimization | ⏸️ OPEN / NOT CURRENT CRITICAL PATH | PRs #164/#165 and provider map remain safe foundations. Destructive execution remains disabled. Calendar mobile exposure is deliberately staff-diary presentation only and does not weaken the separate Admin search masking boundary. |
| Final Client Perspective release gate | 🔵 ACTIVE / GATED | Booking/reschedule/cancellation are now real-accepted. Remaining gates include registered-return/lifecycle evidence, Meta booking-template activation + real acceptance when approved, and explicit handling of outstanding new-booking copy polish. |

## Current production baseline

- GitHub `main` and Render production are positively aligned on **`aa79cfa0064f2ec0ca0801b42a07a82c37945345`**, squash merge of PR #189 (`Include client mobile in booking calendar descriptions`), with Render deploy **`dep-d9va4s49v7es7399tg4g`** live on 2026-08-14.
- PR #189 followed self-test-first engineering: regression-only commit `5457cbc53bb9e446dc2cb828a16c43a6c49496bf` failed CI **#477** before implementation; final head `b1d8553fcda3f7cf7e62b21f702301b6c7d214f8` passed CI **#481**. It is presentation-only: Calendar titles are unchanged, CRM/booking eligibility truth is unchanged, and no existing event was backfilled.
- PR #188 (`Add permission-gated read-only client details`) is production-live in the ancestry. Its regression-only commit `82195ffb0e5a9b42d5055c0e914ce7778c3ec89f` failed CI #471 before implementation and final CI #475 passed. Real Admin acceptance for CRM #836 proved the full-detail path while ordinary search remains masked.
- PR #187 (`Fix cancellation superseding active reschedule`) is production-live in the ancestry. Its regression-only commit `d949d825…` failed before implementation and the implementation passed CI #469. Real Dummy Test cancellation acceptance then proved the repair against #561.
- Appointment #561 completed its controlled management lifecycle: created, rescheduled from 11:00–11:30 to 10:00–10:30, then explicitly cancelled via real WhatsApp. Both required Calendar mirrors were independently verified absent after cancellation. Do not recreate #561 to repeat accepted steps.
- Zane Maree CRM #836 was used only as a read-only Admin/client-detail acceptance target. The independently reconciled current appointment is #562, Full Body Swedish / Abigail / 15:00–16:45 on 14 Aug 2026, mirrored on `Shiloh — Bookings` and `Shiloh — Abigail`; no record was changed during the lookup work.
- PR #184 (`Add reschedule date quick choices`) remains production-deployed and real-WhatsApp accepted: Today / Tomorrow / Choose another date render on bare RESCHEDULE; the alternate-date prompt accepts free text and a real `Friday` reply preserved HIFU/Marietjie and advanced to daypart selection.
- PR #185 is provisioning-only for the new booking-confirmation Utility template. Production Meta submission succeeded, but latest reconciled WhatsApp Manager evidence shows `shiloh_booking_confirmation_v1` **In review**. The sender remains fail-closed on the existing plain-text path because `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE` is intentionally unset until provider activation is positively evidenced.
- Exact Meta Manager evidence also supersedes older provider uncertainty for `shiloh_staff_finalization_v1`: it is **Active — Quality pending**.
- The normal new-booking availability copy and original booking-confirmation copy remain explicit open polish debt. Do not silently treat either as resolved by later booking-management or Calendar work.
- G1 remains resolved operationally: production Postgres `shiloh-memory` is `Basic-256mb` with the former Free expiry removed. Recovery/HA claims remain evidence-bounded.
- The Render direct Postgres query connector still fails with `SSL/TLS required`; use guarded application/Admin reads where available rather than guessing CRM rows.
- Provider/privacy foundations remain deployed; C1.10 is open but subordinate to the current real-client acceptance gate.

## Preserved client-booking truth

- Canonical client-facing full name: **Shiloh Massage Therapy and Aesthetic Clinic**. Use `Shiloh` naturally as the short brand.
- **JP = Jean-Pierre**. `JP` is shorthand/display terminology for the existing Jean-Pierre staff/admin identity only; never create a parallel identity from that shorthand.
- WhatsApp/Shiloh is the client/staff interaction surface; CRM is authoritative for client/service/practitioner/appointment truth; Google Calendar is availability/diary/mirror infrastructure.
- Real client booking acceptance cannot be substituted by backend tests, Demo Client simulation, direct CRM mutation or Calendar-only evidence.
- Dedicated non-admin identities are the correct client acceptance surface; `Dummy Test` remains the controlled identity unless authoritative evidence changes it, but do not reset it merely to recreate already accepted #561 steps.
- WhatsApp self-registration uses the inbound sender number as the initial WhatsApp/contact identity.
- New self-registration asks for **First name + Surname + Date of birth + Gender** together, accepts natural bundled or progressive replies, and asks only for missing/ambiguous fields.
- Registered-client service entry is: **Beauty & Aesthetics / Massage / Lymphatic Drainage / Elim MediHeel Pedicures**.
- Beauty & Aesthetics → Marietjie; Massage → Christel or Abigail according to current CRM eligibility; Lymphatic Drainage → Abigail; Elim MediHeel Pedicures → current CRM-mapped Marietjie treatments. Final treatment/practitioner truth remains CRM-derived/fail-closed.
- Natural language remains supported; registered clients should not be unnecessarily forced backwards through menu structure.
- Genuine Meta WhatsApp interactive controls/lists with stable IDs are the product standard where supported.
- Appointment-management commands must resolve canonical appointment context; clients should not re-enter known service/practitioner/current-booking data when Shiloh can safely resolve it.
- Rescheduling must leave the current appointment unchanged until a replacement slot is positively revalidated and confirmed; abandoned/failed reschedules fail closed.
- Client-facing messages should describe outcomes and choices; CRM/provider synchronization/revalidation mechanics belong in logs/audit evidence unless needed for a client decision.
- Ordinary Admin client search stays masked. Full client contact details are available only through the explicit permission-gated, scope-revalidated read-only details path.
- Future Shiloh-created Calendar event descriptions may include the canonical client mobile for operational diary use; this does not make Calendar authoritative for client identity and does not justify exposing full contacts on ordinary search surfaces.

## Engineering debt that must not disappear

- **Test-client reset configurability:** current guarded test-client reset allowlisting is embedded in a mutation-heavy service. Future refactor should separate the allowlist while preserving guarded archival/contact-release mechanics.
- **Treatment-list presentation regression coverage:** PR #172's acceptance contract was proven but repository test-file writes were safety-blocked at the time. Preserve the deployed presentation and add equivalent coverage when a safe path permits.
- **Booking-confirmation client copy:** remove internal appointment/sync/canonical-CRM diagnostic wording from the original booking-success surface while preserving operational logs/audit evidence. Existing isolated regression-first work is not production-live.
- **New-booking availability client copy:** align normal booking availability with the polished reschedule surface (`Choose an available time below. 🌿`, no `authoritative now`, natural section naming) without altering CRM/calendar/revalidation semantics.
- **Calendar client-mobile real acceptance:** PR #189 is deployed, but the first genuine future booking after deployment must verify the mobile appears on both shared and practitioner event descriptions and survives any later reschedule. Do not create or mutate an appointment solely to force this presentation check.
- **Master/Tracker continuity:** after every material product-state change, reconcile both ledgers; specialist handoffs never become competing masters.

## Cross-chat operating rule

1. Read Master first, Tracker second; verify GitHub `main` + Render production.
2. Identify production defects and the Product-Critical Gate before ordinary workstream ordering.
3. Treat human-assisted acceptance as actionable when the authorised tester is present; never infer results.
4. Work the highest-risk actionable product gate/defect first.
5. Re-rank after every blocker removal.
6. Preserve genuinely unavailable external/human truth fail-closed.
7. Before ending substantial work, reconcile Master + Tracker.

The Tracker is a view of the Master, not an independent authority. If they disagree, verify operational evidence and reconcile the discrepancy rather than silently choosing one.
