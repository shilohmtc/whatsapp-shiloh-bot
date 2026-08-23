# Shiloh OS — Authorization — Universal Premium First-Contact Welcome

Date: 2026-08-22
Owning implementation workstream: CRM & Identity
Shared-contract consumer: Booking & Admin UX where the same first-contact presentation surface is reused
Control owner: Control & Reconciliation
Status: AUTHORIZED FOR IMPLEMENTATION / PRESENTATION-ONLY

## Business decision

JP explicitly authorizes a universal premium first-contact presentation rule:

**Every genuine first-contact identity journey should begin with the existing Shiloh `PREMIUM_GREETING` exactly once, without weakening any verified-client, ambiguity, historical-client, duplicate/conflict or human-review authority.**

This is a UX/presentation decision only. It does not authorize any change to identity classification or client trust.

## Required behavior

On the first genuine interaction for an identity/onboarding journey, present the existing Shiloh premium welcome before the appropriate identity-specific response.

The rule applies to first-contact branches including:

- normal new registration / no match;
- imported contact `claim_required`;
- provisional/unverified registration-required paths;
- `historical_unverified`;
- `manual_review`;
- ambiguous/conflicting exact-phone identity;
- verified returning client greeting.

The premium greeting should appear **once per genuine first-contact journey**, not on every subsequent onboarding message.

## Non-negotiable authority preservation

Implementation must not:

- change `clientVerifiedIdentity` resolver semantics;
- convert imported source/name/DOB/gender/history/profile completeness/contact type/`verified_at` into identity authority;
- weaken `historical_unverified` human verification;
- weaken ambiguous/multiple-client/conflicting contact fail-closed behavior;
- disclose imported display names or labels;
- compare claimant names against imported labels;
- seed imported DOB/gender as claimant truth;
- weaken exact-phone duplicate/contact ownership protection;
- alter migration 074 or explicit verification evidence semantics;
- alter controlled Juvan authority;
- bulk remediate, verify, merge, rewrite or trust-backfill imported clients;
- manufacture a real onboarding, booking, Calendar event or WhatsApp journey merely for proof.

## Preferred implementation shape

Centralize the first-contact presentation rule in a small reusable helper/wrapper rather than manually prepending the premium greeting independently in every branch. The implementation should distinguish first contact from subsequent messages so the greeting is emitted exactly once.

Focused regression should cover at least:

- no-match new registration first contact gets premium greeting once;
- imported `claim_required` first contact gets premium greeting once;
- `historical_unverified` first contact gets premium greeting followed by unchanged human-verification explanation;
- ambiguous/conflict first contact gets premium greeting followed by unchanged fail-closed explanation;
- verified returning-client greeting remains correct;
- subsequent onboarding messages do not repeat the full premium greeting;
- identity status/authority returned by each branch is unchanged.

## Authorization scope

Authorized now:

- bounded application-code implementation;
- focused tests and full applicable non-mutating regression;
- CI;
- bounded PR;
- merge only when green;
- normal Render auto-deployment and startup/health verification;
- Project Tracker/Master reconciliation after successful implementation.

Not authorized:

- any production CRM data mutation or historical cohort remediation;
- changes to identity trust rules;
- weakening human/provider/security gates;
- synthetic customer journeys merely for evidence.

## Starting authority

Start from current `main` at authorization time:

`d5acffd18eec85c0488e579b71636c8de59d318f`

Preserve PR #416 verified-client implementation, PR #417 reconciliation, PR #399/migration 072, PR #395 Calendar classification, PR #411 bounded Postgres observation exception, and all newer unrelated authority discovered before implementation.

Open Goldie exact-source-first policy work is separate and must not be modified by this unit.

## Sequence

`inspect current authority → implement centralized first-contact presentation → focused tests → full applicable regression → repair until green → PR → CI → merge → Render verification → Tracker → Master → final checkpoint`

Stop only for contradictory newer authority, material scope expansion, or a genuine fail-closed safety/provider/human gate.
