# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth. Historical detail remains in Git history/archive; do not redo accepted work.

## Authority and production baseline

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or Calendar state.

Current application-code baseline: **PR #222** squash merge `5c856745f7ba4eb39fb363071a49418c09fd672e`. Functional deploy **`dep-d9vh9sm7bikc73c40avg`** was independently verified live with post-deploy `/health` 200. Subsequent documentation-only auto-deploys do not change that application code baseline and must not be mistaken for new functional behavior. PR #222 is presentation-only for Google Calendar staff contact usability; booking, approval, hold, CRM catalogue/practitioner truth and private synchronization metadata are unchanged.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test uses JP admin account alone. Pending holds have no automatic expiry. MediHeel remains Christel only.

## Execution Protocol — mandatory checkpoint before substantial work

Before beginning substantial engineering or any new controlled production mutation, Shiloh OS must stop at an explicit four-part checkpoint:

1. **Authoritative current state** — verify and state current truth from GitHub `main`, Render production, Shiloh CRM, Google Calendar and/or explicit real WhatsApp/human evidence as applicable.
2. **Highest-priority actionable item** — identify the single genuinely unfinished item that is actionable now. Do not repeat completed work; externally blocked/evidence-gated items remain fail-closed.
3. **Why this is next** — explain why it outranks alternatives and which alternatives are completed, blocked or evidence-gated.
4. **Explicit approval gate** — do not proceed automatically with substantial engineering, schema/data changes, migrations, production mutations, new controlled bookings or material workflow changes. Stop and ask for explicit user approval.

Read-only verification, diagnostics, repository/production-state inspection, reconciliation, documentation/status maintenance and clearly requested minor housekeeping may proceed without another approval gate. If an already-approved test exposes a defect, stop at the defect and obtain approval before substantial engineering unless that repair was already explicitly authorized.

## Real Client Perspective acceptance — 2026-08-14

### #564 positive Dummy Test approval — REAL-ACCEPTED

Confirmed Sat 15 Aug 2026, 10:45–12:15, Christel + MediHeel. Proven: indefinite hold, JP sole approval, held-slot exclusion, explicit approval, client confirmation and canonical Google Calendar event with Dummy Test mobile. **Leave #564 unchanged.** A read-only post-PR-#222 Calendar check confirmed #564 remains unchanged with its original presentation; it was deliberately not rewritten merely for cosmetic proof.

### #565 reschedule + cancellation — REAL-ACCEPTED

#565 proved canonical reschedule including repaired self-conflict handling, old→new review-before-write, 12:15 boundary availability and Calendar update while #564 remained unchanged. It then proved deterministic destructive cancellation review and explicit cancellation; its Calendar event was absent afterward and #564 remained unchanged. **#565 is cancelled; never recreate merely for proof.**

### #566 Dummy Test JP decline — REAL-ACCEPTED

A genuine Dummy Test request for Bamboo Sports Massage - Area Specific with Abigail, Sat 15 Aug 2026 12:15 produced request #566. Real evidence proved indefinite hold, JP sole-approver request, explicit Decline, client not-confirmed outcome, no #566 Calendar event, and released 12:15 capacity offered again. **#566 is declined/cancelled and must not be recreated merely for proof.**

### Client Perspective presentation polish — PR #219

- Declined-booking outcome uses **Book another time** with stable `BOOKING` payload; typed `BOOKING` remains fallback.
- Client Booking Policy display says **Policy updated: 11 August 2026** while immutable audit version remains **`2026-08-11-v1`**.
- Terms and explicit `I AGREE` / `DECLINE` semantics are unchanged.
- Self-test-first evidence: red CI #617; final green CI #621; production live.
- Real WhatsApp acceptance of these presentation details waits for the next genuine applicable journey; do not manufacture a booking solely for proof.

### Google Calendar staff contact polish — PR #222

User-approved presentation-only polish is now **CODE/CI + PROD LIVE**:
- visible event description retains operational staff fields: **Client, Mobile, WhatsApp, Service, Practitioner**;
- WhatsApp contact is an explicit `https://wa.me/<digits>` link derived from the stored client mobile;
- clinic is written to Google Calendar's native **Location** field instead of repeated inside the description;
- visible `Shiloh CRM appointment #...` and `Source: ...` lines are removed;
- private Calendar synchronization metadata remains intact, including appointment id, source, staff, service and client mobile;
- creation and later legitimate update/reschedule paths share the polished presentation contract;
- self-test-first evidence: expectation-only CI **#627 failed**, implementation CI **#628 passed**;
- PR #222 squash merge `5c856745f7ba4eb39fb363071a49418c09fd672e`; functional Render deploy `dep-d9vh9sm7bikc73c40avg` was verified live and healthy before documentation reconciliation.

**Real presentation acceptance remains WAITING for the next genuine Calendar create/update.** Do not alter #564 or create a booking solely to prove the polish.

## Provider/template and other fail-closed items

- Post-reschedule Google/Apple CTAs + Reschedule/Cancel controls are code/CI/prod-live; REAL acceptance waits for a future genuine reschedule.
- Reminder native Reschedule/Cancel buttons remain **PROVIDER/TEMPLATE WAITING** pending Meta approval, explicit production config and real delivery evidence.
- Google Contacts synchronization is not implemented; CRM remains authoritative.
- Attendance finalizations remain WAITING for genuine Completed/No-show truth.
- Ozow remains WAITING on merchant configuration and explicit business rules.
- Destructive privacy execution remains fail-closed pending authority/evidence.

## Remaining Client Perspective priorities

Completed/accepted includes both Dummy Test approval directions: #564 positive JP approval and #566 explicit JP decline/release. Calendar contact polish is production-live but deliberately awaits genuine presentation evidence.

**Highest-priority genuinely unfinished actionable item: ordinary approval acceptance.** Production rules exist but still require controlled real evidence: Marietjie self-approval; Christel self-approval; Abigail booking approved by Abigail or Christel with first valid decision authoritative. Use genuine controlled requests and do not mutate #564 solely for proof.

**Why it is next:** Dummy Test positive/negative approval is accepted; the Calendar polish is already engineered/deployed and its remaining evidence must wait for a genuine journey; ordinary production approval is not externally blocked and still lacks genuine acceptance evidence. Provider-template, attendance, payment and privacy items are externally blocked or evidence-gated.

## Exact continuation state

- **#561** — cancelled historical test. Never recreate.
- **#564** — confirmed Sat 15 Aug 2026, **10:45–12:15**, Christel + MediHeel. Leave unchanged.
- **#565** — cancelled after accepted reschedule/cancellation lifecycle. Never recreate merely for proof.
- **#566** — declined by JP; held Abigail/Bamboo 12:15 capacity proven released; no #566 Calendar event. Never recreate merely for proof.

**Authoritative current state:** PR #222 is the current application-code baseline; controlled appointment state above remains authoritative until re-verified against applicable sources. Render's exact current deploy must be re-verified directly because documentation-only commits also auto-deploy.

**Highest-priority actionable item:** controlled **ordinary approval acceptance**, starting with the least-complex self-approval path (Marietjie or Christel), then Abigail's dual-authority/first-valid-decision rule.

**Why this is next:** ordinary approval remains the highest-value genuinely unfinished acceptance item that is actionable now; Calendar contact polish is already production-live and waits only for a genuine applicable journey.

**Approval gate:** **WAITING FOR USER APPROVAL TO PROCEED.** Do not begin a new controlled booking or substantial engineering solely from this continuation state.
