# Shiloh OS — Reconciliation — CRM Dummy Test number reassignment completion

Date: 2026-08-20
Owning workstream: Production / DevOps
Status: VERIFIED LIVE / GENUINE RESET AND FRESH-IDENTITY PROOF COMPLETE

## Scope

Complete the controlled CRM Dummy Test number-reassignment delivery boundary from the merged #338 reset safeguards through the genuine privileged WhatsApp reset and the first real message from the reassigned number. This reconciliation records only evidence actually established in GitHub, Render production and the supplied genuine handset journey. It does not manufacture a booking, appointment, CRM row, provider event or WhatsApp delivery.

## Repository and runtime lineage

- PR #338 merged the guarded CRM Dummy Test / Dummy Test reassignment workflow as merge commit `31d49d27a74c570fb439bee62c9647275bf97f6b`.
- The accepted reset contract resolves only Chenique, Juvan or Dummy Test / CRM Dummy Test; permits only Christel owner/business-admin or Jean-Pierre business-admin with the required business scopes; previews the actual matched CRM display name, CRM ID and WhatsApp/mobile identities; blocks shared-active-client identity before confirmation; re-resolves and locks the target on confirmation; repeats the shared-active-client guard in the transaction; clears temporary phone-bound booking/onboarding/policy/conversation/profile state; releases only WhatsApp/mobile bindings; verifies no such binding remains; archives rather than deletes the CRM client; and preserves appointment/audit history.
- A genuine first confirmation tap exposed a production defect: the structured Meta button control token reached the English-language classifier before the privileged reset handler and was rejected. The reset transaction did not run and no CRM mutation occurred on that failed attempt.
- PR #358, **Fix CRM reset interactive language gate**, changed only the language boundary so the six exact approved reset Confirm/Cancel control tokens bypass natural-language classification. Arbitrary machine-like text and ordinary non-English free text remain subject to the English-only guard. The destructive reset transaction itself was unchanged.
- PR #358 CI run #1139 completed **773 passed / 0 failed**, including the new structured-interaction language-gate regressions and all existing CRM/reset, booking, Calendar, provider, attendance and reschedule safeguards.
- PR #358 merged as `287579510e566d9b629df51b91c4b716b5d6a4e1`.
- Render auto-deploy `dep-da3cu21srm7s73961ir0` reached **LIVE** on that exact commit. No manual deploy and no Render environment/configuration change was used for this repair or verification.

## Post-deploy health and provider continuity

On the #358 instance:

- `/health` returned HTTP 200 repeatedly.
- Google Calendar provider health check passed.
- Booking-update and cancellation templates remained `submitted=false`, `reason=already_exists`, `providerStatus=APPROVED`.
- Staff finalization, staff finalization actions and booking confirmation v1 remained `submitted=false`, `reason=already_exists`, `providerStatus=APPROVED`.
- Existing Christel catalogue, Juvan policy, package, attendance/finalization and reschedule schema startup guards remained intact.
- No startup error/fatal regression was established.

## Genuine guarded preview

After #358 was LIVE, a fresh authorized business-admin WhatsApp request generated the guarded preview at approximately 11:56 SAST. The preview displayed:

- CRM profile: **Dummy Test**
- CRM ID: **#835**
- WhatsApp/mobile identity to release: **WhatsApp +27 71 674 2646 — primary**

The live application can render this Confirm/Cancel card only after resolving exactly one active approved test-client target and completing the pre-confirm shared-active-CRM identity check with no conflict. The confirmation path independently repeats the same conflict check after re-resolution/locking inside the database transaction.

The external Render read-only Postgres connector remained unusable because its connection failed before SQL execution with the known SSL/TLS requirement. No CRM row truth is inferred from that failed connector and no write-capable workaround was used.

## Genuine reset commit

The authorized operator pressed **Confirm reset** on the fresh repaired preview.

Production evidence:

- At **11:59:23.746 SAST**, the LIVE #358 instance received the genuine `interactive` inbound from the authorized admin handset.
- At **11:59:24.417 SAST**, Shiloh sent the reset-complete response and the webhook completed HTTP 200.
- The reset-complete reply is generated only after the reset database transaction has successfully executed `COMMIT`.

The committed transaction therefore establishes the designed postconditions for CRM #835:

- the old Dummy Test CRM profile is archived/inactive rather than deleted;
- exactly **1** WhatsApp/mobile contact record was released from that client;
- booking-intent, onboarding and booking-policy state for the released phone was deleted;
- optional conversation-session and legacy user-profile phone state was cleared where those tables exist;
- the postcondition verified zero remaining WhatsApp/mobile contact rows for CRM #835 before commit;
- appointments were not deleted or rewritten by this reset path;
- the CRM client record and historical audit/appointment evidence were preserved;
- an `admin.test_client_reset` CRM audit event was inserted in the same transaction;
- no unrelated active CRM client could lose a phone/contact binding because deletion is scoped to the locked target client and both pre-confirm and in-transaction shared-active-client guards must pass.

The handset success response matched those committed semantics: old CRM profile #835 archived, one WhatsApp/mobile contact released, appointment/audit history preserved, and temporary conversation/profile state cleared.

## Genuine post-reset fresh identity proof

No booking was created for proof.

From the legitimately reassigned **+27 71 674 2646** handset, the real user sent `Hi`.

Production evidence:

- At **12:01:27.486 SAST**, the LIVE #358 instance received a genuine text inbound from masked suffix `2646`.
- At **12:01:28.537 SAST**, Shiloh sent the response and completed the webhook HTTP 200.
- The handset response was the unregistered/new-client branch: universal Shiloh welcome followed by **“It looks like you’re not registered with us yet”** and a request for first name, surname, date of birth and gender.
- The response contained no inherited Dummy Test name, CRM #835 identity, booking intent, prior onboarding continuation, prior policy state or prior conversation-session context.

Together with the committed reset transaction, this is the required genuine reassignment proof: the released number is now treated as a brand-new client identity.

## Preserved fail-closed authority

This unit does not reopen or supersede unrelated verified state. Preserve in particular:

- client-welcome repair and prior Juvan handset evidence;
- booking-update production activation and #575 / audit 674 stale suppression;
- Christel catalogue correction;
- own-practitioner attendance authority;
- appointment #558 HOLD;
- booking-confirmation v1 live state and v2 provider gate;
- practitioner-approved reschedule provider/activation gates;
- Google Calendar fail-closed provider guard;
- all existing privacy, GBP, Goldie-description and other external gates.

## Reconciliation result

CRM Dummy Test number reassignment is **complete and handset-proven**. Do not reset CRM #835 again or replay the reassigned number merely to reproduce evidence.

Current accepted runtime application lineage is PR #358 / `287579510e566d9b629df51b91c4b716b5d6a4e1`, with #338 remaining the durable reset transaction contract and #358 the narrow structured-interaction language-boundary repair.

No further specialist action is required for this controlled unit.