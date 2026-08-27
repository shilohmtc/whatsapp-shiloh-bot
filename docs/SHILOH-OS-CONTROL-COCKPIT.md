# Shiloh OS Control Cockpit

Controlled unit: `SHILOH-OS-CONTROL-COCKPIT`

Owner: **00 — Control & Reconciliation**

Status after merge: **ACTIVE GOVERNANCE STANDARD**

## Purpose

The Control Cockpit is the single visual cross-workstream projection of Shiloh OS state. It exists to make ownership, priority, blockers, completion, authority and next action understandable without requiring JP to reconcile multiple specialist chats manually.

The Cockpit is **not an independent source of truth**. It projects the current authoritative Project Tracker, Master Status, merged Control decisions and current machine evidence.

## Governing stabilization doctrine

During the current stabilization phase, all Control Cockpit prioritization and new-work decisions must apply:

`docs/SHILOH-OS-STABILIZATION-SIMPLIFICATION-DOCTRINE.md`

The operative spine is:

**Shiloh Calendar → Clean CRM V2 → WhatsApp communications / client registration**

No unrelated P0/P1 feature accumulation, speculative refactoring or legacy-surface polish should interrupt that spine unless it removes a blocking dependency or remediates a genuine production/security defect.

The current Master Status stabilization checkpoint is recorded in:

`docs/SHILOH-OS-MASTER-STATUS-ADDENDUM-2026-08-27-STABILIZATION-SIMPLIFICATION.md`

The doctrine also governs Workspace economy, OWN / INTEGRATE / RETIRE / NEVER BUILD decisions, control-surface hygiene and the **ACTIVE bounded 00 standing-release model**.

### Standing release authority

Bounded standing 00 release delegation is **ACTIVE** under JP's explicit 2026-08-27 authorization recorded in the current Master Status stabilization addendum.

00 may use that delegation only after independently satisfying every Section 8 pre-merge condition in the Stabilization & Simplification Doctrine. Specialist and WS streams never self-merge. Excluded destructive/data/provider/security/operator/business actions remain explicit JP gates.

**Important:** the dated 2026-08-25 snapshot later in this document is historical evidence only. It must not be treated as current machine state. 00 must read current GitHub / Render / provider evidence and newer Master Status addenda before acting.

## Primary human principals

Shiloh OS is governed around two primary human principals:

- **JP — System Owner / Super Admin** — accountable system/governance authority.
- **Christel — Operations Admin** — primary day-to-day clinic operations authority.

Durable product principle: **JP governs Shiloh OS; Christel operates Shiloh OS.**

This is a governance model, not a claim that every external/runtime permission has already been aligned. Concrete role, permission, credential, infrastructure or production-access changes remain separately controlled mutations.

Every material new capability must explicitly define the JP governance/admin path, the Christel operational/admin path, any JP-only/security-sensitive actions, and the applicable audit/fail-closed/non-self-escalation rules.

## Authority hierarchy

When sources differ, apply this precedence:

1. Merged Control authorization / reconciliation decisions and their exact repository authority.
2. Project Tracker and Master Status durable records.
3. Current machine evidence from GitHub / Render / provider or database observers when relevant.
4. The Control Cockpit projection.
5. Specialist chat summaries or historical conversational state.

A Cockpit mismatch must be reconciled by 00; the lower-precedence source must not silently override higher authority.

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
- exact authority (PR / branch / SHA when available);
- current gate or dependency;
- next owner;
- exactly what JP must do next;
- explicit `DO NOT REDO` boundary where applicable;
- Tracker reconciliation state;
- Master Status reconciliation state.

## Historical snapshot — 2026-08-25 — superseded as current state

The table below is retained as historical Control evidence only. It is **not** a current workstream projection after the 2026-08-27 stabilization reset. Use current machine evidence plus the latest Master Status addendum for live decisions.

