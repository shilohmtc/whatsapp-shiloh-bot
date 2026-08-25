# Shiloh OS Project Tracker Addendum — Control Cockpit

Controlled unit: `SHILOH-OS-CONTROL-COCKPIT`

Owner: **00 — Control & Reconciliation**

User authorization: **JP explicitly authorized the Shiloh OS Control Cockpit on 2026-08-25.**

## Status

**COMPLETE — GOVERNANCE STANDARD ACTIVE after merge.**

## Purpose

Introduce one persistent cross-workstream visual tracking layer so JP does not need to reconstruct project state from separate specialist conversations.

## Authority boundary

The Control Cockpit is a presentation/reconciliation layer only. It does not replace or compete with the Project Tracker, Master Status, merged Control decisions or machine evidence.

Authority precedence:

1. merged Control authorization / reconciliation;
2. Project Tracker and Master Status;
3. current machine evidence where relevant;
4. Control Cockpit projection;
5. conversational summaries.

## Required tracked state

Each active/recent unit must show owner, controlled-unit identifier, status, exact authority, gate/dependency, next owner, JP next action, reconciliation state and `DO NOT REDO` boundary where applicable.

Standard lifecycle:

`Finding → Control decision → Authorized → Implementation → CI → Merge → Deploy → Production proof → Reconciled → Closed`

Standard states:

- COMPLETE / FROZEN
- ACTIVE
- WAITING EXTERNAL
- CONTROL GATE
- OBSERVER / IDLE
- BLOCKED

## Initial cross-workstream snapshot

- **00 — Control & Reconciliation:** reconciled; owns Cockpit maintenance and cross-stream authority.
- **10 — Booking & Admin UX:** COMPLETE / FROZEN; emergency Christel Calendar and provisional new-client booking are closed/do-not-redo absent new defect evidence.
- **20 — CRM & Identity:** ACTIVE; `SHILOH-CLIENT-FACING-NAME-AUTHORITY` authorized by PR #488 and pending bounded implementation/evidence return.
- **30 — WhatsApp & Meta Integration:** WAITING EXTERNAL; Meta verification convergence is `META SUPPORT REQUIRED` under reconciled PR #483.
- **40 — Production & DevOps:** OBSERVER / IDLE unless routed a bounded runtime/database/deployment evidence request.

Repository authority at authorization start: `d58847775f352a5289592ea07ee2107d2909779a`.

## Update policy

00 refreshes the Cockpit when authorization, ownership, status, PR/deploy authority, external gate, production proof, Tracker/Master reconciliation or `DO NOT REDO` state materially changes.

Specialists do not maintain competing global boards. They return bounded authoritative evidence to 00.

Routine GitHub/Render evidence should be retrieved through connectors when available; JP should not be used as a manual evidence-transfer mechanism.

## Completion criteria

This governance unit is complete when:

- the Control Cockpit standard is durable on `main`;
- Project Tracker and Master Status record its role and authority boundary;
- 00 adopts the compact Control Snapshot convention for substantive cross-workstream work;
- no runtime application, CRM, appointment, provider, permission or business-data mutation is introduced by the governance unit itself.
