# Shiloh OS — Client Welcome Routing Repair Reconciliation

Date: 2026-08-19
Status: **VERIFIED LIVE / HANDSET-PROVEN**
Owning workstream: **WhatsApp / Meta Integration**
Observers: **CRM & Identity**, **Production / DevOps**, **Control & Reconciliation**, **Booking & Admin UX**

## Scope

This reconciliation closes the controlled Juvan Botha universal-welcome routing defect that followed the earlier authenticated read-only diagnostic. It records the proven pre-repair state, root cause, guarded runtime repair, regression/CI, production deployment verification and real handset verification. It does not infer consent, guardian status, appointment state or any CRM fact beyond the exact sanitized diagnostic evidence stated below, and it does not authorize any booking mutation.

The prior Meta/booking-update reconciliations remain durable and authoritative for their scopes. In particular PR #326 Meta integration, PR #332 stale booking-update suppression and PR #334 booking-update production activation are preserved unchanged.

## Proven pre-repair evidence

The authenticated production endpoint from PR #335 was invoked against the user-confirmed Juvan WhatsApp number while keeping `AUDIT_READ_TOKEN` private. The sanitized result for phone suffix `1564` reported:

- `welcomeVersion=v2`;
- `ledger.exists=false`, `ledger.sentAt=null`;
- `canonicalIdentity.status=unique`, `activeClientCount=1`;
- `canonicalMarker.status=resolved`, `canonicalMarker.exists=false`, `canonicalMarker.sentAt=null`.

This established that the earlier real `Hi` → three-button home-menu response was not legitimate once-only `v2` suppression. The result proves only a unique active canonical match for that normalized phone at the time of the read; it does not infer consent, guardian status or any additional CRM state.

## Root cause

The production bootstrap installed the existing client-navigation-priority wrapper before webhook/transition-welcome modules captured the identity handler. That wrapper intentionally treated greetings such as `Hi` as navigation so matched clients could escape stale conversational state and reach the main menu.

PR #312 later established a stronger first-contact contract: where `v2` has not already been delivered, the universal welcome must precede the safe client-state branch. For unknown, incomplete or ambiguous first-contact states, `processClientTransitionWelcome()` delegates to identity handling. Because it captured the wrapped identity processor, the greeting could be returned as `handled=false` and fall through to discovery, where it became the standard home menu.

The defect was therefore an application routing-composition conflict between the older greeting-navigation rule and the newer universal-welcome contract. It was not classified as a Meta/provider delivery defect and did not require a CRM data rewrite.

## PR #337 — guarded routing repair

PR **#337**, **Preserve universal welcome before greeting navigation**, merged as:

`59119128ea0b288292622fd0b032058fcbd203ce`

The repair narrows greeting bypass behavior:

- greeting input first invokes the canonical/original identity processor;
- only `identityStatus=matched_complete` may bypass identity into ordinary main-menu greeting navigation;
- `unknown`, `matched_incomplete` and `ambiguous` identity outcomes remain handled by the first-contact identity/transition path;
- `Book another treatment` keeps its existing explicit navigation bypass;
- normal discovery and booking handlers remain unchanged.

No migration, CRM/client mutation, welcome-ledger reset, appointment mutation, environment/configuration change or Meta provider submission is part of PR #337.

## Regression and CI evidence

PR #337 adds focused composition coverage proving:

- greetings remain canonical navigation commands for post-welcome use;
- unknown, incomplete and ambiguous first-contact identity branches are not bypassed;
- matched-complete clients may still use a greeting to reach the normal client menu;
- `Book another treatment` still bypasses identity as before;
- the installed navigation wrapper can compose with the transition handler so the universal welcome is prepended to a first-contact registration branch.

GitHub Actions CI run **#1074** completed successfully:

- tests: **701**
- passed: **701**
- failed: **0**

The full suite also retained existing CRM identity/duplicate guards, client discovery/booking safeguards, provider/template checks and governance regressions.

## Production deployment and provider verification

