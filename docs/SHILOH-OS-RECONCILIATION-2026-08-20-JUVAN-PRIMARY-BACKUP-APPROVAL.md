# Shiloh OS — Reconciliation — Juvan Primary / Backup booking approval

Date: 2026-08-20
Owning workstream: Booking & Admin UX
Status: VERIFIED LIVE / APPLICATION-RUNTIME PROVEN / NO MANUFACTURED JOURNEY

## Scope

Complete the Booking & Admin UX unit handed off from CRM & Identity after PR #364 established the durable phone-anchored controlled Juvan identity lifecycle.

This unit changes operational presentation and booking-approval authority only:

- expose **Reset Juvan** in the Admin UI only to the exact authorized Jean-Pierre business-admin experience while delegating to the existing #364 reset preview/confirmation contract;
- make the assigned practitioner the **Primary approver** for a current controlled Juvan booking;
- make Jean-Pierre the **Backup approver**;
- make exactly one valid atomic first decision authoritative;
- preserve current-client identity resolution, booking/Calendar/client-notification/audit safeguards and all unrelated gates.

No genuine Juvan reset, contact release, re-registration, booking, approval/decline, handset journey or Calendar proof was manufactured.

## Authority consumed

Implementation began only after independently re-reading current GitHub `main`, Master, Tracker, `docs/SHILOH-OS-RECONCILIATION-2026-08-20-CONTROLLED-JUVAN-DEMO-IDENTITY.md` and Engineering Governance and verifying current Render startup evidence.

The durable identity contract from #364 remains authoritative:

- `controlled_demo_identities.demo_key='juvan_botha'` is anchored to the exact normalized business-controlled WhatsApp/mobile identity;
- `current_client_id` is nullable and means the **current** canonical controlled Juvan client while BOUND;
- the Juvan approval-policy client pointer must move atomically with that current pointer;
- a display name is not an identity key;
- historical client 845 is not a permanent Juvan identifier;
- a future reset is exact Jean-Pierre business-admin only, intentionally leaves the controlled identity and approval-policy client pointer UNBOUND, and a normal exact-phone WhatsApp onboarding later performs the atomic rebind.

Pre-implementation production evidence still showed BOUND client 845, controlled phone suffix 1564 and Jean-Pierre admin 4. This is current state, not a permanent identity rule.

## Implementation

PR **#366 — Add Juvan Primary Backup booking approval** merged as:

`53b5e0c4027f9910291f75c05ec13d9c55528118`

### JP-only Reset Juvan presentation

`adminInteractiveMenu` now removes any stale Reset Juvan menu line and re-adds the action only for the exact Jean-Pierre business-admin presentation contract. Christel does not receive the Reset Juvan menu item.

The action still delegates to `processAdminTestClientResetMessage` with the established #364 reset command. No reset transaction, target resolution, preview, confirmation, shared-active-contact guard, archive/release/unbind or rebind logic is duplicated in the menu layer.

A crafted/stale stable action ID is still revalidated against the current role-scoped menu before dispatch, and the underlying #364 reset handler retains exact server-side Jean-Pierre authority.

### Current controlled Juvan approval identity

Runtime approval resolution consumes `resolveCurrentControlledDemoClient(db)` and special-cases a booking only when `appointment.client_id` equals the **currently BOUND** controlled Juvan pointer.

The implementation does **not**:

- hard-code `client_id=845`;
- select “any client named Juvan Botha”;
- broaden the controlled identity to display-name matching.

If the controlled identity is UNBOUND or client/contact/policy/shared-active truth drifts, the controlled approval path fails closed.

### Primary / Backup hold contract

Migration **068 `juvan_primary_backup_booking_approval.sql`** adds:

- `approval_mode`, with controlled mode `controlled_juvan_primary_backup`;
- `backup_notified_at`, so Primary and Backup delivery can be independently idempotent.

For a current controlled Juvan client booking:

- assigned position-1 active practitioner becomes `approver_staff_id` = **Primary**;
- exact current Jean-Pierre policy admin becomes `approver_admin_id` = **Backup**;
- no observer is assigned;
- the Primary must have an active Admin WhatsApp identity;
- the exact controlled phone, current-client pointer, policy pointer, JP authority and shared-active-contact state are all guarded.

The runtime `ensureBookingApprovalInfrastructure` recreates the same trigger contract, so a restart cannot silently restore the superseded JP-only behavior.

Migration 068 upgrades only a still-`pending` current-controlled-Juvan approval hold. Terminal historical decisions are not rewritten, so genuine booking #585 remains intact as historical proof of the former JP-sole behavior.

### Approval delivery and staff presentation

The existing approved `shiloh_booking_approval_request_v1` transport remains unchanged. No Meta template was submitted or modified.

For a controlled Juvan request, Shiloh sends the existing request separately to:

- the assigned Primary practitioner Admin identity;
- Jean-Pierre Backup.

The staff-facing appointment presentation identifies:

