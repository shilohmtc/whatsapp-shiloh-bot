# Shiloh OS — Master Project Status

Updated: 2026-08-18
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted or superseded work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-18-HYBRID-WHATSAPP-CHOICE-MENUS.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on `main`; verify applicable production/provider state; then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate. Obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Permanent governance remains: operational screenshots are diagnostic evidence by default and must not trigger image generation unless visual creation/editing is explicitly requested; production defects follow trace → authoritative evidence → root cause → guarded repair → regression/E2E → CI → deploy → production verification → reconciliation; provider lead-time is considered early; known finite client/admin choices are button/list-first where practical; natural language remains fallback into the same canonical handlers; no speculative provider submissions; no manufactured appointments/evidence; no duplicate public service source of truth.

## Current production baseline

Current accepted production application code is **PR #322 / `e4bf61f60cac4fd98492f846e37e07c07d3219e5`**, **Use one-tap buttons for small WhatsApp menus**. The current governance baseline is **PR #317 / `f2a78bb33db212f759ac5bb72f1d832ca11cc104`**, **Enforce specialist workstream reconciliation**. Full regression CI run **#1037** passed with **656 passed / 0 failed**; Render deploy **`dep-da29l28ae00c73957t30`** reached LIVE. Post-deployment error-level logs were clear, the Google Calendar health check passed, and production `/health` reported application and database status `ok`.

Relevant accepted lineage:
- #301 / `6863958dbf97a6a6f593fc196c284571adf802c6` — accepted public catalogue presentation.
- #302 / `bee0bdcd71f7dae768a78e6e5cfcd5ec5ddf76c9` — fail-closed Google Calendar provider guard + health probe.
- #303 / `632ec4780489a97349b41a85567fa13b18d9ca35` — customer-change WhatsApp confirmation architecture.
- #304 / `278aab397aa750af94e2b1d9df49cb82e75bd29d` — Admin typed-time picker repair.
- #305 / `4767d2823ab41e7f803b5bc4bbdb043e7030dcd7` — canonical client-name resolution repair.
- #306 / `507c3f492dc22e2c7767b8bac24128665f8ac73f` — reconciled Goldie→canonical client lookup bridge.
- #307 / `55c2f00b1470a095ec78c675eaa368bdbd53dc51` — provisional new-client Admin booking fast path.
- #308 / `fdcbae48577b464bf67442b36dcc1ea8155d2c69` — cleanup of unused provisional clients.
- #309 / `fa4e403ac60fa6828b0da977784f0a04d6f08fe7` — temporary Christel↔Abigail cross-confirm handoff; **superseded**.
- #310 / `cb59fc67e09b5ac0afeb12c987bbaf7d41332f14` — removes #309 cross-confirm handoff; **accepted state**.
- #311 / `89291bbceb287b4a78eaf1e0ef84da4cc853ac50` — adds the `/book` treatment catalogue link to the client welcome.
- #312 / `7aaef341d4ac8e897769e18093733092c197507c` — makes the universal welcome precede client-state branching.
- #313 / `ef0da63681d244fc3a0fbb1e6c9e1cdb42bf77c7` — fail-closed Admin practitioner booking entitlement, grouped WhatsApp service menus and JP appointment-menu parity; **superseded for JP booking scope by #318**.
- #314 / `9f6aa3d38ef292e8c80570c03b14be5250d616f8` — adopts the five-workstream shared-authority operating model and full controlled-work completion protocol.
- #315 / `465afe295bdfc5f9570ab52147a4e97865a8947a` — carries forward the Google Business Profile provider gate.
- #316 / `dd9681994eb51e4247cd86c8d37d1957b954aecd` — adds explicit workstream routing to Control checkpoints.
- #317 / `f2a78bb33db212f759ac5bb72f1d832ca11cc104` — enforces specialist reconciliation and mandatory final checkpoints; **current governance baseline**.
- #318 / `aafd7acb278be97ddc1c0dc4b1fca25b16e83d5a` — grants JP the explicit Christel+Abigail booking entitlement while preserving fail-closed enforcement and denying attendance finalization; **accepted entitlement state**.
- #319 / `6bb248fef50877235357b97087b4829db3bddeae` — reconciles the verified JP entitlement into shared authority.
- #320 / `90cbc79362183cff8ea9ef3116aac52e3f312f7f` — centralizes full-label WhatsApp list presentation across applicable Admin and client menus.
- #322 / `e4bf61f60cac4fd98492f846e37e07c07d3219e5` — hybridizes one-to-three safe choices into visible reply buttons after scope filtering; **current accepted production application code**.

