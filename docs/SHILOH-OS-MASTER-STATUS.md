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

- Immediately before this source-session reconciliation, GitHub `main` and Render production were aligned on `e62ce2681322b13b4f03e00df8a65391ccd66fa8`; its production-code ancestry includes `640d0b6870632f3eaf21a601f5c70db082b6b521` (PR #160) plus later documentation/ledger reconciliation commits.
- Client Perspective Testing production fixes through PRs #156–#160 are merged:
  - #156 clears stale booking intent on client Home/Menu/Back escape paths.
  - #157 supports the natural sequential registration path name → mobile → DOB while preserving identity-conflict safeguards.
  - #158 makes client rescheduling atomic across CRM/calendar conflict revalidation and compensates partial Calendar movement on failure.
  - #159 adds durable per-appointment booking-confirmation delivery claiming to prevent duplicate confirmations on retry/concurrency boundaries.
  - #160 gates post-appointment follow-up on explicit canonical `completed` attendance only.
- Earlier 12 Aug production ancestry includes the attendance/finalization and earnings work reconciled from the source chat and `docs/HANDOFF-NEXT-CHAT-2026-08-12.md`: explicit attendance certification authority, historical 1–8 Aug Christel/Abigail correction, completed-only earnings integrity, explicit period selection, Marietjie earnings, practitioner-scoped finalization UX, and the shared bounded Admin `Check next available` no-slot recovery action.
- The extended 11–12 Aug Shiloh OS production source session also established several foundations that remain relevant but do **not** replace unfinished live acceptance below:
  - canonical client-facing brand policy: **Shiloh Massage Therapy and Aesthetic Clinic**; use `Shiloh` naturally as the short brand and never expand/use `Shiloh MTC` as `Shiloh Medical Training Centre` in client-facing copy;
  - guarded August Goldie recovery after a read-only delta audit: seven missing real booking rows were restored, one duplicate source row was linked to the existing canonical appointment, and one `Personal` source row was promoted as a calendar block; the one-time audit/recovery hooks were removed after completion;
  - WhatsApp Admin is the staff booking-entry surface; CRM remains booking authority; Google Calendar is availability/diary/mirror infrastructure rather than a parallel client-booking database;
  - confirmed bookings are mirrored to `Shiloh — Bookings` and the selected practitioner calendar; manual practitioner-calendar events are availability blocks, while booking-like unlinked events are monitored/reviewed and are never silently imported into CRM;
  - practitioner-team Admin booking scope is Marietjie -> Marietjie mapped services only, Christel/Abigail -> their shared mapped service pool, with final `staff_services` eligibility still revalidated fail-closed;
  - genuine Meta interactive controls/lists are the preferred/implemented UX for menu/catalogue choices where supported; fake numbered "buttons" are not the product standard.
- Earlier 12 Aug Admin/client-booking foundations remain in the deployed ancestry and are regression evidence, not a substitute for unfinished live acceptance:
  - PR #104 / `b822331d1e8f64ae822aa8e0cc5e084e2bd5dedd` made successful Demo Client cleanup mandatory and fail-closed.
  - Admin demo escape, natural DOB input, appointment routing, reporting integrity, Last Week earnings, and guided client lookup were merged through PRs #105–#108.
  - PR #110 subsequently implemented the stable top-level WhatsApp Admin list that the earlier audit had recommended; PR #150 later added current-role visibility revalidation for stable Admin actions. Do not redo that architecture; remaining B1 work is real role-specific acceptance and genuine defects only.
  - PR #134 later retired the temporary Client Test Mode and hid/revoked production Demo Client permissions. The Demo engine/cleanup remains regression infrastructure; the earlier visible Demo Client rollout is superseded and must not be treated as currently enabled merely because PRs #100–#105 exist in ancestry.
- Privacy/data-minimization hardening already present in the deployed ancestry includes P-PRIV-1 through the currently implemented P-PRIV-4 gates: fail-closed AI profile preference allowlisting, bounded local OpenAI conversation-state retention, short-lived temporary onboarding/walk-in staging retention, non-destructive client privacy inventory/retention planning, and privacy-request identity-verification/owner-authorization workflow state. Destructive privacy execution remains intentionally disabled.
- The dedicated client audit is documented in `docs/HANDOFF-CLIENT-PERSPECTIVE-TESTING-2026-08-13.md`; its original checklist text is historical execution detail where this master reconciliation records newer evidence/status.
- The prior production handoff remains `docs/HANDOFF-NEXT-CHAT-2026-08-12.md` and is retained as historical/supporting detail, not as a competing master checklist. It also preserves two user-supplied shared ChatGPT conversation references as supporting context; they are not production authority.
- The Render Postgres query connector has repeatedly failed its direct read path with `SSL/TLS required`. Treat this as a tooling/authoritative-read limitation, not proof of a Shiloh application defect. Where it blocks live CRM verification, preserve the relevant item fail-closed or use an existing guarded application/CRM surface; never guess rows or statuses.
- Every new session must verify current GitHub `main` and Render before relying on a commit/deploy identifier recorded here.

# Master remaining-work ledger

## A. Attendance, finalization and earnings

### A0. ✅ Attendance/earnings production foundation implemented

Evidence reconciled from the 12 Aug production sessions and handoff:
- Attendance is explicit human truth; elapsed appointment time or a Calendar event never auto-completes a visit.
- Certification authority is enforced server-side:
  - Marietjie -> Marietjie appointments only.
  - Abigail -> Abigail appointments only.
  - Christel -> Christel + Abigail appointments.
  - Jean-Pierre -> business-wide review visibility only; no routine Completed/No-show certification authority.
- `Finalize past visits` uses practitioner-scoped queues and explicit Completed / No-show decisions; canonical writes update appointment status, status history, lifecycle and CRM audit evidence transactionally.
- A proof-bound historical correction for **1–8 August 2026 inclusive, Christel + Abigail only** identified 29 exact calendar-linked CRM appointments and recorded all 29 as `completed`; 0 were already completed, cancelled or no-show. The one-time maintenance startup hook was removed afterward. **Do not extend this historical completion assumption beyond 8 August.**
- The historical correction had intermediate production maintenance attempts that failed closed before changing attendance rows (schema/query-shape defects were corrected); the successful exact batch then ran and the temporary hook was removed. Those implementation incidents are superseded/closed and are not ongoing work.
- The earlier August Goldie delta/recovery is also completed historical reconciliation evidence: a guarded source audit identified nine source rows requiring account; the recovery created/restored seven real canonical bookings, linked the Gwendie duplicate source row to the existing canonical appointment rather than duplicating it, and represented the `Personal` row as a calendar block rather than a client booking. Distinct identities with shared/duplicate source contact evidence remained contact-unverified/outbound-not-authorized rather than being merged by assumption. One-shot audit/recovery startup hooks were removed afterward.
- Earnings reports are completed-only and fail closed around unresolved attendance, joint-practitioner attribution, missing CRM prices, and unresolved Goldie/reporting-integrity evidence rather than silently understating a clean-looking total.
- Earnings routes expose Today / This Week / Last Week / This Month instead of silently defaulting the Reports menu to Today.
- Abigail rule: 20% commission on qualifying completed solo treatment value + R5,000 fixed salary in monthly view only; no salary proration in shorter periods.
- Christel rule: 100% of qualifying completed solo treatment value; clinic-wide revenue/other-practitioner earnings remain separate.
- Marietjie rule: 100% of qualifying completed solo treatment value, no salary.
- Marietjie earnings are authorized for Marietjie self-view (canonical staff binding), Christel and Jean-Pierre; Abigail has no access.
- End-of-day/next-morning attendance-finalization reminder infrastructure is implemented and WhatsApp-template gated/fail-closed.
- Reminder-ledger deployment hardening is complete: runtime initialization is idempotent so the future reminder path does not depend on every historical migration having been auto-run by Render. Managed template provisioning/status discovery remains approval-gated.
- Temporary repository placeholder/no-op files and one-shot maintenance/audit hooks created during implementation were removed after their evidence was captured; they are superseded housekeeping, not open engineering work.

### A1. 🟡 Six known Christel/Abigail attendance finalizations

Last evidenced August report state:
- Abigail: 2 unresolved.
- Christel: 4 unresolved.
- These require genuine practitioner/supervisor Completed / No-show truth.
- Never infer outcomes from elapsed time, Calendar events, or earnings needs.
- Christel may certify Christel + Abigail visits; Abigail may certify Abigail visits; Jean-Pierre has business-wide review visibility but no routine certification authority.
- The direct Render Postgres read limitation prevented reliable connector-side enumeration during the source session; that does not authorize Calendar-based inference. Use the guarded `Finalize past visits` application surface or another authoritative CRM read when available.
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
- Preserve these production/business rules:
  - staff client bookings are initiated through Shiloh's WhatsApp Admin booking flow, not by manually creating a client appointment in Google Calendar;
  - Google Calendar remains availability/diary/mirror infrastructure: practitioner manual events may block availability, while client appointment authority remains the CRM/Shiloh booking path;
  - Marietjie Admin booking scope is her mapped services/practitioner only; Christel and Abigail use the shared Christel+Abigail mapped service pool, with final service/practitioner eligibility revalidated from canonical CRM mappings;
  - use genuine Meta WhatsApp interactive controls/lists with stable IDs wherever supported; legacy typed aliases may remain for resilience but should not be the primary UX.
- 12 Aug source-session evidence to preserve without overstating completion:
  - the shared Admin booking flow gained a bounded `Check next available` action after a no-slot result; it searches forward through canonical availability while preserving selected service/practitioner and performs no booking/Calendar mutation during search;
  - that no-slot fix is shared for authorized Admins rather than an account-specific Jean-Pierre patch, preserving the rule that systemic defects are fixed at the shared routing/data/authorization layer when evidence supports that scope;
  - numbered top-level appointment selections were repaired so displayed Today/Tomorrow choices no longer fall through to the generic assistant;
  - `Last week's clients` was added as an operational appointment-history view;
  - `Find a client` gained guided state so a next reply such as `Juvan`, `Find Juvan`, or a mobile number is interpreted as the lookup term;
  - `Menu` / `Admin Menu` / `Home` can safely escape an unfinished historical Demo Client session back to Admin Mode;
  - the earlier architectural risk of dynamic numbered top-level menus was subsequently addressed by PR #110's stable WhatsApp top-level list and later role-scope hardening in PR #150. Remaining B1 work is acceptance of genuinely unverified routes, not reimplementation of the stable-ID menu.
- Calendar-integrity monitoring is a guardrail, not a booking importer: booking-like unlinked practitioner-calendar events are review exceptions and never silently become CRM bookings or authorize client messaging.

### B2. ⬜ Reconcile Jean-Pierre Admin capability and client-test strategy

Prior requirement to preserve:
- Jean-Pierre needs a practical Admin experience comparable to Christel where business authority permits, but authorization must remain role/authority based rather than blindly cloning certification powers.
- Jean-Pierre also needs to be able to test the genuine first-time client journey.

Historical Demo Client/test foundation from the extended 12 Aug source session:
- controlled Demo Client access was temporarily extended to Christel/Abigail/Marietjie with practitioner/service eligibility boundaries;
- successful demo booking cleanup was made mandatory/fail-closed, with demo appointment/calendar cleanup and synthetic-client deactivation while preserving audit evidence;
- unfinished demo state could be escaped safely to Admin Mode without deleting a created appointment;
- **supersession:** PR #134 later retired Client Test Mode and hid/revoked production Demo Client permission from Admin accounts. Do not re-enable or expose Demo Client merely from the older rollout requirement; the underlying demo engine/cleanup remains regression infrastructure only unless a newer explicit product decision restores it;
- Chenique/Juvan were intentionally treated as resettable family/test identities for genuine client-path acceptance. Later guarded reset/recovery work supersedes any notion that broad unrestricted CRM deletion should be the normal test mechanism.

Decision rule:
- Do **not** disable or weaken Jean-Pierre's production Admin identity merely to test client behavior until the identity-routing architecture is audited.
- Historical `Demo Client` simulation is not sufficient by itself to certify the true external first-time client journey, WhatsApp identity registration, real CRM creation, Calendar booking, webhook/idempotency, and client-facing UX.
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

- Canonical client-facing business name is **Shiloh Massage Therapy and Aesthetic Clinic**. Use `Shiloh` naturally as the short brand. Do not call the clinic `Shiloh Medical Training Centre`; do not use `Shiloh MTC` as a client-facing expansion/name merely because MTC appears in internal Meta/app identifiers.
- A forwardable `/walk-in` registration entry exists as a convenience client-registration surface, but registration/booking truth remains canonical CRM/WhatsApp workflow state rather than the link itself; do not treat the current Render hostname as a permanent brand/domain commitment.
- New-client registration supports sequential entry and bundled full-name/mobile/DOB input.
- WhatsApp is the client/staff booking interaction surface; CRM is the appointment/service/practitioner authority; Google Calendar is availability/diary/mirror infrastructure. Manual practitioner-calendar events can block availability but must not silently become CRM client appointments.
- `Shiloh — Bookings` is intended as the shared booking diary/mirror, with human staff access kept non-authoritative for client creation/editing where Google permissions allow; real client bookings should flow through Shiloh so client, service, practitioner, price and appointment identity remain canonical.
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

- Verify the AI/client route can answer practitioner-role/service questions from authoritative CRM/configured business knowledge in real client acceptance.
- Verify no invented qualifications, services, ownership claims or eligibility.
- Ensure service-family UI and free-text answers tell the same operational story.
- Add/fix regression coverage only where current evidence establishes a gap.
- The earlier 12 Aug audit originally found that practitioner↔service eligibility was enforced deeper in booking/availability while the general AI layer lacked a dedicated authoritative public-profile source. That **implementation gap was subsequently addressed** by PR #118's approval-gated public practitioner profile/service-mapping knowledge layer, with public treatment-team titles refined in PR #131 and service-family booking refined in PR #154. Do not redo those foundations.
- This item remains ⬜ because authoritative **real client conversational acceptance** and live CRM catalogue/profile consistency are not yet fully proven; the direct Render Postgres read limitation also preserves C1.4 as 🟡.

### C3. 🟡 True first-time booking acceptance

- Complete a controlled real-client registration -> family -> treatment -> practitioner resolution -> date/time -> confirmation journey.
- Verify canonical CRM appointment and Google Calendar event.
- Verify retry/idempotency and supported cancellation/cleanup behavior.
- `Dummy Test` is the preferred dedicated work-time client identity unless authoritative evidence changes this.
- Backend prerequisites are substantially regression-covered, but this item is explicitly human/real-WhatsApp acceptance blocked; do not substitute direct CRM/Calendar mutation for the client path.

## D. Client lifecycle / automation blockers

### D0. ✅ P3 customer-care foundation implemented

- The client-care foundation reached production before P4 work was started, including treatment-aware aftercare/rebooking/loyalty lifecycle infrastructure already present in the code ancestry.
- PR #127 added explicit client appointment reminder confirmation: only an exactly resolved active canonical client and eligible future appointment can be confirmed; ambiguous appointments require the booking number; final confirmation is row-locked, audited and idempotent; it can move canonical `scheduled` -> `confirmed` / lifecycle -> `confirmed_by_client` but can never infer attendance/completion/no-show/cancellation or payment truth.
- Later PR #160 tightened post-appointment follow-up eligibility to canonical `completed` attendance only. Treat this as the current rule; do not reintroduce elapsed-time follow-up eligibility.
- Real WhatsApp/provider lifecycle acceptance remains covered by C1.8 and is not implied complete by these backend foundations.

### D1. 🟡 Birthday automation

- `shiloh_birthday_wish_v2` last known Meta state: PENDING.
- Keep sending disabled until positively APPROVED and copy/current configuration is verified.
- The temporary read-only provider-status startup probe used to capture the PENDING state was removed afterward; it is superseded audit tooling, not ongoing startup behavior.

## E. P4 payments / Ozow

### E1. 🟡 Ozow activation gate

- Blocked on actual Ozow merchant/account configuration and explicit Shiloh rules for payable amount/deposit/full payment, refunds and Shiloh-issued gift vouchers.
- Payment truth remains separate from booking, attendance, Calendar and loyalty truth.
- Do not conflate Ozow's own voucher/redemption product with a future Shiloh-issued gift-voucher product; the latter requires explicit business rules.

### E2. ⬜ Safe P4 engineering after higher-priority acceptance is clean

- The provider-independent architecture/pure-state foundation is already complete (PR #129): payment intent/event truth boundaries, idempotency/reconciliation principles, refund separation, POPIA minimization and a pure state contract that requires verified provider evidence before paid/refund truth. It introduced no credentials, provider calls, payment links, routes/webhooks, DB migration or client messages. **Do not redo this slice.**
- Continue only the next provider-independent/sandbox-safe contracts, reconciliation/idempotency, sanitized observability and tests after higher-priority Admin/client acceptance is clean.
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
3. ⬜ Continue C2 practitioner-information/service-visibility **acceptance** without redoing PR #118/#131/#154 foundations; do not infer live CRM mapping truth while the authoritative read remains blocked.
4. ⬜ Continue F3 Meta/Instagram consolidation only through verified existing-account ownership/access; do not create a duplicate account or disturb the production WABA/app chain.
5. ⬜ In parallel where non-mutating, continue A2/B1 evidence gathering: practitioner finalization queues, Abigail/Christel post-finalization reports when human truth is supplied, Marietjie real-account earnings acceptance, and genuinely unfinished shared Admin route acceptance only.
6. 🟡 Preserve A1, A3, C3, D1 and E1 until their real external/human facts become available.
7. ⬜ Return to the next safe P4 engineering slice only after the higher-priority production acceptance work is clean; PR #129 architecture/pure-state work is already complete and must not be repeated.

# Standard new-chat prompt

**Shiloh OS**

Continue from `docs/SHILOH-OS-MASTER-STATUS.md`. Treat it as the permanent project-management ledger.

Treat GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human acceptance evidence as operational truth.

Read the master ledger first, then read the specialist handoff linked by the currently active workstream. Do not create a competing checklist or redo completed work. Preserve all 🟡 blockers and continue with the highest-priority genuine ⬜ item. Apply the safe self-test-first engineering rule automatically. Update the master ledger when evidence changes project status.