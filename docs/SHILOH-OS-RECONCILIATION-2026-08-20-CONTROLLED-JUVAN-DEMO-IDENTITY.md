# Shiloh OS — Controlled Juvan Demo Identity Reconciliation

Date: 2026-08-20  
Owning workstream: CRM & Identity  
Status: VERIFIED LIVE — foundation complete; genuine reset/re-registration not executed in this unit

## Authority consumed

This unit independently re-read current `main`, `docs/SHILOH-OS-MASTER-STATUS.md`, `docs/SHILOH-OS-PROJECT-TRACKER.md`, the then-latest `docs/SHILOH-OS-RECONCILIATION-2026-08-20-DUMMY-TEST-BOOKING-CLEANUP.md`, and `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`, then verified current Render/CRM/WhatsApp/Calendar evidence before implementation.

The implementation started from `main` `cd06715a420ca16f8e856f02fc4c767561295701`, which already preserved the completed Dummy Test reset/cleanup history and Juvan booking #585 evidence.

## Delivered application authority

PR **#364**, **Make Juvan the durable reusable demo identity**, merged as **`727b7c335ce9008daa9173206aa4abfd975decf9`**.

Final full non-mutating GitHub CI **#1158** passed **791 / 791**, with zero failures and zero skipped tests.

The accepted reusable-demo contract is now:

- **Juvan Botha is the only reusable controlled CRM demo identity.** Chenique and Dummy Test / CRM Dummy Test are retired from active reset eligibility. Their historical CRM, booking, Calendar and audit evidence is preserved.
- The reusable identity is not discovered by loose display-name matching. `controlled_demo_identities` stores one active `juvan_botha` row anchored to the exact normalized business-controlled WhatsApp/mobile identity and a nullable `current_client_id`.
- Production migration bootstrap derived the initial Juvan binding from the already-persisted, previously verified Juvan approval-policy/client relationship, then required one exact phone identity and zero shared-active-client conflict before accepting it.
- Reset authorization is exact Jean-Pierre business-admin authority only: Jean-Pierre, `business_admin`, `all_business`, `all_services`. Christel is no longer authorized at this CRM reset boundary.
- Reset preview resolves the durable current pointer and shows the actual CRM display name, CRM ID and controlled WhatsApp/mobile identity. UNBOUND state, pointer drift, extra phone identity or shared-active-client conflict fails closed before confirmation.
- Confirmation re-resolves and locks the demo row, current client, releasable contacts and Juvan approval policy, then repeats identity/shared-contact checks transactionally.
- Reset clears only bounded phone-linked transient state required for a genuinely fresh-client journey: booking intents, onboarding sessions, booking-policy acceptances, optional conversation-session state, optional legacy user-profile state, and phone-level universal-welcome delivery state.
- Reset releases only WhatsApp/mobile `client_contacts`, requires zero residual WhatsApp/mobile bindings before commit, archives/inactivates the old CRM client rather than deleting it, preserves appointments and existing CRM/audit history, and writes an atomic `admin.controlled_demo_reset` audit event.
- The same reset transaction sets both `controlled_demo_identities.current_client_id` and the Juvan booking-approval-policy `client_id` to `NULL`. A successful reset therefore leaves Juvan intentionally **UNBOUND** and cannot leave downstream approval policy pointing at an archived client.
- Fresh re-registration uses the normal real WhatsApp onboarding path. A database trigger recognizes only the exact controlled Juvan phone; while UNBOUND it permits rebind only to an active `whatsapp_onboarding` client and only when no other CRM binding exists. Contact attachment, controlled-demo `current_client_id`, approval-policy `client_id`, and `controlled_demo_identity.rebound` audit commit or roll back atomically.
- A read-only application resolver exposes only the current phone-anchored canonical Juvan client and fails closed on pointer, contact, policy or shared-active-client drift. Downstream Booking & Admin UX must consume this current controlled identity rather than any name match or historical client ID.

