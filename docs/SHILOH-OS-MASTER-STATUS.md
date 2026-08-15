# Shiloh OS — Master Project Status

Updated: 2026-08-15
Purpose: permanent current-state project-management source of truth. Historical detail remains in Git history/archive; do not redo accepted work.

## Authority and production baseline

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or Calendar state.

Current application-code baseline: **PR #227** squash merge `4253f3404afca8e8245e2a4f6413d0aedf5c599f`. Render production deploy **`dep-d9vvvgh42hec739k6k60`** was independently verified **live** on 2026-08-15 with fresh `/health` 200 responses.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test uses JP admin account alone. Pending holds have no automatic expiry. MediHeel remains Christel only.

## Canonical project status taxonomy

Use exactly these lifecycle states in current operational documentation:

- 🟢 **VERIFIED** — completed with sufficient authoritative evidence.
- 🔵 **ACTIVE** — work currently being executed.
- ⚪ **READY** — genuinely actionable now, but not currently being executed.
- 🟠 **WAITING** — requires human, provider, external or genuine-journey evidence before it can advance.
- 🔴 **DEFECT / HOLD** — a proven problem or unsafe state; fail closed until repaired and re-verified.
- ⏸️ **DEFERRED** — deliberately postponed by explicit project decision.

**State is not evidence detail.** Code/CI/deploy evidence belongs in evidence text, not in the lifecycle state.

## Execution Protocol — mandatory checkpoint before substantial work

Before beginning substantial engineering or any new controlled production mutation, Shiloh OS must stop at an explicit four-part checkpoint:

1. **Authoritative current state** — verify current truth from the applicable authoritative sources.
2. **Highest-priority actionable item** — identify the single genuinely unfinished item that can be acted on now.
3. **Why this is next** — explain why it outranks alternatives and which alternatives are completed, blocked or evidence-gated.
4. **Explicit approval gate** — do not proceed automatically with substantial engineering, schema/data changes, migrations, production mutations, new controlled bookings or material workflow changes.

Read-only verification, diagnostics, reconciliation, documentation/status maintenance and clearly requested minor housekeeping may proceed without another approval gate.

## Active operational gate — Attendance finalization

### Attendance truth — 🟠 WAITING

Real staff reminder evidence on 2026-08-14 showed **2 Shiloh visits for clinic date 2026-08-14 require finalization**. The reminder was sent at approximately 19:06 SAST as an end-of-day reminder, so its phrase `from today` was correct at send time.

**Critical rule:** attendance is never inferred. Neither visit may be marked **Completed** or **No-show** without explicit authorized human truth.

### Admin finalization navigation — 🔵 ACTIVE real-WhatsApp verification

A real Christel WhatsApp test exposed multiple Admin-navigation defects before attendance could be reviewed. These were repaired self-test-first:

- **PR #226** — fixed stale Manage-booking state intercepting Admin/Menu/Hi; exposed **Finalize past visits** in the current Appointments section; made section refresh fail closed instead of dereferencing a missing interactive body.
- Self-test-first evidence: intentional red **CI #635** → final green **CI #638**.
- PR #226 merged as `d4f2c0c0a62e32c90de77fcfe47654c23ae7beaf`; Render deploy `dep-d9vvqd3ncjis738b4ldg` verified live/healthy.
- A follow-up real WhatsApp test then proved literal **`Admin`** still fell through to the legacy text Admin assistant rather than opening the canonical interactive home.
- **PR #227** repaired literal `Admin` as a canonical top-level Admin/home escape, including guided-state escape semantics.
- Self-test-first evidence: intentional red **CI #640**; implementation then exposed one obsolete test expectation; after updating that expectation, full green **CI #642**.
- PR #227 squash merged as `4253f3404afca8e8245e2a4f6413d0aedf5c599f`; Render deploy `dep-d9vvvgh42hec739k6k60` verified live with fresh `/health` 200.

**Next evidence step:** real WhatsApp only — send `Admin` → choose `Appointments` → choose `Finalize past visits`, then stop before selecting Completed/No-show and verify the pending visits shown. This is read-only workflow verification until an attendance decision is explicitly made.

