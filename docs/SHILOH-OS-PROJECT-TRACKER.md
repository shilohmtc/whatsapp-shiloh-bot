# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the detailed current ledger. Historical pre-approval detail remains preserved at `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Resume the existing policy-accepted CRM Dummy Test booking by sending exactly `RETRY BOOKING` once, then stop at the pending hold before JP decides.**

Production runtime baseline: PR #203 squash merge `cb8091ef36e5805635a4c4e82b7d198454d2c451`; Render deploy `dep-d9vdt1jbc2fs73cbjtk0` reached live.

### Why PR #203 was required

Real WhatsApp on 2026-08-14 reached MediHeel/Christel/15 Aug 2026/10:45, recorded Booking Policy acceptance, then safely failed the final appointment write without claiming a booking. Repository truth proved the mismatch: Jean-Pierre's authoritative admin migration says he is a project admin and `staff_id` may remain NULL, while the Dummy Test approval trigger incorrectly required JP to join through clinic `staff`.

PR #203 fixes the model without inventing a staff record:
- normal practitioner approvals continue to use `approver_staff_id`;
- Dummy Test uses `approver_admin_id` → the unique qualifying Jean-Pierre `staff_admin_accounts.id`;
- JP must still be active `business_admin`, `all_business`, `all_services`, with a WhatsApp identity;
- ambiguity/missing JP authority fails closed;
- hold remains indefinite and final confirmation remains blocked until approval.

Self-test-first evidence: regression-only commit `564a143363d20c3ff089b4f3b98dc4b331eba3aa` failed CI #556; final head `aad08a5c672083004e1511d5c5af44b809d61505` passed CI #559; merge/deploy reached live.

## Current accepted client evidence

- ✅ Exact `Lymphatic drainage treatments` phrase renders CRM-backed treatment rows.
- ✅ Booking family menu presentation code is production-live.
- ✅ Elim MediHeel list is real-accepted: two existing Medi-Heel treatments rendered with duration/pricing.
- ✅ MediHeel practitioner truth is **Christel only**; selecting the With Gel Toes treatment showed `Practitioner: Christel`.
- ✅ Saturday 15 August 2026 produced real Christel availability; 10:45–12:30 slots rendered cleanly.
- ✅ Selected 10:45 summary showed correct service/practitioner/date/time and `Nothing is booked yet`.
- ✅ Policy version `2026-08-11-v1` rendered and explicit `I AGREE` was recorded.
- 🔵 Final held appointment still needs post-PR-#203 acceptance via the existing retry path.

## Approval policy live

- **CRM Dummy Test → JP/Jean-Pierre admin account alone may approve/decline.** JP does not need a clinic `staff_id`.
- Ordinary Marietjie booking → Marietjie alone.
- Ordinary Christel booking → Christel alone.
- Ordinary Abigail booking → Abigail or Christel, first valid decision authoritative.
- Pending hold has no automatic expiry and blocks the slot until explicit approval/decline.
- Final client confirmation remains fail-closed until approval.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-MEDIHEEL | Elim MediHeel presentation/Christel routing | 🟢 REAL-ACCEPTED | Two treatments shown; With Gel Toes resolved Christel. Do not repeat solely for proof. |
| C1-AVAIL | New-booking availability presentation | 🟢 REAL-ACCEPTED IN CURRENT JOURNEY | Christel slots 10:45–12:30 rendered cleanly. |
| C1-POLICY | Booking Policy acceptance | 🟢 REAL-ACCEPTED | `2026-08-11-v1`, explicit `I AGREE` recorded. |
| C1-WRITE | Final booking write after policy | 🟡 DEFECT REPAIRED / REAL RETRY REQUIRED | Send `RETRY BOOKING` once on the existing accepted intent. |
| C1-APP-DUMMY | Dummy Test → JP approval | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | After retry succeeds, prove JP gets Approve/Decline and Christel is not required approver. |
| C1-HOLD | Pending slot/no-expiry | 🔵 REAL ACCEPTANCE REQUIRED | Verify exact slot is unavailable and remains held until explicit JP decision. |
| C1-CONFIRM | JP approval → final confirmation | 🔵 REAL ACCEPTANCE REQUIRED | Approve only after pending evidence is captured. |
| C1-CAL | Shared + Christel Calendar/mobile presentation | 🟠 WAITING FOR CURRENT GENUINE BOOKING | Verify on the same held/approved booking. |
| C1-APP-ORD | Ordinary approval rules | 🔵 LIVE / FOLLOW-UP REAL ACCEPTANCE | Marietjie self; Christel self; Abigail or Christel first decision. |
| C1-RETURN | Registered-client return recognition | ⚪ READY / IN-JOURNEY | Observe naturally; no redundant registration. |
| C1-TPL | Booking confirmation Meta template | 🟠 WAITING | Preserve plain-text path until exact provider Active/APPROVED evidence. |
| A1 | Six known attendance finalizations | 🟠 WAITING | Genuine Completed/No-show truth only; never infer. |
| A2 | Finalization/earnings UX | ⚪ READY | Remaining authorized-account acceptance after client gate. |
| B1 | Remaining Admin route acceptance | ⚪ READY | Only genuinely unverified paths after client gate. |
| D0 | Customer-care foundation | 🟢 VERIFIED | Provider/lifecycle acceptance remains evidence-gated. |
| E1 | Ozow | 🟠 WAITING | Merchant configuration + explicit business rules. |
| F3 | Instagram ownership/connection | ⚪ READY | Verify existing `@shiloh_massage_studio`; never create duplicate. |
| PRIV | Destructive privacy execution | 🟠 WAITING / FAIL-CLOSED | Legal/owner authority + sufficient evidence required. |

