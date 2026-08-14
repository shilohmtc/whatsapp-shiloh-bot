# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth. Historical detail remains in Git history/archive; do not redo accepted work.

## Authority and production baseline

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or Calendar state.

Current application-code baseline: **PR #222** squash merge `5c856745f7ba4eb39fb363071a49418c09fd672e`. Functional deploy **`dep-d9vh9sm7bikc73c40avg`** was independently verified live with post-deploy `/health` 200. Subsequent documentation-only auto-deploys do not change that application-code baseline; verify Render directly for the exact current deploy ID.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test uses JP admin account alone. Pending holds have no automatic expiry. MediHeel remains Christel only.

## Canonical project status taxonomy

Use exactly these lifecycle states in current operational documentation:

- 🟢 **VERIFIED** — completed with sufficient authoritative evidence.
- 🔵 **ACTIVE** — work currently being executed.
- ⚪ **READY** — genuinely actionable now, but not currently being executed.
- 🟠 **WAITING** — requires human, provider, external or genuine-journey evidence before it can advance.
- 🔴 **DEFECT / HOLD** — a proven problem or unsafe state; fail closed until repaired and re-verified.
- ⏸️ **DEFERRED** — deliberately postponed by explicit project decision.

**State is not evidence detail.** Statements such as `code/CI + prod live`, PR numbers, deploy IDs and test results belong in the evidence/action text, not in the State field. Legacy `🟡` entries must be normalized to the real lifecycle state; legacy `⬜` maps to ⚪ READY. Do not introduce new ad-hoc status colors or compound pseudo-states.

## Execution Protocol — mandatory checkpoint before substantial work

Before beginning substantial engineering or any new controlled production mutation, Shiloh OS must stop at an explicit four-part checkpoint:

1. **Authoritative current state** — verify and state current truth from GitHub `main`, Render production, Shiloh CRM, Google Calendar and/or explicit real WhatsApp/human evidence as applicable.
2. **Highest-priority actionable item** — identify the single genuinely unfinished item that is actionable now. Do not repeat completed work; externally blocked/evidence-gated items remain fail-closed.
3. **Why this is next** — explain why it outranks alternatives and which alternatives are completed, blocked or evidence-gated.
4. **Explicit approval gate** — do not proceed automatically with substantial engineering, schema/data changes, migrations, production mutations, new controlled bookings or material workflow changes. Stop and ask for explicit user approval.

Read-only verification, diagnostics, repository/production-state inspection, reconciliation, documentation/status maintenance and clearly requested minor housekeeping may proceed without another approval gate. If an already-approved test exposes a defect, stop at the defect and obtain approval before substantial engineering unless that repair was already explicitly authorized.

## Real Client Perspective acceptance — 2026-08-14

### #564 positive Dummy Test approval — 🟢 VERIFIED

Confirmed Sat 15 Aug 2026, 10:45–12:15, Christel + MediHeel. Proven: indefinite hold, JP sole approval, held-slot exclusion, explicit approval, client confirmation and canonical Google Calendar event with Dummy Test mobile.

On 14 Aug, after explicit user approval, **#564's existing Calendar presentation was normalized in place** without changing its event identity, date/time, service, practitioner or booking state. Authoritative Calendar read-back verifies:
- Client: Dummy Test
- Mobile: `+27 71 674 2646`
- WhatsApp: `https://wa.me/27716742646`
- Service: Medi-Heel Pedicure (With Gel Toes) & Foot Massage
- Practitioner: Christel
- native Location: Shiloh Massage Therapy and Aesthetic Clinic

The old visible CRM appointment-number/source clutter is gone. This controlled presentation migration does not reopen or alter #564's booking acceptance evidence.

### #565 reschedule + cancellation — 🟢 VERIFIED

#565 proved canonical reschedule including repaired self-conflict handling, old→new review-before-write, 12:15 boundary availability and Calendar update while #564 remained unchanged. It then proved deterministic destructive cancellation review and explicit cancellation; its Calendar event was absent afterward. **#565 is cancelled; never recreate merely for proof.**

### #566 Dummy Test JP decline — 🟢 VERIFIED

