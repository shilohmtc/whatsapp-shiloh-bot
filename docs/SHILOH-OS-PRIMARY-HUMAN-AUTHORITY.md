# Shiloh OS Business Ownership and Delegated Technical Authority

Controlled unit: `SHILOH-OS-BUSINESS-OWNER-AND-DELEGATED-TECHNICAL-AUTHORITY`

Owner: **00 — Control & Reconciliation**

Status after merge: **ACTIVE GOVERNANCE STANDARD**

Supersedes, where inconsistent, the earlier `SHILOH-OS-PRIMARY-HUMAN-AUTHORITY` wording.

## Control decision

Shiloh OS must distinguish **business ownership** from **delegated technical/system authority**.

The durable human model is:

- **Christel — Business Owner / Primary Shiloh Admin**
- **JP — Delegated Technical/System Super Admin**

Christel owns and operates **Shiloh Massage Therapy & Aesthetic Clinic**. JP helps Christel build, test, support, secure and improve Shiloh OS under delegated technical/system authority.

`00 — Control & Reconciliation` is the engineering/control process for sequencing, authorization records, evidence, gates and reconciliation. It is not an independent human business owner.

These titles describe governance intent and product authority. They do not assert that current runtime role names, accounts or external permissions already use the same labels.

## Governing principle

> Christel owns and operates Shiloh Massage Therapy & Aesthetic Clinic. Shiloh OS should allow Christel to administer the business herself. JP helps build, govern technically, test and improve the system under delegated authority.

The design goal is:

- Christel can run and administer normal clinic operations without needing JP, ChatGPT or an engineer for routine work.
- Christel can delegate and revoke bounded operational or technical authority.
- JP has the technical/system access needed to help build, test, support and improve Shiloh OS where that authority has been delegated.
- Staff authority is explicit, least-privilege and attributable to the real authenticated operator.
- Neither operational convenience nor technical access may silently expand a person's business authority.

## Christel — Business Owner / Primary Shiloh Admin

Christel is the primary human business authority for Shiloh Massage Therapy & Aesthetic Clinic.

Subject to canonical safeguards and the capabilities that have actually been implemented, the intended Shiloh Workspace experience must let Christel administer normal business operations herself, including:

- adding and activating staff;
- deactivating staff when access is no longer required;
- assigning and changing operational roles;
- assigning and changing service authority;
- managing staff schedules, leave and availability;
- managing Calendar and booking operations;
- managing canonical CRM/client operations;
- managing normal client lifecycle and communication workflows;
- managing normal business configuration;
- delegating and revoking bounded staff authority;
- reviewing the audit trail for material business and staff changes.

A normal operational change should not require Christel to edit code, modify database rows, use GitHub/Render/Meta administration directly, or ask JP/ChatGPT to act as the permanent operational control panel once the relevant Workspace capability is productized.

Christel's business ownership does not mean operational workflows should bypass canonical booking, CRM identity, eligibility, stale-slot, security, provider, audit or fail-closed safeguards. The product should make legitimate authority easy to exercise without creating bypasses.

## JP — Delegated Technical/System Super Admin

JP helps Christel build, test, support, secure and improve Shiloh OS under delegated technical/system authority.

Depending on the separately controlled capability, JP's delegated technical work may include:

- architecture and implementation;
- testing and technical diagnostics;
- security and integration administration;
- controlled deployment execution and production support;
- GitHub, Render, Meta, database or other infrastructure work where the applicable authority has been delegated;
- system configuration and technical recovery work that is genuinely engineering/administration rather than routine clinic operation.

JP is **not** represented as the owner of Shiloh Massage Therapy & Aesthetic Clinic and is not assumed to be a Shiloh employee or routine day-to-day clinic operator.

Delegated technical authority does not transfer business ownership to JP. JP must not silently grant himself broader business authority merely because he has technical access. Routine operational actions are available to JP only where a capability-specific rule or delegation permits them.

## Business authority and technical execution

Business policy and technical execution are related but distinct:

| Capability | Christel — Business Owner / Primary Shiloh Admin | JP — Delegated Technical/System Super Admin |
|---|---|---|
| Business ownership and clinic policy | Final business authority | Supports; no implied ownership |
| Routine clinic operations | Primary admin/operator | Only where specifically delegated or capability-authorized |
| Staff add/activate/deactivate | Business admin authority when productized | Build/support path; may assist if delegated |
| Operational roles and service authority | Business admin authority when productized | Build/support path; no self-expansion |
| Calendar / booking / CRM / communications | Business admin authority within canonical safeguards | Capability-specific delegated access only |
| Staff schedules / leave / availability | Business admin authority when productized | Build/support path unless operationally delegated |
| Technical architecture and implementation | Authorizes business requirement / outcome | Primary delegated technical execution |
| GitHub / Render / Meta / DB technical administration | Business owner may authorize/delegate | Executes only within delegated technical scope |
| Security-model or structural system changes | Business-owner decision where business authority is affected | Designs/implements under controlled technical authorization |
| Destructive / irreversible business actions | Business-owner authority, with product safeguards | Technical execution only when explicitly delegated/authorized |
| Delegation / revocation of business authority | Owner | Cannot self-delegate broader business authority |

A capability-specific controlled unit may define a narrower operational scope. It must not silently contradict this ownership/delegation model.

## Delegation and least privilege

Business authority originates with Christel. Christel may delegate bounded operational or technical authority and may revoke it.

Other staff roles derive from operational need and least privilege. They are not co-equal business owners unless the business ownership itself changes through an explicit governance decision.

Staff must act as themselves. Material changes must be attributable to the authenticated operator. No user should be able to self-escalate through an ordinary operational workflow.

Technical principals such as service accounts, Meta system users, Render services, database users, integrations and automation agents are technical identities only. They are never independent human business authority.

## Shiloh Workspace product direction

Normal business decisions should be configurable in Shiloh rather than requiring engineering intervention.

The target Shiloh Workspace should make safe self-service possible for routine areas such as:

- Today / operational attention;
- Calendar and booking lifecycle;
- Clients / CRM and governed identity actions;
- Staff lifecycle, roles and service scope;
- staff schedules, leave and availability;
- communications and delivery exceptions;
- normal business configuration and audit visibility.

The product should prefer canonical configuration, service IDs/assignments and audited workflows over hard-coded person-specific exceptions.

Engineering intervention remains appropriate for genuinely technical work such as structural system changes, new integrations, security-model changes, database migrations, production incidents, major feature development and technical infrastructure changes.

## Product acceptance rule

Every material new Shiloh OS capability must explicitly answer:

1. Can Christel administer the normal business operation herself through Shiloh Workspace?
2. What may other staff do, and how is their authority bounded by role, service scope and operational need?
3. What delegated technical/system path does JP need to build, test, support or administer the capability?
4. Which decisions remain business-owner decisions for Christel even if technical execution is delegated?
5. Which actions are routine operations versus security-sensitive, production, destructive or irreversible actions?
6. What audit trail, fail-closed and non-self-escalation behavior applies?
7. Can recurring configuration be made safely in Workspace instead of requiring a code change or manual engineering task?

A capability is not considered fully productized merely because its functional backend path works.

## Relationship to capability-specific authorities

This governance correction does not automatically reopen or rewrite completed capability implementations. When a current capability's runtime role model does not yet match this standard, alignment must be separately scoped and tested rather than silently inferred.

Current capability-specific service scopes, identity evidence rules, booking safeguards, communication safeguards and production gates remain authoritative until their owning controlled units reconcile them.

## Runtime permission boundary

This governance standard does **not**, by itself, mutate GitHub, Render, Meta, database, application, Calendar, CRM or other runtime permissions.

No runtime role, production permission, credential, Meta asset, GitHub permission, Render configuration, CRM record, staff account, booking, appointment, Calendar event, database row or provider configuration may be changed solely because this document exists.

Concrete runtime alignment must be separately scoped, reviewed, tested and authorized.