## Exact next test

From the **same CRM Dummy Test WhatsApp conversation**, send exactly:

`RETRY BOOKING`

Do not restart the service/date/time journey and do not recreate #561. The existing accepted intent should re-run final CRM, availability, schedule and Calendar checks. If the 10:45 slot is still genuinely available, expected result is one canonical appointment request held pending approval—not final confirmation.

When the pending/held response appears:
1. **Stop before JP presses anything.**
2. Capture Dummy Test's exact held/not-confirmed message.
3. Capture JP's actionable Approve/Decline request.
4. Verify the same Christel 10:45 slot is no longer offered to another client.
5. Only after those checks should JP approve; then verify final client confirmation plus shared and Christel Calendar mirrors.
6. Test JP decline later on a separate genuine request.

If `RETRY BOOKING` fails again, do not repeatedly retry; preserve the exact message and inspect production evidence before another state transition.

## Guardrails

- GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence remain authoritative.
- Current MediHeel truth: **Christel only**.
- Current Dummy Test approval truth: **Jean-Pierre admin account only; no clinic staff record is required or to be invented.**
- PR #199 Marietjie MediHeel assignment is superseded.
- Do not recreate cancelled appointment #561.
- Do not infer provider/template/attendance outcomes.
- Dummy Test/JP ambiguity must fail closed.
- Direct Render Postgres SSL connector failure is a tooling limitation, not CRM truth.
- Human acceptance is for final transport/live-state proof; deterministic defects should be caught and retained as regressions.

## Latest reconciliation — held appointment #564 / PR #205

**This section supersedes the earlier `RETRY BOOKING` next-step text above.** Real WhatsApp evidence now proves the retry succeeded and created canonical held appointment **#564**. Dummy Test saw `Booking request received — #564`, explicit held-slot wording, `there is no automatic expiry`, and `Your appointment is not yet confirmed`. Therefore C1-WRITE is now 🟢 REAL-ACCEPTED and the basic pending-hold/no-expiry client contract is real-observed.

The same screenshot exposed a deterministic copy defect: it said the selected time was being held `while Christel reviews the request`, even though the controlled Dummy Test authority contract requires **JP alone**. The underlying runtime source proved this was presentation logic: `bookingPolicy.stageCreatedBookingForApproval()` blindly interpolated the assigned practitioner snapshot into client copy after approval routing had already resolved the real approver.

PR #205 repairs only that presentation boundary. Client pending copy now derives the reviewer from `requestPractitionerApproval()`'s resolved `approver` identity, with a safe `an authorized approver` fallback, and the no-expiry sentence is authority-neutral rather than saying `the practitioner`. Approval authorization, held appointment #564, practitioner assignment, and no-expiry semantics are unchanged.

Self-test-first evidence for PR #205: regression commit `e340bbe7752e2954e32fa4476f2e4f63b4370675` failed CI #563 before implementation. Runtime commit `01c15f8e0657a9524f4bfb0f4cd9aacb3d783ed3` then exposed one overly literal new assertion in CI #564; runtime behavior itself already used safe optional chaining. Final head `63048e1ac17db084d1dd3e0975f28cde57699cb2` passed CI #565. Squash merge `0fe9df17c32ba8503124a0f9e09936bdda612ab4`; Render deploy `dep-d9ve1glbedkc7382rng0` is live.

### Exact continuation now