## Real Client Perspective acceptance

### #564 positive Dummy Test approval — 🟢 VERIFIED

Confirmed Sat 15 Aug 2026, 10:45–12:15, Christel + MediHeel. Proven: indefinite hold, JP sole approval, held-slot exclusion, explicit approval, client confirmation and canonical Google Calendar event.

Calendar presentation was explicitly normalized in place without changing event identity, date/time, service, practitioner or booking state. Verified presentation: Client, formatted Mobile, WhatsApp link, Service, Practitioner, and native clinic Location; visible CRM/source clutter removed.

### #565 reschedule + cancellation — 🟢 VERIFIED

#565 proved canonical reschedule and later explicit cancellation. **#565 is cancelled; never recreate merely for proof.**

### #566 Dummy Test JP decline — 🟢 VERIFIED

#566 proved explicit JP decline, no Calendar event, and released capacity. **#566 is declined/cancelled and must not be recreated merely for proof.**

### Historical #561 — preserve cancelled truth

**#561 is a cancelled historical test. Never recreate.**

## Presentation and customer-experience workstreams

- PR #219 decline CTA / friendly policy-date polish — 🟠 **WAITING** for the next genuine applicable WhatsApp journey; do not manufacture a booking solely for proof.
- PR #222 Calendar staff-contact presentation — 🟢 **VERIFIED** through code/CI/prod plus approved #564 normalization/read-back.
- MediHeel/pedicure Calendar icon specificity — approved engineering remains unfinished in open PR #225; paused behind the higher-priority attendance operational issue. Resume from its existing self-test-first state; do not duplicate work.
- Post-confirmation client UX package (**Book another treatment / My appointments / Main menu** plus natural-language equivalents) — explicitly approved, queued behind currently active higher-priority repair/acceptance work. Buttons are primary discoverability; natural language is fallback. Do not start in parallel with an unresolved higher-priority workstream.

## Provider/template and other gated items

- Post-reschedule Google/Apple CTAs + Reschedule/Cancel controls — 🟠 **WAITING** for future genuine reschedule delivery.
- Reminder native Reschedule/Cancel buttons — 🟠 **WAITING** for Meta approval/config/real delivery as applicable.
- Google Contacts synchronization — ⚪ **READY**, separate lower-priority workstream; CRM remains authoritative.
- Ozow — 🟠 **WAITING** for merchant configuration and explicit business rules.
- Destructive privacy execution — 🟠 **WAITING**, fail-closed pending authority/evidence.

## Ordinary approval acceptance

Production ordinary approval rules still need genuine controlled evidence: Marietjie self-approval; Christel self-approval; Abigail approved by Abigail or Christel with first valid decision authoritative.

Lifecycle state: ⚪ **READY**, but **not the current active item** while the real attendance-finalization workflow is being verified.

## Exact continuation state

- #561 cancelled historical — never recreate.
- #564 confirmed 15 Aug 2026 10:45–12:15 Christel + MediHeel — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- 2 real visits from 2026-08-14 require explicit attendance finalization; no attendance truth may be inferred.
- PR #226 and #227 repair the Admin path required to reach Finalize past visits; #227 is current production code baseline.

**Authoritative current state:** GitHub `main` application baseline is PR #227 / `4253f340...`; Render deploy `dep-d9vvvgh42hec739k6k60` is live and healthy; attendance decisions remain untouched and human-truth-gated.

**Highest-priority actionable item:** 🔵 **ACTIVE — real WhatsApp verification of `Admin → Appointments → Finalize past visits`**, stopping before any Completed/No-show decision.

**Why this is next:** it closes the live staff-operational defect chain and is prerequisite to safely presenting the two pending 2026-08-14 visits for explicit human attendance truth. Ordinary approval is READY but lower priority until this operational issue is settled.

**Approval state:** the read-only WhatsApp verification is already authorized. Any actual attendance decision requires explicit human truth; any newly discovered substantial defect requires a fresh engineering approval gate.
