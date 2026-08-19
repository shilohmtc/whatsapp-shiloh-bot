# Shiloh OS — Engineering Governance

Updated: 2026-08-19
Purpose: permanent engineering operating rules that apply across Shiloh OS continuation work.

## Workstream operating model

Shiloh OS remains one project inside the same ChatGPT Work workspace, organized into five specialist workstreams. These are responsibility boundaries for focused chats, not independent projects or independent sources of truth.

1. **Shiloh OS — Control & Reconciliation**
   - Overall project status and priorities.
   - Cross-workstream coordination and dependencies.
   - Authoritative-state reconciliation.
   - Governance and architectural decisions.
   - Master + Project Tracker integrity.
2. **Booking & Admin UX**
   - Client and Admin booking journeys.
   - Treatment/service discovery and menus.
   - Practitioner booking entitlements.
   - Admin permissions and operational UX.
   - Appointment-management UX.
3. **WhatsApp / Meta Integration**
   - WhatsApp Cloud API.
   - Webhooks and message delivery.
   - Interactive messages and templates.
   - Meta verification and provider state.
   - WhatsApp-specific production behaviour.
4. **CRM & Identity**
   - Canonical client, practitioner and staff identities.
   - CRM integrity.
   - Identity resolution and deduplication.
   - Practitioner/service relationships.
   - Conversation-memory identity integration.
5. **Production / DevOps**
   - Render.
   - GitHub Actions / CI.
   - Deployments.
   - Runtime health and logs.
   - Environment/configuration.
   - Production incidents and operational verification.

The Control & Reconciliation workstream coordinates shared state. It does not replace specialist ownership or become a second implementation queue.

## Control checkpoint workstream routing rule

Every **Shiloh OS — Control & Reconciliation** checkpoint must first determine the authoritative current state and recommended next controlled action. It must then include a routing block containing all of the following:

- **Owning workstream**.
- **Exact specialist chat to continue in**.
- **Why that workstream owns the action**.
- **Dependencies or observers**, including Control & Reconciliation where shared-state tracking is required.
- **Implementation status**, stating explicitly whether work may proceed or is blocked.
- **Ready-to-copy continuation instruction** for the named specialist chat.

The continuation instruction is routing context, not delegated authority or a replacement for verification. It must tell the specialist chat to independently read the applicable Master, Project Tracker, latest reconciliation and Engineering Governance on GitHub `main`, verify relevant production/provider/human evidence, preserve any newer authoritative state, and then follow the controlled-work completion protocol.

When the recommended item is blocked by provider approval, business approval, human truth, genuine-journey evidence or another external gate, the checkpoint must explicitly say that implementation must not proceed. Ownership remains with the appropriate monitoring/provider workstream, with Control & Reconciliation tracking or observing the dependency. A blocked item must not be routed to an implementation workstream merely to keep work moving.

Control & Reconciliation supplies the routing decision and ready-to-copy instruction; it does not become a second implementation queue. The receiving specialist chat remains responsible for independent authoritative-state inspection and for reconciling any changed cross-workstream contract back into shared authority.

The checkpoint routing block uses this structure:

```markdown
**Owning workstream:** ...
**Exact specialist chat:** Shiloh OS — ...
**Why this workstream owns it:** ...
**Dependencies / observers:** ...
**Implementation status:** Proceed / Blocked — ...
**Ready-to-copy continuation instruction:**
> ...
```

## Authoritative-state rule

Across every workstream, the shared source of truth is GitHub `main`, `docs/SHILOH-OS-MASTER-STATUS.md`, `docs/SHILOH-OS-PROJECT-TRACKER.md`, the latest reconciliation evidence identified by those documents, and verified production/provider state.

Before controlled work, a specialist chat must read the applicable authoritative repository state and verify any production/provider facts that could have changed. Chat history is navigation context only when authoritative repository evidence exists; it must not be used to reconstruct or override project truth. Do not redo completed or superseded work.

## Specialist workstream reconciliation rule

This rule is mandatory for the four implementing/operating specialist workstreams: **Booking & Admin UX**, **WhatsApp / Meta Integration**, **CRM & Identity**, and **Production / DevOps**.

