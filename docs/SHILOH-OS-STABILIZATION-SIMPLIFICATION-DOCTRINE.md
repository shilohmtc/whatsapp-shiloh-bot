# Shiloh OS Stabilization & Simplification Doctrine

Controlled unit: `SHILOH-OS-STABILIZATION-SIMPLIFICATION-DOCTRINE`

Owner: **00 — Control & Reconciliation**

Status after merge: **ACTIVE GOVERNANCE STANDARD**

## Purpose

This doctrine turns the architectural and operating lessons from the current Shiloh OS build into durable decision rules.

It exists to prevent regression into superseded architecture, unnecessary feature accumulation, duplicated control surfaces, low-value refactoring, repetitive release ceremony, wasteful Workspace use, and unnecessary owner-level approval ceremony for bounded technical work.

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

These directions do not authorize destructive cleanup, provider disconnection, production migration or data deletion by themselves. Each concrete mutation remains subject to its applicable control boundary.

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

## 8. Bounded operational delegation

Specialist streams and `WS-*` execution streams **never independently self-authorize production or self-merge their own work**.

The preferred release and production chain remains:

**00 control decision → specialist scope/acceptance → WS implementation when justified → specialist verification → tests/CI → 00 reconciliation → release/operation → production proof → 00 reconciliation**

### Governing principle

JP delegates technical stewardship to 00 under this principle:

> **JP owns irreversible business authority. 00 owns bounded, reversible technical execution and release judgment.**

The purpose is to remove technical rubber-stamping by JP while preserving a genuine owner gate where the consequence is materially irreversible, changes business ownership/control, or creates a new real-world commitment.

### Standing 00 operational delegation — ACTIVE

The previously active standing release delegation is broadened to **bounded operational delegation** under JP's explicit 2026-08-27 approval recorded in:

`docs/SHILOH-OS-MASTER-STATUS-ADDENDUM-2026-08-27-BOUNDED-OPERATIONAL-DELEGATION.md`

00 may authorize, execute, or explicitly route a bounded technical action without a fresh per-action JP confirmation when all of the following are true:

- the action advances an authorized/current Shiloh OS controlled unit, resolves a genuine defect/risk, completes release/cutover/verification, or removes a blocking dependency consistent with this doctrine;
- 00 records the controlling unit and exact intended outcome before a substantive mutation;
- current machine state is re-read immediately before the action where stale state could change the decision;
- target, scope and expected blast radius are bounded and understood;
- the action is reversible **or** has a credible restore/rollback/checkpoint path with no intentional irreversible loss;
- backups, dry-run evidence, idempotency, locking, concurrency controls or staged rollout are used when materially relevant;
- applicable tests/CI/validation are green or any exception is explicitly reconciled;
- no hidden scope expansion, new human authority or new business commitment is introduced;
- post-action verification is performed against the intended outcome; and
- 00 stops and escalates instead of improvising if actual state materially differs from the assumptions that justified the action.

For substantive production work, 00 remains accountable for the decision even when execution is explicitly routed to 10, 20, 30, 40 or a WS implementation stream. A specialist/WS stream does not gain independent standing production authority merely by being the executor.

### Actions normally inside standing delegation

Provided the safeguards above are satisfied, standing operational delegation may include:

- merge and deployment of accepted/tested controlled-unit PRs;
- routine redeploy/restart/recovery actions;
- additive, backward-compatible schema migrations;
- bounded data backfills or conversions that are non-destructive or rollback/restore protected, with exact scope, validation and idempotency/reconciliation appropriate to the risk;
- reversible application, environment, feature-flag, routing or provider configuration changes that do not expose/rotate secrets, transfer provider ownership/control, materially broaden human permissions, or destructively remove provider assets;
- already-authorized cutover and rollback switches;
- bounded corrective data repairs where the authoritative source, exact target set, validation and rollback/restore path are established;
- synthetic/test verification that does not create a real client/business commitment;
- read-only production evidence gathering and health verification; and
- already-authorized automatic product behavior, including ordinary system-generated communications, without requiring JP to approve each individual automated event.

This list is illustrative, not a reason to bypass the control conditions above.

### JP-only authority gates

A fresh explicit JP authorization remains required for:

- intentional destructive or materially irreversible loss/deletion of production or retained business data where a practical restore path is not part of the authorized action;
- creation, disclosure, rotation, revocation or transfer of credentials/secrets, or transfer of ownership/control of an external provider account or asset;
- destructive provider-account/asset deletion, irreversible provider disconnection, or ownership transfer;
- materially broader human/admin/security permissions or authority;
- a real client-facing action initiated by Shiloh OS itself that creates, cancels or materially changes a booking, financial obligation, refund, contract or other business commitment outside normal already-authorized product behavior or a specific human operator request;
- legal, financial, contractual or ownership decisions that are genuinely irreversible or materially bind Shiloh; or
- any action that 00 judges has an uncertain blast radius or lacks a credible verification/rollback boundary.

A specific JP or authorized human-operator request for one of these actions remains valid authority for that exact action; it does not silently become a new standing permission.

### Release verification remains mandatory

Standing operational delegation does not weaken release engineering. Before merging a controlled-unit PR, 00 must still independently verify:

- the controlled unit is current and authorized;
- the exact PR head SHA is the accepted/tested SHA;
- PR scope and changed-file boundary match the authorization;
- required focused/full tests and CI are green, or any permitted exception is explicitly reconciled;
- current `main` compatibility and merge ordering are reconciled;
- no unresolved production/security/provider/data gate blocks release; and
- no out-of-scope authority or behavior was introduced.

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
5. **40 — Google production configuration retirement** only after Shiloh-only production proof and the applicable authority gate.

Do not randomly delete Render variables, provider configuration or legacy data because they appear obsolete. Retire concrete dependencies only after their runtime paths are proven unused and the applicable control boundary is satisfied.

## 11. Mandatory 00 decision checkpoint

Before authorizing substantive new work, 00 must ask:

> **Does this advance the operational spine, remove a dependency, reduce lifetime complexity, or fix a genuine operational risk? If none applies, why are we doing it now?**

If there is no compelling answer, defer, retire or reject the work rather than adding complexity.

## 12. Authority boundary

This doctrine is both a governance standard and, under the active Section 8 delegation, a standing authorization for qualifying bounded technical execution by 00.

It does **not** turn recommendation into unlimited authority. Actions inside Section 8 may proceed only when its control conditions are satisfied. Actions listed under the JP-only gates require fresh explicit JP authority unless the exact action has already been specifically requested by an authorized human operator.

00 must prefer the smallest safe action, preserve reversibility, verify outcomes, and escalate uncertainty rather than infer broader authority.
