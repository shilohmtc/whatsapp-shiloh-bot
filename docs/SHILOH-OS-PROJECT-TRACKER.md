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
| A3 | Staff finalization reminder template | 🟠 VERIFY PROVIDER STATE | Owner reports Meta templates are approved; verify exact `shiloh_staff_finalization_v1` provider status before promoting/sending. |
| B1 | Remaining Admin route acceptance | ⚪ READY | Finish only genuinely unverified role-specific WhatsApp paths after product-critical client acceptance. |
| B2 | JP Admin capability / client-test strategy | ⚪ READY | `JP` means the existing Jean-Pierre identity. Preserve business-admin authority; use dedicated non-admin test identities for genuine client acceptance. |
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Dummy Test has now passed registration, discovery, HIFU → Marietjie availability, controlled booking creation and two Calendar mirrors. PR #177 fixes bare `RESCHEDULE`/`CANCEL` routing and is production-live. Re-run `RESCHEDULE` on appointment #561 and continue the same lifecycle. |
| C2 | Practitioner-information conversational audit | ⚪ READY / IN-JOURNEY | Exercise natural practitioner/service questions during real client acceptance; verify no invention and consistency with CRM booking eligibility. |
| C3 | True first-time booking acceptance | 🟢 BOOKING CREATED / 🔵 MANAGEMENT LIFECYCLE ACTIVE | Real Dummy Test booking #561 was created for HIFU with Marietjie on Fri 14 Aug 2026 at 11:00 and matching shared/practitioner Calendar events were independently verified. Continue reschedule then cancellation without resetting. |
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
| First WhatsApp client entry UX | 🟢 VERIFIED (CODE/PRODUCTION + REAL DUMMY TEST) | PR #168 remains deployed ancestry. Real Dummy Test evidence positively established unregistered-number handling without asking the client to re-enter the inbound WhatsApp number. |
| Registered-client initial routing | 🔵 ACTIVE / REAL ACCEPTANCE | First-time Dummy Test registration is proven. Registered-client return recognition still needs its own real WhatsApp acceptance later in the journey. |
| New-client registration | 🟢 VERIFIED (REAL DUMMY TEST) | Dummy Test successfully supplied `Dummy Test, 14 May 1990, Female` as a bundled reply and transitioned directly into booking discovery using the inbound WhatsApp identity. |
| Four service families | 🟢 VERIFIED (REAL DUMMY TEST) | Real WhatsApp exposed `Beauty & Aesthetics`, `Massage`, `Lymphatic Drainage`, `Elim MediHeel Pedicures`; Dummy Test selected Beauty & Aesthetics and reached the Marietjie treatment flow. Downstream rows remain CRM-derived/fail-closed. |
| Beauty & Aesthetics treatment-list presentation | 🟢 VERIFIED (PRODUCTION + REAL WHATSAPP) | PR #172 repaired long-name readability, simple Rand price/range consistency and pagination wording. Real post-deploy screenshot positively verified materially more readable canonical treatment names in descriptions, formats such as `R1,250–R2,200`, and `Next treatments →` / `Go to page 2 of 4`. |
| HIFU → Marietjie routing | 🟢 VERIFIED (REAL WHATSAPP) | Dummy Test selected HIFU and Shiloh displayed `Practitioner: Marietjie` with Today/Tomorrow/date input. |
| Client authoritative availability SQL | 🟢 VERIFIED (ENGINEERING + REAL WHATSAPP) | PR #174 repaired PostgreSQL `42P10`; real re-acceptance then produced authoritative morning HIFU/Marietjie slots and working two-page pagination. |
| Availability-list pagination copy | ⚪ POLISH | Functional two-page slot navigation is real-WhatsApp verified. Destination descriptions `Page 2 of 2` / `Page 1 of 2` remain mildly ambiguous and should later become explicit `Go to page …` copy without interrupting lifecycle acceptance. |
| Dummy Test reset | 🟢 VERIFIED (PRODUCTION TOOLING) | PR #167 merged as `376ab4fd…`; JP/Christel Admin → Clients can reset Dummy Test using the same guarded archive/contact-release model as Chenique/Juvan. |
| Live Dummy Test booking | 🟢 VERIFIED (REAL WHATSAPP + CALENDAR) | Dummy Test accepted policy version `2026-08-11-v1`; appointment #561 was created for HIFU / Marietjie / Fri 14 Aug 2026 / 11:00–11:30. Matching events were independently verified in `Shiloh — Bookings` and Marietjie calendars. |
| Booking-confirmation client copy | ⚪ POLISH / NOT YET DEPLOYED | Real confirmation exposed internal appointment ID, Calendar sync and `canonical CRM` / `calendar revalidation` diagnostics. Isolated `polish-client-booking-confirmation` branch has regression-first work; do not claim production polish until merged/deployed. |
| Live CRM catalogue fidelity | 🟠 VERIFY IN JOURNEY | Real WhatsApp exposed CRM-backed Beauty catalogue rows, durations, prices and selected HIFU → Marietjie truth. Direct Render Postgres query connector remains unavailable (`SSL/TLS required`), so do not invent direct-row verification. |
| Controlled booking creation | 🟢 VERIFIED TO WHATSAPP + BOTH CALENDAR MIRRORS | Real appointment #561 was created after policy acceptance and final checks. Shared and practitioner Calendar mirrors match CRM appointment identity. Direct CRM connector read remains tooling-limited, so preserve evidence wording precisely. |
| Bare RESCHEDULE / CANCEL routing | 🟢 ENGINEERING DEPLOYED / 🔵 REAL RE-ACCEPTANCE | Real `RESCHEDULE` fell through to generic assistant because bare command was not recognized. PR #177 proved red in CI #435, normalized exact `RESCHEDULE`/`CANCEL` into existing canonical appointment-change routing, passed CI #437, merged as `441f4df…`, and Render deploy `dep-d9v1bsoae00c738t5qkg` is live. Re-run `RESCHEDULE` on #561 now. |
| Cancellation/reschedule acceptance | 🔵 ACTIVE / PRODUCT-CRITICAL | Use appointment #561. Reschedule must carry forward the known booking, revalidate the replacement slot, preserve the current appointment until successful confirmation, then synchronize canonical CRM and Calendar mirrors. Cancellation follows after reschedule verification. |
| Client communication lifecycle | 🔵 ACTIVE IN JOURNEY | Real booking confirmation and a reminder were observed. Continue lifecycle/provider acceptance; exact Meta template approvals must still be positively verified before promoting provider-gated items. |
| Error recovery / conversational resilience | 🟢 VERIFIED (CODE-LEVEL) | PR #163 deployed. Real provider/WhatsApp acceptance remains part of the controlled journey. |
| Client privacy/data minimization | ⏸️ OPEN / NOT CURRENT CRITICAL PATH | PRs #164/#165 and provider map remain valid safe foundations. Destructive execution remains disabled. Resume governance after client gate unless immediate safety blocker appears. |
| Final Client Perspective release gate | 🔵 ACTIVE / GATED | Requires successful reschedule + cancellation + remaining lifecycle evidence and resolution/recording of client-copy polish; backend tests or deployment alone do not close it. |

