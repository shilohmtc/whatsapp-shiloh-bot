# Shiloh OS — Project Tracker

Updated: 2026-08-13

Purpose: concise operational dashboard for humans. `docs/SHILOH-OS-MASTER-STATUS.md` remains the detailed permanent project-management ledger and source of task detail. This tracker must never silently replace or close work in the master ledger.

## Status system

Use these states consistently across future reconciliations:

- 🟢 **VERIFIED** — implemented and supported by sufficient production/acceptance evidence.
- 🔵 **ACTIVE** — the workstream currently being worked/audited.
- ⚪ **READY** — genuinely actionable now; no known external truth is required to begin safely.
- 🟠 **WAITING** — blocked on human, provider, external-system, or authoritative-data truth; never infer completion.
- 🔴 **DEFECT / HOLD** — a proven defect or safety issue means progression must stop/fail closed until repaired.
- ⏸️ **DEFERRED** — intentionally postponed with an explicit reason.

Mapping from the older master symbols: ✅ -> 🟢, 🔵 -> 🔵, ⬜ -> ⚪, 🟡 -> 🟠, ⏸ -> ⏸️. The semantic rules do not change.

## At-a-glance tracker

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| A1 | Six known Christel/Abigail attendance finalizations | 🟠 WAITING | Genuine Completed / No-show truth: Abigail 2, Christel 4. |
| A2 | Finalization / earnings UX production acceptance | ⚪ READY | Real authorized-account queue/report acceptance; Marietjie self-view still needs real acceptance. |
| A3 | Staff finalization reminder template | 🟠 WAITING | `shiloh_staff_finalization_v1` positive Meta approval. |
| B1 | Remaining Admin route acceptance | ⚪ READY | Stable top-level WhatsApp IDs and role-scope guards are implemented; finish only genuinely unverified role-specific WhatsApp paths. |
| B2 | Jean-Pierre Admin capability / client-test strategy | ⚪ READY | Preserve business-admin authority; production Demo Client UI is retired, so use dedicated non-admin identities for true client acceptance rather than weakening Admin identity. |
| C1 | Client Perspective Testing | 🔵 ACTIVE | C1.9 error recovery / conversational resilience is the highest-priority ready item. |
| C2 | Practitioner-information conversational audit | ⚪ READY | Real-client acceptance of the implemented authoritative profile/service-mapping layer; prove no AI invention and consistency with booking eligibility. |
| C3 | True first-time booking acceptance | 🟠 WAITING | Real Dummy Test WhatsApp happy path + exact CRM/Calendar evidence. |
| D0 | P3 customer-care foundation | 🟢 VERIFIED | Backend foundation is implemented; real WhatsApp/provider lifecycle acceptance remains under C1.8. |
| D1 | Birthday automation | 🟠 WAITING | `shiloh_birthday_wish_v2` positive Meta approval. |
| E1 | Ozow activation gate | 🟠 WAITING | Merchant/account configuration + explicit payment/deposit/refund/Shiloh gift-voucher rules. |
| E2 | Safe P4 engineering | ⚪ READY (LOWER PRIORITY) | PR #129 architecture/pure-state foundation is complete; continue only the next provider-independent slice after higher-priority acceptance is clean. |
| F1 | Meta keeper portfolio / core ownership | 🟢 VERIFIED | Preserve portfolio `406573210678288`, WABA/app/system-user chain. |
| F2 | Existing Facebook Page consolidation | 🟢 VERIFIED | Preserve consolidated Page ownership; no further action unless evidence changes. |
| F3 | Existing Instagram ownership/connection | ⚪ READY | Verify existing `@shiloh_massage_studio` ownership/access before connection; never create duplicate by assumption. |
| F4 | Portfolio naming / business verification | ⚪ READY | Investigate rejection/legal details before resubmission; rename only after stable asset map. |

## Active Client Perspective sub-tracker

