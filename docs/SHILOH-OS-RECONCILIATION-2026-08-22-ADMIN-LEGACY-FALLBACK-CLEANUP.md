# Shiloh OS — Admin Legacy Fallback Cleanup Reconciliation

Date: 2026-08-22
Owning workstream: **Booking & Admin UX**

## Scope

Remove only the legacy plaintext Admin fallback that exposed internal command syntax when an authenticated Admin supplied unrecognized text, while preserving all existing guarded Admin capabilities, authorization, auditing and booking-flow ownership.

## Authoritative implementation

- Pull request: **#409 — Remove legacy Admin command-dump fallback**
- Application merge: **`696a2c669a3de7b21f8119f0786c707974c30ffd`**
- Presentation patch: `src/bootstrap/adminUxStandardizationPatch.js`
- Focused regression: `tests/admin-legacy-fallback-cleanup.test.js`

The bounded presentation wrapper recognizes only the established legacy response beginning `I don't have that admin command connected yet.` and replaces that output with:

`I didn't recognise that admin request. Send *Menu* to open Shiloh Admin.`

The underlying Admin assistant still receives the unsupported input, so the existing `admin.whatsapp_unrecognized_command` audit path remains intact. Legitimate guarded Admin replies are returned unchanged.

## Routing contract preserved

The repair does not move or weaken booking routing. Active Admin mobile booking remains ahead of the generic Admin assistant fallback in webhook dispatch order. A natural date such as `29 Aug` therefore remains booking-owned when an active booking step expects a date; only genuinely unrecognized Admin input reaching the legacy fallback receives the compact recovery copy.

No command authorization, practitioner scope, booking entitlement, CRM identity rule, Calendar conflict rule, Meta/WhatsApp provider contract or mutation path was broadened.

## Validation evidence

GitHub Actions CI run **32567694026** completed successfully on Node **24.14.1**.

- Full non-mutating regression: **868/868 passed**
- Failed: **0**
- Focused cases proved:
  - the legacy unrecognized Admin fallback no longer exposes raw command syntax;
  - guarded Admin command replies are unchanged;
  - active mobile booking routing remains ahead of the fallback; and
  - production startup preloads the cleanup patch before `app.js` captures the Admin assistant export.

## Production verification

Render workspace **My Workspace** was explicitly confirmed before production inspection.

Application deployment:

- Service: `whatsapp-shiloh-bot`
- Service ID: `srv-d9qbfmk9v7es73emgam0`
- Deploy: **`dep-da4njtlckfvc73cmnk0g`**
- Trigger: new commit
- Exact application commit: **`696a2c669a3de7b21f8119f0786c707974c30ffd`**
- Status: **LIVE**

Startup reached the production listener successfully and Render reported the service live. Existing migration/bootstrap verification completed through migration 072 and a production request returned HTTP 200 in the inspected startup window.

An earlier inspection window contained a transient Google Calendar provider-health permission warning. That is **superseded by newer authoritative production evidence** from reconciliation PR #410: documentation-only main commit **`560099cdb55260ae045ffa6a2a3cb2cfdb51017b`** auto-deployed as **`dep-da4nrhgjo6nc73fee4sg`**, reached **LIVE** at `2026-08-22T10:46:11.098874Z`, logged **`Google Calendar provider health check passed`**, logged `Shiloh started`, and returned repeated `/health` HTTP 200 plus root HTTP 200. There is therefore no unresolved Google Calendar provider-health gate attached to this controlled unit.

## Safety boundary

This unit contains no database migration and made no appointment, schedule, CRM, Calendar, Meta template, permission or production business-data mutation. No handset journey was manufactured merely for verification.

## Reconciliation

### Project Tracker

Record `ADMIN-LEGACY-FALLBACK-CLEANUP` as **🟢 VERIFIED LIVE / COMPLETE**, with #409 / `696a2c669a3d...`, CI 868/868, application deploy `dep-da4njtlckfvc73cmnk0g`, and final reconciliation deploy `dep-da4nrhgjo6nc73fee4sg` as bounded evidence. Preserve all unrelated current gates and durable authorities.

### Master Status

Record #409 as the current accepted application baseline, #410 / `560099cdb552...` as documentation-only reconciliation convergence, and preserve #399 as the durable CRM normalized-phone repair authority, #395 as the practitioner Calendar conflict-classification authority, and every unrelated provider/human/evidence gate unchanged.

## Unresolved gates

**None for this controlled unit.** The earlier transient Calendar warning is superseded by the later clean provider-health check on the final reconciliation deploy.

## Do not redo

Do not restore the legacy raw Admin command dump, do not bypass the existing guarded routers, and do not alter booking/date ownership merely to reproduce this issue. Further Admin UX changes require a separately scoped controlled decision.

## Final ownership

**None — controlled unit complete once this final health-evidence reconciliation is merged and its documentation-only deployment is verified.**
