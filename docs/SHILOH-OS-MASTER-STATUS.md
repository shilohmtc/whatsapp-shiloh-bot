# Shiloh OS — Master Project Status

Updated: 2026-08-15
Purpose: permanent current-state project-management source of truth. Historical detail remains in Git history/archive; do not redo accepted work.

## Authority and production baseline

Operational truth is GitHub `main`, Render production, Shiloh CRM, Google Calendar and explicit real WhatsApp/human evidence. Never infer provider, attendance, approval, CRM or Calendar state.

Current application-code baseline: **PR #225** squash merge `3fe028810902fe2b370f067e213f7c2633c89efb`. Render production deploy **`dep-da00cjad0e5s73a8thng`** is verified **live** on 2026-08-15 with fresh `/health` 200 responses.

Approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative. Dummy Test uses JP admin account alone. Pending holds have no automatic expiry. MediHeel remains Christel only.

## Canonical project status taxonomy

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

## Attendance finalization — 🟢 VERIFIED for the 2026-08-14 reminder cohort

Real staff reminder evidence on 2026-08-14 identified **2 Shiloh visits for clinic date 2026-08-14 requiring finalization**. Attendance was never inferred.

The real WhatsApp journey exposed and then verified repair of three production defects:

- **PR #226** — stale Manage-booking state interception, missing Finalize-past-visits discoverability, and unsafe section refresh. Intentional red CI #635 → green CI #638.
- **PR #227** — literal `Admin` failed to enter the canonical interactive Admin home. Intentional red CI #640 → green CI #642.
- **PR #229** — Finalize-past-visits could render 11 WhatsApp rows (9 visits + More + Back), exceeding Meta's 10-row limit. Repaired to reserve navigation rows: 8 visits + More + Back = maximum 10. Green CI #648; production deploy `dep-da004j8u01pc73epn00g` verified live.

Real WhatsApp production evidence then proved the complete workflow:

- `Admin → Appointments → Finalize past visits` opened successfully and displayed the authorized unresolved backlog.
- **#562 — Zane Maree — Full Body Swedish — Abigail — 2026-08-14 15:00:** Christel explicitly confirmed **Completed**; Shiloh returned `Appointment #562 marked Completed`.
- **#357 — Buhle Zulu — 2026-08-14 12:15:** Christel intentionally selected and subsequently explicitly confirmed **No-show**; Shiloh returned `Appointment #357 marked No-show`.
- A duplicate #357 No-show interaction was rejected with no second update, proving fail-closed stale/duplicate-action handling.

The two visits that triggered the 2026-08-14 reminder are therefore resolved with explicit human truth. Older unresolved historical visits remain visible in the backlog and **must not be bulk-finalized or inferred**; each remains human-truth-gated.

Direct connector-level CRM row read-back remains unavailable while the Render Postgres connector cannot negotiate the database's required SSL/TLS. Do not fabricate row-level read-back. The explicit real WhatsApp canonical-write confirmations are authoritative operational evidence for #562/#357.

## Real Client Perspective acceptance

### #564 positive Dummy Test approval — 🟢 VERIFIED

Confirmed Sat 15 Aug 2026, 10:45–12:15, Christel + MediHeel. Proven: indefinite hold, JP sole approval, held-slot exclusion, explicit approval, client confirmation and canonical Google Calendar event.

Calendar presentation was normalized in place without changing event identity, date/time, service, practitioner or booking state. Verified presentation: Client, formatted Mobile, WhatsApp link, Service, Practitioner, and native clinic Location; visible CRM/source clutter removed. Its displayed Medi-Heel icon was also normalized to 🦶 during approved presentation housekeeping.

### #565 reschedule + cancellation — 🟢 VERIFIED

#565 proved canonical reschedule and later explicit cancellation. **#565 is cancelled; never recreate merely for proof.**

### #566 Dummy Test JP decline — 🟢 VERIFIED