Fresh Meta/provider evidence from the #310 production startup:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **APPROVED / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.
- `shiloh_cancellation_confirmation_v1` — **APPROVED**.
- `shiloh_booking_update_v1` — **PENDING**.

Provider approval does not itself prove handset delivery or justify manufactured operational messaging.

## Workstream operating model — 🟢 ADOPTED

Shiloh OS remains one project in the same ChatGPT Work workspace, organized into five focused specialist workstreams:

1. **Shiloh OS — Control & Reconciliation** — overall status/priorities, cross-workstream coordination, governance/architecture, authoritative reconciliation and Master/Tracker integrity.
2. **Booking & Admin UX** — client/Admin booking journeys, treatment discovery, practitioner entitlement, permissions and appointment-management UX.
3. **WhatsApp / Meta Integration** — Cloud API, webhooks, delivery, interactive messages/templates, Meta verification/provider state and WhatsApp production behaviour.
4. **CRM & Identity** — canonical client/practitioner/staff identity, CRM integrity, resolution/deduplication, practitioner/service relationships and conversation-memory identity integration.
5. **Production / DevOps** — Render, CI, deployments, runtime health/logs, environment/configuration and incident verification.

These are ownership and chat-focus boundaries, not separate projects or sources of truth. Every workstream uses GitHub `main`, this Master, the Project Tracker, the latest reconciliation evidence and verified production/provider state. Chat history is navigation context only where repository evidence exists.

After initial approval, controlled work continues through authoritative inspection, implementation, the full applicable regression gate, repair until green, merge, Render/production/provider verification, Project Tracker reconciliation, durable Master reconciliation when applicable, and the final checkpoint. Intermediate success does not end the task. Work stops only at a genuine material gate. Cross-workstream contract changes must be identified and reconciled into shared authority; no specialist chat may maintain conflicting Shiloh OS state.

The Master records durable architecture, business rules, permissions, integrations and operational truth. The Project Tracker records delivery state, PRs/commits, tests, deployment evidence, outstanding work and next actions. Planned work is never recorded as completed production state.

## Specialist workstream reconciliation — 🟢 ADOPTED

Booking & Admin UX, WhatsApp / Meta Integration, CRM & Identity, and Production / DevOps each independently verify applicable GitHub `main`, Master, Tracker, latest reconciliation and production/provider authority before controlled work.

The owning specialist may declare a controlled unit complete only after applicable implementation, regression, merge, production/provider verification, Project Tracker reconciliation, durable Master reconciliation when required, and a final specialist checkpoint. The final checkpoint must identify authoritative state, completed/do-not-redo work, unresolved gates, completed Tracker/Master reconciliation, and any dependency or next-action owner.

The Tracker records delivery evidence, PR/commit/test/verification status, unresolved dependencies and next actions. The Master changes only for verified merged work that alters durable authoritative state; proposed, in-progress or unmerged work is never recorded as completed Master state. Blocked work is recorded as blocked with its dependency instead of being declared complete.

Control & Reconciliation uses reconciled authoritative evidence—not specialist-chat narrative—for cross-workstream continuity.

## Control checkpoint workstream routing — 🟢 ADOPTED

Every Control & Reconciliation checkpoint must translate its recommended next controlled action into an explicit specialist route. The checkpoint records the owning workstream, exact specialist chat, ownership reason, dependencies/observers, implementation status and a ready-to-copy continuation instruction.

The instruction must require the receiving specialist chat to independently read the applicable Master, Project Tracker, latest reconciliation and Engineering Governance on GitHub `main`; verify relevant production/provider/human evidence; preserve newer authoritative state; and follow the controlled-work completion protocol. Routing context never replaces authoritative-state verification.

