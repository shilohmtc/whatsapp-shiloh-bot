# Shiloh OS — Engineering Governance

Updated: 2026-08-24
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

## Durable operating-rule persistence / no user-memory dependency rule

This rule is mandatory across **all five Shiloh OS workstreams**, including Control & Reconciliation.

When a project-wide or cross-workstream operating rule, reporting convention, recurring workflow requirement, architectural working rule, authorization boundary, or other durable Shiloh OS norm is explicitly agreed or ratified, the owning workstream must persist that rule into the appropriate authoritative GitHub surface during the same controlled unit whenever the available tools and authorization permit it.

Shiloh OS must not depend on JP remembering, restating, policing, or manually carrying a durable operating rule between specialist chats. Conversation history, project context, handoff text and assistant memory may be used as navigation context, but they must not be the sole authoritative location for a rule that future specialists are expected to follow.

The authoritative surface must match the type of rule:

- **Engineering Governance** for durable working methods, reporting conventions, routing, completion protocols and cross-stream operating norms.
- **Master Status** for durable application architecture, business rules, permissions, integrations and verified operational truth.
- **Project Tracker / reconciliation evidence** for delivery state, implementation evidence, unresolved gates and current next actions.

A specialist that discovers a previously agreed durable rule exists only in conversational context must not silently rely on that memory as permanent authority. It must either reconcile the rule into the correct authoritative repository surface within its controlled scope, or route the exact governance/reconciliation dependency to Control & Reconciliation if ownership or authority is unclear.

Future specialists must recover durable rules independently from current authoritative repository state and preserve newer authority. JP should not need to remind each specialist that an already-ratified norm exists.

This persistence rule does **not** require recording casual preferences, transient instructions, private personal details, secrets, credentials, sensitive data, or one-off conversational choices in GitHub. Persist only project-relevant durable rules that legitimately belong in Shiloh OS authority, and continue to minimize identifying or sensitive information.

Persisting a durable rule does not expand authorization. Production mutations, destructive actions, external messages, permission changes, security-sensitive actions and irreversible business decisions remain subject to their existing authorization and fail-closed gates.

## GitHub connector permission, privacy-confirmation and payload-minimization rule

This rule applies across all five Shiloh OS workstreams.

GitHub connector permission, Shiloh business authorization, and ChatGPT/platform privacy confirmation are three separate controls and must not be conflated:

- A GitHub connector setting such as **Allow all actions** is technical capability only. It does not itself authorize a production mutation, destructive action, irreversible business decision, security-sensitive change, or work outside the currently authorized Shiloh scope.
- Shiloh business authorization controls whether a substantial controlled unit may proceed. Once that unit is authorized, routine in-scope GitHub execution must continue through the controlled-work completion protocol without repeatedly asking for the same Shiloh authorization merely because a branch, file write, pull request, merge, or reconciliation step is next.
- ChatGPT/the platform may independently display a privacy or data-sharing confirmation for a GitHub write even when the GitHub connector is configured to allow actions automatically. Such a confirmation is a platform privacy control, not a new Shiloh authorization gate and not evidence that the GitHub connector permission has been reduced.

GitHub write payloads must contain only the minimum authoritative information required for the operation. Commit messages, pull-request titles/bodies, reconciliation records, comments, and connector payloads should prefer role- or decision-based wording such as **business authorization recorded** rather than unnecessary personal identifiers. Do not include full phone numbers, personal addresses, credentials, secrets, client personal data, or other identifying/sensitive information unless it is genuinely required for the authoritative repository record and is appropriate for that controlled scope.

Do not weaken global connector/plugin permissions merely to suppress platform privacy confirmations. If a platform privacy confirmation still appears after payload minimization and physically blocks an otherwise authorized GitHub action, treat it as a platform interaction gate only. After the platform confirmation is satisfied, resume the already-authorized controlled unit from the blocked action without requesting a new Shiloh business authorization.

This rule reduces avoidable interruptions and unnecessary data disclosure; it does not expand authorization. Existing approval, provider, human-truth, security, privacy, production, destructive-action, and scope gates remain fully authoritative.

## Bounded execution / anti-thrashing rule

Authoritative inspection is a start-of-unit control, not a substitute for execution. Once the owning workstream, scope, relevant authority and genuine gates are known, the specialist must move to the smallest reversible step that can produce the requested outcome or test the implementation hypothesis.

A **read-only cycle** is a sequence of repository, log, provider, connector or resource reads performed without producing a materially new execution artifact or materially new evidence. Two consecutive read-only cycles that do not add material evidence trigger a mandatory execution checkpoint. At that checkpoint the specialist must do exactly one of the following before continuing broad inspection:

- produce the next bounded output artifact, edit, commit, targeted test result or other concrete work product;
- state a specific blocker or unresolved gate and cite the evidence that proves execution cannot safely continue; or
- if the chat itself is materially degraded, produce the same-specialist continuation checkpoint required by the Specialist chat lifecycle operating convention.

Repeating the same repository searches, reopening the same authority documents, or narrating preparation does not count as progress. Re-inspection after the initial authoritative pass is justified only when there is a concrete reason, including: authoritative state changed; an edit/test exposed an unexpected dependency; the requested scope materially changed; a production/provider/human-truth fact could have changed and is required for the next step; or a safety/irreversibility boundary requires fresh verification.

