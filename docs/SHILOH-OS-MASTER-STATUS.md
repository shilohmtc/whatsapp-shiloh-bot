# Shiloh OS — Master Project Status

Updated: 2026-08-19
Purpose: permanent current-state source of truth. Historical implementation detail remains in Git history; do not redo accepted or superseded work.

## Authority and continuation protocol

Operational truth is GitHub `main`, Render production, Shiloh CRM/Postgres, Google Calendar, Meta/WhatsApp provider evidence, and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM, Calendar, or handset state.

At the beginning of each new Shiloh OS chat: read this Master + `docs/SHILOH-OS-PROJECT-TRACKER.md` + the latest reconciliation, currently `docs/SHILOH-OS-RECONCILIATION-2026-08-19-CLIENT-WELCOME-ROUTING-REPAIR.md`, plus `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, on `main`; verify applicable production/provider state; then give the four-part checkpoint: (1) authoritative current state, (2) highest-priority continuation item, (3) why it is next, (4) remaining approval/evidence/provider gate. The prior client-welcome diagnostic reconciliation remains durable evidence at `docs/SHILOH-OS-RECONCILIATION-2026-08-19-CLIENT-WELCOME-DIAGNOSTIC.md`; the prior booking-update activation reconciliation remains durable production/configuration evidence at `docs/SHILOH-OS-RECONCILIATION-2026-08-19-BOOKING-UPDATE-PRODUCTION-ACTIVATION.md`, the stale-suppression reconciliation remains durable safety evidence at `docs/SHILOH-OS-RECONCILIATION-2026-08-19-BOOKING-UPDATE-STALE-SUPPRESSION.md`, the 19 August Meta approval reconciliation remains durable provider evidence at `docs/SHILOH-OS-RECONCILIATION-2026-08-19-META-BOOKING-UPDATE-APPROVAL.md`, and the Christel catalogue reconciliation remains durable evidence at `docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md`; a newer current reconciliation does not erase any of them. Obtain explicit approval before the first new substantial controlled action. After that initial approval, continue the approved workstream automatically through ordinary engineering/deploy/verification/housekeeping boundaries. Stop only for material scope/risk expansion, contradictory authority, or an existing fail-closed human/provider/evidence gate.

Permanent governance remains: operational screenshots are diagnostic evidence by default and must not trigger image generation unless visual creation/editing is explicitly requested; production defects follow trace → authoritative evidence → root cause → guarded repair → regression/E2E → CI → deploy → production verification → reconciliation; provider lead-time is considered early; known finite client/admin choices are button/list-first where practical; natural language remains fallback into the same canonical handlers; no speculative provider submissions; no manufactured appointments/evidence; no duplicate public service source of truth. Under PR #340, implementing/operating specialists also provide mandatory self-contained copy-ready specialist handoffs whenever another workstream owns the next action or dependency; direct specialist-to-specialist continuation is permitted when ownership and shared authority are clear, but the receiving specialist must independently verify current authority and Control remains the escalation point for ambiguity/conflict/governance decisions.

## Current production baseline

Current accepted production application code is **PR #337 / `59119128ea0b288292622fd0b032058fcbd203ce`**, **Preserve universal welcome before greeting navigation**. The current governance baseline is **PR #340 / `aeb4e35361c34413d4310b1846c7043642a31cd2`**, **Require copy-ready specialist handoffs**. Application full regression CI run **#1074** passed with **701 passed / 0 failed**. Governance CI #1079 correctly caught removal of a pre-existing specialist-completion invariant; that invariant was restored while retaining the stronger new handoff rule, and replacement CI **#1080** completed successfully before merge. PR #340's documentation-only Render auto-deploy **`dep-da2utrh5efls73baqi40`** reached LIVE and healthy; `/health` returned HTTP 200 on the new instance, Google Calendar provider health passed, and existing booking-update/cancellation template provisioning checks remained `submitted=false`, `reason=already_exists`, `providerStatus=APPROVED`. PR #340 does not supersede PR #337 as the accepted runtime application-code lineage. A real Juvan handset greeting at approximately 19:31 SAST had already shown the universal welcome first and the registered-client interactive branch second under #337; that accepted runtime/handset evidence remains unchanged. PR #335 remains the accepted authenticated SELECT-only diagnostic lineage; PR #332 remains the accepted stale booking-update suppression lineage included in this application; PR #328 remains the accepted Christel catalogue correction lineage; PR #326 remains the accepted Meta integration lineage.

Booking-update production activation remains **LIVE / ENABLED** under the previously reconciled #334 state. Production is still configured with `WHATSAPP_BOOKING_UPDATE_TEMPLATE=shiloh_booking_update_v1` and `WHATSAPP_BOOKING_UPDATE_ENABLED=true`; the activation deploy `dep-da2qovs9v7es73cqlrr0` remains durable evidence of the activation boundary. PR #340 changed governance documentation only: it did not resubmit a Meta template, change booking-update configuration, alter a booking, reset welcome state, or modify CRM identity state.

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
- #317 / `f2a78bb33db212f759ac5bb72f1d832ca11cc104` — enforces specialist reconciliation and mandatory final checkpoints; retained predecessor governance baseline.
- #318 / `aafd7acb278be97ddc1c0dc4b1fca25b16e83d5a` — grants JP the explicit Christel+Abigail booking entitlement while preserving fail-closed enforcement and denying attendance finalization; **accepted entitlement state**.
- #319 / `6bb248fef50877235357b97087b4829db3bddeae` — reconciles the verified JP entitlement into shared authority.
- #320 / `90cbc79362183cff8ea9ef3116aac52e3f312f7f` — centralizes full-label WhatsApp list presentation across applicable Admin and client menus.
- #322 / `e4bf61f60cac4fd98492f846e37e07c07d3219e5` — hybridizes one-to-three safe choices into visible reply buttons after scope filtering; **accepted menu-presentation code**.
- #324 / `ac461dd7b6b0774a89bd179f913f54dcfae2414d` — makes Christel, Abigail and Marietjie attendance finalization own-practitioner-only while keeping JP excluded; **accepted attendance authority**.
- #325 / `790b5c1254858e17d5811e0182acfb9cc83e32bd` — reconciles the own-appointment finalization authority into shared state.
- #326 / `acefd0e3bc5a21c6e61c656ccfd8f185339c4783` — accepted Meta template integration; final head `9328a89b84bdeeebbee9ab1d3b74af809a30e017`, CI #1049, original verified deploy `dep-da2b5ogu01pc73blgvn0`; included in current production.
- #327 / `5dc39552186d11b3be7d9a2abea56581cbefb006` — records the read-only production gate for Christel's reviewed catalogue scope.
- #328 / `78ece8d5bcf38aaf5d01dbaaefacde253bdef6e3` — guarded retirement of service #27 plus the three reviewed canonical buffer removals; **accepted catalogue correction retained in current production**.
- #331 / `4d96411e7ed3303e4a5f961064511aa12f8fe133` — reconciles 19 August provider approval for `shiloh_booking_update_v1` while keeping production activation closed.
- #332 / `bd6b3963b5ba8a9518d49d9502936521a986a7bb` — terminally suppresses stale ended booking-update retries while preserving history and future-appointment delivery; **accepted stale-suppression safety lineage included in current production**.
- #333 / `29cf4ebc249b8b85d66a1616a26e35bd9e9739a0` — reconciles #575 / 674 as terminally suppressed historical evidence and preserves production activation as a separate later boundary; **documentation-only**.
- #334 / `82a6cece62de5966133d5787339494c629ed9c66` — reconciles booking-update production activation as LIVE / ENABLED while preserving natural-delivery evidence gating; **documentation-only durable activation evidence**.
- #335 / `59469d6670cb116a5be20ebc3ab682d4f36ad717` — adds the authenticated SELECT-only client universal-welcome diagnostic with ambiguity-safe canonical identity reporting; CI #1070 700/0, Render `dep-da2ttdcs728c73b99mbg` LIVE; **accepted diagnostic lineage included in current production**.
- #337 / `59119128ea0b288292622fd0b032058fcbd203ce` — preserves first-contact universal-welcome routing while retaining matched-complete greeting navigation; CI #1074 701/0, Render `dep-da2udf95efls73ba76ng` LIVE; **current accepted production application code**.
- #340 / `aeb4e35361c34413d4310b1846c7043642a31cd2` — requires self-contained copy-ready specialist-to-specialist handoffs, permits direct specialist continuation when ownership/authority are clear, preserves fail-closed gates and independent verification; CI #1080 green, docs-only Render `dep-da2utrh5efls73baqi40` LIVE; **current governance baseline**.

Fresh Meta/provider evidence reconciled on 19 August 2026:
- `shiloh_staff_finalization_v1` — **APPROVED / UTILITY**.
- `shiloh_staff_finalization_actions_v1` — **APPROVED / UTILITY**.
- `shiloh_booking_confirmation_v1` — **APPROVED / UTILITY**.
- `shiloh_cancellation_confirmation_v1` — **APPROVED**.
- `shiloh_booking_update_v1` — **APPROVED / UTILITY / `en`**, exact contract, `duplicateCount=0`, quality `UNKNOWN`, `already_exists`, not resubmitted; production template configuration and explicit enablement remain LIVE.

Provider approval and production activation do not themselves prove handset delivery.

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

The owning specialist may declare a controlled unit complete only after applicable implementation, regression, merge, production/provider verification, Project Tracker reconciliation, durable Master reconciliation when required, and a final specialist checkpoint. The final checkpoint must identify authoritative state, completed/do-not-redo work, unresolved gates, completed Tracker/Master reconciliation, and whether another workstream owns a dependency or next action.

PR #340 strengthens that final checkpoint. Whenever another workstream owns a dependency, verification step, blocked gate or next controlled action, the outgoing specialist must provide a self-contained handoff containing the owning workstream, exact `Shiloh OS — <workstream>` chat, ownership reason, dependencies/observers, explicit **Proceed** or **Blocked** status, completed/do-not-redo state, and one ready-to-copy continuation instruction in a fenced `text` block. The continuation must require the receiving specialist to re-read current `main`, Master, Tracker, latest reconciliation and Engineering Governance; verify relevant production/provider/CRM/Calendar/Meta/human evidence that could have changed; preserve newer authority; treat the handoff as routing context rather than authority; execute only its owned scope; complete reconciliation; and issue the same handoff at its next boundary. If no further specialist action exists, state **`Next specialist: None — controlled unit complete.`**

Direct specialist-to-specialist continuation is permitted without an intermediate Control checkpoint when ownership is clear and shared authority is not contradictory. Control & Reconciliation remains the escalation/coordination point for unclear ownership, conflicting authority, cross-workstream prioritisation, governance/architecture decisions and reconciliation disputes. A provider, human-truth, approval, safety, evidence, production or capability gate remains fail-closed and must never be bypassed merely to keep work moving.

The Tracker records delivery evidence, PR/commit/test/verification status, unresolved dependencies and next actions. The Master changes only for verified merged work that alters durable authoritative state; proposed, in-progress or unmerged work is never recorded as completed Master state. Blocked work is recorded as blocked with its dependency instead of being declared complete.

Control & Reconciliation uses reconciled authoritative evidence—not specialist-chat narrative—for cross-workstream continuity.

## Control checkpoint workstream routing — 🟢 ADOPTED

Every Control & Reconciliation checkpoint must translate its recommended next controlled action into an explicit specialist route. The checkpoint records the owning workstream, exact specialist chat, ownership reason, dependencies/observers, implementation status and a ready-to-copy continuation instruction.

The instruction must require the receiving specialist chat to independently read the applicable Master, Project Tracker, latest reconciliation and Engineering Governance on GitHub `main`; verify relevant production/provider/human evidence; preserve newer authoritative state; and follow the controlled-work completion protocol. Routing context never replaces authoritative-state verification.

PR #340 does not make Control an intermediate stop between clear specialist owners. When the outgoing specialist can identify the next owner without contradictory authority, the mandatory specialist handoff is sufficient to continue directly. Control remains available and authoritative for escalation, governance decisions and reconciliation conflicts.

If the next item is behind a provider, approval, human-truth, genuine-journey or other external gate, the checkpoint must state that implementation is blocked. Ownership stays with the appropriate monitoring/provider workstream and Control & Reconciliation tracks the dependency; implementation must not be routed prematurely.

## Public Shiloh service catalogue — 🟢 VERIFIED LIVE through #301

`/book` remains the Shiloh-owned public service catalogue and booking entry surface, projected read-only from canonical Shiloh CRM catalogue data. Public eligibility remains active service + at least one active practitioner who is client-bookable. Availability remains authoritative only inside the booking engine.

Accepted presentation remains the #301 state: reduced hero; wider scannable catalogue; Massage first and Pedicures & Foot Care second; responsive navigation and WhatsApp actions; real clinic imagery with clean treatment cards; exact Inside Shiloh artwork at three signature positions; plasma three-card row; SQT pair; approved HIFU + Vaginal Tightening & Rejuvenation + Neo Pelvic Therapy row. PRs #284–#300 contain superseded visual/layout variants and are not outstanding work.

The public compatibility contract remains **`Your appointment starts with Shiloh.`** and **`Continue with Shiloh on WhatsApp`**.

## Christel reviewed service catalogue — 🟢 VERIFIED LIVE through #328

The reviewed Christel catalogue scope is now durable canonical CRM truth. Service #27, **Full Body Sports Massage** / Goldie `1d734e8b-d21e-44c3-9a3f-b2a7165a7787`, is inactive and has no practitioner mapping, but its service row and seven linked appointments remain intact. The distinct service #34, **Sports Massage Full Body** / Goldie `46043512-d1df-4169-92b4-132160fca809`, remains active at 120 minutes with 17 linked appointments. Package-only service #65 remains active at 50 minutes and its four-session / R1,400 / 30-day package contract is unchanged.

The only approved timing changes are canonical service-level values: Medi-Heel Pedicure (No Gel Toes) & Foot Massage is **60 + 0 + 0 = 60 minutes**; Full Body Swedish is **90 + 0 + 0 = 90 minutes**; Lower Back, Hip & Psoas Release is **90 + 0 + 0 = 90 minutes**. Practitioners sharing these service rows inherit the same totals. No practitioner-specific duration override is authorized.

Migration `062_christel_service_catalogue_correction.sql` and its startup verifier fail closed on an unreviewed active Christel buffer, target-identity drift, retained mapping/package drift, public-eligibility drift or appointment-history change. Active catalogue/public/Admin/client visibility continues to be status-and-eligibility driven; availability and appointment end windows continue to use base + processing + extra canonical minutes. Production `/book` and the sanitized catalogue audit omit service #27 and show the retained/corrected totals.

Do not reactivate/remap service #27, merge it into #34, restore the removed buffers, delete historical evidence, change #34/#65 from 120/50, or introduce practitioner-specific duration overrides. Goldie description publication is separate and remains behind Control/business approval for phone-number, treatment-identity, medical-claim and misplaced-text exceptions; the catalogue correction did not prepare or bulk-publish description content.

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

## Meta template production integration — 🟢 VERIFIED LIVE / DELIVERY ENABLED

PR #326 merged as `acefd0e3bc5a21c6e61c656ccfd8f185339c4783`. CI #1049 passed its final head `9328a89b84bdeeebbee9ab1d3b74af809a30e017`, and Render original deploy `dep-da2b5ogu01pc73blgvn0` was verified LIVE and healthy. The production read-only audit returned HTTP 200 with `report.ok=true`. This makes the centralized inventory, exact contract checks, fail-closed send boundary, duplicate-safe post-acceptance handling, exact approval-resend evidence, and retired legacy evidence endpoints durable production behaviour. This work is complete and must not be redone.

The provider/configuration matrix is authoritative as follows:

- All eleven previously configured operational templates remain API **APPROVED**, exactly match name, language, category and components, have `duplicateCount=0`, and report `ready=true`.
- `shiloh_booking_update_v1` is API **APPROVED**, `already_exists`, exact Utility/`en`, `duplicateCount=0`, quality `UNKNOWN`, and was not resubmitted. Production is configured with `WHATSAPP_BOOKING_UPDATE_TEMPLATE=shiloh_booking_update_v1` and `WHATSAPP_BOOKING_UPDATE_ENABLED=true`. **Provider and production activation gates are closed.** The deterministic kill switch is `WHATSAPP_BOOKING_UPDATE_ENABLED=false`. Successful customer-delivery evidence remains open and must arise naturally from a genuine change to a still-future appointment.
- `shiloh_birthday_wish_v1`, `appointment_followup`, and `appointment_reminder` are API **APPROVED** with `duplicateCount=0`, but return `configuredName` equal to each identity and `configured=true`; they remain fail-closed with `sendable=false` and `ready=false`. Their full component contracts are non-authoritative, and legacy configuration cannot bypass the registry/send gate. WhatsApp / Meta Integration owns continued retirement; Control & Reconciliation guards against speculative reactivation.
- Provider API quality is `UNKNOWN` for every template. The separate WhatsApp Manager screenshot remains authoritative evidence of **Active – Quality pending** and must not be rewritten as an API quality value. WhatsApp / Meta Integration owns monitoring; Production / DevOps may perform read-only checks.

Provider approval and production activation are not handset delivery. Natural approval-outcome, decline, cancellation and reschedule journeys remain owned by Booking & Admin UX with WhatsApp / Meta verification. A genuine completed-visit/rating journey and genuine opted-in birthday eligibility remain owned by Customer Care, with WhatsApp / Meta delivery verification and CRM & Identity observing birthday source truth. Control & Reconciliation tracks every unresolved dependency. No messages, appointments, attendance actions, reminders, ratings or birthday journeys may be manufactured for evidence. Permanent early provider planning and no-speculative-submission governance remain in force; the exact contracts remain in `docs/META-TEMPLATE-READINESS-MATRIX.md`.

### Booking-update activation, stale-notification suppression and Control incident — 2026-08-19

Appointment **#575 / audit event 674** is genuine historical production queue evidence, but its appointment had already ended before booking-update activation. PR #332 terminally suppressed the row with `appointment_already_ended`, preserving its audit/history, leaving `sent_at=null`, and excluding it from retry scans. Immediately before production activation, authoritative read-only evidence established `active_booking_update_rows=0` and confirmed #575 / 674 remained suppressed. The row must not be released, marked sent, deleted, mutated for proof, or reused as successful delivery evidence.

Production / DevOps then activated booking-update delivery by setting the exact template name and explicit enablement flag in one Render environment merge update. Activation deploy `dep-da2qovs9v7es73cqlrr0` reached LIVE at 15:16:16 SAST; post-restart health returned HTTP 200; provider verification remained non-submitting and APPROVED; no unexpected update send occurred during startup. PR #340's later documentation-only restart independently reverified the same provider state without submission. Genuine future update evidence must come naturally from a still-future appointment.

The supplied stale-suppression investigation observed `attempt_count=27`, but an additional old-code retry occurred at **14:25:13 SAST** before PR #332 deployed. The exact post-deploy numeric counter is therefore not asserted; suppression itself does not increment it. The sanctioned Render read-only SQL connector failed SSL/TLS negotiation before executing SQL in that earlier checkpoint and again during the #335 client-welcome diagnostic checkpoint, so no write-capable workaround was used.

During the earlier Control read-only verification, the Render environment-update action was mistakenly invoked three times with an empty environment-variable list and merge semantics. No environment key/value was supplied and no booking-update configuration was changed, but Render treated the calls as deployment requests. At least two same-commit API redeployments materialized for `011ed6126c176e375b618c4b5824893d0760db01`: `dep-da2ope3m8hqs73e3pr7g` and `dep-da2opi9s4bfs73fstcgg`; the later became LIVE and the earlier was deactivated. This was a control-boundary breach and remains part of the audit trail. It must not be normalized away merely because environment values were unchanged.

## Google Calendar provider guard and recovery — 🟢 VERIFIED HEALTHY

A real Admin **Manage booking → Change practitioner** journey exposed expired/revoked Google OAuth credentials. PR #302 added fail-closed provider handling plus a read-only startup/recurring Google Calendar health probe. The Google Auth app was moved to **In production**, and the production OAuth Client ID / Client Secret / Refresh Token chain was reconciled.

Fresh #340 documentation-only restart evidence again reports **`Google Calendar provider health check passed`**.

Real WhatsApp evidence previously verified booking **#570** end to end: practitioner changed to **Christel**, the **Google Calendar event was updated**, and Linda Dr / Sports Massage — Package Session / 2026/08/21 14:30–15:20 / R0.00 were preserved. Do not mutate #570 again merely for proof.

The PR #302 fail-closed guard and health probe are permanent protection and must remain.

## Customer confirmations after Admin changes — 🟢 LIVE / ENABLED / 🟠 DELIVERY EVIDENCE OPEN

PR #303 covers successful Admin changes to service, practitioner, date/time, booked price, and cancellation. New bookings continue using the established approved `shiloh_booking_confirmation_v1` path.

For service/practitioner/date-time/price changes, Shiloh records a durable audit-event-idempotent outbox item only after the canonical mutation succeeds. PR #332 extends that durable contract with terminal `suppressed` handling: a pending/failed booking-update row whose appointment has already ended is suppressed before provider/configuration work and rechecked before send claim, with reason `appointment_already_ended`; it is not sent or deleted and cannot return to the retry scanner. Genuine future appointment changes are now eligible for `shiloh_booking_update_v1` delivery when all existing fail-closed provider, appointment, contact and idempotency guards pass. Admin cancellation continues using `shiloh_cancellation_confirmation_v1` and is not stale-suppressed by this rule.

The queue has no proactive free-text fallback. A failed/blocked CRM or Calendar mutation does not queue a misleading client message. Suppression preserves the source audit event, appointment history, existing failure history, and `sent_at` semantics rather than manufacturing a successful delivery record.

Current booking-update truth: provider is **APPROVED, exact and duplicate-free**; production template configuration is exact; explicit enablement is true; the path is **LIVE / ENABLED**. Appointment #575 / audit event 674 remains terminally suppressed historical evidence and cannot be released or used as successful delivery evidence. Successful customer delivery evidence remains open until a natural still-future appointment change is genuinely delivered. The deterministic production kill switch is `WHATSAPP_BOOKING_UPDATE_ENABLED=false`.

## Client universal-welcome routing — 🟢 REPAIRED / VERIFIED LIVE / HANDSET-PROVEN

The universal welcome contract from PR #312 remains authoritative: where phone-level `v2` has not already been durably delivered, a greeting must receive the universal welcome before the safe client-state branch. A genuine prior `v2` delivery allows later greetings to reach the ordinary client menu.

During the controlled Juvan journey on 19 August, an earlier real `Hi` incorrectly produced the normal three-button client home menu. PR #335's authenticated SELECT-only diagnostic was then invoked using the user-confirmed number and returned sanitized evidence for suffix `1564`: `ledger.exists=false`, `ledger.sentAt=null`, `canonicalIdentity.status=unique`, `activeClientCount=1`, and a resolved canonical marker with `exists=false`, `sentAt=null`. That proved the earlier home-menu response was not legitimate once-only suppression. The unique canonical match is the only identity fact established by that read; it does not imply consent, guardian status or unrelated CRM attributes.

The traced root cause was a routing-composition conflict: the older client-navigation-priority wrapper treated greetings as main-menu escape navigation before the later PR #312 transition contract could safely branch unknown/incomplete/ambiguous identities. PR #337 narrows the bypass so greeting input first invokes original identity handling and only `matched_complete` may fall through to ordinary main-menu greeting navigation. Unknown, matched-incomplete and ambiguous outcomes remain in the first-contact transition path; `Book another treatment` keeps its established explicit navigation bypass.

PR #337 / `59119128ea0b288292622fd0b032058fcbd203ce` passed CI #1074 with 701/0 and deployed as Render `dep-da2udf95efls73ba76ng`, which reached LIVE and healthy. Google Calendar health passed; existing booking-update/cancellation/provider checks remained APPROVED / already_exists / not resubmitted. No CRM/client row, welcome ledger, appointment, environment flag or Meta template was manually changed for the repair.

Real handset verification at approximately 19:31 SAST then showed **🌿 Welcome to Shiloh** first, followed by **✅ You’re already registered with Shiloh.** and the expected four-row `Choose an option` registered-client list. Render independently correlated the masked suffix `***1564` inbound text, outbound activity, successful four-row interactive-list send and HTTP 200 webhook completion. This closes the routing defect as handset-proven repaired behavior.

The post-send `v2` ledger timestamp has not been separately re-read and must not be invented; it is not required to classify the observed routing repair. PostgreSQL external inbound traffic remains blocked and must not be weakened merely for an additional read.

## Attendance finalization authority — 🟢 IMPLEMENTED

Canonical certification authority remains:
- **Christel:** finalizes Christel appointments only.
- **Abigail:** finalizes Abigail appointments only.
- **Marietjie:** finalizes Marietjie appointments only.
- **Jean-Pierre:** does not finalize appointments.
- Broad Admin visibility, booking scope or business-admin status does not grant attendance-certification authority.

PR #324 centralizes this own-only rule across Appointments-menu visibility, direct/crafted finalization enforcement, discretionary service/price outcomes, end-of-day reminders and historical action prompts. Authority requires an exact active canonical staff record matching the Admin's linked `staff_id` and normalized practitioner name; missing, unlinked or conflicting identity fails closed. A no-authority account receives an empty finalization queue, and every write still revalidates assignment under transaction/row lock. The change did not mutate attendance or appointments.

Historical finalization exposes Completed, No-show, Cancelled, No charge, Service change, Adjust price, Reschedule and Leave unresolved. Service/price changes preserve original history and finalize through canonical guarded paths.

## Historical attendance 2026-08-01 through 2026-08-15 — 🔵 HUMAN FINAL REVIEW ACTIVE

Earlier audit: 53 appointments = 31 finalized, 4 cancelled, 17 unresolved/routable, plus one unresolved exception #558 historically mapped to `SHILOH MTC`. The 31 prior Completed/No-show visits were approved for reopening with audit/history preserved; cancelled visits were not reopened. Historical counts are not current truth; re-query before quoting a current total.

### #558 — 🔴 FAIL-CLOSED historical exception

Appointment **#558 on 2026-08-06** remains unresolved with historical practitioner `SHILOH MTC`. Never silently assign it to Christel or Marietjie. Establish the real practitioner from authoritative history or explicit human evidence before correction/finalization.

## Completed client/lifecycle/directory work — do not redo

Universal welcome routing is repaired and handset-proven through PR #337. Registered/legacy Book appointment routing, eligible-practitioner ordering, booking/cancellation action-button parity, practitioner directory, category ordering/count polish, SQT BioMicroneedling virtual-family presentation, Admin booking/reschedule, 24-hour presentation, typed-time repair, canonical/Goldie-aware client lookup, provisional-client reservation and cleanup remain completed. Continue the current controlled Juvan menu/booking-path test from the registered-client choices; do not recreate earlier welcome proof.

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

- Client universal-welcome routing is **repaired / production-live / handset-proven through PR #337**. Do not reset or replay welcome state merely for proof. The separate post-send ledger timestamp was not re-read and is not required for routing classification.
- Specialist-to-specialist handoffs are governed by PR #340: direct continuation is allowed when ownership is clear, but handoffs do not replace independent authoritative-state verification and blocked gates remain fail-closed.
- `shiloh_booking_update_v1` provider approval and production activation are **closed/complete**. Successful customer delivery evidence remains open and may only arise from a genuine change to a still-future appointment. #575 / 674 is terminally suppressed historical evidence only and cannot be released or used as delivery evidence. The deterministic production kill switch is `WHATSAPP_BOOKING_UPDATE_ENABLED=false`.
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

- Production application code is the accepted PR #337 / `59119128ea0b288292622fd0b032058fcbd203ce` baseline. Governance baseline is PR #340 / `aeb4e35361c34413d4310b1846c7043642a31cd2`; application CI #1074 passed 701 / 0, governance replacement CI #1080 passed, and docs-only Render auto-deploy `dep-da2utrh5efls73baqi40` is LIVE/healthy. PR #335 authenticated SELECT-only welcome diagnostics, PR #332 stale-suppression, #328 catalogue and #326 Meta behavior remain included.
- PR #340 requires every implementing/operating specialist with a next owner/dependency to provide a self-contained fenced copy-ready handoff with owner/chat/reason/dependencies/Proceed-or-Blocked/completed-do-not-redo state. Direct specialist continuation is allowed when ownership/authority are clear; receiving specialists still independently verify current authority. If no next specialist action exists: `Next specialist: None — controlled unit complete.`
- Universal welcome routing is handset-proven repaired: authenticated pre-repair evidence showed no `v2` ledger/marker and one unique active canonical match; PR #337 fixed the greeting-navigation composition; the repaired 19:31 SAST Juvan `Hi` displayed the universal welcome first and the registered-client four-row list second. Do not redo the welcome proof or infer consent/guardian state.
- PR #320's full-label list presentation remains accepted. PR #322 adds the hybrid send-boundary rule: one-to-three safe choices use visible reply buttons after scope filtering; four-or-more or unsafe choices remain lists.
- JP retains the explicit #318 Christel+Abigail booking scope and Christel-equivalent authorized Admin actions except finalization. Other unlinked Admins remain fail-closed.
- Attendance finalization is own-practitioner-only for linked Christel, Abigail and Marietjie Admins. JP has no finalization. Identity/link conflicts fail closed.
- Admin typed-time, canonical/Goldie lookup, provisional-client booking/cleanup and same-Admin prepare→confirm rules remain accepted.
- Google Calendar OAuth/provider health is **🟢 VERIFIED HEALTHY**; the fail-closed provider guard remains permanent.
- Customer-change confirmation architecture is live; cancellation template is APPROVED; `shiloh_booking_update_v1` is **APPROVED / exact / duplicate-free / LIVE / ENABLED** with exact template configuration and explicit enablement. #575 / audit event 674 is terminally suppressed with `appointment_already_ended`, `sent_at=null`, and is historical evidence only. Genuine update-delivery evidence must come from a still-future appointment through a natural business journey.
- `/book` remains the accepted live CRM-backed public catalogue through #301; do not redo superseded #284–#300 variants.
- Christel's reviewed canonical catalogue correction is verified live through #328: service #27 inactive/unmapped with history preserved; #34/#65 retained at 120/50; reviewed totals 60/90/90; do not redo or expand it into description publication.
- Historical attendance remains human-controlled; #558 remains fail-closed with historical practitioner `SHILOH MTC`.
- Google Business Profile access remains pending Google with general Requests/min at 0; Production / DevOps owns verification and Control & Reconciliation tracks the dependency. No GBP integration work is authorized from this state.

**Authoritative current state:** PR #337 / `59119128ea0b288292622fd0b032058fcbd203ce` remains the accepted regression-green production application baseline; CI #1074 passed 701/0. Governance PR #340 / `aeb4e35361c34413d4310b1846c7043642a31cd2` is authoritative for mandatory copy-ready specialist handoffs; CI #1080 passed and docs-only Render `dep-da2utrh5efls73baqi40` is healthy LIVE. The universal welcome routing defect remains repaired and handset-proven. Booking-update production remains **LIVE / ENABLED** and provider APPROVED/existing/exact/duplicate-free/no resubmission. #575 / audit event 674 remains terminally suppressed historical evidence.

**Highest-priority next item:** continue the controlled Juvan client journey one handset step at a time, beginning with the registered-client **Browse treatments** choice and stopping for real handset evidence before selecting a treatment or advancing toward a booking confirmation.

**Why next:** the first-contact welcome defect is closed with code, CI, deploy, provider-health and handset proof. The governance handoff rule is now durable and does not reopen completed runtime work. The remaining user goal is non-destructive validation of client menus and the booking path while preserving canonical CRM/identity and duplicate safeguards.

**Remaining gates:** do not infer consent, guardian status or unobserved CRM attributes; do not manufacture or mutate an appointment; stop before any irreversible or genuine booking confirmation without explicit approval. Existing booking-update natural-delivery, historical attendance/#558, Goldie description, GBP and natural lifecycle evidence gates remain unchanged.