| Item | State | Meaning |
|---|---|---|
| Registration acceptance matrix | 🟢 VERIFIED | Sequential and bundled registration paths regression/production fixed. |
| Calendar availability/conflict audit | 🟢 VERIFIED | Non-mutating conflict/eligibility evidence established. |
| Live Dummy Test booking retry | 🟠 WAITING | Requires real WhatsApp acceptance. |
| Live CRM catalogue fidelity | 🟠 WAITING | Authoritative Render Postgres read remains unavailable; do not guess. |
| Controlled booking creation | 🟠 WAITING | Requires real Dummy Test booking and CRM + Calendar verification. |
| Cancellation/reschedule acceptance | 🟠 WAITING | Requires controlled real appointment first. |
| Client communication lifecycle | 🟠 WAITING | Backend fixes deployed; real WhatsApp/provider acceptance outstanding. |
| Error recovery / conversational resilience | 🔵 ACTIVE | Investigate uncertain Google Calendar success / CRM rollback / retry orphan-duplicate edge self-test-first. |
| Client privacy/data minimization | ⚪ READY | Continue synthetic execution-plan/rollback simulator and owner/legal-basis work; destructive execution remains disabled. |
| Practitioner-information conversational audit | ⚪ READY | Public profile/service-mapping foundations are implemented; real client acceptance must prove `What does each practitioner do?`, `Tell me about Marietjie`, `Who does massage?` are authoritative and consistent with booking eligibility. |
| Final Client Perspective release gate | ⚪ READY (GATED) | Close only after all actionable items are verified or explicitly waiting/fail-closed and the real happy path is proven. |

## Preserved practitioner/client-booking truth

- Canonical client-facing full business name: **Shiloh Massage Therapy and Aesthetic Clinic**. Use `Shiloh` naturally as the short brand; never expand/use `Shiloh MTC` as `Shiloh Medical Training Centre` in client-facing copy.
- WhatsApp/Shiloh is the client and staff booking interaction surface; CRM is authoritative for client/service/practitioner/appointment truth; Google Calendar is availability, diary and booking-mirror infrastructure rather than a parallel CRM booking entry system.
- Manual practitioner-calendar events may block availability but must never silently become CRM client appointments; booking-like unlinked events are integrity-review exceptions only.
- Marietjie: Shiloh Esthetician / Beauty & Aesthetics practitioner.
- Christel: Shiloh owner and active Massage practitioner.
- Abigail: Shiloh Massage practitioner and the practitioner for Lymphatic Drainage.
- Beauty & Aesthetics -> Marietjie.
- Massage -> Christel or Abigail according to actual CRM service eligibility.
- Lymphatic Drainage -> Abigail only.
- Admin team scope remains Marietjie -> Marietjie mapped services; Christel/Abigail -> shared Christel+Abigail mapped service pool, with canonical final eligibility revalidation.
- Actual treatment names and practitioner eligibility remain CRM-derived and fail closed.
- Where multiple practitioners are genuinely eligible, clients must receive a meaningful choice (plus `Any available` where appropriate). Where only one is eligible, Shiloh may skip an unnecessary choice but must communicate who will provide the treatment.
- Genuine Meta WhatsApp interactive controls/lists with stable IDs are the product standard where supported; typed aliases can remain for resilience but are not the preferred primary UX.

# Historical source-session reconciliation register

Purpose: make chat/session provenance visible so important requirements cannot disappear merely because a new chat starts. A session is not considered fully reconciled merely because one of its topics appears somewhere in the repository.

