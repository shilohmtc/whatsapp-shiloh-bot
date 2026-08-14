# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the current detailed ledger. The pre-approval tracker is preserved at `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Real Client Perspective acceptance: first confirm Elim MediHeel family presentation after PR #199, then resume the held-booking approval lifecycle.**

Production runtime baseline: PR #199 squash merge `0562ca279304ab8fd92b7bc2cb69bea758ba6f3e`; Render deploy `dep-d9vdeonavr4c73ag8e30` reached live. Startup logged `Marietjie pedicure ownership verified` with `repaired: true`, `serviceCount: 2`, `marietjieId: 6`.

Pre-booking routing/presentation state:
- PR #194 fixed the English-language false positive on `Lymphatic drainage treatments`; real WhatsApp proved the rejection disappeared.
- PR #195 fixed the subsequent generic service-verification fallthrough. Regression-only commit `b8de7a6d7757661858ad7e51c7c296ef54c4e68a` failed CI #517; final head `c4343e07ec9cb99fb4ae6ea86136b4a7f385e934` passed CI #518; runtime/deploy reached live.
- **Real WhatsApp proves the exact Lymphatic phrase enters the CRM-backed treatment list.** Observed rows: `Facial Lymphatic Drainage Massage` • 60 min • R450 and `Lymphatic Drainage Reset Package` • 90 min • R500. C1-FAMILY-NL is closed; do not repeat solely for proof.
- PR #197 polished the actual booking-entry `Choose service` surface: visible rows are `Beauty & Aesthetics`, `Massage Treatments`, `Lymphatic Drainage`, and `Elim MediHeel Pedicures`, with `View ... treatments` descriptions. Stable `client_family_*` IDs are unchanged.
- **PR #199 resolved the Elim MediHeel zero-row root cause.** Existing active Medi-Heel services were present in the imported CRM catalogue, but their historical staff-service mappings were Abigail/Christel while the current client family is Marietjie-only; migration 026 had omitted `Pedicures & Foot Care`. PR #199 repairs only existing active pedicure/MediHeel/Elim ownership to unique active Marietjie, fail-closed and idempotently. It does not create/activate/rename/reprice services.
- PR #199 self-test-first evidence: regression-only commit `1144d92441de1563b2ff9b430edae87672569673` failed CI #536 before implementation; final head `b362c1391cb7d17f27ba9da239274604963f619e` passed CI #541; runtime/deploy reached live and startup proved two mappings repaired.

Approval policy live:
- **CRM Dummy Test booking → JP/Jean-Pierre alone may approve/decline.** Unique Dummy Test and qualifying JP authority are required; ambiguity fails closed.
- Ordinary Marietjie booking → Marietjie alone.
- Ordinary Christel booking → Christel alone.
- Ordinary Abigail booking → Abigail or Christel, first explicit decision authoritative.
- Pending hold has no automatic expiry and blocks the slot until explicit approval/decline.
- Final client confirmation remains fail-closed until approval.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-FAMILY-NL | Natural treatment-family routing | 🟢 REAL-ACCEPTED | Exact Lymphatic phrase rendered authoritative treatment list. Do not repeat. |
| C1-FAMILY-MENU | Booking-entry family menu presentation | 🔵 PRODUCTION-LIVE / REAL ACCEPTANCE PENDING | Observe naturally; menu copy is live. |
| C1-MEDIHEEL | Elim MediHeel ownership/presentation | 🔵 REPAIRED / ONE REAL CHECK REQUIRED | Select Elim MediHeel once; expected existing active Marietjie treatment list. Do not seed services. |
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | After MediHeel check, continue Dummy Test to future booking and stop at pending approval. Do not recreate #561. |
| C1-APP-DUMMY | Dummy Test → JP approval override | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | Prove JP receives Approve/Decline and assigned practitioner is not required approver. No expiry. |
| C1-APP-ORD | Ordinary client approval rules | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | Marietjie self; Christel self; Abigail or Christel first decision. |
| C1-RETURN | Registered-client return recognition | ⚪ READY / IN-JOURNEY | Observe naturally without redundant registration. |
| C1-CAL | Calendar/mobile presentation | 🟠 WAITING FOR GENUINE BOOKING | Verify on same next genuine future booking. |
| C1-TPL | Booking confirmation Meta template | 🟠 WAITING | Preserve plain-text path until exact Meta Active/APPROVED evidence. |
| A1 | Six known attendance finalizations | 🟠 WAITING | Genuine Completed/No-show truth only; never infer. |
| A2 | Finalization/earnings UX acceptance | ⚪ READY | Remaining authorized-account acceptance after client-critical gate. |
| B1 | Remaining Admin route acceptance | ⚪ READY | Only genuinely unverified role-specific paths after client gate. |
| D0 | Customer-care foundation | 🟢 VERIFIED | Real lifecycle/provider acceptance remains evidence-gated. |
| E1 | Ozow activation | 🟠 WAITING | Merchant configuration + explicit business rules. |
| F3 | Instagram ownership/connection | ⚪ READY | Verify existing `@shiloh_massage_studio`; never create duplicate by assumption. |
| PRIV | Destructive privacy execution | 🟠 WAITING / FAIL-CLOSED | Requires legal/owner authority and sufficient evidence. |