Task type must govern tool use. A source-data transformation, export, spreadsheet, document or other output-artifact request must not be converted into a repository-audit exercise unless repository authority is actually required to interpret or safely produce that output. Conversely, implementation work must not skip the initial authoritative-state inspection merely to satisfy this execution rule.

Progress updates should be milestone-based. Prefer updates tied to a concrete artifact, changed file, test/CI result, PR, merge/deploy result or proven blocker. Repeated status narration without a new artifact or new evidence is not an acceptable substitute for forward motion.

This rule does not create a fixed wall-clock deadline, does not weaken approval/provider/human-truth/safety gates, and does not change the controlled-work completion protocol. It prevents redundant inspection after those controls have already been satisfied.

## Specialist chat lifecycle operating convention

There is no fixed message, prompt, input or turn count at which a Shiloh OS specialist chat must be replaced. Chat age alone is not a reason to rotate, and a responsive specialist chat may continue across multiple controlled units.

Use practical conversation health rather than a numeric threshold. Noticeable sustained sluggishness, repeated very large tool/diff/log cycles, accumulated context that makes continuation materially less crisp, or a chat becoming difficult to use reliably are valid signals that a fresh chat may be preferable. Ordinary temporary network, provider or tool latency is not by itself evidence that the specialist chat needs replacement.

Prefer rotation at a controlled-unit boundary. When the current controlled unit can safely reach its normal checkpoint, complete the applicable verification/reconciliation boundary first, preserve completed/do-not-redo state, then continue in a fresh chat for the **same specialist workstream** using a self-contained continuation block. Starting a fresh chat does not create a new project, change ownership, reopen completed work or weaken any approval/provider/human-truth/evidence gate.

The fresh same-specialist chat must independently re-read current GitHub `main`, Master Status, Project Tracker, latest reconciliation and Engineering Governance, verify any changing production/provider/human evidence, and preserve newer authority. The copied continuation block is navigation/routing context only; repository and verified operational evidence remain authoritative.

Do not rotate chats mechanically after an arbitrary number of messages. Do not interrupt a healthy active controlled unit solely because the chat is old or large. Conversely, do not keep using a materially degraded chat merely to preserve conversation continuity when a clean same-specialist continuation would be safer and clearer.

If a specialist chat becomes practically unusable before the controlled unit reaches completion, it must **not** falsely declare the unit complete. Instead, produce a same-specialist continuation checkpoint that distinguishes:

- verified authoritative work already completed and not to be redone;
- in-progress or unmerged work that is not yet authoritative;
- tests/CI/deploy/provider evidence already obtained;
- unresolved gates, blockers or safety boundaries;
- exact branch/PR/commit references where applicable; and
- the next controlled action.

The user may then open a fresh chat for that same specialist and paste the continuation checkpoint. The receiving chat independently verifies authority before resuming. Control & Reconciliation is not required merely because a specialist chat was rotated; Control remains the escalation point only for the ownership, authority, prioritisation, governance and reconciliation cases defined elsewhere in this document.

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
- whether another workstream owns a dependency or next action;
- the next-specialist status: either the mandatory specialist handoff below, or **`Next specialist: None — controlled unit complete.`**

## Plain-English capability summary rule

This rule is mandatory across **all five Shiloh OS workstreams**, including Control & Reconciliation.

Every final checkpoint for a meaningful controlled unit must include a short plain-English section titled **`What this now enables`** immediately before **`Exactly what JP should do next`**. The purpose is to translate technical delivery evidence into the practical operating capability Shiloh has gained, changed, clarified, or still lacks.

The section must state, where applicable:

- what Shiloh can now do that it could not reliably do before;
- whether ChatGPT/Shiloh OS can directly use the capability in future specialist work;
- whether the capability is **read-only**, **bounded write-capable**, **fully operational**, **partially enabled**, **blocked**, or otherwise materially constrained;
- what manual work JP no longer needs to perform because of the completed unit;
- what limitations, external gates, evidence requirements, permissions, or tool-capability gaps still remain;
- whether future specialists should reuse this capability rather than rebuilding or bypassing it; and
- when a technical framework or architecture exists but is not yet operational, an explicit statement that the capability must **not** be represented as available merely because its design or framework has been completed.

The section must be understandable without requiring JP to interpret PR numbers, commit SHAs, CI terminology, Render deployment IDs, SQL architecture jargon, provider terminology, or implementation details. Technical evidence still belongs elsewhere in the checkpoint and reconciliation record; this section explains the practical consequence of that evidence.

The summary must distinguish **completed infrastructure/framework** from **usable current capability**. For example, an approved database-access architecture or inert maintenance-operation framework does not mean production SQL writes are available if the required execution mechanism is still missing. Conversely, once a capability is genuinely verified operational, the summary should say plainly what future specialists may now do and what JP no longer needs to do manually.

Do not overstate capability. If a feature is partially operational, provider-gated, read-only, fail-closed, human-truth-dependent, or unavailable through the currently connected tools, say so explicitly. A plain-English summary is explanatory only; it does not expand authorization, weaken safety/production/provider gates, or create permission for destructive or security-sensitive actions.

This section is required whenever the controlled unit creates, changes, retires, blocks, or materially clarifies an ongoing Shiloh capability. For purely clerical/no-capability documentation corrections, it may state briefly that no new operating capability was created.

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
