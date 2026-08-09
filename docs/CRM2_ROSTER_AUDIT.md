# CRM-2 Roster Completeness Audit

`Roster status` is a read-only manager/admin diagnostic exposed through the WhatsApp Admin Assistant.

It reports active staff records with:
- configured recurring working-day count
- active eligible service count
- readiness warning when either working hours or active service eligibility is missing

The command is permission-gated by `schedule:manage`, audited through `crm_audit_events`, and performs no roster, service, schedule, appointment, or historical data writes.