If the next item is behind a provider, approval, human-truth, genuine-journey or other external gate, the checkpoint must state that implementation is blocked. Ownership stays with the appropriate monitoring/provider workstream and Control & Reconciliation tracks the dependency; implementation must not be routed prematurely.

## Public Shiloh service catalogue — 🟢 VERIFIED LIVE through #301

`/book` remains the Shiloh-owned public service catalogue and booking entry surface, projected read-only from canonical Shiloh CRM catalogue data. Public eligibility remains active service + at least one active practitioner who is client-bookable. Availability remains authoritative only inside the booking engine.

Accepted presentation remains the #301 state: reduced hero; wider scannable catalogue; Massage first and Pedicures & Foot Care second; responsive navigation and WhatsApp actions; real clinic imagery with clean treatment cards; exact Inside Shiloh artwork at three signature positions; plasma three-card row; SQT pair; approved HIFU + Vaginal Tightening & Rejuvenation + Neo Pelvic Therapy row. PRs #284–#300 contain superseded visual/layout variants and are not outstanding work.

The public compatibility contract remains **`Your appointment starts with Shiloh.`** and **`Continue with Shiloh on WhatsApp`**.

## Admin booking — 🟢 VERIFIED / FAST PATH ACCEPTED

The normal WhatsApp Admin surface remains button/list-first where practical. Appointments priority remains **Finalize past visits → Make a booking → Manage a booking → Today's clients → Tomorrow's clients**. `Find an available time` remains integrated into Make a booking.

### Typed time and slot picker — repaired

PR #304 repaired two live defects: typed `14:00` / `2pm` was previously ignored at the slot step, and stale pagination could display only `← Previous`. Typed times now normalize into the authoritative generated slot set. They cannot bypass clinic hours, practitioner working schedule, CRM conflicts, shared Google Calendar, or configured practitioner Google Calendar conflicts. If the typed time is unavailable, Shiloh must explain that and offer authoritative alternatives rather than loop.

### Client lookup and provisional new-client booking — accepted

PR #305 improved canonical name resolution without weakening duplicate/ambiguity guards. PR #306 safely checks already-reconciled Goldie external identities and follows only established `shiloh_entity_id` links to canonical clients; unresolved Goldie identities remain fail-closed.

PR #307 added the operational fast path for genuinely new clients. If Admin cannot find a canonical client, Shiloh may offer **Reserve new client**, collect the minimum **name + South African mobile**, normalize and duplicate-check the mobile, then either reuse an existing canonical client, fail closed on ambiguity, or create a clearly marked provisional canonical client. A provisional client does not bypass the booking review/confirmation guard.

PR #308 cleans up an unused provisional client when booking preparation fails or Admin cancels before confirmation, but only when that provisional record has no appointment. Existing clients and provisional clients with appointments are never removed by this cleanup.

Accepted operational sequence:

`choose service/practitioner/date/time → search client → no match → Reserve new client → name + mobile → duplicate check → provisional canonical client → review → explicit Confirm booking`.

Do not require a completed full profile before securing a legitimate slot. Richer DOB/profile/consent/onboarding data may be completed later through the established registration/onboarding path. Do not silently create duplicate clients.

A real Stephan Erasmus Admin journey demonstrated the fast path through authoritative 14:00 selection, provisional CRM client creation and final review; Christel subsequently confirmed the booking herself. Do not cancel/recreate that appointment merely to manufacture evidence.

### Booking confirmation ownership — simplified accepted rule

PR #309 temporarily introduced Christel↔Abigail cross-confirm handoff. The business decision was that this is not operationally necessary because each authorized Admin can create and confirm bookings while selecting the other practitioner when appropriate. PR #310 removed the handoff and all dedicated preload/tests/change markers.

**Accepted rule:** the Admin who prepares a pending booking confirms that booking. Practitioner choice is independent: Christel may create/confirm a booking for Abigail, Abigail may create/confirm a booking for Christel, and an authorized business Admin may create/confirm for an eligible practitioner. Existing final CRM, clinic-hours, practitioner-schedule, conflict and Google Calendar re-checks remain authoritative.

Do not reintroduce cross-confirm handoff unless a new explicit business requirement justifies the added state/ambiguity complexity.

