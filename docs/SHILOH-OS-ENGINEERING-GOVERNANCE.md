# Shiloh OS — Engineering Governance

Updated: 2026-08-18
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
