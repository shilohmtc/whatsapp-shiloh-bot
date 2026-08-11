# Shiloh Production Maintenance & Rollback Runbook

Current operating rule: normal `npm start` boots the HTTP service and long-running schedulers only. Migrations, repairs, production smoke checks, rollout jobs, Goldie imports and Google Calendar reconciliations are explicit operator actions and must never be coupled to a Render restart/deploy.

## Normal deploy verification

1. Confirm the intended GitHub `main` commit.
2. Wait for GitHub Actions CI to complete successfully.
3. Confirm Render deployed the same commit and reports `live`.
4. Confirm `/health` returns HTTP 200 with database `ok`.
5. Review startup logs. Expected recurring schedulers are Goldie knowledge sync, Google Business Profile sync when configured, appointment lifecycle, and customer care. One-time repair/import/reconciliation jobs must not appear during ordinary startup.

## Running maintenance explicitly

List commands with:

```bash
npm run maintenance -- help
```

Read-only examples:

```bash
npm run maintenance -- chenique-diagnostic
npm run maintenance -- p2-staff-smoke
npm run maintenance -- google-calendar-reconcile-dry-run
npm run maintenance -- goldie-future-import-dry-run
```

Mutating commands require an explicit acknowledgement:

```bash
npm run maintenance -- google-calendar-reconcile-commit --confirm
npm run maintenance -- goldie-future-import-commit --confirm
npm run maintenance -- catalogue-polish --confirm
```

Never run a write command merely to test that it works. Prefer a read-only/dry-run command and inspect the result first. Do not use genuine appointments for destructive testing and do not send unnecessary WhatsApp messages to real clients.

## Pre-write checklist

Before any mutating maintenance command:

1. Record the current GitHub commit and current live Render deploy ID.
2. Confirm the command's intended scope and environment values.
3. Run the corresponding dry-run/read-only check when one exists.
4. Confirm database backup/PITR availability in Render for database-changing work; if no suitable recovery point is available, do not proceed with a risky bulk mutation.
5. For Calendar work, identify exact affected calendar/event scope and avoid bulk destructive changes to genuine appointments.
6. For Goldie work, retain the source export/checksum outside Git and confirm no client messaging path is invoked.

## Application rollback

If a code deploy regresses production but no maintenance write has been executed:

1. Revert the offending GitHub commit (preferred) or restore the last known-good tree on `main`.
2. Let Render auto-deploy the rollback commit.
3. Verify CI, Render `live`, `/health` 200 and startup logs.
4. Confirm no one-time maintenance command ran during the deploy.

A code rollback does **not** undo database or Calendar mutations already committed by an explicit maintenance command.

## Data/Calendar rollback

For a database-changing maintenance command, use the recorded pre-write recovery point plus the command's audit/output to determine the narrowest safe recovery. Do not blindly restore the whole production database if a scoped corrective transaction is safer.

For Google Calendar, prefer an idempotent/tightly scoped corrective reconciliation. Never delete or recreate genuine appointments simply to prove a rollback path.

If a command partially fails, preserve logs/output, stop further writes, verify CRM and Calendar state read-only, then choose the smallest corrective action. Do not rerun a mutating command repeatedly unless its idempotency and current state are understood.

## Goldie cutover protection

Goldie remains connected until the documented exit gate is fully cleared: fresh final export, future-booking delta comparison, delta import/reconciliation, zero unresolved future bookings, and final CRM/Calendar verification. Maintenance cleanup does not alter that gate.

## Safety invariants

- No impersonating Marietjie or Abigail.
- No unnecessary messages to real clients.
- No destructive testing against genuine CRM/Calendar appointments.
- Write maintenance commands require `--confirm`.
- Prefer dry-run/read-only verification first.
- Do not disconnect Goldie until the exit gate is fully verified.
