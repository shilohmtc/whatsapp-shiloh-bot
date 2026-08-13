# Shiloh OS — Project Tracker

Updated: 2026-08-13

Purpose: concise operational dashboard for humans. `docs/SHILOH-OS-MASTER-STATUS.md` remains the detailed permanent project-management ledger and source of task detail. This tracker must never silently replace or close work in the Master.

## Mandatory priority-selection rule

Before ordinary ACTIVE / READY work, identify unresolved production defects and the current **Product-Critical Gate**. Rank by threat to Shiloh's core business function, not merely by workstream number or the technical item that was previously active.

A human/provider-evidence item is genuinely WAITING only while the required evidence is unavailable. If the authorised tester is present and can perform a real WhatsApp acceptance step, that item is actionable for the session. Never infer the result: run the acceptance test and record evidence.

After any blocker/HOLD is removed, re-rank the whole project against operational truth rather than automatically resuming the prior technical item.

## Current Product-Critical Gate

🔵 **Complete real Client Perspective acceptance of the WhatsApp booking and booking-management lifecycle.**

Acceptance sequence: real dedicated client WhatsApp → registration/recognition → service/treatment discovery → authoritative practitioner eligibility/choice → availability → booking → canonical CRM appointment → Google Calendar mirror → real WhatsApp confirmation → view booking → reschedule → cancellation → lifecycle/template communications.

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
| B1 | Remaining Admin route acceptance | ⚪ READY | Finish only genuinely unverified role-specific WhatsApp paths after product-critical client acceptance. |
| B2 | JP Admin capability / client-test strategy | ⚪ READY | `JP` means the existing Jean-Pierre identity. Preserve business-admin authority; use dedicated non-admin test identities for genuine client acceptance. |
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Dummy Test has passed first-time registration, discovery, booking creation, reschedule mutation and the PR #184 reschedule date-choice UX in real WhatsApp. Continue cancellation and lifecycle/template acceptance without resetting the journey. |
| C2 | Practitioner-information conversational audit | ⚪ READY / IN-JOURNEY | Exercise natural practitioner/service questions during real client acceptance; verify no invention and consistency with CRM booking eligibility. |
| C3 | True first-time booking acceptance | 🟢 BOOKING + RESCHEDULE VERIFIED / 🔵 MANAGEMENT LIFECYCLE ACTIVE | Appointment #561 is HIFU / Marietjie / Fri 14 Aug 2026 / 10:00–10:30. PR #184 date-choice UX is real-WhatsApp accepted. Continue cancellation; do not reset Dummy Test. |
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
| Dummy Test reset | 🟢 VERIFIED (PRODUCTION TOOLING) | Guarded Dummy Test reset remains available through authorised Admin tooling. Do not reset the current lifecycle journey. |
| Live Dummy Test booking | 🟢 VERIFIED (REAL WHATSAPP + CALENDAR) | Appointment #561 was created for HIFU / Marietjie / Fri 14 Aug 2026, originally 11:00–11:30, after policy `2026-08-11-v1` acceptance. Both Calendar mirrors were independently verified. |
| Booking-confirmation client copy | ⚪ POLISH / NOT YET DEPLOYED | Original booking confirmation exposed appointment/sync/canonical-CRM diagnostics. Regression-first work remains isolated; do not claim production polish until merged/deployed. |
| Live CRM catalogue fidelity | 🟠 VERIFY IN JOURNEY | Real WhatsApp exposed CRM-backed Beauty catalogue rows, durations, prices and HIFU → Marietjie truth. Direct Render Postgres read remains tooling-limited (`SSL/TLS required`); do not guess. |
| Controlled booking creation | 🟢 VERIFIED TO WHATSAPP + BOTH CALENDAR MIRRORS | Appointment #561 creation is supported by WhatsApp success + matching shared/practitioner Calendar mirrors. Direct CRM-row verification remains tooling-limited. |
| Bare RESCHEDULE / CANCEL routing | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | PR #177 fixed exact bare commands. Real re-acceptance carried forward HIFU/Marietjie/current appointment context and asked only for the new date. |
| Reschedule authoritative availability UX | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | PR #178 introduced date → daypart → authoritative slots → selected-slot recheck → existing atomic confirmation. Real WhatsApp exercised the path through slot selection. |
| Reschedule availability client copy | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | PR #179 removed client-facing CRM/calendar/revalidation diagnostics and `authoritative now`; real re-acceptance showed `Choose an available time below. 🌿`, clean HIFU rows and explicit `Go to page 2 of 2`. |
| Reschedule functional mutation | 🟢 VERIFIED TO REAL WHATSAPP + BOTH CALENDAR MIRRORS | Dummy Test selected 10:00 and confirmed. Appointment #561 moved from 11:00–11:30 to 10:00–10:30. `Shiloh — Bookings` and `Shiloh — Marietjie` both show #561 at 10:00–10:30; the old 11:00 window contains no Dummy Test event. Direct CRM-row read remains tooling-limited. |
| Reschedule confirmation client UX | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | Real acceptance exercised the polished confirmation/keep-appointment flow and the subsequent PR #184 date-choice controls. Preserve the accepted UX; proceed to cancellation. |
| Cancellation acceptance | ⚪ READY | Use the same appointment #561. Verify explicit confirmation/fail-closed behavior, canonical cancellation, and removal/cancellation on both Calendar mirrors. |
| Client communication lifecycle | 🟠 WAITING ON BOOKING TEMPLATE REVIEW + 🔵 IN-JOURNEY | Existing real booking confirmation/reminder evidence remains valid. PR #185 provisioned `shiloh_booking_confirmation_v1`; Meta Manager now shows the exact Utility template **In review**. Keep `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE` unset until Active/APPROVED, then activate on Render and real-accept the template. |
| Error recovery / conversational resilience | 🟢 VERIFIED (CODE-LEVEL) | PR #163 deployed. Real provider/WhatsApp acceptance remains part of controlled journeys. |
| Client privacy/data minimization | ⏸️ OPEN / NOT CURRENT CRITICAL PATH | PRs #164/#165 and provider map remain safe foundations. Destructive execution remains disabled. |
| Final Client Perspective release gate | 🔵 ACTIVE / GATED | Requires successful cancellation, remaining lifecycle evidence, Meta approval + real acceptance of `shiloh_booking_confirmation_v1`, and explicit handling of outstanding new-booking copy polish. |