## Current production baseline

- GitHub `main` and Render production are positively aligned on `441f4dfaaebd955d9325296ac74510312254906d` from PR #177 (`Fix bare client reschedule command`). Render deploy `dep-d9v1bsoae00c738t5qkg` is `live` on 2026-08-13.
- PR #177 is a narrow routing repair only: exact bare `RESCHEDULE` or `CANCEL` is normalized to the existing appointment-change vocabulary before `processAppointmentChangeMessage()`. It does not change canonical appointment mutation, availability revalidation, reschedule atomicity, compensation, or Calendar synchronization semantics.
- Self-test-first evidence for PR #177: regression-only CI #435 failed before implementation; corrected candidate CI #437 passed; final patch inspection showed only `src/controllers/webhookController.js` and `tests/client-appointment-reschedule-atomicity.test.js`.
- Real Dummy Test evidence now positively establishes first-time registration, four service families, Beauty treatment presentation, HIFU → Marietjie routing, authoritative morning availability, two-page slot pagination, booking preference review, Booking Policy & Terms acceptance, appointment #561 creation, and matching shared/practitioner Calendar mirrors.
- The client confirmation copy still exposes internal diagnostics. The isolated `polish-client-booking-confirmation` branch is not merged; preserve this as active polish debt rather than silently treating it as production-complete.
- G1 remains resolved operationally: production Postgres `shiloh-memory` is `Basic-256mb` with the former Free expiry removed. Recovery/HA claims remain evidence-bounded.
- Provider/privacy foundations remain deployed; C1.10 is open but subordinate to the current real-client acceptance gate.