### Practitioner booking entitlement and grouped treatment menus — verified live

PR #313 made booking entitlement independent from broad Admin capability. PR #318 preserves Christel and Abigail's shared Christel/Abigail scope, Marietjie's Marietjie-only scope, and each other practitioner-linked Admin's own-practitioner scope. It adds one explicit exception for the unlinked Jean‑Pierre business Admin identity only when the canonical Admin record matches the guarded business-admin/all-business/all-services contract: JP may book **Christel or Abigail only**. No clinic-wide practitioner scope is inferred, no practitioner/CRM link is manufactured, and other unlinked Admins remain fail-closed with no booking catalogue. The `admin_booking_sessions` database trigger enforces the same narrow rule for normal, crafted and historical prepare paths.

The WhatsApp menu and booking flow now use one canonical entitlement contract, so **Make a booking** is presented only when that contract grants a usable practitioner scope. The booking catalogue retains authoritative service/staff eligibility, treatment sub-groups, pagination, cancellation, client selection, availability and final confirmation guards.

JP has the same authorized Admin operational actions as Christel and the same Christel+Abigail booking scope, except **Finalize past visits** remains absent and denied. This does not grant JP attendance/finalization authority. PR #318 passed CI run #1026 with 642 passed / 0 failed and is verified LIVE as Render deploy `dep-da2909ou01pc73bite9g` with healthy application, database and Google Calendar checks.

### WhatsApp menu label presentation — verified live

PR #320 adds one shared presentation contract for applicable dynamic Admin and client WhatsApp lists. WhatsApp row titles remain within the enforced 24-character limit; the optional 72-character description line now prioritizes the full canonical treatment, service, package or client wording whenever it fits. Secondary price, duration, date and practitioner detail is included only when it does not force a fitting canonical label to be shortened. Labels longer than the provider description limit remain explicitly ellipsized; canonical CRM wording is not renamed or mutated.

The rule covers Admin booking, booking management, finalization, pricing and approvals, plus client discovery, packages, booking changes, availability and rescheduling. Static labels already displayed in full remain unchanged. Permissions, JP entitlement, availability, confirmation, booking, attendance, CRM identity and database enforcement are unaffected. CI #1033 passed 648 / 0; Render deploy `dep-da29chegekts7391fq90` is LIVE with clear error logs and healthy application, database and Google Calendar checks. Genuine handset presentation remains natural evidence and must not be manufactured.

### Hybrid one-tap choice presentation — verified live

PR #322 adds one shared send-boundary presenter after the existing Admin booking-scope guard. Applicable Admin and client list interactions with one to three safely distinguishable choices render as immediately visible reply buttons; four or more choices remain lists. Full row wording and descriptions stay visible in the message body, while only the button label is compacted to the 20-character provider limit.

Menus remain lists when compact button labels would collide, the reply-button body would exceed the provider limit, or list presentation is explicitly required. Original action IDs and canonical handlers are preserved. WhatsApp list sheets cannot be programmatically opened; this rule removes the extra opening tap only where the reply-button contract allows it.

Permissions, JP entitlement, practitioner scope, availability, confirmation, CRM, database enforcement, Calendar and attendance are unchanged. CI #1037 passed 656 / 0; Render deploy `dep-da29l28ae00c73957t30` is LIVE with clear error logs and healthy application, database and Google Calendar checks. Genuine handset rendering remains natural evidence and must not be manufactured.

## Google Calendar provider guard and recovery — 🟢 VERIFIED HEALTHY

A real Admin **Manage booking → Change practitioner** journey exposed expired/revoked Google OAuth credentials. PR #302 added fail-closed provider handling plus a read-only startup/recurring Google Calendar health probe. The Google Auth app was moved to **In production**, and the production OAuth Client ID / Client Secret / Refresh Token chain was reconciled.

Fresh #310 startup evidence again reports **`Google Calendar provider health check passed`**.

Real WhatsApp evidence previously verified booking **#570** end to end: practitioner changed to **Christel**, the **Google Calendar event was updated**, and Linda Dr / Sports Massage — Package Session / 2026/08/21 14:30–15:20 / R0.00 were preserved. Do not mutate #570 again merely for proof.

