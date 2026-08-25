# Shiloh OS — Product North Star & Build Principles

**Established:** 2026-08-25  
**Owning workstream:** 00 — Control & Reconciliation  
**Purpose:** Durable product-governance authority for how Shiloh OS should evolve.

> **North Star: Build the smallest complete operational system that can run Shiloh extremely well.**

This is the governing product goal for Shiloh OS. It is not a feature-count target and it is not an instruction to clone Goldie, Fresha, or any other appointment platform.

## Supporting rule

> **Own what is strategically important. Integrate what is commodity. Eliminate what adds complexity without sufficient value.**

## What “smallest complete operational system” means

“Smallest” means the minimum justified system complexity required to operate Shiloh exceptionally well. It does **not** mean weak controls, incomplete workflows, or fragile engineering.

Core integrity remains non-negotiable where applicable, including:

- canonical data ownership;
- identity integrity;
- scheduling and conflict protection;
- role and capability enforcement;
- least-privilege staff access;
- actual-operator provenance and audit trails;
- idempotency and concurrency safety;
- backups and recovery;
- observable failures and retry paths;
- rollback and safe migration;
- production proof before dependency retirement.

## Product principles

1. **Shiloh owns canonical business logic where dependency would create material operational risk.**
2. **Use external providers for commodity capability when they are reliable, economical, replaceable, and do not become the canonical source of truth unnecessarily.**
3. **One canonical operational authority per domain.** Avoid competing sources of truth.
4. **Do not build a feature merely because a competitor has it.** Build only when it materially improves Shiloh’s operation, economics, resilience, client experience, or staff efficiency.
5. **Decommissioning follows independence.** Never retire a provider before Shiloh has passed production proof, rollback is available, and the cutover has a controlled observation period where appropriate.
6. **Prefer recoverable integrations over synchronous hard dependencies.** A non-canonical provider outage should not unnecessarily stop a canonical Shiloh workflow.
7. **Preserve history and provenance.** Future architecture improvements do not justify rewriting historical operational truth.
8. **Keep permissions explicit.** Visibility, operational mutation authority, and system governance are distinct capabilities.
9. **Automation must reduce operational burden.** Do not create automation that adds more monitoring, exception handling, or maintenance than the manual work it replaces.
10. **Maintenance cost is a product requirement.** The lifetime support burden of a feature is part of its design decision, not an afterthought.

## Mandatory decision test for future capabilities

Before a new Shiloh OS capability is authorised, 00 — Control & Reconciliation should assess it against four questions:

1. **Operational necessity** — Is this needed to run Shiloh well or remove a real operational weakness?
2. **Business value** — Does it materially save time/cost, protect revenue, reduce risk, improve client experience, or improve staff effectiveness?
3. **Dependency reduction** — Does owning it remove an unacceptable dependency, or is a replaceable integration preferable?
4. **Lifetime maintenance cost** — Is the ongoing engineering/support burden justified by the value created?

The result should then be classified as one of:

- **OWN** — strategically important enough for Shiloh to own;
- **INTEGRATE** — better supplied by a controlled external provider;
- **RETIRE** — no longer justified once a controlled replacement is proven;
- **NEVER BUILD** — insufficient value relative to complexity or maintenance cost.

## Current sequencing rule

At the time this principle was established, the active P0 programme is:

`SHILOH-CALENDAR-OPERATIONAL-ASSURANCE-CUTOVER`

The North Star does **not** expand that unit’s implementation scope. Calendar operational assurance remains first priority. New modules should not distract from completing and proving the current core.

This document is product-governance authority, not a competing global status dashboard. Current lifecycle/state remains controlled by 00, the Project Tracker, and Master Status.

## After the Calendar is controlled and proven

00 — Control & Reconciliation will guide the next phase step by step. The standard sequence for each future capability is:

1. **Discover the real operational need.** Document the current workflow, pain, risk, cost, and desired outcome.
2. **Define authority and canonical data.** Decide what Shiloh must own, what data is authoritative, and which role may perform which actions.
3. **Classify OWN / INTEGRATE / RETIRE / NEVER BUILD.** Apply the mandatory decision test before implementation.
4. **Establish business and technical economics.** Estimate implementation effort, recurring provider/infrastructure cost, expected savings/value, and lifetime maintenance burden.
5. **Create one bounded controlled unit.** Set explicit acceptance criteria, non-goals, rollback requirements, and owner.
6. **Implement without premature cutover.** Preserve current production operation while the replacement or improvement is built.
7. **Run focused tests and full regression.** Include permissions, failure modes, idempotency, concurrency, auditability, and recovery where relevant.
8. **Return an unmerged evidence package when production deployment is gated.** Control reviews exact commit/PR/CI and unresolved risk before authorising production mutation.
9. **Merge and deploy only after Control authorization.** Production mutation is separate from recommendation/readiness.
10. **Obtain bounded production proof.** Verify the deployed revision, real runtime behaviour, monitoring, recovery, and data correctness.
11. **Retire dependencies only after independence proof.** Prefer soft-disable and observation before irreversible removal.
12. **Reconcile Project Tracker and Master Status.** Close the controlled unit only when durable authority and production evidence agree.
13. **Select the next highest-value capability.** Repeat the sequence; do not accumulate parallel feature programmes without justification.

## Roadmap horizons

### Horizon 1 — Complete the core operating system

Focus on the smallest set of capabilities required to run Shiloh reliably end to end. Likely domains include scheduling, CRM/identity, staff access/permissions, operational messaging, client administration, payments where justified, reporting, and production resilience.

### Horizon 2 — Operational automation

After the core is authoritative and observable, automate repetitive work that has measurable value: follow-up, rebooking opportunities, exception detection, operational reminders, utilisation insights, and owner-level summaries. Automation must remain auditable and controllable.

### Horizon 3 — Optional advanced/commercial capability

Consider stock/POS, packages, memberships, gift vouchers, marketing segmentation, client portal, multi-location support, deeper analytics, or other capabilities only when the decision test justifies them. There is no requirement to reproduce a competitor’s complete catalogue.

## Economic discipline

Shiloh OS should be compared to commercial software on **total cost of ownership**, not subscription price alone.

Where relevant, include:

- hosting/runtime;
- database/storage/backups;
- messaging/provider costs;
- payment processing;
- domains and third-party APIs;
- monitoring/operations;
- maintenance effort;
- avoided subscription/add-on costs;
- staff time saved;
- revenue protected or created;
- cost/risk of external dependency.

Recurring platform cost parity with commercial appointment software is a useful objective, but it must be demonstrated rather than assumed. Business-value superiority comes from a system designed around Shiloh’s actual operating model.

## Governance promise

Once Calendar operational assurance is complete, 00 — Control & Reconciliation will guide Shiloh OS through the roadmap **one controlled capability at a time**: recommend the next priority, explain trade-offs, route the correct specialist, define gates, verify evidence, reconcile durable status, and prevent unnecessary feature creep.

The goal is not the biggest system.

The goal is a **complete, trusted, economical and maintainable operating system that runs Shiloh extremely well.**
