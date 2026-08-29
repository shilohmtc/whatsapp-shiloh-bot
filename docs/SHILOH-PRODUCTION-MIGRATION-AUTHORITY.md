# Production migration authority

Shiloh has one supported production migration-application command:

```sh
npm run db:migrate
```

The command reads the ordered SQL files in `migrations/`, validates each
filename, takes a unit-specific PostgreSQL advisory transaction lock, and
applies each pending file in the same transaction as its matching
`schema_migrations(filename, checksum, applied_at)` row. A checksum mismatch
or unknown migration fails closed. The transaction uses bounded lock and
statement timeouts and rolls back both SQL and ledger recording on failure.

## Application startup

`npm start` runs `scripts/verify-migrations.js` before loading the web
application. `app.js` repeats the read-only authority check so direct
application invocation has the same fail-closed boundary.

Verification uses a repeatable-read, read-only transaction and requires:

- every released migration file has one ledger row;
- every ledger checksum matches the released file;
- no ledger row names a migration absent from the release;
- no released migration is pending.

Startup does not create the ledger, apply SQL, repair business data, provision
provider templates, or record an applied migration. Pending or mismatched state
must be reconciled through controlled release execution before the web process
starts.

## Release sequence

1. Confirm backup/PITR and freeze the exact release and migration inventory.
2. Run `npm run db:migrate` in the controlled production execution window.
3. Verify the ledger/file counts, checksums, physical postconditions, business
   invariants, and health.
4. Start or deploy the web release. Startup verifies the reconciled state and
   fails closed if it has drifted.

Migration 088 remains the example for migrations requiring private
transaction-local inputs: use its specifically controlled execution sequence,
then reconcile through the same filename/checksum ledger. Do not put private
inputs into startup configuration merely to make an unattended restart apply
the migration.

## Rollback and recovery

Before production migration execution, record the current release SHA, ledger
inventory, relevant business invariants, and practical database recovery
boundary. If migration execution fails, the transaction rollback preserves the
pre-execution schema and ledger. After a committed migration, use the migration's
documented forward/restore procedure; do not edit historical SQL or ledger
checksums to simulate rollback.