## Current production baseline

- Before this documentation-only reconciliation commit, GitHub `main` and Render production were positively aligned on **`66259e53ae2a897e089e895b322c712cbf4ef1c6`** from PR #185 (`Provision booking confirmation utility`), with Render deploy **`dep-d9v39h8ae00c73adc38g`** live on 2026-08-13.
- PR #184 (`Add reschedule date quick choices`) is production-deployed and real-WhatsApp accepted: Today / Tomorrow / Choose another date render on bare RESCHEDULE; the alternate-date prompt accepts free text and a real `Friday` reply preserved HIFU/Marietjie and advanced to daypart selection.
- PR #185 is provisioning-only for the new booking-confirmation Utility template. Production Meta submission succeeded, but explicit WhatsApp Manager evidence shows `shiloh_booking_confirmation_v1` **In review**. The sender remains fail-closed on the existing plain-text path because `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE` is intentionally unset until provider activation is positively evidenced.
- Exact Meta Manager evidence also supersedes older provider uncertainty for `shiloh_staff_finalization_v1`: it is now **Active — Quality pending**.
- PR #181 followed self-test-first engineering: regression-only CI **#448 failed** before implementation; final CI **#453 passed**. Final patch scope was `src/services/clientRescheduleAvailability.js` plus `tests/client-reschedule-confirmation-polish.test.js`; `src/services/appointmentChange.js` remained unchanged.
- PR #181 reuses the existing proven `yes` / `stop` semantics behind genuine WhatsApp buttons; it does not introduce new mutation commands. Its adapter delegates final confirmation to the existing atomic appointment-change handler and only polishes client-facing presentation.
- Real reschedule evidence before PR #181: appointment #561 changed from **11:00–11:30 to 10:00–10:30** on Fri 14 Aug 2026. Independent searches found the same #561 event at 10:00 in both `Shiloh — Bookings` and `Shiloh — Marietjie`, with no Dummy Test event remaining in the old 11:00 window.
- PRs #177–#179 remain deployed ancestry and their real WhatsApp acceptance evidence remains valid.
- The normal new-booking availability copy and original booking-confirmation copy remain explicit open polish debt. Do not silently treat either as resolved by PR #181.
- G1 remains resolved operationally: production Postgres `shiloh-memory` is `Basic-256mb` with the former Free expiry removed. Recovery/HA claims remain evidence-bounded.
- Provider/privacy foundations remain deployed; C1.10 is open but subordinate to the current real-client acceptance gate.

