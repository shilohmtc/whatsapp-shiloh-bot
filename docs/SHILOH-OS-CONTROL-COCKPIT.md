# Shiloh OS Control Cockpit

Controlled unit: `SHILOH-OS-CONTROL-COCKPIT`

Owner: **00 — Control & Reconciliation**

Status after merge: **ACTIVE GOVERNANCE STANDARD**

## Purpose

The Control Cockpit is the single visual cross-workstream projection of Shiloh OS state. It exists to make ownership, priority, blockers, completion, authority and next action understandable without requiring Christel or JP to reconcile multiple specialist chats manually.

The Cockpit is **not an independent source of truth**. It projects the current authoritative GitHub control records, Master Status, applicable Tracker state, merged Control decisions and current machine evidence.

## Business owner and delegated technical principal

Shiloh OS distinguishes business ownership from delegated technical/system authority:

- **Christel — Business Owner / Primary Shiloh Admin** — owner and primary human business authority for Shiloh Massage Therapy & Aesthetic Clinic.
- **JP — Delegated Technical/System Super Admin** — helps build, test, support, secure and improve Shiloh OS under delegated technical/system authority.

Durable product principle: **Christel owns and operates Shiloh Massage Therapy & Aesthetic Clinic. Shiloh OS should allow Christel to administer the business herself. JP helps build, govern technically, test and improve the system under delegated authority.**

`00 — Control & Reconciliation` is the engineering/control process for sequencing, authorization records, evidence, gates and reconciliation. It is not an independent human business owner.

This is a governance model, not a claim that every external/runtime permission has already been aligned. Concrete role, permission, credential, infrastructure or production-access changes remain separately controlled mutations.

Every material new capability must define the Christel business/admin path, bounded staff operational paths, the JP delegated technical/admin path where needed, any security/production-sensitive actions, and the applicable audit/fail-closed/non-self-escalation rules.

## Source-of-truth discipline

GitHub is the authoritative location for Shiloh OS engineering/control state unless a controlled decision explicitly names another system as authoritative for a particular domain.

For Control and reconciliation, 00 should retrieve current `main`, issues, PRs, merge state, repository governance/Master records and relevant machine evidence directly. Google Drive is **not** a parallel Shiloh OS Master/Tracker/reconciliation authority unless a specific Drive document is explicitly designated as such.

Domain systems remain authoritative for their own runtime facts where applicable, for example Render for deployment/runtime evidence, the canonical CRM/database for client data, Calendar/provider systems for their governed scheduling evidence, and Meta/provider evidence for messaging state.

Do not create duplicate control documents merely because another storage system is available. Prefer one durable authority and projections of that authority.

## Authority hierarchy

Business policy originates with Christel as Business Owner. Technical/system execution may be delegated, including to JP, without transferring business ownership.

When durable Shiloh OS control records differ, apply this precedence:

1. Explicit current business-owner policy and valid capability-specific delegated technical/control authorization.
2. Merged Control authorization / reconciliation decisions and their exact repository authority, insofar as they faithfully record the applicable business/delegated authority.
3. Master Status and applicable Tracker durable records.
4. Current machine evidence from GitHub / Render / provider or database observers when relevant.
5. The Control Cockpit projection.
6. Specialist chat summaries or historical conversational state.

A mismatch must be reconciled by 00; a lower-precedence source must not silently override higher authority.

## Workstream states

- `✓ COMPLETE / FROZEN` — controlled work is accepted; do not redo absent new defect evidence or fresh authorization.
- `▶ ACTIVE` — this is an internal Shiloh OS execution unit currently owned by the named specialist.
- `⏸ WAITING EXTERNAL` — Shiloh-side work is paused on an external provider or third party.
- `◆ CONTROL GATE` — implementation or production mutation is waiting for a Control decision or explicit authorization.
- `○ OBSERVER / IDLE` — no active implementation ownership; may provide bounded evidence when requested.
- `✕ BLOCKED` — an internal dependency or failed gate prevents progress and requires resolution.

## Controlled-unit lifecycle

`Finding → Control decision → Authorized → Implementation → CI → Merge → Deploy → Production proof → Reconciled → Closed`

A unit may branch to `WAITING EXTERNAL` or `BLOCKED` and return to the lifecycle only when the external/internal gate changes.

## Required Cockpit fields

Every active or recently closed unit must expose:

- owning workstream;
- controlled-unit identifier;
- state;
- exact authority (issue / PR / branch / SHA when available);
- current gate or dependency;
- next owner;
- exactly what the responsible human must do next, if anything;
- explicit `DO NOT REDO` boundary where applicable;
- Tracker reconciliation state where an applicable Tracker record exists;
- Master Status reconciliation state.

## Current snapshot — 2026-08-27

