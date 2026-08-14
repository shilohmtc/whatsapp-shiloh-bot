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
