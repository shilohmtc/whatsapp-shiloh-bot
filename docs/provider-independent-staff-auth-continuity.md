# Provider-independent staff authentication continuity

Status: workspace implementation only. This document does not authorize a merge, deployment, migration execution, production secret change, feature activation, WhatsApp retirement, or Meta/WABA/template mutation.

## Security architecture

The provider-independent path resolves a submitted staff account number to exactly one active canonical `staff_admin_accounts.id`, revalidates linked staff status, and verifies either RFC 6238 TOTP or a one-time recovery code. Successful TOTP verification issues the same opaque, hashed, server-side `staff_browser_sessions` used by WhatsApp authentication. A recovery or break-glass exchange issues that same session type in `recovery_required` state, with no Calendar viewer authority, until replacement enrollment is confirmed.

TOTP profile:

- issuer: `Shiloh OS`;
- SHA-1 compatibility profile;
- six digits;
- 30-second timestep;
- previous/current/next timestep only;
- transaction-locked `last_accepted_timestep` replay rejection.

TOTP seeds are 20 random bytes and are stored only as AES-256-GCM ciphertext, 12-byte nonce, authentication tag, and key version. The application keyring remains outside PostgreSQL. Recovery codes are 10 independently generated 128-bit values, displayed once and stored only as individually salted scrypt hashes. Regeneration revokes every previous unused code.

## Default-off controls

All of the following must be valid before the provider-independent surface becomes operational:

- `SHILOH_STAFF_TOTP_AUTH_ENABLED=true`
- `SHILOH_STAFF_TOTP_PILOT_ADMIN_IDS=<comma-separated immutable staff_admin_accounts IDs>`
- `SHILOH_STAFF_TOTP_ACTIVE_KEY_VERSION=<version label>`
- `SHILOH_STAFF_TOTP_ENCRYPTION_KEYS_JSON=<JSON object mapping versions to 32-byte base64url keys>`

The feature is off when the feature flag is absent or not exactly `true`. If the pilot list or keyring is missing or malformed, the feature fails closed while the existing WhatsApp routes remain intact.

The keyring supports multiple versions so an existing seed remains decryptable while a new version becomes active for later enrollment. Never log, commit, paste into tickets, or store the production keyring in PostgreSQL.

## Controlled rollout

1. Apply migration `081_provider_independent_staff_auth.sql` only under later production authorization.
2. Configure the production keyring and keep `SHILOH_STAFF_TOTP_AUTH_ENABLED` off.
3. Resolve JP's exact immutable canonical Admin ID; configure only that ID in the pilot list.
4. Enable the feature under explicit authorization. Existing WhatsApp authentication remains available.
5. JP authenticates through the existing path, opens `/calendar/staff-auth/totp/manage`, enrolls, proves possession, and stores the one-time recovery-code set offline.
6. Prove a genuine new browser login with TOTP while Meta delivery is unavailable at the test boundary.
7. Add Christel's exact immutable Admin ID to the pilot list only after JP proof succeeds.
8. Repeat enrollment, recovery-code custody confirmation, and Meta-unavailable browser-login proof for Christel.
9. Keep WhatsApp authentication and Meta templates intact. Any later retirement or demotion is a separate 00 decision.

## Reset and recovery

An active staff member can replace their authenticator from a recent session. Recovery-code use is atomic and single-use, marks replacement required, rotates the browser session, and blocks Calendar authority until a new authenticator is confirmed.

`staff_auth:reset` authorizes resetting another account only. Runtime enforcement rejects privileged self-reset. Reset disables the subject's credential, revokes unused recovery codes, revokes active sessions, and writes operator/subject/reason evidence.

JP total-factor loss is not an ordinary application workflow. After explicit 00 authorization, 40 may issue a five-minute, one-time, hash-at-rest break-glass handoff:

```sh
node scripts/issue-staff-auth-break-glass.js \
  --admin-id=<immutable-jp-admin-id> \
  --operator=<actual-40-operator> \
  --control-reference=<00-authorization-reference>
```

Issuance revokes active subject sessions and records the actual operator reference, subject, control reference, and session count. The browser handoff uses a URL fragment, clears it before exchange, creates a recovery-required session, and forces replacement enrollment. The command must never be run without the separate 00+40 authority.

The issuance command refuses redirected or captured output and must run in an interactive secure terminal. It shows the handoff once; the database stores only its SHA-256 hash.

## Rollback

The migration is additive and the feature defaults off. Disabling `SHILOH_STAFF_TOTP_AUTH_ENABLED` hides and rejects the new path without deleting credentials, recovery state, sessions, WhatsApp authentication, or Meta templates. Before a later controlled rollback, record the operator and control reference:

```sh
node scripts/audit-staff-auth-rollback.js \
  --operator=<actual-40-operator> \
  --control-reference=<00-authorization-reference> \
  --reason=<controlled-reason>
```

## Production proof checklist

- schema migration checksum and service health;
- feature initially off;
- JP enrollment and independent browser login;
- Christel enrollment and independent browser login;
- valid, invalid, old-timestep, replay, concurrent-replay, throttling and lockout evidence;
- recovery single-use, replay rejection, regeneration invalidation and forced replacement;
- inactive account and post-disable session rejection;
- cookie, CSRF, expiry, rotation, revocation and role/capability evidence;
- sanitized audit operator/subject provenance;
- Meta-unavailable authentication proof with no provider request;
- existing WhatsApp authentication regression;
- audited feature-off rollback;
- confirmation that WhatsApp authentication, Meta templates, and WABA configuration remain unchanged.
