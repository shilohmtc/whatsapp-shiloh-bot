# Shiloh OS Stabilization & Simplification Doctrine

Controlled unit: `SHILOH-OS-STABILIZATION-SIMPLIFICATION-DOCTRINE`

Owner: **00 — Control & Reconciliation**

Status after merge: **ACTIVE GOVERNANCE STANDARD**

## Purpose

This doctrine turns the architectural and operating lessons from the current Shiloh OS build into durable decision rules.

It exists to prevent regression into superseded architecture, unnecessary feature accumulation, duplicated control surfaces, low-value refactoring, repetitive release ceremony, or wasteful Workspace use.

The objective remains:

> **Build the smallest complete operational system that can run Shiloh extremely well.**

Supporting rule:

> **Own what is strategically important. Integrate what is commodity. Eliminate what adds complexity without sufficient value.**

## 1. Stabilization operational spine

Until 00 explicitly closes the stabilization phase, the primary Shiloh OS objective is to complete and prove this operational spine:

**Shiloh Calendar → Clean CRM → WhatsApp communications / client registration**

No new P0/P1 capability should interrupt this sequence unless it is required to:

- complete the canonical Shiloh Calendar;
- complete Clean CRM V2;
- integrate Calendar with CRM V2;
- integrate WhatsApp registration with CRM V2;
- complete production cutover and production proof;
- retire or remove a dependency that blocks the target architecture; or
- remediate a genuine production or security defect.

## 2. Simplification before expansion

When existing functionality is encountered, do **not** automatically repair, polish, preserve or migrate it.

Evaluate it in this order:

**Operational necessity → Business value → Dependency reduction → Lifetime maintenance cost**

Then classify it:

- **OWN** — strategically important enough for Shiloh OS to control directly.
- **INTEGRATE** — commodity capability better supplied by a reliable external service.
- **RETIRE** — an existing capability or dependency that no longer earns its complexity.
- **NEVER BUILD** — a capability whose lifetime cost or complexity exceeds its real value to Shiloh.

Prefer retirement over repair when a subsystem belongs to superseded architecture.

Past investment is not, by itself, a reason to preserve a capability.

## 3. Current architectural direction

Unless 00 explicitly changes the policy:

- **Shiloh Calendar** is the canonical scheduling authority.
- **Clean CRM V2** is the canonical client-master direction.
- **WhatsApp** is primarily communications, lightweight interaction, client registration and secure handoff — not the long-term full business-administration interface.
- **Google Calendar scheduling authority** is being retired from the future operating model.
- **Legacy CRM reconciliation and inherited identity machinery** are being retired from normal future runtime paths.
- **GitHub** is engineering/control infrastructure, not a Shiloh product surface.
- **Render** is commodity deployment infrastructure to integrate with, not product architecture to build around.

These directions do not authorize destructive cleanup, provider disconnection, production migration or data deletion by themselves. Each concrete mutation remains subject to its own control boundary.

## 4. No feature accumulation during stabilization

Do not introduce or prioritize:

- competitor-inspired features merely because another system has them;
- cosmetic improvements to legacy surfaces that are likely to be retired;
- speculative frameworks or abstractions;
- unrelated refactoring because code appears untidy;
- duplicate administration surfaces;
- new dependencies without material operational value.

Finish the operational spine, prove it, then simplify.

## 5. Workspace economy

Workspace execution is a scarce, high-leverage resource.

Use normal specialist streams for:

- analysis and inspection;
- read-only audits;
- reconciliation;
- small or medium bounded changes that do not require extensive code/test/fix cycles;
- documentation and governance changes.

Use `WS-*` only when substantial multi-file engineering, repetitive code/test/fix work, migrations, broad refactoring, dependency changes or similarly bounded implementation complexity materially justifies the cost.

Do not spend Workspace credits merely because work involves code.

## 6. Control-surface hygiene

00 must periodically reconcile GitHub and other control artifacts so stale branches, PRs, issues and superseded architecture do not distort the perceived project state.

Every open implementation/control artifact should ultimately resolve to one of:

- **ACTIVE** — current architecture and current execution.
- **HOLD — explicit dependency** — still valid, but waiting on a named gate.
- **MERGE CANDIDATE** — current implementation accepted and awaiting release sequencing/gate.
- **SUPERSEDED — CLOSE** — old architecture or obsolete implementation; never merge.

Do not preserve obsolete work merely because effort was previously invested in it.

GitHub cleanup is a 00 control activity and should not consume Workspace credits unless the cleanup itself exposes a genuinely substantial engineering package.

## 7. Proactive expert judgment

JP should not need to ask:

- “What would you do?”
- “If Shiloh OS were yours?”
- “Do you suggest anything?”
- “Is there a better way?”