Before controlled work begins, the owning specialist workstream must independently apply the Authoritative-state rule below: read the applicable Master Status, Project Tracker, latest reconciliation and Engineering Governance on GitHub `main`, and verify relevant production/provider/human evidence that could have changed. Routing context and specialist-chat narrative do not replace this inspection.

When a controlled unit reaches its verification boundary, the owning specialist must complete the applicable sequence before declaring the work complete:

`implement → test/full applicable regression gate → repair until green → merge → production/provider verification where applicable → Project Tracker reconciliation → Master reconciliation where durable authoritative state changed → final specialist checkpoint`

Project Tracker reconciliation must record delivery evidence and current status, PR/commit references, tests and regression results, production/provider verification where applicable, unresolved dependencies or gates, and the next controlled action or owner.

Master Status reconciliation is required only when verified, merged work changes durable architecture, business rules, permissions, integrations, operational behaviour or other authoritative current state. Proposed work, work in progress and implementation on an unmerged branch must never be recorded as completed Master state.

Every specialist final checkpoint must explicitly state:

- what became authoritative;
- what was completed and must not be redone;
- what remains unresolved or externally gated;
- whether Project Tracker and/or Master reconciliation was required and completed;
- the next-specialist status: either the mandatory specialist handoff below, or **`Next specialist: None — controlled unit complete.`**

### Mandatory specialist-to-specialist handoff rule

Whenever another workstream owns a dependency, verification step, blocked gate, or next controlled action, the final checkpoint from **Booking & Admin UX**, **WhatsApp / Meta Integration**, **CRM & Identity**, or **Production / DevOps** must include a self-contained specialist handoff.

The handoff must contain all of the following:

- **Owning workstream**.
- **Exact specialist chat**, in the form `Shiloh OS — <workstream>`.
- **Why this workstream owns it**.
- **Dependencies / observers**, including Control & Reconciliation where shared-state tracking is required.
- **Implementation status**, stated explicitly as **Proceed** or **Blocked**, with the reason.
- **Completed / do-not-redo state**, identifying authoritative work that the receiving specialist must preserve.
- **Ready-to-copy continuation instruction** for the receiving specialist.

The ready-to-copy continuation instruction must be self-contained enough for the user to copy it directly into the receiving specialist chat without manually reconstructing context. It must be rendered in a fenced `text` code block so it is directly copyable as one unit.

The continuation instruction must require the receiving specialist to:

1. independently read current GitHub `main`;
2. read the applicable Master Status, Project Tracker, latest reconciliation and Engineering Governance;
3. verify any relevant production, provider, CRM, Calendar, Meta, human-truth or other evidence that could have changed;
4. preserve newer authoritative state and completed/do-not-redo work;
5. treat the handoff as routing context rather than authority;
6. execute only the scope owned by that specialist;
7. follow the controlled-work completion protocol;
8. reconcile durable verified changes back into the Project Tracker and Master Status where required; and
9. finish with the same mandatory specialist handoff when another workstream owns the next action.

A specialist may hand off directly to another specialist without an intermediate Control & Reconciliation checkpoint when ownership is clear and the shared authority is not contradictory. Control & Reconciliation remains the escalation and coordination point for unclear ownership, conflicting authority, cross-workstream prioritisation, governance/architecture decisions, or reconciliation disputes. Direct handoff never weakens authoritative-state verification.

A genuine provider, human-truth, approval, safety, evidence, production or capability gate must remain fail-closed. A blocked handoff must say **Blocked** and must not instruct an implementation workstream to bypass the gate merely to keep work moving.

The standard specialist handoff uses this structure:

````markdown
### Next specialist handoff

**Owning workstream:** ...
**Exact specialist chat:** Shiloh OS — ...
**Why this workstream owns it:** ...
**Dependencies / observers:** ...
**Implementation status:** Proceed / Blocked — ...
**Completed / do not redo:** ...

**Copy into the next specialist:**

```text
...
```
````

If no other specialist action is required, the final checkpoint must state:

**Next specialist:** None — controlled unit complete.