Render auto-deploy **`dep-da2udf95efls73ba76ng`** deployed merge commit `59119128ea0b288292622fd0b032058fcbd203ce` and reached **LIVE** on 2026-08-19.

Post-deploy evidence:

- Shiloh started normally;
- repeated `/health` requests returned HTTP 200;
- Google Calendar provider health passed;
- customer-change template provisioning retained `submitted=false`, `reason=already_exists`, with booking-update and cancellation templates `providerStatus=APPROVED`;
- booking confirmation and staff finalization templates remained approved/existing;
- no Meta template was resubmitted;
- no post-startup error/fatal log was found in the repair verification window.

This preserves the previously reconciled booking-update LIVE / ENABLED state and PR #326/#332/#334 provider/safety evidence.

## Real handset verification

At approximately **19:31 SAST** on 2026-08-19, Juvan sent a real handset greeting `Hi` after the repaired deployment was LIVE.

Observed handset result:

1. the full **🌿 Welcome to Shiloh** universal welcome appeared first;
2. Shiloh then displayed the registered-client branch: **✅ You’re already registered with Shiloh.** / **There’s no need to register again. 😊** / **How would you like to proceed?**;
3. the branch exposed the expected `Choose an option` interactive list.

Render independently corroborated the same production event for masked suffix `***1564`: inbound text at about 17:31:04Z, outbound welcome delivery activity, then a successful **4-row interactive list** send, with the webhook completing HTTP 200.

This is **handset-proven expected repaired behavior** for the observed journey. The post-send `v2` ledger timestamp was not re-read through the authenticated diagnostic in this work unit, so this reconciliation does not invent or assert that timestamp as separately verified evidence.

## Current classification

### Universal welcome routing defect

**🟢 REPAIRED / VERIFIED LIVE / HANDSET-PROVEN.** The former first-contact greeting fallthrough is closed by PR #337.

### Juvan observed branch

**🟢 EXPECTED for the observed production result.** The real handset received the universal welcome first and then the registered-client list. The wording is evidence of the branch the authoritative production handler selected at that moment; it is not a basis to infer consent, guardian status or unrelated CRM attributes.

### Manual state repair

**NOT REQUIRED / NOT PERFORMED.** No welcome-ledger deletion, CRM edit, client merge, identity correction, appointment mutation or Meta configuration change was needed.

## Controlled journey continuation

The next production handset action should remain non-destructive: from the registered-client `Choose an option` list, select **Browse treatments**. Expected behavior is CRM-backed active client-bookable category discovery beginning with the service-category list headed **Browse Shiloh services**. Do not select a treatment yet; capture the real handset result before continuing.

The journey must still stop before any irreversible or genuine booking confirmation unless the user explicitly approves that real booking action.

## Final specialist checkpoint

**Authoritative state:** PR #337 / `59119128ea0b288292622fd0b032058fcbd203ce` is the repaired production application runtime; CI #1074 is 701/0; Render `dep-da2udf95efls73ba76ng` is LIVE and healthy; universal welcome before first-contact branching is handset-proven for the controlled Juvan journey.

**Complete — do not redo:** #335 read-only diagnostic implementation, pre-repair Juvan ledger/marker read, root-cause trace, PR #337 routing repair, regression, CI, merge, production health/provider verification and first repaired handset greeting proof.

**Preserved authority:** PR #326 Meta integration, PR #332 stale booking-update suppression, PR #334 booking-update activation, #575/674 terminal historical suppression and all natural-delivery evidence gates remain unchanged.

**Unresolved gates:** post-send Juvan `v2` ledger timestamp was not separately re-read and is not required to classify the observed handset routing repair; booking-update/lifecycle customer delivery evidence remains natural-journey gated; historical attendance/#558 and GBP gates remain unchanged.

**Next owner/action:** Booking & Admin UX owns controlled client-menu/booking-path exploration with WhatsApp / Meta Integration observing transport behavior and CRM & Identity observing canonical identity/duplicate guards where relevant. Next handset step: **Browse treatments**, then stop for real handset evidence before any further selection.
