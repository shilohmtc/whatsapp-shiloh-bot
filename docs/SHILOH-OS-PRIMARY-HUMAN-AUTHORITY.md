# Shiloh OS Primary Human Authority

Controlled unit: `SHILOH-OS-PRIMARY-HUMAN-AUTHORITY`

Owner: **00 — Control & Reconciliation**

Status after merge: **ACTIVE GOVERNANCE STANDARD**

## Control decision

Shiloh OS is governed around two primary human principals with deliberately different authority levels:

- **JP — System Owner / Super Admin**
- **Christel — Operations Admin**

All other human and technical principals derive bounded authority from this model.

This is a governance authority model. It does **not**, by itself, mutate GitHub, Render, Meta, database, application, Calendar, CRM or other runtime permissions. Any concrete permission, role, credential, production configuration or access-control change remains a separately bounded implementation/mutation requiring the appropriate authority.

## Governing principle

Shiloh OS is built primarily for **JP to govern** and **Christel to operate**.

The design goal is:

- Christel can run normal clinic operations without needing JP for routine work.
- JP retains control over changing what Shiloh OS itself is allowed to do, who may do it, and which security/production boundaries exist.
- Neither operational convenience nor a feature-specific implementation may silently expand human authority.

## JP — System Owner / Super Admin

JP is the accountable human authority for the Shiloh OS system and business-governance boundary.

JP owns or authorizes:

- final Shiloh OS governance decisions;
- production/security boundary changes;
- permission and role model changes;
- structural CRM and booking authority changes;
- integration ownership and credential/asset authority changes;
- Render production configuration changes;
- Meta system-user/token/asset/phone/WABA authority changes;
- database structural changes and migration authorization;
- GitHub merge/deployment authority where separately implemented;
- destructive, irreversible or security-sensitive business/system actions;
- delegation or revocation of bounded authority to other users.

JP may also perform ordinary operational work, but the primary role is system ownership and governance.

## Christel — Operations Admin

Christel is the primary clinic operations administrator.

Subject to each capability's existing safeguards and any separately implemented role checks, Christel is the intended primary operator for:

- Calendar and booking administration;
- canonical CRM client administration;
- normal client lifecycle operations;
- staff schedule/availability administration where authorized;
- treatment/service and booking workflow usage where authorized;
- client communication workflows;
- operational corrections that have an explicit audited business rule;
- evidence-backed client-facing name corrections once `SHILOH-CLIENT-FACING-NAME-AUTHORITY` is implemented.

Christel does **not** receive implied authority to:

- self-escalate permissions;
- alter Shiloh OS governance rules;
- change Meta tokens/system-user roles/assets/WABA ownership/phone registration;
- change Render production configuration;
- make database structural changes;
- change security-critical credentials;
- bypass canonical booking, CRM identity, eligibility, stale-slot or provider safeguards;
- perform destructive/irreversible system changes unless JP has explicitly delegated that bounded action.

## Default authority matrix

| Capability | JP — System Owner / Super Admin | Christel — Operations Admin |
|---|---|---|
| View Control Cockpit / project status | Full | Operational visibility when productized |
| Calendar & booking operations | Full | Full within existing booking safeguards |
| CRM client administration | Full | Full within audited operational rules |
| Client-facing name correction | Full when implemented | Allowed only through evidence-backed audited correction when implemented |
| Staff schedules / leave / availability | Full | Operational admin where implemented |
| Client communications | Full | Full within communication policy and workflow safeguards |
| WhatsApp operational messaging | Full | Full where the operational workflow is authorized |
| Meta token/system-user/asset configuration | Owner / explicit authority | No by default |
| Render production configuration | Owner / explicit authority | No by default |
| Database structural changes | Owner / authorization | No |
| GitHub merge/deployment authority | Owner / authorization where implemented | No by default |
| Permission / role changes | Owner | No self-escalation |
| Destructive or irreversible business/system actions | Explicit JP authority | Only if specifically delegated |

This table is the default governance model. A future controlled capability may define a narrower permission set, but it must not silently broaden Christel beyond these boundaries or reduce JP's System Owner authority without a fresh 00 Control decision.

## Product acceptance rule

Every material new Shiloh OS capability must explicitly answer:

1. How does JP govern/administer this capability?
2. How does Christel operate/administer this capability?
3. Which actions are normal operational actions?
4. Which actions require JP-level authority?
5. Which actions are destructive, irreversible, security-sensitive or production-config changes and therefore need explicit authorization?
6. What audit trail, fail-closed behavior and non-self-escalation rule applies?

A capability is not considered fully governed merely because its functional path works.

## Derived-role rule

Other staff roles must be derived from operational need and least privilege. They are not co-equal primary principals unless 00 explicitly changes this standard.

Technical principals (service accounts, Meta system users, Render services, database users, integrations, automation agents) are never treated as human business authority. They act only within explicitly granted technical scopes.

## Relationship to existing authorities

This governance standard does not reopen completed units.

In particular:

- `SHILOH-EMERGENCY-CHRISTEL-CALENDAR-BOOKING` remains COMPLETE / FROZEN.
- `SHILOH-CALENDAR-NEW-CLIENT-PROVISIONAL-BOOKING` remains COMPLETE / FROZEN.
- imported-contact identity remediation remains COMPLETE / DO NOT REDO.
- `SHILOH-CLIENT-FACING-NAME-AUTHORITY` remains owned by 20 — CRM & Identity and must implement its own evidence/audit rules.
- Meta verification remains WAITING EXTERNAL / Meta Business Support.

## Mutation boundary

This governance unit authorizes the **authority model**, not concrete external permission mutations.

No runtime role, production permission, credential, Meta asset, GitHub permission, Render configuration, CRM record, booking, appointment, Calendar event or database row may be changed solely because this document exists.

Concrete permission implementation must be separately scoped, reviewed, tested and authorized.