| Stream | State | Current unit / authority | Current gate | Next owner |
|---|---|---|---|---|
| **00 — Control & Reconciliation** | ✓ RECONCILED | Control Cockpit + `SHILOH-OS-PRIMARY-HUMAN-AUTHORITY`; accepted CRM name-authority return | Maintain projection as state changes | Meta Support return or new controlled unit |
| **10 — Booking & Admin UX** | ✓ COMPLETE / FROZEN | Emergency Christel Calendar + guarded provisional new-client booking | None | None unless new defect evidence |
| **20 — CRM & Identity** | ✓ COMPLETE / FROZEN | `SHILOH-CLIENT-FACING-NAME-AUTHORITY`; Control PR #488, implementation PR #490, reconciliation PR #492 | Individual current-name corrections remain evidence-gated | None unless 00 authorizes an exact evidence-backed correction |
| **30 — WhatsApp & Meta Integration** | ⏸ WAITING EXTERNAL | Meta verification convergence; Control PR #483 | Meta Business Support | Meta Support, then 00 |
| **40 — Production & DevOps** | ○ OBSERVER / IDLE | Evidence observer | None | Called only when bounded runtime/DB/deploy evidence is needed |

Primary principals: **JP = System Owner / Super Admin**; **Christel = Operations Admin**.

Client-facing-name implementation authority: `a88ba2c7962af4dffb53886904d1ab325b09ae14` / production deploy `dep-da6l97dbedkc73frmqj0`.

Client-facing-name terminal reconciliation authority: PR #492 / main `6b6b626e4f9b4b48f130cc811f86f7cced214605` / reconciliation deploy `dep-da6lbi15efls73cun5f0`.

Durable name boundary: canonical `clients.id` remains identity authority; imported/Goldie/historical names remain aliases/provenance; a current client-facing name requires approved evidence; no active authority means neutral client-facing wording.

## Historical priority sequence — superseded

This sequence is retained only to explain the 2026-08-25 state and must not drive new work after the stabilization doctrine takes effect.

1. **Meta Business Support** proceeds externally; 30 remains paused until substantive provider evidence arrives.
2. There is currently **no active internal implementation unit** after completion of `SHILOH-CLIENT-FACING-NAME-AUTHORITY`.
3. Any future exact evidence-backed current-name correction must route through **00 → 20**; do not infer or mass-clean names.
4. **10 — Booking & Admin UX** remains frozen unless genuine new defect evidence appears.
5. **40 — Production & DevOps** remains observer-only unless a bounded evidence request is routed to it.
6. **00 — Control & Reconciliation** maintains cross-stream authority, gates and final reconciliation.

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
- primary-human authority or role boundaries change.

Routine machine evidence should be retrieved by 00 through available connectors rather than requiring JP to act as a human clipboard.

During stabilization, 00 must also apply the doctrine's mandatory checkpoint before authorizing substantive new work:

> **Does this advance the operational spine, remove a dependency, reduce lifetime complexity, or fix a genuine operational risk? If none applies, why are we doing it now?**

## 00 response standard

For substantive cross-workstream requests, 00 should provide a compact Control Snapshot near the top of the response showing:

`Stream | State | Current unit | Gate | Next owner`

Where human authority is material, 00 should also state the applicable principal boundary: JP System Owner / Super Admin, Christel Operations Admin, or a narrower derived role.

Then the normal Shiloh OS terminal fields remain mandatory:

1. Status.
2. Authoritative outcome.
3. Completed / do not redo.
4. Unresolved gates or dependencies.
5. Project Tracker reconciliation status.
6. Master Status reconciliation status.
7. Next specialist.
8. Exactly what JP should do next.
9. Copy-ready handoff when another specialist owns the next action.

## Governance constraints

- The Cockpit does not independently authorize production mutations, bookings, outbound messages, destructive changes, permission changes or other security-sensitive actions.
- Recommendation and authorization remain separate.
- Bounded standing 00 release delegation is ACTIVE under JP's explicit 2026-08-27 authorization and remains strictly limited to the boundaries recorded in the Stabilization & Simplification Doctrine.
- Specialists must not maintain competing cross-stream boards.
- Tracker and Master Status remain durable authority; the Cockpit is their readable operational projection.
- Closed capabilities remain frozen and must not be recreated merely because a later unit touches an adjacent surface.
- The Primary Human Authority standard defines governance roles but does not silently mutate external/runtime permissions.
