# Shiloh OS — Meta WABA Template Permission Diagnostic

Controlled unit: `SHILOH-META-WABA-TEMPLATE-CREATION-PERMISSION-REMEDIATION`

Owner: 30 — WhatsApp & Meta Integration

## Purpose

Provide a default-off, read-only production diagnostic for the current Meta token/WABA relationship after Meta rejected template creation with provider code 10.

## Safety boundary

The diagnostic performs GET requests only. It does not:

- create, update or delete a Meta template;
- send a WhatsApp message;
- modify a Meta human/system user role;
- modify a WABA asset assignment;
- modify token scopes or credentials;
- modify WABA ownership or partner sharing;
- modify phone registration or ownership.

Runtime gate:

`META_WABA_TEMPLATE_PERMISSION_AUDIT_ON_START=false`

The gate must be enabled only for the bounded diagnostic rollout and returned to `false` immediately after evidence capture.

## Sanitized evidence

The audit records only status enums, permission/task names, boolean relationship checks and query success/failure evidence. Meta business/WABA/principal identifiers, phone numbers, credentials, challenge codes and long provider identifiers are removed from logs.

## Interpretation

The diagnostic distinguishes:

1. token permission/scope deficiency;
2. WABA assigned-user task deficiency;
3. WABA ownership/client-sharing relationship;
4. WABA review/business verification/status state;
5. a provider/WABA restriction when the local permission and account prerequisites are independently proven adequate.

No permission mutation is authorized by this diagnostic.