| Stream | State | Current unit / authority | Current gate | Next owner |
|---|---|---|---|---|
| **00 — Control & Reconciliation** | ▶ ACTIVE | `SHILOH-OS-BUSINESS-OWNER-AND-DELEGATED-TECHNICAL-AUTHORITY`; Draft PR #508 | Docs/governance review only; no runtime mutation | 00; 10/20 returns continue independently |
| **10 — Calendar & Booking Assurance** | ▶ ACTIVE | `SHILOH-CALENDAR-SERVICE-SCOPED-BOOKING-CONFIRMATION-P0`; issue #505. PR #504 remains HOLD | Implement service-scoped own-identity booking and confirmation-safe finalization; integrate #506 | 10, then 00 |
| **20 — CRM & Identity** | ▶ ACTIVE | `SHILOH-CALENDAR-BOOKING-BOUND-CLIENT-AUTHORITY-P0`; issue #506 | Implement least-privilege booking-bound contact/name authority seam | 20, then 00/10 integration |
| **30 — WhatsApp & Meta Integration** | ⏸ WAITING EXTERNAL | Meta verification convergence | Meta Business Support | Meta Support, then 00 |
| **40 — Production & DevOps** | ○ OBSERVER / IDLE | Evidence observer | No production mutation authorized for #504/#505/#506/#508 | Called only for bounded runtime/deploy evidence |

Current human authority model: **Christel = Business Owner / Primary Shiloh Admin**; **JP = Delegated Technical/System Super Admin**.

Current production/main authority at this snapshot: `bfba3b0047faf4e960c114d178fe0da9dd63b7e3` (PR #500 merge; initial booking confirmation guarantee).

PR #504 is open/draft/unmerged and remains **HOLD / DO NOT MERGE / DO NOT DEPLOY** while the active Calendar P0 authority/confirmation gaps are closed.

## Current priority sequence

1. **#505 / 10 — Calendar & Booking Assurance:** implement service-scoped booking authority for the authorized staff model and make confirmation safety a final-booking acceptance condition.
2. **#506 / 20 — CRM & Identity:** implement the canonical booking-bound contact/name authority seam needed by Calendar without creating a second identity system or broad CRM-admin privilege.
3. **#504 — Calendar cockpit polish:** remain HOLD; reconcile/rebase only after the P0 operational authority/confirmation contract is accepted.
4. **#508 / 00 governance correction:** docs-only and deliberately non-blocking to #505/#506; reconcile the corrected business-owner/delegated-technical model without mutating runtime permissions.
5. **30 — WhatsApp & Meta Integration:** remains WAITING EXTERNAL on Meta Business Support unless substantive provider evidence changes the gate.
6. **40 — Production & DevOps:** remains observer-only until a bounded runtime/DB/deploy evidence request is routed.

## Update triggers

00 must refresh the Cockpit when any of the following occurs:

- a new controlled unit is authorized;
- ownership changes;
- a unit moves between ACTIVE, BLOCKED, WAITING EXTERNAL, COMPLETE or FROZEN;
- a PR is opened, merged, closed or superseded when it changes authority;
- a deployment becomes authoritative or fails;
- production proof changes completion state;
- an external provider gate changes;
- Tracker or Master Status is reconciled;
- a `DO NOT REDO` boundary is established or lifted;
- business ownership, delegation or human role boundaries change;
- a source-of-truth ambiguity is discovered that could cause competing control records.

Routine machine evidence should be retrieved by 00 through available connectors rather than requiring Christel or JP to act as a human clipboard.

## 00 response standard

For substantive cross-workstream requests, 00 should provide a compact Control Snapshot near the top of the response showing:

`Stream | State | Current unit | Gate | Next owner`

Where human authority is material, 00 should state the applicable boundary: Christel Business Owner / Primary Shiloh Admin, JP Delegated Technical/System Super Admin, or a narrower derived staff/capability role.

Then the normal Shiloh OS terminal fields remain mandatory:

1. Status.
2. Authoritative outcome.
3. Completed / do not redo.
4. Unresolved gates or dependencies.
5. Tracker reconciliation status where applicable.
6. Master Status reconciliation status.
7. Next specialist.
8. Exactly what the responsible human should do next, if anything.
9. Copy-ready handoff when another specialist owns the next action.

## Governance constraints

- The Cockpit does not authorize production mutations, bookings, outbound messages, destructive changes, permission changes or other security-sensitive actions by itself.
- Business-owner policy, delegated technical execution and Control authorization must not be conflated.
- Recommendation and authorization remain separate.
- Specialists must not maintain competing cross-stream boards.
- GitHub control records and Master/Tracker projections must remain reconciled; the Cockpit is their readable operational projection, not a competing truth source.
- Closed capabilities remain frozen and must not be recreated merely because a later unit touches an adjacent surface.
- The Business Ownership and Delegated Technical Authority standard does not silently mutate external/runtime permissions.
- Normal recurring business administration should be productized in Shiloh Workspace rather than left as a permanent JP/ChatGPT engineering task.
