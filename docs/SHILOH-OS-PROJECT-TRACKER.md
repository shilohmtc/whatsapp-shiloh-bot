# Shiloh OS — Project Tracker

Updated: 2026-08-13

Purpose: concise operational dashboard. The Master remains authoritative.

## Mandatory priority rule

Before ordinary ACTIVE / READY work, identify unresolved production defects and the current **Product-Critical Gate**. Rank by threat to Shiloh's core business function, not workstream number.

A WAITING item requiring real WhatsApp/human evidence becomes actionable when the authorised tester is available. Never infer the evidence: run the acceptance test and record it. After any blocker is removed, re-rank the whole project instead of automatically resuming the previous technical item.

## Current Product-Critical Gate

🔵 **Complete real Client Perspective acceptance of the WhatsApp booking and booking-management lifecycle.**

Acceptance sequence: real client WhatsApp → registration/recognition → service/treatment discovery → correct practitioner eligibility/choice → availability → booking → canonical CRM appointment → Google Calendar mirror → WhatsApp confirmation → view booking → reschedule → cancellation → lifecycle/template communications.

Any defect exposed by this journey becomes the immediate engineering priority: reproduce safely, self-test first, fix, deploy, verify, then resume the same journey. C1.10 privacy/governance remains open with existing safeguards preserved, but it must not displace this gate unless it reveals an immediate safety/booking blocker.

## At-a-glance

| ID | Workstream | State | Next action |
|---|---|---|---|
| G1 | Production Postgres continuity | 🟢 VERIFIED | Existing `shiloh-memory` upgraded in place to Basic-256mb; Free expiry removed; post-upgrade connections resumed; issue #166 closed. |
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Run the real Dummy Test WhatsApp journey now. |
| C3 | True first-time booking acceptance | 🔵 ACTIVE / HUMAN-ASSISTED | Tester is available now; prove WhatsApp happy path + exact CRM/Calendar evidence. |
| C2 | Practitioner-information audit | ⚪ READY / IN-JOURNEY | Exercise naturally during client journey and verify answers match booking eligibility. |
| C1.10 | Privacy/data minimization | ⏸️ OPEN / NOT CURRENT CRITICAL PATH | Preserve implemented safety controls and destructive execution disabled; resume governance after client gate unless safety blocker appears. |
| A1 | Six attendance finalizations | 🟠 WAITING | Requires genuine Completed / No-show truth. |
| A2 | Finalization/earnings acceptance | ⚪ READY | Real authorized-account acceptance after product-critical gate. |
| A3 | Staff reminder template | 🟠 VERIFY PROVIDER STATE | User reports Meta templates approved; verify exact template/status before promoting. |
| B1 | Remaining Admin acceptance | ⚪ READY | Genuine unfinished role-specific paths after client gate. |
| D1 | Birthday template | 🟠 VERIFY PROVIDER STATE | User reports Meta templates approved; verify exact template/status before promoting/sending. |
| E1 | Ozow activation | 🟠 WAITING | External merchant/business-rule truth required. |

## Client Perspective acceptance board

| Item | State | Meaning |
|---|---|---|
| Registration matrix | 🟢 VERIFIED (FOUNDATION) | Must survive real journey. |
| Availability/conflict audit | 🟢 VERIFIED (FOUNDATION) | Must survive real booking. |
| Live Dummy Test booking | 🔵 ACTIVE | Start now with natural WhatsApp interaction. |
| CRM catalogue fidelity | 🟠 VERIFY IN JOURNEY | Do not guess; use guarded authoritative evidence where available. |
| Controlled booking creation | 🔵 ACTIVE / JOURNEY-GATED | Verify CRM + Calendar before accepting WhatsApp success. |
| Cancellation/reschedule | ⚪ READY AFTER BOOKING | Use controlled appointment created by journey. |
| Communication lifecycle | ⚪ READY IN/AFTER JOURNEY | Verify real WhatsApp/provider behavior including approved templates. |
| Error recovery | 🟢 VERIFIED (CODE-LEVEL) | PR #163; real journey remains acceptance authority. |
| Privacy foundations | 🟢 SAFE FOUNDATIONS / OPEN GOVERNANCE | PRs #164/#165 + provider map preserved; no destructive executor. |
| Final Client Perspective release gate | 🔵 ACTIVE / GATED | Requires real happy path and management lifecycle. |

## Current production baseline

- GitHub `main` and Render production aligned on `5305ae96171a100cf08d24d9330c5c0bb2f4aa7d`; Render deploy `dep-d9ut983l550s73dmt670` is live.
- G1 resolved: existing production Postgres upgraded in place to Basic-256mb; old Free expiry removed; issue #166 closed. No HA/tested-restore claim inferred.
- User reports Meta templates are now approved. This means prior blanket PENDING evidence may be stale, but exact template names/statuses must be positively verified before changing A3/D1 or enabling provider-dependent behavior.

## Preserved client-booking truth

- WhatsApp/Shiloh is the client interaction surface; CRM is authoritative for client/service/practitioner/appointment truth; Google Calendar is availability/diary/mirror infrastructure.
- Backend tests, Demo Client simulation, direct CRM mutation or Calendar-only evidence cannot substitute for real WhatsApp client acceptance.
- Use a dedicated non-admin client identity; `Dummy Test` is preferred unless authoritative evidence changes it.
- Beauty & Aesthetics → Marietjie; Massage → Christel or Abigail according to CRM eligibility; Lymphatic Drainage → Abigail only. Actual treatment eligibility remains CRM-derived/fail-closed.
- Genuine Meta interactive controls/lists with stable IDs are the product standard where supported.

## Cross-chat operating rule

1. Read Master, then Tracker; verify GitHub `main` + Render.
2. Identify production defects and the Product-Critical Gate before ordinary workstream ordering.
3. Treat human-assisted acceptance as actionable when the authorised tester is present; never infer results.
4. Work the highest-risk actionable product gate/defect first.
5. Re-rank after every blocker removal.
6. Preserve genuinely unavailable external/human truth fail-closed.
7. Reconcile Master + Tracker before ending substantial work.
