# Shiloh OS Control Cockpit

Controlled unit: `SHILOH-OS-CONTROL-COCKPIT`

Owner: **00 — Control & Reconciliation**

Status after merge: **ACTIVE GOVERNANCE STANDARD**

## Purpose

The Control Cockpit is the single visual cross-workstream projection of Shiloh OS state. It exists to make ownership, priority, blockers, completion, authority and next action understandable without requiring JP to reconcile multiple specialist chats manually.

The Cockpit is **not an independent source of truth**. It projects the current authoritative Project Tracker, Master Status, merged Control decisions and current machine evidence.

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

## Current snapshot — 2026-08-25

| Stream | State | Current unit / authority | Current gate | Next owner |
|---|---|---|---|---|
| **00 — Control & Reconciliation** | ✓ RECONCILED | `SHILOH-OS-CONTROL-COCKPIT` governance standard | Maintain projection as state changes | 20 return, then 00 |
| **10 — Booking & Admin UX** | ✓ COMPLETE / FROZEN | Emergency Christel Calendar + guarded provisional new-client booking | None | None unless new defect evidence |
| **20 — CRM & Identity** | ▶ ACTIVE | `SHILOH-CLIENT-FACING-NAME-AUTHORITY`; Control PR #488 | Bounded implementation and evidence return | 20 |
| **30 — WhatsApp & Meta Integration** | ⏸ WAITING EXTERNAL | Meta verification convergence; Control PR #483 | Meta Business Support | Meta Support, then 00 |
| **40 — Production & DevOps** | ○ OBSERVER / IDLE | Evidence observer | None | Called only when bounded runtime/DB/deploy evidence is needed |

Current repository authority at Cockpit authorization start: `d58847775f352a5289592ea07ee2107d2909779a`.

## Current priority sequence

1. **20 — CRM & Identity** implements the client-facing-name authority layer.
2. **Meta Business Support** proceeds in parallel; 30 remains paused until substantive provider evidence arrives.
3. **10 — Booking & Admin UX** remains frozen unless genuine new defect evidence appears.
4. **40 — Production & DevOps** remains observer-only unless a bounded evidence request is routed to it.
5. **00 — Control & Reconciliation** maintains cross-stream authority, gates and final reconciliation.

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
- a `DO NOT REDO` boundary is established or lifted.

Routine machine evidence should be retrieved by 00 through available connectors rather than requiring JP to act as a human clipboard.

## 00 response standard

For substantive cross-workstream requests, 00 should provide a compact Control Snapshot near the top of the response showing:

`Stream | State | Current unit | Gate | Next owner`

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

- The Cockpit does not authorize production mutations, bookings, outbound messages, destructive changes, permission changes or other security-sensitive actions.
- Recommendation and authorization remain separate.
- Specialists must not maintain competing cross-stream boards.
- Tracker and Master Status remain durable authority; the Cockpit is their readable operational projection.
- Closed capabilities remain frozen and must not be recreated merely because a later unit touches an adjacent surface.