## Preserved client-booking truth

- Canonical client-facing full name: **Shiloh Massage Therapy and Aesthetic Clinic**. Use `Shiloh` naturally as the short brand.
- **JP = Jean-Pierre**. `JP` is shorthand/display terminology for the existing Jean-Pierre staff/admin identity only; never create a parallel identity from that shorthand.
- WhatsApp/Shiloh is the client/staff interaction surface; CRM is authoritative for client/service/practitioner/appointment truth; Google Calendar is availability/diary/mirror infrastructure.
- Real client booking acceptance cannot be substituted by backend tests, Demo Client simulation, direct CRM mutation or Calendar-only evidence.
- Dedicated non-admin identities are the correct client acceptance surface; `Dummy Test` remains the current controlled identity unless authoritative evidence changes it.
- WhatsApp self-registration uses the inbound sender number as the initial WhatsApp/contact identity.
- New self-registration asks for **First name + Surname + Date of birth + Gender** together, accepts natural bundled or progressive replies, and asks only for missing/ambiguous fields.
- Registered-client service entry is: **Beauty & Aesthetics / Massage / Lymphatic Drainage / Elim MediHeel Pedicures**.
- Beauty & Aesthetics → Marietjie; Massage → Christel or Abigail according to current CRM eligibility; Lymphatic Drainage → Abigail; Elim MediHeel Pedicures → current CRM-mapped Marietjie treatments. Final treatment/practitioner truth remains CRM-derived/fail-closed.
- Natural language remains supported; registered clients should not be unnecessarily forced backwards through menu structure.
- Genuine Meta WhatsApp interactive controls/lists with stable IDs are the product standard where supported.
- Appointment-management commands must resolve canonical appointment context; clients should not re-enter known service/practitioner/current-booking data when Shiloh can safely resolve it.
- Rescheduling must leave the current appointment unchanged until a replacement slot is positively revalidated and confirmed; abandoned/failed reschedules fail closed.
- Client-facing messages should describe outcomes and choices; CRM/provider synchronization/revalidation mechanics belong in logs/audit evidence unless needed for a client decision.

## Engineering debt that must not disappear

- **Test-client reset configurability:** current guarded test-client reset allowlisting is embedded in a mutation-heavy service. Future refactor should separate the allowlist while preserving guarded archival/contact-release mechanics.
- **Treatment-list presentation regression coverage:** PR #172's acceptance contract was proven but repository test-file writes were safety-blocked at the time. Preserve the deployed presentation and add equivalent coverage when a safe path permits.
- **Booking-confirmation client copy:** remove internal appointment/sync/canonical-CRM diagnostic wording from the original booking-success surface while preserving operational logs/audit evidence. Existing isolated regression-first work is not production-live.
- **New-booking availability client copy:** align normal booking availability with the polished reschedule surface (`Choose an available time below. 🌿`, no `authoritative now`, natural section naming) without altering CRM/calendar/revalidation semantics.
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