The PR #302 fail-closed guard and health probe are permanent protection and must remain.

## Customer confirmations after Admin changes — 🟢 LIVE / 🟠 UPDATE TEMPLATE PENDING

PR #303 covers successful Admin changes to service, practitioner, date/time, booked price, and cancellation. New bookings continue using the established approved `shiloh_booking_confirmation_v1` path.

For service/practitioner/date-time/price changes, Shiloh records a durable audit-event-idempotent outbox item only after the canonical mutation succeeds. The latest appointment state is sent through `shiloh_booking_update_v1` only when Meta reports it APPROVED. Admin cancellation uses `shiloh_cancellation_confirmation_v1`.

The queue is retryable and has no proactive free-text fallback. A failed/blocked CRM or Calendar mutation does not queue a misleading client message.

Current provider truth: cancellation confirmation is APPROVED; `shiloh_booking_update_v1` remains **PENDING**. Therefore ordinary change notifications remain queued until Meta approval. Do not claim delivery until genuine post-approval evidence exists and do not mutate a real booking merely for proof.

## Attendance finalization authority — 🟢 IMPLEMENTED

Canonical certification authority remains:
- **Christel:** finalizes Christel + Abigail appointments only.
- **Marietjie:** finalizes Marietjie appointments only.
- **Abigail:** does not finalize appointments.
- Broad Admin visibility does not grant attendance-certification authority.

Historical finalization exposes Completed, No-show, Cancelled, No charge, Service change, Adjust price, Reschedule and Leave unresolved. Service/price changes preserve original history and finalize through canonical guarded paths.

## Historical attendance 2026-08-01 through 2026-08-15 — 🔵 HUMAN FINAL REVIEW ACTIVE

Earlier audit: 53 appointments = 31 finalized, 4 cancelled, 17 unresolved/routable, plus one unresolved exception #558 historically mapped to `SHILOH MTC`. The 31 prior Completed/No-show visits were approved for reopening with audit/history preserved; cancelled visits were not reopened. Historical counts are not current truth; re-query before quoting a current total.

### #558 — 🔴 FAIL-CLOSED historical exception

Appointment **#558 on 2026-08-06** remains unresolved with historical practitioner `SHILOH MTC`. Never silently assign it to Christel or Marietjie. Establish the real practitioner from authoritative history or explicit human evidence before correction/finalization.

## Completed client/lifecycle/directory work — do not redo

Universal welcome, registered/legacy Book appointment routing, eligible-practitioner ordering, booking/cancellation action-button parity, practitioner directory, category ordering/count polish, SQT BioMicroneedling virtual-family presentation, Admin booking/reschedule, 24-hour presentation, typed-time repair, canonical/Goldie-aware client lookup, provisional-client reservation and cleanup remain completed.

Canonical practitioner presentation remains:
- Christel · Massage — Massage Practitioner
- Abigail · Massage — Massage Practitioner
- Marietjie · Esthetician — Aesthetic Practitioner

Do not consolidate/rename underlying CRM records merely to reproduce presentation.

## Existing evidence and provenance

Pa Derik #567 real handset reschedule evidence remains accepted; last recorded state was Tuesday 18 August 2026, 08:30–10:15, Full Body Swedish with Christel. Re-query if current state is needed; do not mutate for evidence.

CRM48 (Pa Derik) and CRM473 remain legitimate controlled Goldie-imported canonical clients. CRM IDs are not proof of bot registration. CRM1 remains an orphan-like read-only review candidate; do not delete without identity/supersession proof. Unique unverified imported mobiles use the existing-profile claim/verification path; ambiguity remains fail-closed.

## Google Business Profile provider access — 🟠 EXTERNAL/PROVIDER GATE

Last-authoritative provider evidence remains:

- My Business Business Information API is enabled.
- The Google Business Profile API access/application was submitted.
- API-specific quotas are visible.
- The general **Requests per minute** quota remains **0**.
- Google Business Profile API approval and usable access are therefore not positively established.

Earlier PR #35 added GBP knowledge-sync scaffolding and the current repository retains `src/services/googleBusinessProfileSync.js`. That code is not evidence of provider approval and must not be activated or extended merely because it exists.