#566 proved explicit JP decline, no Calendar event, and released capacity. **#566 is declined/cancelled and must not be recreated merely for proof.**

### Historical #561 — preserve cancelled truth

**#561 is a cancelled historical test. Never recreate.**

## Presentation and customer-experience workstreams

- PR #219 decline CTA / friendly policy-date polish — 🟠 **WAITING** for the next genuine applicable WhatsApp journey; do not manufacture a booking solely for proof.
- PR #222 Calendar staff-contact presentation — 🟢 **VERIFIED** through code/CI/prod plus approved #564 normalization/read-back.
- PR #225 MediHeel/pedicure Calendar icon specificity — 🟢 **VERIFIED**. Self-test-first evidence: intentional red CI #634 → green CI #652. The classifier now gives pedicure/foot/heel/toe specificity precedence over generic massage, so `Medi-Heel Pedicure ... & Foot Massage` resolves to 🦶 while ordinary massage services remain 💆. Squash merge `3fe028810902fe2b370f067e213f7c2633c89efb`; Render deploy `dep-da00cjad0e5s73a8thng` verified live/healthy.
- Post-confirmation client UX package (**Book another treatment / My appointments / Main menu** plus natural-language equivalents) — ⚪ **READY** and explicitly approved. Buttons are primary discoverability; natural language is fallback. This is now the highest-priority approved customer-experience workstream.

## Provider/template and other gated items

- Post-reschedule Google/Apple CTAs + Reschedule/Cancel controls — 🟠 **WAITING** for future genuine reschedule delivery.
- Reminder native Reschedule/Cancel buttons — 🟠 **WAITING** for Meta approval/config/real delivery as applicable.
- Google Contacts synchronization — ⚪ **READY**, separate lower-priority workstream; CRM remains authoritative.
- Ozow — 🟠 **WAITING** for merchant configuration and explicit business rules.
- Destructive privacy execution — 🟠 **WAITING**, fail-closed pending authority/evidence.

## Ordinary approval acceptance

Production ordinary approval rules still need genuine controlled evidence: Marietjie self-approval; Christel self-approval; Abigail approved by Abigail or Christel with first valid decision authoritative.

Lifecycle state: ⚪ **READY**.

## Exact continuation state

- #561 cancelled historical — never recreate.
- #564 confirmed 15 Aug 2026 10:45–12:15 Christel + MediHeel — preserve booking semantics.
- #565 cancelled — never recreate merely for proof.
- #566 declined/released — never recreate merely for proof.
- #562 explicitly finalized **Completed** from real human truth.
- #357 intentionally and explicitly finalized **No-show** from real human truth; duplicate replay safely rejected.
- Older attendance backlog remains unresolved and human-truth-gated; do not infer or bulk-finalize.
- PR #226/#227/#229 attendance Admin defect chain is repaired and real-WhatsApp verified.
- PR #225 Calendar icon specificity is merged, green and production-live; do not redo it.

**Authoritative current state:** GitHub `main` application baseline is PR #225 / `3fe02881...`; Render deploy `dep-da00cjad0e5s73a8thng` is live and healthy; attendance reminder cohort is resolved; Calendar contact presentation and MediHeel icon specificity are verified.

**Highest-priority genuinely actionable item:** ⚪ **READY — implement the already-approved post-confirmation client UX package: Book another treatment / My appointments / Main menu, with natural-language equivalents.**

**Why this is next:** attendance's live operational defect chain is closed and PR #225 is now fully completed. The post-confirmation UX package was explicitly approved earlier, directly improves client discoverability and repeat-booking experience, and is the next unfinished approved customer-facing workstream. Ordinary approval and Google Contacts remain READY but lower priority.

**Approval state:** the post-confirmation UX package has prior explicit user approval, but under the execution protocol a fresh four-part checkpoint must still be presented before substantial implementation resumes. Read-only verification and reconciliation remain permitted.