## Client acceptance board

| Item | State | Required evidence |
|---|---|---|
| First-time Dummy Test registration | 🟢 VERIFIED | Historical real WhatsApp evidence retained; do not redo. |
| Lymphatic language-guard false positive | 🟢 REAL-ACCEPTED FIXED | Real post-PR-#194 WhatsApp evidence. |
| Natural Lymphatic family routing | 🟢 REAL-ACCEPTED | Exact phrase rendered two CRM-backed Lymphatic treatment rows with duration/pricing. |
| Booking-entry family menu presentation | 🔵 PRODUCTION-LIVE | PR #197 CI/deploy verified; observe copy naturally through real WhatsApp. |
| Elim MediHeel Pedicures ownership | 🟢 PRODUCTION-REPAIRED | Startup proved two existing active service mappings repaired to Marietjie; no catalogue rows created. |
| Elim MediHeel Pedicures WhatsApp list | 🔵 REAL ACCEPTANCE REQUIRED | Re-open/select family once and confirm treatment list renders through Meta. |
| Beauty & Aesthetics treatment-list presentation | 🟢 VERIFIED | PR #172 + real WhatsApp acceptance. |
| HIFU → Marietjie eligibility/routing | 🟢 VERIFIED | Historical real WhatsApp evidence. |
| Authoritative availability | 🟢 VERIFIED | SQL repair + real acceptance retained. |
| New-booking availability client copy | 🟢 PRODUCTION-LIVE | Exercise naturally in next journey. |
| Appointment #561 booking/reschedule/cancellation | 🟢 VERIFIED / CANCELLED | Do not recreate #561. |
| New Dummy Test booking pending-approval copy | 🔵 REAL ACCEPTANCE REQUIRED | Client must see request received/time held/not yet confirmed. |
| Pending slot exclusion | 🔵 REAL ACCEPTANCE REQUIRED | Same practitioner/time must not appear available while pending. |
| Hold no-expiry behavior | 🔵 REAL ACCEPTANCE REQUIRED | Hold persists until explicit JP decision. |
| JP approval request for Dummy Test | 🔵 REAL ACCEPTANCE REQUIRED | JP receives actionable Approve/Decline as sole required approver. |
| Practitioner non-authority for Dummy Test | 🔵 REAL ACCEPTANCE REQUIRED | Assigned practitioner must not be required decision-maker. |
| JP approval → final client confirmation | 🔵 REAL ACCEPTANCE REQUIRED | Final confirmation/calendar links only after JP approval. |
| JP decline → release | ⚪ FOLLOW-UP TEST | Separate genuine Dummy Test request later. |
| Ordinary Abigail/Christel approval | ⚪ FOLLOW-UP REAL ACCEPTANCE | Normal client booking after Dummy Test path. |
| Calendar client-mobile metadata | 🟠 WAITING FOR NEXT GENUINE BOOKING | Check shared + practitioner Calendar on same genuine booking. |
| Registered-client return | ⚪ READY / IN-JOURNEY | Confirm recognition without redundant registration. |

## Verification-quality rule

- CI/unit/source-contract evidence is necessary but broad real WhatsApp acceptance requires actual transport/human observation.
- Every deterministic client-visible production defect found manually should become a permanent regression before repair where feasible.
- Human real-WhatsApp acceptance validates Meta transport, live CRM state and presentation.
- On high-churn files, preserve current `main` and apply the smallest possible delta; PR #197 demonstrated CI correctly catches accidental whole-file regressions before merge.
- Positive startup/database-backed application evidence may resolve CRM-mapping truth when the direct Render Postgres connector is unavailable; do not infer beyond the logged mutation result.

## Exact next test

From CRM Dummy Test, select/send **`Elim MediHeel Pedicures` once**. The previous zero-row response should be gone; the family should render the existing active Marietjie pedicure/MediHeel treatment list. Do not seed treatments and do not recreate #561.

If that passes, continue the same Dummy Test journey using a genuine desired treatment and genuine future slot. When Shiloh says the request is held/pending approval, **stop before JP decides**. Capture Dummy Test’s exact pending wording and JP’s actionable request. Then verify slot exclusion and sole-JP authority before JP presses Approve; afterward verify final client confirmation and both Calendar mirrors. JP decline is a later separate genuine request.

## Guardrails

- GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence remain authoritative.
- Do not recreate cancelled appointment #561.
- Do not infer provider/template/attendance outcomes.
- CRM Dummy Test / JP authority ambiguity must fail closed; never fall back to practitioner approval.
- Direct Render Postgres connector SSL failure is a tooling limitation, not CRM truth.
- Re-rank after every defect/blocker resolution; product-critical client defects take precedence.