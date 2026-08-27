# Shiloh OS Master Status Addendum — Business Owner and Delegated Technical Authority

Date: 2026-08-27

Controlled unit: `SHILOH-OS-BUSINESS-OWNER-AND-DELEGATED-TECHNICAL-AUTHORITY`

Owner: **00 — Control & Reconciliation**

Durable status after merge: **ACTIVE GOVERNANCE CORRECTION**

Supersedes, where inconsistent, the human-authority wording recorded in `SHILOH-OS-MASTER-STATUS-ADDENDUM-2026-08-25-PRIMARY-HUMAN-AUTHORITY.md`.

## Corrected business and system authority

The previous governance wording was based on incomplete business-ownership context. The durable model is now:

1. **Christel — Business Owner / Primary Shiloh Admin**
2. **JP — Delegated Technical/System Super Admin**

Durable product principle:

> Christel owns and operates Shiloh Massage Therapy & Aesthetic Clinic. Shiloh OS should allow Christel to administer the business herself. JP helps build, govern technically, test and improve the system under delegated authority.

`00 — Control & Reconciliation` remains the engineering/control process for sequencing, evidence, gates and reconciliation. It is not a separate human business owner.

## Christel — business authority

Christel is the business owner and primary human authority for Shiloh Massage Therapy & Aesthetic Clinic.

Shiloh Workspace should ultimately let Christel perform normal business administration herself, including:

- adding, activating and deactivating staff;
- assigning and changing operational roles;
- assigning and changing service authority;
- managing staff schedules, leave and availability;
- managing Calendar and booking operations within canonical safeguards;
- managing CRM/client operations and client communications;
- managing normal business configuration;
- delegating and revoking bounded staff authority;
- reviewing the audit trail for material staff and business changes.

Christel should not need JP, ChatGPT, GitHub, Render, direct database access or code changes for ordinary clinic administration once the applicable Workspace capability is productized.

## JP — delegated technical/system authority

JP is not represented as the owner of Shiloh Massage Therapy & Aesthetic Clinic and is not assumed to be a Shiloh employee or routine clinic operator.

JP helps Christel build, test, support, secure and improve Shiloh OS under delegated technical/system authority. Depending on the separately controlled capability, that may include architecture, implementation, technical administration, integrations, security work, deployment execution, diagnostics and production support.

Delegated technical authority does not transfer business ownership to JP and does not allow JP to silently expand his own business authority. Routine clinic actions are available to JP only where a capability-specific business rule or delegation permits them.

## Delegation and least privilege

Business authority originates with Christel. Christel may delegate bounded operational or technical authority and may revoke that delegation.

Other staff authority must be derived from operational need and least privilege. Staff must act as themselves; material actions must be attributable to the authenticated operator; no staff member may self-escalate through an operational workflow.

Technical principals such as service accounts, Meta system users, Render services, databases, integrations and deployment identities are technical identities only. They are never independent human business authority.

## Shiloh Workspace end-state

Normal business decisions should be configurable in Shiloh rather than requiring engineering intervention.

The target Workspace must make safe self-service possible for routine operations such as staff lifecycle, operational roles, service scope, Calendar/bookings, CRM, schedules/leave and communications. The product should prefer canonical configuration and audited workflows over hard-coded person-specific exceptions.

Engineering intervention remains appropriate for structural system changes, new integrations, security-model changes, database migrations, production incidents, major feature development and other genuinely technical work.

## Runtime permission boundary

This governance correction does **not** claim that existing runtime roles, credentials or permissions already match the corrected model.

No GitHub permission, Render role, Meta asset, token, database permission, application role, staff account, CRM record, Calendar permission, booking rule, production configuration or other runtime state is changed by this document.

Any concrete runtime alignment is a separately controlled implementation and must preserve authentication, auditability, least privilege, fail-closed behavior and non-self-escalation.

## Product acceptance rule

Every material new Shiloh OS capability must explicitly answer:

1. Can Christel administer the normal business operation herself through Shiloh Workspace?
2. What may other staff do, and how is their authority bounded by role/service/operational need?
3. What delegated technical/system path does JP need to build, test, support or administer the capability?
4. Which decisions remain business-owner decisions for Christel, even when technical execution is delegated?
5. Which actions are routine operations versus security-sensitive, production, destructive or irreversible actions?
6. What audit trail, fail-closed and non-self-escalation behavior applies?
7. Can recurring configuration be made safely in Workspace instead of requiring a code change or manual engineering task?

A capability is not considered fully productized merely because its backend path works.

## Current P0 work is not blocked

This documentation correction does not block or reopen the current Calendar/identity P0 packages.

WS-20 issue #506 is now **IMPLEMENTATION COMPLETE / DO NOT REDO** at Draft PR #507, exact head `3191235ef71b319cd643fc7bb77043c0d61d6397`, with CI #1489 / run `33054776443` successful. That acceptance covers the least-privilege server-side booking-bound contact/name authority primitive and its security proof. PR #507 remains DRAFT / UNMERGED / UNDEPLOYED; this Master record does not authorize merge or deployment.

WS-10 issue #505 is the current integration owner. It must consume the accepted server-derived `bookingContext` contract, preserve the service-scope booking matrix, and make authoritative `confirmationSafe === true` a final-booking acceptance condition before ordinary Calendar appointment creation. #500 remains the delivery/idempotency owner after identity is safe.

PR #504 remains on its existing Control hold until the Calendar P0 authority/confirmation package is integrated and reconciled.

## Reconciliation outcome

After this correction is merged, current Shiloh OS governance records must use this distinction:

**Christel = Business Owner / Primary Shiloh Admin**

**JP = Delegated Technical/System Super Admin**

Any earlier broad statement that JP is Shiloh's business owner/final business authority, or that Christel is merely an operations administrator, is superseded by this correction.
