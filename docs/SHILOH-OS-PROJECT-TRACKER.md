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
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Real Dummy Test journey is in progress. Registration and four-family entry are accepted; current stop is Beauty & Aesthetics treatment-list presentation polish. |
| C2 | Practitioner-information conversational audit | ⚪ READY / IN-JOURNEY | Exercise natural practitioner/service questions during real client acceptance; verify no invention and consistency with CRM booking eligibility. |
| C3 | True first-time booking acceptance | 🔵 ACTIVE / HUMAN-ASSISTED | Continue Dummy Test from treatment discovery through availability, booking and exact CRM + Calendar evidence. |
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
| First WhatsApp client entry UX | 🟢 VERIFIED (REAL WHATSAPP) | Dummy Test received the Shiloh introduction and was correctly recognized as unregistered. No redundant mobile-number prompt. |
| New-client registration | 🟢 VERIFIED (REAL WHATSAPP HAPPY PATH) | Dummy Test submitted `Dummy Test, 14 May 1990, Female` in one message; registration completed and transitioned directly to booking. Progressive/partial real acceptance remains useful but is not required to repeat the proven bundled path. |
| Four service families | 🟢 VERIFIED (REAL WHATSAPP) | Real list showed `Beauty & Aesthetics`, `Massage`, `Lymphatic Drainage`, `Elim MediHeel Pedicures`. |
| Initial booking copy | 🟢 VERIFIED (REAL WHATSAPP) | PR #169 moved the client-facing booking prompt to `src/config/clientCopy.js`; CI #415 passed and production copy now says `Choose a service below and I’ll show you the available treatments and practitioners. 🌿` without CRM jargon. |
| Family treatment prompt | 🟢 VERIFIED (REAL WHATSAPP) | PR #170 polished the Beauty & Aesthetics prompt to `Choose the treatment you’d like to book. 🌿`; CI #422 passed; Render deploy `dep-d9v0bu5bedkc73c470g0` is live on merge `0f4e6b966d0635e74ddf45824f85488283083435`; real WhatsApp screenshot accepted. |
| Beauty & Aesthetics treatment list | 🔴 UX DEFECT / CURRENT STOP | Real WhatsApp catalogue works and is CRM-derived, but client presentation needs polish before proceeding: long names are heavily truncated; price formats are inconsistent; `More treatments → / Page 2 of 4` is ambiguous on the first displayed page. Fix presentation only; preserve CRM catalogue/eligibility truth. |
| Dummy Test reset | 🟢 VERIFIED (PRODUCTION TOOLING) | PR #167 added guarded Dummy Test reset to JP/Christel Admin → Clients. |
| Live Dummy Test booking | 🔵 ACTIVE | Resume at Beauty & Aesthetics treatment list after the current presentation defect is fixed; then continue treatment → practitioner → availability → booking. |
| Live CRM catalogue fidelity | 🟠 VERIFY IN JOURNEY | Direct Render Postgres query connector remains unavailable (`SSL/TLS required`). Do not guess; verify through guarded application/CRM evidence where available. |
| Controlled booking creation | ⚪ READY AFTER JOURNEY REACHES CONFIRMATION | WhatsApp success is not proof: verify canonical CRM appointment and Google Calendar mirrors. |
| Cancellation/reschedule acceptance | ⚪ READY AFTER CONTROLLED BOOKING | Use the controlled appointment created by this journey. |
| Client communication lifecycle | ⚪ READY IN/AFTER JOURNEY | Verify real confirmation/reminder/follow-up provider behavior; exact Meta template approvals must be positively verified. |
| Error recovery / conversational resilience | 🟢 VERIFIED (CODE-LEVEL) | PR #163 deployed. Real provider/WhatsApp acceptance remains part of the controlled journey. |
| Client privacy/data minimization | ⏸️ OPEN / NOT CURRENT CRITICAL PATH | PRs #164/#165 and provider map remain valid safe foundations. Destructive execution remains disabled. |
| Final Client Perspective release gate | 🔵 ACTIVE / GATED | Requires real happy path plus booking-management lifecycle evidence; backend tests alone do not close it. |

## Current production baseline

- GitHub `main` and Render production are positively aligned on `0f4e6b966d0635e74ddf45824f85488283083435` from PR #170 (`Polish family treatment copy`). Render deploy `dep-d9v0bu5bedkc73c470g0` reached `live` on 2026-08-13.
- PR #168 introduced the four-family client entry and streamlined WhatsApp self-registration; final CI #409 passed.
- PR #169 polished the initial booking prompt and established `src/config/clientCopy.js` as a safe client-facing copy surface; CI #415 passed.
- PR #170 polished the family treatment prompt via a presentation/config boundary without changing CRM catalogue/eligibility logic; CI #422 passed.
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

## Engineering debt that must not disappear

- **GitHub write ergonomics / safe presentation surfaces:** GitHub plugin permission is already `Allow all actions`; intermittent write blocks are a separate safety-classification layer, not missing owner access. Continue moving harmless client-facing copy/presentation away from CRM/mutation-heavy modules so routine UX work can use safe config/presentation surfaces. Do not ask the owner to perform routine GitHub edits unless all supported automated paths are genuinely exhausted.
- **Test-client reset configurability:** refactor future approved test identities into a separate non-destructive config/allowlist source while keeping archival/contact-release mechanics frozen and guarded.
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