## Booking approval boundary deliberately preserved

This CRM unit does **not** implement the next approval-policy redesign. Production still uses the accepted current Juvan behavior from #350/#352: the current controlled Juvan canonical client routes to exact Jean-Pierre as sole approver.

Genuine booking **#585** remains accepted do-not-redo evidence for that prior/current behavior. No practitioner approval semantics were altered in #364.

The next Booking & Admin UX unit owns:

- JP-only **Reset Juvan** Admin-menu presentation;
- assigned practitioner = **Primary approver**;
- Jean-Pierre = **Backup approver**;
- exactly one atomic first decision wins;
- clear staff-facing Primary/Backup wording;
- normal client-facing booking outcome.

That unit must resolve the **current** controlled Juvan canonical client through the durable controlled identity/policy foundation, never `client_id=845` as a permanent constant and never “any client named Juvan Botha”.

## Production verification

Render auto-deploy **`dep-da3e2gjl550s7384d1l0`** reached **LIVE** on merge `727b7c335ce9008daa9173206aa4abfd975decf9`.

New-instance startup evidence verified:

- migration `065_juvan_botha_jp_booking_approval.sql`: already applied / checksum verified;
- migration `066_controlled_juvan_demo_identity.sql`: applied / checksum verified;
- migration `067_controlled_juvan_registration_rebind.sql`: applied / checksum verified;
- demo key: `juvan_botha`;
- binding state: **bound**;
- current canonical client ID: **845**;
- current display name: **Juvan Botha**;
- controlled phone suffix: **1564**;
- approver admin ID: **4**;
- approver name: **Jean-Pierre**;
- approver WhatsApp configured: true.

Google Calendar provider health passed. The new instance returned `/health` HTTP 200. No error/fatal logs were present in the verified startup window.

Existing WhatsApp provider checks remained non-mutating: staff-finalization, booking-update, cancellation-confirmation and booking-confirmation-v1 contracts were `APPROVED` / `already_exists` with `submitted=false`. Practitioner-approved rescheduling remained `featureEnabled=false`; this unit did not weaken or activate that provider gate.

The sanctioned Render read-only Postgres connector was attempted for direct post-deploy row verification but failed before SQL execution with the existing SSL/TLS negotiation error. No write-capable or credential workaround was used, and no direct SQL result is claimed from that failed query.

## Explicit non-events / evidence boundary

This unit did **not** perform or manufacture:

- a Juvan reset;
- an archive/contact release for Juvan client 845;
- a new Juvan registration;
- a controlled-demo rebind to a newer client;
- a synthetic webhook, booking, approval, Calendar event or handset journey.

Therefore production remains **BOUND to client 845** until a separately authorized genuine Juvan device reset/re-registration occurs. The code and database foundation are verified live; the future lifecycle transition is intentionally not claimed as handset-proven here.

## Preserved authority

Unchanged and preserved:

- current #318 booking entitlement;
- own-practitioner attendance/finalization authority and appointment #558 HOLD;
- Google Calendar fail-closed safeguards;
- genuine Juvan booking #585 evidence;
- practitioner-approved reschedule Meta/activation gate;
- completed Dummy Test reset, fresh-identity proof and booking/Calendar cleanup history;
- existing CRM ambiguity/shared-contact fail-closed rules;
- all other current provider and genuine-journey gates.

## Specialist checkpoint

**Completed / do not redo:** #364 implementation, 791/791 regression, merge `727b7c3...`, Render deploy `dep-da3e2gjl550s7384d1l0`, migrations 066/067, production BOUND verification to client 845 / phone suffix 1564 / JP admin 4. Do not execute a real Juvan reset merely to reproduce evidence.

**Next owner:** Shiloh OS — Booking & Admin UX.  
**Status:** PROCEED.  
**Reason:** CRM & Identity now owns and has completed the canonical reusable identity lifecycle foundation. Menu presentation and Primary/Backup booking-approval semantics are Booking & Admin UX behavior.