Control & Reconciliation treats the reconciled repository and verified production/provider evidence—not specialist-chat narrative—as the source of cross-workstream continuity. Specialist narrative may explain or route work, but it cannot establish authoritative completion by itself.

If a genuine approval, provider, human-truth, safety, production or capability gate prevents the reconciliation boundary from being reached, the specialist must record the blocked state, evidence, dependency and owning/observing workstream in the applicable authoritative tracker/reconciliation surface. It must not declare the unit complete or write unverified state into the Master.

## Controlled-work completion protocol

After the initial approval for a substantial controlled workstream, continue automatically through every available applicable stage:

`inspect authoritative state → implement → test/full applicable regression gate → repair until green → merge → verify Render/production/provider state → reconcile Project Tracker → reconcile Master when durable architectural/operational state changed → final checkpoint`

An intermediate success is not a completion boundary. Do not stop merely because implementation, a commit, a PR, CI, merge, or deployment completed. Stop only for a genuine approval, safety, provider, human-truth, unavailable-capability, contradictory-authority, material scope/risk, or other material decision gate.

Never describe work as continuing in the background unless an actual scheduled or automated mechanism has been created.

## Cross-workstream rule

When specialist work changes assumptions, permissions, contracts, provider behaviour, identity semantics, deployment requirements, or operational truth owned by another workstream, identify the dependency explicitly and reconcile it into the shared authoritative state. No specialist chat may maintain a conflicting version of Shiloh OS.

The specialist executing the controlled change remains responsible for the full completion protocol, including applicable CI, merge, production verification and reconciliation. Production / DevOps assists with delivery evidence; Control & Reconciliation protects shared state and resolves cross-workstream priority or architecture conflicts.

## Documentation responsibility

The Master records durable current architecture, business rules, permissions, integrations and operational truth. The Project Tracker records delivery state, PRs/commits, tests, deployment evidence, outstanding work and next actions.

Reconciliation must preserve existing authoritative facts unless newer verified evidence supersedes them. Planned or in-progress implementation must not be recorded as completed production state. Historical detail belongs in reconciliation evidence and Git history when it is no longer needed for the concise current state.

## Screenshot evidence rule

Screenshots supplied during Shiloh OS work from WhatsApp, Render, GitHub, Meta/provider, CRM, Calendar, or related operational surfaces are diagnostic/operational evidence by default.

Do not generate images, sketches, mockups, redesigns, or other visual artifacts from those screenshots unless the user explicitly asks for visual creation or image editing.

A screenshot that shows unexpected runtime behaviour is evidence of a possible defect. Treat it as an engineering signal to investigate the authoritative implementation and production/provider state.

## Production-defect handling rule

When operational evidence exposes unexpected production behaviour, follow the controlled defect path:

1. Read the current authoritative state on GitHub `main` and do not reopen completed or superseded work.
2. Trace the actual current handler/state/provider path responsible for the observed behaviour.
3. Inspect applicable production logs, provider evidence, CRM/Calendar state, and other authoritative evidence before inferring root cause.
4. Reproduce the failure from code/tests/logs where practical without manufacturing appointments, provider state, handset evidence, attendance truth, or other operational evidence.
5. Identify the root cause and distinguish application defects from provider/configuration failures.
6. Repair the application defect with fail-closed behaviour where authoritative provider truth is required.
7. Add regression coverage for the discovered failure mode and, where practical, strengthen end-to-end or provider-health coverage so the same class of problem is detected before a human encounters it in WhatsApp.
8. Run CI, deploy through the established GitHub/Render path, verify the applicable production state, and reconcile the Master/Tracker/latest reconciliation.

Do not treat a generic user-facing error as sufficient handling when the system can safely identify a blocked provider or dependency. Prefer an explicit, non-destructive, fail-closed operational message that states that no change was saved and identifies the dependency that must be restored.

## Reliability principle

The user should not function as Shiloh's primary production test suite. Recurring business-critical journeys should progressively gain regression/E2E protection and dependency-health checks. Provider outages or expired credentials that can block authoritative booking operations should be detected proactively where practical and surfaced clearly without weakening conflict, Calendar, CRM, attendance, authorization, or audit guardrails.
