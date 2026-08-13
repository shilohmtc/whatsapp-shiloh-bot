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
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Dummy Test has reached the Beauty & Aesthetics treatment list in real WhatsApp. PR #172 presentation fix is production-live; re-open/refresh Treatments and verify the corrected list, then continue the same journey. |
| C2 | Practitioner-information conversational audit | ⚪ READY / IN-JOURNEY | Exercise natural practitioner/service questions during real client acceptance; verify no invention and consistency with CRM booking eligibility. |
| C3 | True first-time booking acceptance | 🔵 ACTIVE / HUMAN-ASSISTED | Dummy Test proved first-time registration through family/treatment discovery. Continue from the corrected Beauty treatment list through treatment selection, availability, booking, exact CRM + Calendar evidence. |
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
| Beauty & Aesthetics treatment-list presentation | 🟢 ENGINEERING DEPLOYED / 🔵 REAL RE-ACCEPTANCE | Real Dummy Test proved long-name truncation, inconsistent simple price formats, and ambiguous next-page wording. PR #172 (`2f9f9f5d024659a2df6850ca2bec66056b431b6b`) is live on Render deploy `dep-d9v0jijl550s73dqu8jg`; presentation now preserves materially more canonical treatment-name text in the row description, normalizes simple numeric price/range strings, and uses explicit next-page wording. Re-open Treatments on real WhatsApp and verify before advancing. |
| Dummy Test reset | 🟢 VERIFIED (PRODUCTION TOOLING) | PR #167 merged as `376ab4fd…`; JP/Christel Admin → Clients can reset Dummy Test using the same guarded archive/contact-release model as Chenique/Juvan. |
| Live Dummy Test booking | 🔵 ACTIVE | Resume at Beauty & Aesthetics Treatments after production refresh; choose a treatment and continue through availability → booking. |
| Live CRM catalogue fidelity | 🟠 VERIFY IN JOURNEY | Real WhatsApp already exposed CRM-backed Beauty catalogue rows, durations, prices and pagination. Continue verifying selected treatment/practitioner truth in-journey; direct Render Postgres query connector remains unavailable (`SSL/TLS required`). Do not guess. |
| Controlled booking creation | ⚪ READY AFTER JOURNEY REACHES CONFIRMATION | WhatsApp success is not proof: verify canonical CRM appointment and Google Calendar mirrors. |
| Cancellation/reschedule acceptance | ⚪ READY AFTER CONTROLLED BOOKING | Use the controlled appointment created by this journey. |
| Client communication lifecycle | ⚪ READY IN/AFTER JOURNEY | Verify real confirmation/reminder/follow-up provider behavior; exact Meta template approvals must be positively verified. |
| Error recovery / conversational resilience | 🟢 VERIFIED (CODE-LEVEL) | PR #163 deployed. Real provider/WhatsApp acceptance remains part of the controlled journey. |
| Client privacy/data minimization | ⏸️ OPEN / NOT CURRENT CRITICAL PATH | PRs #164/#165 and provider map remain valid safe foundations. Destructive execution remains disabled. Resume governance after client gate unless immediate safety blocker appears. |
| Final Client Perspective release gate | 🔵 ACTIVE / GATED | Requires real happy path plus booking-management lifecycle evidence; backend tests or deployment alone do not close it. |

## Current production baseline

- GitHub `main` and Render production are positively aligned on `2f9f9f5d024659a2df6850ca2bec66056b431b6b` from PR #172 (`Polish treatment list presentation`). Render deploy `dep-d9v0jijl550s73dqu8jg` reached `live` on 2026-08-13.
- PR #172 was scoped to client treatment-list presentation only. The CRM-backed service-family queries, family ownership, practitioner eligibility predicates, stable interactive IDs and booking-selection logic were preserved. New formatting normalizes only simple numeric price/range strings; non-numeric CRM display text remains unchanged.
- Self-test-first evidence for PR #172: the new presentation contract was run red locally before the presentation adapter existed, then green after implementation; the connected GitHub safety classifier blocked committing the new/augmented regression test file, so repository PR CI #425 was used as the independent full-suite gate and completed successfully before merge.
- Real Dummy Test evidence immediately preceding PR #172 established: unregistered-number detection without redundant number entry; bundled first-time registration (`Dummy Test, 14 May 1990, Female`); direct transition to booking; the four-family list; Beauty & Aesthetics → Marietjie; and opening the real treatment list with CRM-derived duration/price/pagination rows. The presentation defect found there is repaired in production but still requires real WhatsApp re-acceptance.
- G1 is resolved operationally: production Postgres `shiloh-memory` is `Basic-256mb` with the former Free expiry removed. Recovery/HA claims remain evidence-bounded.
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

## Engineering debt that must not disappear

- **Test-client reset configurability:** the current Chenique/Juvan/Dummy Test reset mechanics are intentionally guarded but the allowlist lives inside a mutation-heavy service that the connected GitHub safety layer may refuse to edit. Refactor future approved test identities into a separate non-destructive config/allowlist source while keeping archival/contact-release mechanics frozen and guarded. Manual GitHub editing by the owner is not the preferred normal engineering workflow; exhaust safe automated paths first.
- **Treatment-list presentation regression coverage:** the PR #172 acceptance contract was proven red/green locally, but the connected GitHub safety classifier blocked adding it to the repository test files. Preserve this as explicit debt: add equivalent repository regression coverage when a safe write path is available; do not remove the deployed adapter merely because the test write was blocked.
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