Do **not** retry or create another booking: appointment **#564 is already held**. Do **not** let JP approve or decline yet. The next required real evidence is JP's WhatsApp side of this same request: capture whether JP received the actionable **Approve / Decline** controls for appointment #564. This will prove Meta delivery plus sole-JP routing. If JP received nothing, preserve #564 unchanged and inspect notification evidence before any further state transition. After JP receipt is proven, verify the same Christel/time slot is excluded while pending; only then may JP approve and unlock final client confirmation/calendar verification. JP decline remains a later separate genuine request.

## Latest reconciliation — #564 fully approved / PR #207 confirmation UX

**This section supersedes all earlier #564 continuation instructions above.** Real production acceptance on 2026-08-14 now proves the complete controlled Dummy Test approval chain for appointment **#564**:
- JP received the correct actionable Approve / Decline request naming Dummy Test, the MediHeel treatment, Christel, Sat 15 Aug 2026 10:45, and explicitly stating JP is the sole required approver.
- While #564 remained pending, a fresh authoritative availability check no longer offered the held 10:45 slot; the visible list had advanced to later availability (12:15 and 12:30), proving pending-slot exclusion.
- JP approved #564 and received `Approved by Jean-Pierre. Appointment #564 is confirmed and the client confirmation has been sent.`
- Dummy Test received the final confirmed appointment for the correct service, Christel, date and 10:45–12:15 time.
- Google Calendar independently showed the same appointment on **Shiloh — Bookings**, with CRM appointment #564, client Dummy Test, **Mobile: 27716742646**, service, practitioner Christel and source `shiloh_client_whatsapp`.
- The visible calendar architecture has no separate `Shiloh — Christel` calendar; Christel's booking is correctly represented on shared `Shiloh — Bookings`. Do not invent a missing Christel calendar requirement.

Therefore C1-WRITE, C1-APP-DUMMY approval path, C1-HOLD slot exclusion/no-expiry behavior, C1-CONFIRM and C1-CAL for this genuine booking are 🟢 REAL-ACCEPTED. A separate genuine JP-decline case remains open; ordinary-client approval acceptance also remains open.

PR **#207** (`Polish booking confirmation actions`) is production-live as squash merge `5c83b8f406f1cfce62175f7dc80904faa7cf6d56`, Render deploy `dep-d9veettbedkc73837hkg`. Regression-only commit `25842f425243332355a0cc7066f208da866e63b9` failed CI #573 before implementation; final implementation commit `65afe7fd35d54f1614e3bf224a994d32d13f1321` passed CI #576. Active plain-text confirmation UX now:
- keeps the concise confirmed-booking summary and `We look forward to seeing you. 🌿`;
- removes raw calendar URLs from the visible summary and sends **Google Calendar** plus **Apple / Outlook** as WhatsApp CTA URL buttons;
- sends **Reschedule** and **Cancel booking** as deterministic WhatsApp reply buttons with stable IDs that normalize into the existing canonical appointment-change commands;
- retains typed `RESCHEDULE` / `CANCEL` fallback commands;
- treats supplemental action delivery as independently logged so an already-delivered confirmation is not duplicated if a button send fails.

Calendar client-mobile retention was already a permanent regression before PR #207 and real #564 proves it in production. Do not display the client's own phone back in the WhatsApp confirmation merely to satisfy staff calendar needs.

### Google Contacts status

🟠 **NOT CURRENTLY SYNCHRONIZED.** Connected Google Contacts search did not find Dummy Test, and repository inspection found no Google Contacts / People API client-sync implementation. Shiloh CRM remains canonical. Do not claim that existing or new CRM clients are automatically captured in Google Contacts. If the clinic elects to add this, treat it as a separate controlled one-way CRM→Google Contacts workstream with normalized-phone deduplication, CRM client identity linkage, explicit existing-client backfill, incremental new-client sync, and privacy/deletion rules; Google Contacts must not silently become CRM authority.

### Exact next Product-Critical work

Appointment #564 is confirmed; do not recreate it and never recreate cancelled #561. The next client-facing acceptance can use #564 to test **Reschedule** / **Cancel booking** entry behavior after the new buttons are real-observed, but do not cancel #564 unless deliberately choosing that lifecycle test. Before destructive state change, first confirm the newly deployed confirmation-action UI on a genuine future confirmation or another safe controlled path. A separate genuine Dummy Test request is still required for the JP-decline branch. Ordinary-client approval rules (Marietjie self; Christel self; Abigail or Christel first valid decision) remain live but real-acceptance pending. Preserve all unrelated WAITING items fail-closed.