This is not an ordinary capacity/quota-increase task. Do not begin or resume GBP OAuth/API integration until authoritative Google evidence confirms access or a usable general request quota greater than 0. When that gate closes, reopen from current GitHub `main`, reassess the existing scaffolding, and follow the full controlled-work completion protocol.

Primary ownership is **Production / DevOps** for provider/configuration verification. **Shiloh OS — Control & Reconciliation** tracks the external dependency and protects the shared authoritative state.

## Standing gates

- `shiloh_booking_update_v1` Meta approval remains a provider gate before service/practitioner/date-time/price customer-update messages can be delivered.
- Historical attendance remains explicit human truth.
- #558 remains fail-closed.
- Genuine per-route lifecycle evidence remains natural-journey gated where not already observed.
- Follow-up/rating delivery remains genuine completed-visit timing gated.
- Birthday v2 requires genuine eligible CRM birthday/opt-in conditions.
- Google Business Profile remains **external/provider gate — pending Google**: Business Information API enabled, application submitted and API-specific quotas visible, but general Requests/min remains 0. Do not treat as normal quota work or start OAuth/API integration until positive usable access is verified.
- Google Contacts sync remains lower priority; CRM is authoritative.
- Ozow remains waiting for merchant configuration and explicit business rules.
- Destructive privacy execution remains fail-closed pending authority/evidence.

## Exact new-chat continuation state

- Production application code is **LIVE** on PR #322 / `e4bf61f60cac4fd98492f846e37e07c07d3219e5`; the governance baseline remains PR #317 / `f2a78bb33db212f759ac5bb72f1d832ca11cc104`. CI #1037 passed 656 / 0 and Render deploy `dep-da29l28ae00c73957t30` is live and healthy.
- PR #320's full-label list presentation remains accepted. PR #322 adds the hybrid send-boundary rule: one-to-three safe choices use visible reply buttons after scope filtering; four-or-more or unsafe choices remain lists.
- JP retains the explicit #318 Christel+Abigail booking scope and Christel-equivalent authorized Admin actions except finalization. Other unlinked Admins remain fail-closed.
- Admin typed-time, canonical/Goldie lookup, provisional-client booking/cleanup and same-Admin prepare→confirm rules remain accepted.
- Google Calendar OAuth/provider health is **🟢 VERIFIED HEALTHY**; the fail-closed provider guard remains permanent.
- Customer-change confirmation architecture is live; cancellation template is APPROVED; `shiloh_booking_update_v1` remains **PENDING**.
- `/book` remains the accepted live CRM-backed public catalogue through #301; do not redo superseded #284–#300 variants.
- Historical attendance remains human-controlled; #558 remains fail-closed with historical practitioner `SHILOH MTC`.
- Google Business Profile access remains pending Google with general Requests/min at 0; Production / DevOps owns verification and Control & Reconciliation tracks the dependency. No GBP integration work is authorized from this state.

**Authoritative current state:** PR #322 is regression-green, merged and verified LIVE on `e4bf61f...` as Render deploy `dep-da29l28ae00c73957t30`. Applicable one-to-three Admin/client choices now use visible reply buttons after scope filtering; four-or-more and unsafe-to-compact choices remain lists. PR #320's full-label rule and JP's #318 entitlement remain unchanged; finalization remains denied. Governance baseline #317 remains authoritative.

**Highest-priority next item:** re-check Meta provider status for `shiloh_booking_update_v1`; if still PENDING, continue the next approved Shiloh OS workstream without reopening the completed menu-label, hybrid-choice or JP/Admin-booking fixes.

**Why next:** menu wording and small-choice presentation are centralized and regression-covered across the applicable Admin/client send boundary, with CI and production health verified. A genuine WhatsApp journey may confirm reply-button rendering naturally, but no booking, appointment change or attendance action may be manufactured for evidence.

**Remaining gates:** Meta approval for the booking-update template; positive Google Business Profile approval or usable Requests/min >0; historical attendance and #558 human truth; natural handset evidence; genuine lifecycle/follow-up/birthday evidence; and explicit approval for material commercial/service/business-rule changes.