# Shiloh OS — Master Project Status

Updated: 2026-08-13
Purpose: permanent project-management source of truth across ChatGPT sessions.

## Authority model

Operational truth remains, in order relevant to the work: GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human acceptance evidence.

This file is the **project-management ledger**. Specialist handoffs are execution detail beneath this ledger; they never replace or silently close parent work here. Chat history is supporting context, not the master task list.

## Status legend

- ✅ completed and sufficiently production-verified
- 🔵 active workstream / currently being audited
- ⬜ actionable and unfinished
- 🟡 blocked on external or human truth; never infer
- ⏸ intentionally deferred

## Current technical baseline

- Immediately before this reconciliation, GitHub `main` was `cec710ac06df7e93d2427e14ae62e3621f52cfb8`, a ledger-only Meta portfolio reconciliation commit. Its production-code ancestry includes `640d0b6870632f3eaf21a601f5c70db082b6b521` (PR #160) plus later documentation/ledger reconciliation commits.
- Client Perspective Testing production fixes through PRs #156–#160 are merged:
  - #156 clears stale booking intent on client Home/Menu/Back escape paths.
  - #157 supports the natural sequential registration path name → mobile → DOB while preserving identity-conflict safeguards.
  - #158 makes client rescheduling atomic across CRM/calendar conflict revalidation and compensates partial Calendar movement on failure.
  - #159 adds durable per-appointment booking-confirmation delivery claiming to prevent duplicate confirmations on retry/concurrency boundaries.
  - #160 gates post-appointment follow-up on explicit canonical `completed` attendance only.
- Earlier 12 Aug production ancestry includes the attendance/finalization and earnings work reconciled from `docs/HANDOFF-NEXT-CHAT-2026-08-12.md`: explicit attendance certification authority, historical 1–8 Aug Christel/Abigail correction, completed-only earnings integrity, explicit period selection, Marietjie earnings, and practitioner-scoped finalization UX.
- Earlier 12 Aug Admin/client-booking foundations are also in the deployed ancestry and remain regression evidence, not a substitute for unfinished live acceptance:
  - PR #104 / `b822331d1e8f64ae822aa8e0cc5e084e2bd5dedd` made successful Demo Client cleanup mandatory and fail-closed.
  - Admin demo access/escape, natural DOB input, appointment routing, reporting integrity, Last Week earnings, and guided client lookup were subsequently merged and production-promoted through PRs #105–#108, including `eef27f4a9658e6a21f438a414f9e914fe93f1c94` and `0bbb74761eda883fce561c3904426f57edce8213`.
  - These foundations do **not** close the remaining role-specific Admin acceptance, reporting acceptance, practitioner-information, or true-client booking gates below.
- Privacy/data-minimization hardening already present in the deployed ancestry includes P-PRIV-1 through the currently implemented P-PRIV-4 gates: fail-closed AI profile preference allowlisting, bounded local OpenAI conversation-state retention, short-lived temporary onboarding/walk-in staging retention, non-destructive client privacy inventory/retention planning, and privacy-request identity-verification/owner-authorization workflow state. Destructive privacy execution remains intentionally disabled.
- The dedicated client audit is documented in `docs/HANDOFF-CLIENT-PERSPECTIVE-TESTING-2026-08-13.md`; its original checklist text is historical execution detail where this master reconciliation records newer evidence/status.
- The prior production handoff remains `docs/HANDOFF-NEXT-CHAT-2026-08-12.md` and is retained as historical/supporting detail, not as a competing master checklist. It also preserves two user-supplied shared ChatGPT conversation references as supporting context; they are not production authority.
- Every new session must verify current GitHub `main` and Render before relying on a commit/deploy identifier recorded here.

# Master remaining-work ledger

## A. Attendance, finalization and earnings

### A0. ✅ Attendance/earnings production foundation implemented

Evidence reconciled from the 12 Aug production session and handoff:
- Attendance is explicit human truth; elapsed appointment time or a Calendar event never auto-completes a visit.
- Certification authority is enforced server-side:
  - Marietjie -> Marietjie appointments only.
  - Abigail -> Abigail appointments only.
  - Christel -> Christel + Abigail appointments.
  - Jean-Pierre -> business-wide review visibility only; no routine Completed/No-show certification authority.
- `Finalize past visits` uses practitioner-scoped queues and explicit Completed / No-show decisions; canonical writes update appointment status, status history, lifecycle and CRM audit evidence transactionally.
- A proof-bound historical correction for **1–8 August 2026 inclusive, Christel + Abigail only** identified 29 exact calendar-linked CRM appointments and recorded all 29 as `completed`; 0 were already completed, cancelled or no-show. The one-time maintenance startup hook was removed afterward. **Do not extend this historical completion assumption beyond 8 August.**
- Earnings reports are completed-only and fail closed around unresolved attendance, joint-practitioner attribution and missing CRM prices.
- Earnings routes expose Today / This Week / Last Week / This Month instead of silently defaulting the Reports menu to Today.
- Abigail rule: 20% commission on qualifying completed solo treatment value + R5,000 fixed salary in monthly view only.
- Christel rule: 100% of qualifying completed solo treatment value; clinic-wide revenue/other-practitioner earnings remain separate.
- Marietjie rule: 100% of qualifying completed solo treatment value, no salary.
- Marietjie earnings are authorized for Marietjie self-view (canonical staff binding), Christel and Jean-Pierre; Abigail has no access.
- End-of-day/next-morning attendance-finalization reminder infrastructure is implemented and WhatsApp-template gated/fail-closed.

### A1. 🟡 Six known Christel/Abigail attendance finalizations

Last evidenced August report state:
- Abigail: 2 unresolved.
- Christel: 4 unresolved.
- These require genuine practitioner/supervisor Completed / No-show truth.
- Never infer outcomes from elapsed time, Calendar events, or earnings needs.
- Christel may certify Christel + Abigail visits; Abigail may certify Abigail visits; Jean-Pierre has business-wide review visibility but no routine certification authority.
- No evidence in the reconciled session establishes that these six have since been finalized, so preserve 🟡.

### A2. ⬜ Production acceptance of finalization/earnings UX

- Verify the simplified practitioner `Finalize past visits` queues from real authorized accounts.
- After A1 is resolved, re-run Abigail and Christel `This Month` reports and verify pending/final state from CRM truth.
- Last real-user August screenshots established that the period-routing defect was fixed and the reports were calculating non-zero completed earnings:
  - Abigail: 19 completed solo appointments; R11,800 completed treatment value; R2,360 commission; R5,000 salary; R7,360 total gross compensation; 2 pending; PROVISIONAL.
  - Christel: 10 completed solo appointments; R5,460 completed treatment value/earnings; 4 pending; PROVISIONAL.
- These are snapshots, not frozen ledger amounts. Re-query after attendance truth changes.
- Test Marietjie -> Admin -> Reports -> Marietjie earnings -> This Month from her real account; the self-view implementation is deployed but no reconciled real-account screenshot/acceptance closes it.
- Inspect any Marietjie pending visits through her own queue; do not assume zero.
- Preserve the already-deployed earnings period choices and fail-closed reporting-integrity behavior; do not treat backend/regression presence as complete real-account acceptance.
- Fix only established defects.

### A3. 🟡 Staff finalization reminder template

- `shiloh_staff_finalization_v1` last evidenced Meta state: PENDING.
- Managed provisioning/status discovery exists; reminder sending remains fail-closed until provider status is positively APPROVED.
- No later approval evidence is present in this reconciliation, so preserve 🟡.

## B. Admin acceptance and Jean-Pierre role/testing

### B1. ⬜ Remaining Admin route acceptance

- Continue only genuinely unfinished real-WhatsApp role-specific paths for Christel, Abigail, Marietjie and Jean-Pierre.
- Do not redo regression-locked coverage.
- Verify section -> action -> guarded owner -> Back/Menu behavior and role visibility.
- 12 Aug session evidence to preserve without overstating completion:
  - numbered top-level appointment selections were repaired so displayed Today/Tomorrow choices no longer fall through to the generic assistant;
  - `Last week's clients` was added as an operational appointment-history view;
  - `Find a client` now has guided state so a next reply such as `Juvan`, `Find Juvan`, or a mobile number is interpreted as the lookup term;
  - `Menu` / `Admin Menu` / `Home` can safely escape an unfinished Demo Client session back to Admin Mode;
  - the audit still identified the architectural risk of relying on dynamic numbered text, so stable real WhatsApp interactive-list IDs remain the preferred Admin UX direction where not already implemented.

### B2. ⬜ Reconcile Jean-Pierre Admin capability and client-test strategy

Prior requirement to preserve:
- Jean-Pierre needs a practical Admin experience comparable to Christel where business authority permits, but authorization must remain role/authority based rather than blindly cloning certification powers.
- Jean-Pierre also needs to be able to test the genuine first-time client journey.

Verified Demo Client foundation from the 12 Aug session:
- controlled Demo Client access was extended to the authorized practitioner-admin test set and regression-locked with practitioner/service eligibility boundaries;
- successful demo booking cleanup is mandatory/fail-closed, with demo appointment/calendar cleanup and synthetic-client deactivation while preserving audit evidence;
- unfinished demo state can be escaped safely to Admin Mode without deleting a created real appointment.

Decision rule:
- Do **not** disable or weaken Jean-Pierre's production Admin identity merely to test client behavior until the identity-routing architecture is audited.
- `Demo Client` is useful for safe/non-mutating Admin-side simulation, but it is **not sufficient by itself** to certify the true external first-time client journey, WhatsApp identity registration, real CRM creation, Calendar booking, webhook/idempotency, and client-facing UX.
- Use dedicated non-admin client test identities (currently `Dummy Test`, plus Chenique/Juvan resettable test identities where appropriate) for true client acceptance unless a separately designed reversible Admin/client mode switch is proven safe and necessary.

## C. Client Perspective Testing

### C1. 🔵 Dedicated end-to-end client audit

Execution checklist: `docs/HANDOFF-CLIENT-PERSPECTIVE-TESTING-2026-08-13.md`.

This workstream is a child of the broader production acceptance work; it does not replace sections A, B, D or E.

#### Reconciled Client Perspective Testing status — 2026-08-13 session

1. 🟡 **Resume live Dummy Test booking after PR #155** — still requires real Dummy Test WhatsApp retry/acceptance. Do not infer from backend evidence.
2. 🟡 **Non-mutating end-to-end route audit** — route/regression evidence is clean enough to expose and fix stale Home/Menu/Back booking state in PR #156, but authoritative live CRM family/service/practitioner mapping comparison remains blocked by the Render Postgres connector SSL/TLS failure. Preserve fail-closed rather than declaring full completion.
3. ✅ **Client registration acceptance matrix** — regression-audited and production-fixed through PR #157, including sequential mobile entry, supported normalization, identity conflict protection, incomplete-client continuation and post-registration service-family transition. Earlier Demo Client/onboarding UX work also regression-locked clear natural DOB forms such as `20/10/1988` and `20 Sep 1988`; ambiguous/impossible dates remain rejected.
4. 🟡 **CRM catalogue fidelity audit** — repository/query behavior confirms active-only filtering and CRM-derived presentation/eligibility, but authoritative live CRM catalogue comparison remains blocked by the Render Postgres connector SSL/TLS failure and unavailable fallback read. Do not guess.
5. ✅ **Date/time availability and Calendar conflict audit** — non-mutating production evidence verified shared/practitioner Calendar reads, stale-slot revalidation, final pre-write conflict checks, practitioner eligibility and fail-closed conflict behavior.
6. 🟡 **Controlled booking creation acceptance** — backend commit path is policy-gated, transaction-locked, conflict-revalidated and Calendar-compensating, but the required real Dummy Test WhatsApp booking plus exact CRM/Calendar acceptance evidence has not been performed in this session.
7. 🟡 **Client self-service appointment management** — backend reschedule race/partial-Calendar failure defects were fixed and deployed in PR #158; final cancellation/reschedule acceptance still requires a real controlled Dummy Test appointment from item 6.
8. 🟡 **Client communication lifecycle** — duplicate booking-confirmation risk fixed in PR #159 and premature follow-up eligibility fixed in PR #160. Backend regressions are green and production-deployed, but real WhatsApp lifecycle acceptance/provider truth remains outstanding; do not promote to complete by inference.
9. ⬜ **Error recovery / conversational resilience audit** — partially audited. Stale slot actions fail closed, invalid date/time parsing does not silently normalize bad input, and failed final booking writes preserve explicit retry state with transactional CRM rollback/known Calendar compensation. Still investigate the distributed uncertainty edge where Google Calendar may accept an event but the HTTP result is uncertain before Shiloh records it; prove that a rolled-back CRM attempt cannot leave an orphan/duplicate Calendar event when a later retry allocates a different appointment ID. No production fix has yet been justified for this edge.
10. ⬜ **Client privacy and data-minimization acceptance** — materially advanced but not complete. Evidence established in this session:
   - P-PRIV-1: general AI context now excludes opaque `custom_attributes` and uses an exact fail-closed preference allowlist; unknown, broad, medical-looking or future unclassified preference keys do not reach the LLM by default.
   - P-PRIV-2: local OpenAI `previous_response_id` mappings have a bounded short reuse window with stale-session rejection/deletion and periodic cleanup. Provider-side OpenAI retention remains a separate documented boundary; no claim is made that local deletion erases provider-side state.
   - P-PRIV-3: temporary WhatsApp onboarding and staff walk-in staging data has short bounded retention and automatic cleanup that does not delete canonical `clients` or `client_contacts` records.
   - P-PRIV-4: Shiloh now has a protected non-destructive client privacy inventory, fail-closed retention classifications, and a privacy-request workflow for access/correction/deletion/de-identification/objection with explicit identity-verification evidence and a separate owner-authorization gate. Unknown client-linked data remains `manual_review_required`.
   - P-PRIV-4 remains deliberately non-destructive: `executionReady=false` and `destructiveActionAllowed=false`; no production erase/de-identification executor exists. The separate owner approval secret is not yet configured, so sensitive authorization transitions remain fail-closed.
   - Remaining privacy acceptance work: build and regression-test a transaction/rollback execution-plan simulator on synthetic data; establish approved retention/legal basis and owner-facing approval handling; then decide whether any real destructive/de-identification executor is appropriate. Do not mark this item complete until those controls and production acceptance are evidenced.
11. ⬜ **Final Client Perspective release gate** — cannot close until all actionable items are complete or explicitly 🟡, the real Dummy Test happy path is proven, one controlled booking is verified in CRM + Calendar, cancellation/reschedule is accepted, privacy/error-recovery acceptance is resolved to supported final states, and remaining blockers are documented fail-closed.

Preserved product requirements/decisions:

- New-client registration supports sequential entry and bundled full-name/mobile/DOB input.
- Post-registration booking is service-family first:
  - Beauty & Aesthetics -> Marietjie.
  - Massage -> Christel or Abigail according to actual CRM eligibility.
  - Lymphatic Drainage -> Abigail only.
- Actual treatment names and practitioner eligibility remain CRM-derived/fail-closed rather than a hard-coded catalogue.
- Clients should be able to understand **which practitioner offers which services** before committing to a booking.
- Conversational questions such as `What does each practitioner do?`, `Tell me about Marietjie`, or `Who does massage?` require an authoritative client-facing answer rather than generic AI invention.
- Current intended practitioner positioning to preserve in client UX:
  - Marietjie: Shiloh's Esthetician / Beauty & Aesthetics practitioner.
  - Christel: Shiloh owner and active Massage practitioner.
  - Abigail: Shiloh Massage practitioner and the practitioner for Lymphatic Drainage.
- Booking must not hide practitioner choice behind an optional default where a meaningful client choice exists. For a service with multiple eligible practitioners, offer the eligible choices (and `Any available` where appropriate); where only one practitioner is genuinely eligible, skip an unnecessary choice while clearly communicating who will provide the treatment.

### C2. ⬜ Practitioner-information conversational audit

- Verify the AI/client route can answer practitioner-role/service questions from authoritative CRM/configured business knowledge.
- Verify no invented qualifications, services, ownership claims or eligibility.
- Ensure service-family UI and free-text answers tell the same operational story.
- Add regression coverage and production acceptance where gaps are established.
- 12 Aug audit evidence established the reason this remains separate: the general AI context had the active service catalogue and booking rules, while practitioner↔service eligibility was enforced deeper in booking/availability and there was no dedicated authoritative public practitioner-profile layer. That finding supports this item; it does not prove the current live route complete.
- Do not treat the partial family/service/practitioner evidence from C1 as completion of this dedicated conversational acceptance item.

### C3. 🟡 True first-time booking acceptance

- Complete a controlled real-client registration -> family -> treatment -> practitioner resolution -> date/time -> confirmation journey.
- Verify canonical CRM appointment and Google Calendar event.
- Verify retry/idempotency and supported cancellation/cleanup behavior.
- `Dummy Test` is the preferred dedicated work-time client identity unless authoritative evidence changes this.
- Backend prerequisites are substantially regression-covered, but this item is now explicitly human/real-WhatsApp acceptance blocked; do not substitute direct CRM/Calendar mutation for the client path.

## D. Client lifecycle / automation blockers

### D1. 🟡 Birthday automation

- `shiloh_birthday_wish_v2` last known Meta state: PENDING.
- Keep sending disabled until positively APPROVED and copy/current configuration is verified.

## E. P4 payments / Ozow

### E1. 🟡 Ozow activation gate

- Blocked on actual Ozow merchant/account configuration and explicit Shiloh rules for payable amount/deposit/full payment, refunds and Shiloh-issued gift vouchers.
- Payment truth remains separate from booking, attendance, Calendar and loyalty truth.

### E2. ⬜ Safe P4 engineering after higher-priority acceptance is clean

- Continue only provider-independent/sandbox-safe contracts, reconciliation/idempotency, sanitized observability and tests.
- No live payment activation while E1 is unresolved.

## F. Meta Business Portfolio consolidation / production ownership

### F1. ✅ Keeper portfolio and core production ownership mapped

Evidence from direct Meta Business Suite inspection in the Meta consolidation session:
- Business Portfolio `406573210678288` is the keeper portfolio; do **not** delete it.
- `Shiloh_MTC` Meta App ID `1574685370960526` is present in this portfolio. Christel Botha and the `Employee` system user both showed full app access during inspection.
- Production `Shiloh_MTC` WhatsApp Business Account ID `4002592316709920` is present in this portfolio.
- The production WhatsApp number was verified after the Page consolidation as **Connected** with **High** quality rating.
- The Test WhatsApp Business Account remains present.
- Do not revoke tokens, remove the app/WABA/system user, or delete the portfolio without a separately evidenced migration plan.

### F2. ✅ Existing Shiloh Facebook Page consolidated into keeper portfolio

- Existing Page `Shiloh Massage Therapy Clinic PTYltd`, Page ID `865103253344538`, was found through Meta's `Add an existing Facebook Page` workflow.
- Meta showed Christel Botha (You) as the existing person with Page access and stated the request would be approved automatically because she had full control of the business portfolio.
- Meta confirmed `Page added successfully`.
- Post-change verification under Accounts -> Pages showed the existing Page in the keeper portfolio, owned by Christel Botha, with Christel as the single assigned person with full access.
- Immediate post-change WABA verification remained **Connected / High**, providing evidence that this consolidation did not disturb the production WhatsApp asset state.

### F3. ⬜ Existing Instagram account ownership/connection audit

- Keeper portfolio inspection showed **no Instagram accounts added** before any Instagram change.
- A likely existing Shiloh Instagram identity was identified as `@shiloh_massage_studio`, but public-link inspection was insufficient to establish account type, ownership or Meta connection.
- Do **not** create a duplicate Instagram account.
- Next safe step: inspect Meta's existing-account connection workflow and verify the exact Instagram identity/ownership/access before connecting it to the keeper portfolio.

### F4. ⬜ Portfolio naming and business-verification remediation

- Keeper portfolio is still displayed as `Christel Botha`, which is operationally confusing beside the personal/account context. Rename only after the asset map remains stable and the correct business-facing name is chosen.
- Portfolio-level business verification was observed as **Rejected**; the WABA summary separately showed business verification as **Unverified** while account status was Approved. Treat these as distinct Meta states and do not infer resolution.
- Investigate the rejection reason and reconcile legal/business details against authoritative company documentation before resubmitting.
- No portfolio deletion is currently justified: the earlier apparent duplicate was shown to be a personal/account context versus the production Business Portfolio, not two interchangeable portfolios.

# Cross-chat continuity protocol — mandatory

1. Every Shiloh OS chat starts by reading this file first.
2. Verify GitHub `main` and Render production before claiming the current deployed baseline.
3. If the active item links to a specialist handoff, read that handoff second.
4. Never create a new independent master checklist in a specialist handoff.
5. New findings are added to this ledger under the correct parent workstream; they are not allowed to disappear merely because the chat changes.
6. When work is completed, update the relevant status here only after evidence supports completion.
7. When a task is blocked, mark/preserve 🟡 and continue to the highest-priority genuine ⬜ item rather than silently dropping it.
8. Before ending a substantial work session, reconcile this ledger against any specialist handoff changed during that session.
9. Do not mark human truth (attendance, payment, identity, cancellation, etc.) complete by inference.

# Current recommended execution order

1. 🔵 Continue Client Perspective Testing at C1 item 9 (Error recovery / conversational resilience), because items 1, 2, 4, 6, 7 and 8 are preserved 🟡 and item 9 remains the highest-priority genuine ⬜ item.
2. ⬜ Continue C1 item 10 privacy acceptance only after preserving item 9 priority: next privacy engineering step is the synthetic transaction/rollback execution-plan simulator; destructive execution remains disabled.
3. ⬜ Incorporate C2 practitioner-information/service-visibility acceptance without losing its separate conversational requirements; do not infer live CRM mapping truth while the authoritative read remains blocked.
4. ⬜ Continue F3 Meta/Instagram consolidation only through verified existing-account ownership/access; do not create a duplicate account or disturb the production WABA/app chain.
5. ⬜ In parallel where non-mutating, continue A2/B1 evidence gathering: practitioner finalization queues, Abigail/Christel post-finalization reports when human truth is supplied, and Marietjie real-account earnings acceptance.
6. 🟡 Preserve A1, A3, C3, D1 and E1 until their real external/human facts become available.
7. ⬜ Return to safe P4 engineering only after the higher-priority production acceptance work is clean.

# Standard new-chat prompt

**Shiloh OS**

Continue from `docs/SHILOH-OS-MASTER-STATUS.md`. Treat it as the permanent project-management ledger.

Treat GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human acceptance evidence as operational truth.

Read the master ledger first, then read the specialist handoff linked by the currently active workstream. Do not create a competing checklist or redo completed work. Preserve all 🟡 blockers and continue with the highest-priority genuine ⬜ item. Apply the safe self-test-first engineering rule automatically. Update the master ledger when evidence changes project status.