A genuine Dummy Test request for Bamboo Sports Massage - Area Specific with Abigail, Sat 15 Aug 2026 12:15 produced request #566. Real evidence proved indefinite hold, JP sole-approver request, explicit Decline, client not-confirmed outcome, no #566 Calendar event, and released 12:15 capacity offered again. **#566 is declined/cancelled and must not be recreated merely for proof.**

## Presentation workstreams

### PR #219 decline/policy polish — 🟠 WAITING

Implementation evidence is complete: declined-booking outcome uses **Book another time** with stable `BOOKING` payload; Booking Policy display says **Policy updated: 11 August 2026** while immutable audit version remains `2026-08-11-v1`; self-test-first evidence is red CI #617 → green CI #621; production deployment succeeded.

Lifecycle state remains **WAITING** because real WhatsApp acceptance of these presentation details must come from the next genuine applicable journey. Do not manufacture a booking solely for proof.

### PR #222 Google Calendar staff contact polish — 🟢 VERIFIED

Implementation evidence: visible description retains **Client, Mobile, WhatsApp, Service, Practitioner**; WhatsApp uses `https://wa.me/<digits>`; clinic uses native Google Calendar **Location**; visible CRM appointment/source lines are removed; private synchronization metadata remains intact; creation and legitimate update/reschedule paths share the polished contract; red CI #627 → green CI #628; functional Render deployment verified healthy.

Real Calendar presentation is now also verified through the explicitly approved in-place normalization and read-back of #564. No new booking was manufactured merely for proof.

## Provider/template and other gated items

- Post-reschedule Google/Apple CTAs + Reschedule/Cancel controls — 🟠 **WAITING** for a future genuine reschedule delivery; implementation is already code/CI/prod-live.
- Reminder native Reschedule/Cancel buttons — 🟠 **WAITING** for Meta approval, explicit production config and real delivery evidence.
- Google Contacts synchronization — ⚪ **READY** as a separate workstream; not implemented; CRM remains authoritative.
- Attendance finalizations — 🟠 **WAITING** for genuine Completed/No-show truth.
- Ozow — 🟠 **WAITING** for merchant configuration and explicit business rules.
- Destructive privacy execution — 🟠 **WAITING**, fail-closed pending authority/evidence.

## Remaining Client Perspective priority

Dummy Test positive approval (#564), explicit decline/release (#566), reschedule/cancellation (#565), and Calendar staff-contact presentation are 🟢 VERIFIED.

**Highest-priority genuinely unfinished actionable item: ⚪ READY — ordinary approval acceptance.** Production rules exist but still require controlled real evidence: Marietjie self-approval; Christel self-approval; Abigail booking approved by Abigail or Christel with first valid decision authoritative.

**Why it is next:** the controlled Dummy Test approval directions and Calendar presentation are verified. Ordinary production approval is not externally blocked and still lacks genuine acceptance evidence. Provider-template, attendance, payment and privacy items are WAITING; Google Contacts is READY but lower priority.

## Exact continuation state

- **#561** — cancelled historical test. Never recreate.
- **#564** — confirmed Sat 15 Aug 2026, 10:45–12:15, Christel + MediHeel; Calendar presentation normalized and verified. Preserve booking semantics.
- **#565** — cancelled after verified reschedule/cancellation lifecycle. Never recreate merely for proof.
- **#566** — declined by JP; held Abigail/Bamboo 12:15 capacity proven released; no Calendar event. Never recreate merely for proof.

**Authoritative current state:** PR #222 remains the application-code baseline; #564's normalized Calendar presentation is verified; controlled appointment state above remains authoritative until re-verified against applicable sources. Verify Render directly for the exact current deploy because documentation-only commits also auto-deploy.

**Highest-priority actionable item:** ⚪ **READY — controlled ordinary approval acceptance**, starting with the least-complex self-approval path (Marietjie or Christel), then Abigail's dual-authority/first-valid-decision rule.

**Why this is next:** it is the highest-value genuinely unfinished acceptance item that is actionable now; competing provider/evidence items are WAITING and Google Contacts is lower-priority READY work.

**Approval gate:** **WAITING FOR USER APPROVAL TO PROCEED WITH ORDINARY APPROVAL ACCEPTANCE.** Do not begin that controlled booking solely from this continuation state.
