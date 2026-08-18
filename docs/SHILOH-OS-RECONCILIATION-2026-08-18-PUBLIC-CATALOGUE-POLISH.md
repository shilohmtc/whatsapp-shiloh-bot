# Shiloh OS — Reconciliation 2026-08-18 Public Catalogue Polish

Reconciled: 2026-08-18 09:03 SAST
Post-reconciliation update: 2026-08-18 — Google Calendar provider guard and engineering-governance rule added after production evidence from Admin Manage booking.

## Authority checked

- GitHub `main`
- Merged PR lineage #282–#301
- GitHub Actions CI for the final #301 head
- Render production deployment for the #301 merge commit
- Existing canonical Shiloh CRM-backed catalogue and booking contracts

## Production convergence

PR #301, **Group plasma specialty categories in one row**, passed CI and merged to `main` as **`6863958dbf97a6a6f593fc196c284571adf802c6`**.

Render auto-deployed that exact merge commit as **`dep-da1ut3oae00c73c0g18g`** and reported it **LIVE** at 2026-08-18 05:33:32 UTC.

Source and production are therefore converged through the complete accepted public-catalogue presentation lineage ending at PR #301.

## Accepted `/book` state after #282–#301

The Phase 1 CRM-backed catalogue architecture remains unchanged: `/book` is a read-only projection of canonical Shiloh CRM service truth, and availability remains authoritative only inside the existing booking engine.

The accepted presentation state now includes:

- smaller conversion-oriented hero and faster access to treatments;
- wider desktop catalogue with scannable duration/price treatment cards;
- Massage pinned first and Pedicures & Foot Care second;
- responsive category navigation plus WhatsApp guidance/booking actions;
- real Shiloh clinic imagery served through the repository asset path;
- clean service-card surfaces rather than photographic card backgrounds;
- the exact uploaded **Inside Shiloh** signature artwork used at three approved catalogue positions;
- specialty category rows that group related treatment families horizontally on desktop and stack responsively on mobile;
- the final plasma row containing **Profosma Jet Plasma**, **Plasma Fibroblast Consultation**, and **Plasma Fibroblast Prices** together in one three-column desktop row;
- the SQT pair retained together;
- the HIFU / Vaginal Tightening & Rejuvenation / Neo Pelvic Therapy specialty row retained in its approved order.

The intermediate visual experiments in #284–#294 are historical implementation lineage, not separate outstanding work. The final accepted state is the current #301 runtime; do not redo superseded side-frame, gallery, collage-background, or earlier visual-break variants without new business direction.

## Final #301 verification

The #301 branch updated regression coverage for the three-card plasma row. GitHub Actions CI run **#970** completed successfully before merge. Render then auto-deployed the exact merge commit and reached LIVE.

No catalogue data, service pricing, duration, practitioner eligibility, appointment state, availability rules, Calendar state, or WhatsApp booking semantics were changed by #301. The change is presentation-only.

## Existing non-catalogue authority unchanged

- Admin booking/reschedule and 24-hour-time work remains accepted and live in the current lineage.
- Attendance certification authority remains unchanged.
- Historical attendance remains human-truth controlled; re-query before quoting a current unresolved count.
- Appointment #558 remains fail-closed until its real historical practitioner is established.
- Provider approval and handset delivery evidence remain separate facts.
- Genuine lifecycle/follow-up/birthday evidence remains genuine-journey gated where applicable.
- Destructive privacy execution remains fail-closed.

## Exact continuation state

**Authoritative current runtime:** GitHub + Render converged through **`6863958dbf97a6a6f593fc196c284571adf802c6`** (PR #301).

**Completed now:** the approved `/book` presentation refinement workstream through #301, including the exact Inside Shiloh artwork, responsive specialty grouping, and final three-column plasma family row.

**Do not redo:** superseded catalogue visual experiments from the #284–#294 iteration chain or earlier specialty grouping variants from #298–#300. They are resolved by the final #301 state.

**Next catalogue action:** business review of the current live #301 page. Any further presentation refinement should start from the live accepted state and preserve canonical CRM service truth and existing booking semantics.

**Remaining hard gates:** human attendance truth, #558 practitioner identity, genuine journey evidence, and explicit approval for any material service/commercial/business-rule change.

## Post-reconciliation production incident — Admin practitioner change / Google Calendar

A real WhatsApp Admin **Manage booking → Change practitioner** journey on 2026-08-18 exposed a generic failure after a valid practitioner name was entered. Render production logs established the root cause rather than inferring it: Google OAuth refresh returned **`invalid_grant`** with **`Token has been expired or revoked.`** during the authoritative Calendar availability check inside the booking-update path. The failure was therefore a Google Calendar authorization/provider-state failure, not a practitioner-name parsing failure.

PR **#302**, **Fail closed cleanly when Google Calendar auth expires**, passed GitHub Actions CI run **#975** and merged to `main` as **`bee0bdcd71f7dae768a78e6e5cfcd5ec5ddf76c9`**. Render production startup evidence showed the new `adminBookingProviderGuardPatch.js` preload active. Its read-only startup provider probe immediately detected the same `invalid_grant` condition and logged **`Google Calendar provider health check failed; booking mutations remain fail-closed`**.

The application now:

- catches Google Calendar OAuth/provider failures on both stateful and restart-safe Admin booking-update paths;
- fails closed instead of returning the generic WhatsApp processing error;
- explicitly states that Google Calendar is unavailable and that **no booking change was saved**;
- tells the operator to reconnect Google Calendar before retrying;
- performs a read-only Google Calendar health probe at startup and every 30 minutes so the dependency failure is visible before a human enters the affected journey;
- has regression coverage for expired/revoked OAuth recognition, fail-closed messaging, preload ordering, and provider-health probing.

**Provider gate remains:** the configured Google OAuth refresh token is currently expired or revoked. The code guard is live, but Calendar-dependent booking mutations must remain fail-closed until Google Calendar authorization is restored with authoritative credentials. Do not disable Calendar conflict checks or bypass the provider gate merely to make the practitioner change succeed.

## Permanent engineering-governance addition

`docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md` is now authoritative for Shiloh OS engineering work and must be applied together with the Master, Tracker, and latest reconciliation.

Permanent rules added:

- WhatsApp, Render, GitHub, Meta/provider, CRM, Calendar, and similar screenshots supplied during Shiloh OS work are **diagnostic/operational evidence by default**. Do **not** generate images, sketches, mockups, redesigns, or other visual artifacts from them unless the user explicitly asks for visual creation or image editing.
- When screenshots or other operational evidence reveal unexpected production behaviour, follow the controlled path: current `main` → actual handler/state/provider trace → production/provider evidence → reproduce where practical → root cause → guarded repair → regression/E2E coverage → CI → deploy → production verification → reconciliation.
- The user must not become Shiloh's primary production test suite. Business-critical recurring journeys should progressively gain regression/E2E protection and dependency-health checks where practical.
- Provider/dependency failures that can be identified safely should be surfaced explicitly and fail closed rather than collapsing into generic errors or weakening authoritative CRM/Calendar/conflict/audit rules.

For future continuation, do not treat the governance file as optional historical documentation; apply it as part of the Shiloh OS continuation protocol.