| Source session | Reconciliation state | Preserved outcome / required follow-up |
|---|---|---|
| **Meta Business Portfolio Merge** | 🟢 RECONCILED | Master F1–F4 now explicitly preserve keeper portfolio/core ownership, Facebook Page consolidation, Instagram audit, naming and verification remediation. |
| **Hostname Change Implications** | 🟠 PARTIAL / VERIFY SOURCE | Known production naming/hostname discussion influenced the Shiloh service identity, but the exact source-session decisions have not yet been independently re-read into this register. Do not claim full reconciliation until source evidence is available. |
| **Shiloh OS Progress Update** — historical sessions (multiple) | 🟠 PARTIAL / VERIFY SOURCES | Much of the production ancestry is represented in the master (attendance, earnings, Admin, Demo Client, privacy, Client Perspective), but each same-titled source session has not yet been individually matched to a unique source record. Preserve as reconciliation debt rather than assuming coverage. |
| **Shiloh OS — extended 11–12 Aug production source chat** | 🟢 RECONCILED | Full source-chat reconciliation now accounts for the canonical `Shiloh Massage Therapy and Aesthetic Clinic` brand rule and forwardable walk-in registration surface; guarded August Goldie missing-booking recovery and cleanup; Abigail/Christel earnings rules, salary and Last Week/reporting-integrity UX; practitioner-team Admin service scope; WhatsApp-as-booking-entry versus CRM/Calendar authority split; practitioner-calendar mirroring and unlinked-event integrity monitoring; real WhatsApp interactive-control requirement; the Demo Client DOB crash/natural-DOB/scoped rollout/mandatory cleanup/Admin escape history **and its later PR #134 retirement from production UI**; Admin Today/Tomorrow/Last Week/client-lookup routing fixes and later PR #110/#150 stable-ID supersession; client service↔practitioner discovery/profile requirements and their later PR #118/#131/#154 implementation foundations while preserving live C2/C3 acceptance; P3 client-care/reminder-confirmation foundation; birthday Meta PENDING/fail-closed state; and PR #129 P4 architecture/pure-state completion with live Ozow activation still blocked. All still-open consequences have explicit homes in Master A1–A3, A2/B1–B2, C1–C3, D1, E1–E2 and existing F work; no human/provider truth was inferred. |
| **12 Aug attendance / earnings / Admin production source chat** | 🟢 RECONCILED | Full source-chat reconciliation accounted for the shared Admin `Check next available` no-slot recovery; practitioner-owned attendance certification (Marietjie self, Abigail self, Christel self+Abigail, Jean-Pierre review-only); end-of-day/next-morning template-gated reminders; the exact human-confirmed 1–8 Aug Christel/Abigail historical scope and successful 29-record canonical completion correction; completed-only earnings rules and explicit period picker; real Abigail/Christel August provisional report evidence; Marietjie 100%-of-completed-solo-treatment earnings/no-salary rule plus self/Christel/Jean-Pierre access; Jean-Pierre/Demo Client/test-identity strategy; supporting shared-chat links; and cleanup/supersession of temporary test modes, maintenance hooks, failed-closed maintenance-query attempts and placeholder repository artifacts. Still-open consequences remain explicitly housed in Master A1–A3, A2/B1–B2 and C1–C3; no attendance, Meta approval or real-account acceptance was inferred. |
| **Shiloh OS Production Continuation** | 🟢 RECONCILED | Exact source re-read and GitHub evidence accounted for the guarded Chenique/Juvan test-client reset (PR #151), active-booking discovery recovery (PR #152), bundled registration + neutral booking resume (PR #153), CRM-backed service-family-first booking with Marietjie/Christel/Abigail eligibility rules (PR #154), and the live Dummy Test HIFU practitioner-query repair (PR #155). The source also established that Demo Client does not replace true external client acceptance and led into the dedicated Client Perspective workstream. All still-open consequences already have explicit homes in Master B2/C1–C3; no human/provider truth was inferred. |
| **Client Perspective Testing / Client Testing Update** | 🟢 RECONCILED | Dedicated handoff plus master C1–C3 and this tracker preserve the current audit, fixes through PRs #156–#160, live-acceptance blockers and practitioner-information requirement. |
| **12 Aug production handoff** `docs/HANDOFF-NEXT-CHAT-2026-08-12.md` | 🟢 RECONCILED | Supporting handoff is subordinate to the Master; its attendance/finalization, earnings, Admin/Demo Client, shared ChatGPT references and remaining blockers have explicit homes in Master A/B/C and the dedicated 12 Aug source-chat row above. |

## Reconciliation rule for historical chats

1. Match the exact session/title to recoverable evidence.
2. Extract only decisions, completed evidence, unresolved requirements and explicit blockers that still matter.
3. Compare them against `docs/SHILOH-OS-MASTER-STATUS.md`.
4. Add missing work under the correct existing workstream; do not create a competing master checklist.
5. Mark the source 🟢 RECONCILED only when all still-relevant material has an explicit home or is explicitly superseded with evidence.
6. If source evidence cannot be recovered, leave it 🟠 PARTIAL / VERIFY SOURCE rather than guessing.

## Operating rule across chats

Every Shiloh OS chat should use this order:

1. Read `docs/SHILOH-OS-MASTER-STATUS.md` for detailed project truth.
2. Read this tracker for the concise current dashboard and source-reconciliation debt.
3. Verify GitHub `main` and Render before claiming the deployed baseline.
4. Read the specialist handoff only for the active workstream.
5. Work the highest-priority 🔵 ACTIVE / ⚪ READY item while preserving 🟠 WAITING items fail-closed.
6. Before ending a substantial session, reconcile both the master ledger and this tracker.

The tracker is a view of the master, not an independent authority. If they disagree, verify operational evidence and reconcile the discrepancy rather than silently choosing one.