- client;
- treatment/service;
- assigned practitioner;
- appointment time;
- **Primary** approver;
- **Backup** approver;
- the recipient's own role.

Primary delivery is tracked with `approver_notified_at`; Backup delivery uses `backup_notified_at`. The Pending approvals UX also shows Primary, Backup and the current viewer role and revalidates current truth before refreshing a missing delivery. Existing delivered requests are not intentionally duplicated by the refresh path.

### Atomic first-decision-wins

A controlled decision transaction locks the controlled demo identity, approval row and appointment before authorizing the decision.

Under those locks Shiloh re-resolves:

- the current controlled Juvan canonical client;
- the current position-1 assigned practitioner;
- the current Jean-Pierre Backup policy authority;
- stored approval-role alignment.

Only the current Primary practitioner Admin identity or current Jean-Pierre Backup may decide. The terminal transition uses a `status='pending'` conditional update. The first valid decision records the role in durable decision/audit evidence; a later authorized decision sees the committed terminal state and receives an explicit already-decided response naming the winning approver/role. No second authoritative decision is written.

### Client-facing outcome and existing safeguards

Approval still calls the established idempotent `sendCustomerBookingConfirmationForAppointment` after the decision commits. This preserves the durable one-confirmation claim and prevents a premature final confirmation while approval is pending.

Decline still:

- commits the approval decline and canonical appointment cancellation;
- writes appointment status history and CRM audit evidence;
- releases shared and practitioner Google Calendar mirrors through the established cancellation paths;
- uses the existing client decline notification contract;
- informs the other authorized approver that the first decision is final.

Ordinary non-controlled booking approval behavior remains covered by the full regression suite.

## Regression

Initial CI **#1162** exposed four static compatibility-test failures caused by formatting-sensitive assertions around existing resend/status-write source text. No production mutation occurred and #366 was not merged.

The repair kept the underlying safety assertions intact and made those older tests whitespace-tolerant; it did not remove pending-only, exact-template, status-transition, notification, Calendar or authorization expectations.

Final CI **#1164** passed the complete non-mutating repository suite:

- tests: **796**
- passed: **796**
- failed: **0**
- skipped: **0**

The green suite includes the new controlled-Juvan identity/Primary/Backup/locking/menu regression plus all existing booking, CRM, Calendar, attendance, Dummy Test, notification, provider-contract and dark-reschedule safeguards.

## Production verification

Render auto-deploy **`dep-da3eiegae00c7380pa8g`** reached **LIVE** on exact #366 merge `53b5e0c4027f9910291f75c05ec13d9c55528118` in confirmed workspace **My Workspace**.

New-instance startup evidence established:

- migration `068_juvan_primary_backup_booking_approval.sql`: `applied=true`, `checksumVerified=true`;
- prior Juvan migrations 065/066/067 remained checksum-valid;
- controlled identity state: **BOUND**;
- current canonical pointer at verification time: client **845**;
- display: `Juvan Botha`;
- controlled phone suffix: **1564**;
- Jean-Pierre policy admin: **4**;
- runtime approval contract: `assigned_practitioner_primary_jean_pierre_backup_first_decision_wins`;
- Jean-Pierre WhatsApp authority configured;
- Google Calendar provider health check passed;
- practitioner-approved reschedule schema remained `featureEnabled=false`.

These startup values are current production evidence only. Client 845 must not be treated as a permanent Juvan identifier.

No new Juvan appointment or approval was created to prove behavior. The application/runtime/migration boundary is verified live; a future natural genuine controlled-Juvan booking may provide handset-level Primary/Backup evidence without manufacturing business data.

## Preserved authority

This unit does not alter:

- #318 Admin booking entitlement;
- Block time authority;
- own-practitioner attendance/finalization authority;
- appointment #558 HOLD;
- Google Calendar fail-closed booking safeguards;
- genuine #585 historical evidence;
- completed Dummy Test reset/cleanup evidence;
- client-welcome repair;
- booking-update activation/stale suppression;
- CRM ambiguity/shared-contact fail-closed rules;
- booking confirmation v1/v2 provider state;
- practitioner-approved client reschedule provider gate.

`WHATSAPP_RESCHEDULE_APPROVAL_ENABLED` remains false. No reschedule journey was manufactured and no Meta/provider submission was made.

## Reconciliation result

The Booking & Admin UX implementation unit is **VERIFIED LIVE** at the application/runtime boundary:

- Reset Juvan presentation is JP-only and delegates to #364;
- current controlled Juvan identity remains phone/pointer anchored;
- assigned practitioner is Primary;
- Jean-Pierre is Backup;
- one atomic first decision wins;
- staff presentation exposes roles and appointment context;
- client confirmation/cancellation, Calendar and audit safeguards remain intact.

A genuine reset/re-registration or booking-approval handset journey remains a future natural/explicitly authorized evidence boundary and must not be manufactured merely to reproduce proof.
