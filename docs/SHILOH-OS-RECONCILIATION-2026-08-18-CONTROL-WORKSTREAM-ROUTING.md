# Shiloh OS — Reconciliation — Control Checkpoint Workstream Routing

Date: 2026-08-18
Scope: make every Control & Reconciliation checkpoint directly actionable in the correct specialist chat without weakening authoritative-state verification.

## Authoritative baseline reviewed

- GitHub `main` at `465afe295bdfc5f9570ab52147a4e97865a8947a` after PR #315.
- `docs/SHILOH-OS-MASTER-STATUS.md`.
- `docs/SHILOH-OS-PROJECT-TRACKER.md`.
- `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`.
- Latest prior reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-18-GBP-PROVIDER-GATE.md`.
- Verified Render production at PR #315 / `465afe295...`; accepted application behaviour remains PR #313 and governance baseline remains PR #314.
- Google Business Profile remains an external/provider gate at last-authoritative general Requests/minute 0. No provider or implementation gate is changed by this routing rule.

No conflict was found. The new rule extends the adopted shared-authority workstream model by requiring Control checkpoints to supply explicit specialist routing. It does not transfer authority from GitHub/production/provider evidence to chat instructions.

## Adopted routing contract

After determining authoritative state and the recommended next controlled action, every Control & Reconciliation checkpoint must state:

1. Owning workstream.
2. Exact specialist chat to continue in.
3. Why that workstream owns the action.
4. Other workstream dependencies or observers.
5. Whether implementation may proceed or remains blocked.
6. A ready-to-copy continuation instruction for the specialist chat.

The continuation instruction must require independent inspection of the applicable Master, Project Tracker, latest reconciliation and Engineering Governance on GitHub `main`, plus relevant verified production/provider/human evidence, before acting. It is routing context only.

## Blocked-work rule

If a provider, approval, human-truth, genuine-journey or other external gate blocks the recommended item:

- state explicitly that implementation must not proceed;
- keep primary ownership with the appropriate monitoring/provider workstream;
- retain Control & Reconciliation as dependency tracker or observer where applicable;
- do not route the item to implementation prematurely;
- reopen implementation only after authoritative evidence closes the gate.

The existing Google Business Profile gate demonstrates this rule: Production / DevOps owns provider verification, Control & Reconciliation tracks the dependency, and no GBP OAuth/API implementation is authorized while general Requests/minute remains 0.

## Completion and cross-workstream handling

Control & Reconciliation supplies the route and ready-to-copy instruction but does not become a second implementation queue. The specialist chat must independently verify authority, execute only an open/approved action through the full controlled-work completion protocol, and reconcile any changed contract or operational truth back into the shared Master/Tracker/reconciliation state.