For meaningful architecture, sequencing, cost, risk, product or implementation decisions, 00 and the specialist streams must proactively:

1. recommend the preferred option;
2. state the material reasons, risks and trade-offs;
3. state whether it should be done now, later or not at all;
4. identify the owning workstream and priority position; and
5. explicitly identify work that should be **done, deferred, ignored or retired**.

Do not manufacture recommendations for straightforward requests where no meaningful decision exists.

## 8. Standing release model

Specialist streams and `WS-*` execution streams **never self-merge** their own work.

The preferred release chain is:

**00 control decision → specialist scope/acceptance → WS implementation when justified → specialist verification → tests/CI → 00 reconciliation → release gate → production proof → 00 reconciliation**

### Optional standing 00 release delegation

JP may grant 00 a bounded standing release delegation so JP does not become the repetitive human approval button for ordinary already-authorized releases.

When such delegation is explicitly active, 00 may merge the exact accepted PR head and allow the repository's existing normal deployment mechanism without a fresh per-PR confirmation only if 00 independently verifies all of the following immediately before merge:

- the controlled unit was previously authorized;
- the exact PR head SHA is the accepted/tested SHA;
- the PR scope and changed-file boundary match the authorization;
- required focused and full tests are green or any permitted exception is explicitly reconciled;
- required CI is green at the accepted head;
- current `main` compatibility and merge ordering have been reconciled;
- there is no unresolved production, security, provider or data gate;
- no new out-of-scope authority or behavior was introduced; and
- the merge remains inside the standing delegation boundary.

An additive, backward-compatible, zero-backfill schema migration may fall inside standing delegation only when the controlled unit explicitly authorized schema work and 00 has inspected/reconciled the migration before release.

Standing release delegation never implicitly includes:

- destructive production data changes;
- bulk migrations, backfills or data conversions;
- real booking, cancellation or other client/appointment mutations performed as an operator action;
- external client/staff messages outside already-authorized automatic product behavior;
- credential, secret, provider or environment-configuration changes;
- permission/security expansion;
- destructive provider actions;
- irreversible business decisions; or
- work outside the previously authorized controlled unit.

Those remain explicit JP authorization gates.

**Governance text alone does not activate standing release delegation. Activation requires an explicit JP authorization recorded by 00.**

### Activation record

Bounded standing 00 release delegation was explicitly activated by JP on **2026-08-27** and is recorded in:

`docs/SHILOH-OS-MASTER-STATUS-ADDENDUM-2026-08-27-STABILIZATION-SIMPLIFICATION.md`

The activation changes release ceremony only. It does not broaden the excluded-action boundary above and does not cause specialist or WS streams to acquire merge authority.

## 9. Infrastructure and product-surface discipline

Treat infrastructure according to its role:

- GitHub is the engineering/control record and code collaboration surface.
- Render is deployment/runtime infrastructure.
- WhatsApp is a communications and lightweight interaction channel.
- Shiloh Calendar and Shiloh CRM are first-class operational product surfaces.

Do not turn GitHub, Render or WhatsApp into accidental product architecture simply because they are already present.

## 10. Stabilization cleanup order

Once the operational spine is coherent enough that cleanup will not cause rework, prefer this order unless a concrete risk changes priority:

1. **00 — GitHub/control reconciliation** — classify stale/open PRs and issues cheaply.
2. **40 — Render/environment inventory** — read-only first; classify configuration as KEEP / REMOVE LATER / LEGACY / UNKNOWN / SECRET-CREDENTIAL / FEATURE FLAG / PROVIDER DEPENDENCY.
3. **30 — Admin WhatsApp menu RETIRE/KEEP audit** — shrink the menu around its future lightweight role rather than polishing legacy administration.
4. **20/40 — Legacy CRM runtime retirement** after Calendar and WhatsApp cut over to CRM V2.
5. **40 — Google production configuration retirement** only after Shiloh-only production proof and explicit production authority.

Do not randomly delete Render variables, provider configuration or legacy data because they appear obsolete. Retire concrete dependencies only after their runtime paths are proven unused and the applicable production gate is authorized.

## 11. Mandatory 00 decision checkpoint

Before authorizing substantive new work, 00 must ask:

> **Does this advance the operational spine, remove a dependency, reduce lifetime complexity, or fix a genuine operational risk? If none applies, why are we doing it now?**

If there is no compelling answer, defer, retire or reject the work rather than adding complexity.

## 12. Authority boundary

This doctrine changes governance and prioritization only.

It does **not** by itself authorize:

- a production mutation;
- a merge or deployment unless a separate active standing release delegation or explicit release authorization applies;
- a destructive action;
- an external message;
- a permission or credential change;
- a provider/environment configuration change;
- a real booking or cancellation; or
- an irreversible business decision.

Recommendation remains distinct from authorization.
