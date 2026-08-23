# Shiloh OS — Reconciliation — Universal Premium First-Contact Welcome Complete

Date: 2026-08-23
Owning implementation workstream: 20 — CRM & Identity
Reconciliation owner: 00 — Control & Reconciliation
Status: VERIFIED LIVE / COMPLETE

## Authoritative outcome

Every unwelcomed ordinary client identity/onboarding journey begins with the canonical Shiloh `PREMIUM_GREETING` exactly once, followed by the unchanged identity-specific response.

This presentation rule applies across:
- new registration / no match;
- imported `claim_required`;
- provisional / unverified;
- `historical_unverified` / human-review;
- ambiguous/conflicting exact-phone identity;
- verified returning-client first contact.

Subsequent onboarding messages do not repeat the full premium greeting. Existing phone-level welcome-delivery state remains the one-time delivery guard.

## Authorization chronology

JP explicitly authorized: `Authorize universal premium first-contact welcome without weakening verification.`

PR #418 — `Authorize universal premium first-contact welcome` — records that presentation-only authorization. It was originally opened before implementation and remained open due sequencing, then was merged on 2026-08-23 as historical authorization only. Merge: `e4ba2cddb209274d4ac82821565cbfc88e0f26f2`.

PR #418 did not implement application behavior and did not mutate production data.

## Implementation authority

PR #419 — `Apply premium greeting to every first identity contact`

- head: `1c1bc91962f3ff550df4a52c34dfe946ee2ac1a3`
- merge: `ff04af1cba76f8eb60f51fbbefb42729317fdba2`
- merged: 2026-08-22
- files changed: 2

Implementation preserves the existing centralized verified-client authority and adds presentation-only first-contact composition.

## CI evidence

PR #419 authoritative CI:
- CI #1279
- workflow run `32574937281`
- job `97035766629`
- Node `24.14.1`
- `npm ci`: 0 vulnerabilities
- full non-mutating regression: **886 passed / 0 failed / 0 cancelled / 0 skipped**

Regression explicitly proves:
- canonical `PREMIUM_GREETING` is used for first-contact presentation;
- new registration gets premium greeting exactly once;
- `claim_required` gets the greeting without changing identity status;
- `historical_unverified` gets greeting + unchanged human-verification response;
- ambiguous identity gets greeting + unchanged fail-closed conflict response;
- provisional/manual-review states are preserved;
- verified returning first contact keeps registered-client actions;
- subsequent onboarding messages do not repeat the greeting;
- centralized verified-client resolver semantics remain unchanged;
- the v2 phone-level delivery ledger remains unchanged.

## Production evidence

Render auto-deploy for exact #419 merge:
- service `srv-d9qbfmk9v7es73emgam0`
- deploy `dep-da4pv4favr4c73bc14c0`
- commit `ff04af1cba76f8eb60f51fbbefb42729317fdba2`
- trigger `new_commit`
- started `2026-08-22T13:09:37.648086Z`
- finished `2026-08-22T13:10:06.571419Z`

The deploy was later deactivated only because newer #420 application code deployed immediately afterward. #420 was merged on top of #419 and preserves the premium first-contact implementation. #421 later reconciled #420 and likewise does not alter this presentation rule.

Current application lineage therefore contains #419 behavior beneath #420. No rollback or superseding code change has been identified for this subject.

## Authority preserved / do not redo

This unit does not change:
- `clientVerifiedIdentity` resolver semantics;
- migration 074 or explicit verification evidence;
- exact-phone duplicate/contact conflict protection;
- `historical_unverified` human verification;
- ambiguous/multiple-client fail-closed behavior;
- imported-label non-disclosure;
- prohibition on imported DOB/gender seeding;
- controlled Juvan authority;
- Booking/Admin centralized verified-client authority.

No imported client was bulk verified, rewritten, merged, archived or trust-backfilled. No real onboarding, booking, Calendar event or WhatsApp journey was manufactured merely for proof.

## Handset evidence

A future genuine first-contact journey may provide natural handset evidence of the premium greeting on a particular branch. This is evidence-to-observe only and is not a blocker to VERIFIED LIVE closure because the exact implementation, regression and production lineage are established.

## Reconciliation disposition

- PR #418: merged as historical authorization; do not re-open or reinterpret as implementation authority.
- PR #419: durable bounded implementation authority for universal premium first-contact presentation.
- PR #420: newer overall application authority and preserves #419 behavior.
- PR #421: newer reconciliation authority and preserves #419 behavior.

This controlled unit is COMPLETE / DO NOT REDO unless a later explicit business decision changes the presentation rule.