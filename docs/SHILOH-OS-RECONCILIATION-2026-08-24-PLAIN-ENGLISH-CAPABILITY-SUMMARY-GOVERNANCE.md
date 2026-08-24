# Shiloh OS — Reconciliation: Plain-English Capability Summary Governance

Date: 2026-08-24
Owning workstream: Shiloh OS — Control & Reconciliation
Status: Complete once merged to `main`.

## Decision

Shiloh OS now requires every meaningful final specialist checkpoint across all five workstreams to include a plain-English section titled **`What this now enables`** immediately before **`Exactly what JP should do next`**.

The section must explain the practical operating consequence of completed work rather than forcing JP to infer capability from PRs, CI, deploy IDs, SQL terminology, provider terminology or implementation detail.

It must state, where applicable:

- what Shiloh can now do that it could not reliably do before;
- whether ChatGPT/Shiloh OS can directly reuse the capability in future work;
- whether the capability is read-only, bounded write-capable, fully operational, partially enabled, blocked, or otherwise constrained;
- what manual work JP no longer needs to perform;
- what limitations, evidence gates, permissions, provider gates or connected-tool gaps remain;
- whether future specialists should reuse the capability rather than rebuild or bypass it; and
- when an architecture/framework exists but is not operational, an explicit statement that the capability is not yet available.

The summary must not overstate capability and does not expand authorization.

## Rationale

Technical completion evidence alone does not reliably answer the executive operating question: **what can Shiloh actually do now?** The new requirement makes that answer explicit and durable across Booking & Admin UX, CRM & Identity, WhatsApp / Meta Integration, Production / DevOps, and Control & Reconciliation.

This is particularly important for infrastructure capabilities such as PostgreSQL access, where an approved architecture or inert framework can exist before connected tools can actually execute the intended operation.

## Authoritative implementation

`docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md` now contains the mandatory **Plain-English capability summary rule**.

The rule applies to meaningful controlled units. Purely clerical/no-capability documentation changes may state briefly that no new operating capability was created.

## Scope / non-effects

This governance change:

- does not change application runtime behaviour;
- does not change database permissions or SQL access;
- does not authorize production mutations;
- does not alter Meta, Google Calendar, CRM or Render provider state;
- does not weaken fail-closed gates;
- does not reopen completed implementation work.

## Master Status decision

No Master Status update is required for this unit because the change is a reporting/governance convention, not a change to durable application architecture, business rules, permissions, integrations or production operating behaviour. Engineering Governance itself is the authoritative surface for this rule.

## Completed / do not redo

Once merged, do not re-decide whether Shiloh OS specialist completions should include the capability summary. Future governance changes may refine the format, but the requirement remains authoritative until explicitly superseded.