## Preserved client-booking truth

- Canonical client-facing full name: **Shiloh Massage Therapy and Aesthetic Clinic**. Use `Shiloh` naturally as the short brand.
- **JP = Jean-Pierre**. `JP` is shorthand/display terminology for the existing Jean-Pierre staff/admin identity only; never create a parallel CRM/staff/WhatsApp/permissions identity from that shorthand.
- WhatsApp/Shiloh is the client/staff interaction surface; CRM is authoritative for client/service/practitioner/appointment truth; Google Calendar is availability/diary/mirror infrastructure.
- Real client booking acceptance cannot be substituted by backend tests, Demo Client simulation, direct CRM mutation or Calendar-only evidence.
- Dedicated non-admin identities are the correct client acceptance surface; `Dummy Test` is preferred unless authoritative evidence changes it.
- WhatsApp self-registration uses the inbound sender number as the initial WhatsApp/contact identity. Staff/walk-in registration may still require an explicit mobile number where the client identity cannot be derived from an inbound WhatsApp message.
- New self-registration asks for **First name + Surname + Date of birth + Gender** together, accepts natural bundled or progressive replies, and asks only for missing/ambiguous fields.
- Registered-client service entry is: **Beauty & Aesthetics / Massage / Lymphatic Drainage / Elim MediHeel Pedicures**. The first four-way choice is a WhatsApp list because reply buttons support only three choices.
- Beauty & Aesthetics → Marietjie; Massage → Christel or Abigail according to current CRM eligibility; Lymphatic Drainage → Abigail; Elim MediHeel Pedicures → current CRM-mapped Marietjie pedicure/MediHeel/Elim treatments. Actual treatment rows and final practitioner eligibility remain CRM-derived/fail-closed.
- Natural language remains supported. A registered client message such as `Can Abigail see me tomorrow?` must not be unnecessarily forced backwards through the menu.
- Genuine Meta WhatsApp interactive controls/lists with stable IDs are the product standard where supported.
- Appointment-management commands shown to clients must route back into canonical appointment context; clients should not be asked to re-enter known service/practitioner/current-booking data when Shiloh can safely resolve it.
- Rescheduling must leave the current appointment unchanged until a replacement slot is positively revalidated and confirmed; abandoned/failed reschedules must fail closed.

## Engineering debt that must not disappear

- **Test-client reset configurability:** the current Chenique/Juvan/Dummy Test reset mechanics are intentionally guarded but the allowlist lives inside a mutation-heavy service that the connected GitHub safety layer may refuse to edit. Refactor future approved test identities into a separate non-destructive config/allowlist source while keeping archival/contact-release mechanics frozen and guarded. Manual GitHub editing by the owner is not the preferred normal engineering workflow; exhaust safe automated paths first.
- **Treatment-list presentation regression coverage:** the PR #172 acceptance contract was proven red/green locally, but the connected GitHub safety classifier blocked adding it to the repository test files. Preserve this as explicit debt: add equivalent repository regression coverage when a safe write path is available; do not remove the deployed adapter merely because the test write was blocked.
- **Booking-confirmation client copy:** remove internal appointment/sync/canonical-CRM diagnostic wording from client-facing success output while preserving operational logs/audit evidence. Regression-first work exists on `polish-client-booking-confirmation`; it is not yet production-live.
- **Availability pagination wording:** align slot page navigation descriptions with the already-fixed treatment-list convention (`Go to page X of Y`) when safely convenient; functionality itself is real-WhatsApp verified.
- **Master/Tracker continuity:** after every material product-state change, re-rank against the Product-Critical Gate and reconcile both documents; specialist handoffs never become competing masters.

## Cross-chat operating rule

1. Read Master first, Tracker second; verify GitHub `main` + Render production.
2. Identify production defects and the Product-Critical Gate before ordinary workstream ordering.
3. Treat human-assisted acceptance as actionable when the authorised tester is present; never infer results.
4. Work the highest-risk actionable product gate/defect first.
5. Re-rank after every blocker removal.
6. Preserve genuinely unavailable external/human truth fail-closed.
7. Before ending substantial work, reconcile Master + Tracker.

The Tracker is a view of the Master, not an independent authority. If they disagree, verify operational evidence and reconcile the discrepancy rather than silently choosing one.
