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
| G1 | Production Postgres continuity | 🔴 DEFECT / HOLD | Bound Render Postgres `shiloh-memory` is free, Oregon-hosted and expires 2026-09-06. GitHub issue #166 is open. Obtain explicit owner authorization for the production-safe continuity option before any paid-plan/billing/infrastructure mutation; then verify datastore + Shiloh continuity and backup/recovery posture. |
| A1 | Six known Christel/Abigail attendance finalizations | 🟠 WAITING | Genuine Completed / No-show truth: Abigail 2, Christel 4. |
| A2 | Finalization / earnings UX production acceptance | ⚪ READY | Real authorized-account queue/report acceptance; Marietjie self-view still needs real acceptance. |
| A3 | Staff finalization reminder template | 🟠 WAITING | `shiloh_staff_finalization_v1` positive Meta approval. |
| B1 | Remaining Admin route acceptance | ⚪ READY | Stable top-level WhatsApp IDs and role-scope guards are implemented; finish only genuinely unverified role-specific WhatsApp paths. |
| B2 | Jean-Pierre Admin capability / client-test strategy | ⚪ READY | Preserve business-admin authority; production Demo Client UI is retired, so use dedicated non-admin identities for true client acceptance rather than weakening Admin identity. |
| C1 | Client Perspective Testing | 🔵 ACTIVE | C1.10 remains active. Privacy rollback simulator + Goldie inventory are live, and the technical provider/subprocessor data-flow register is now live. Continue legal/account transfer-basis evidence, retention authority and Calendar minimization without inventing policy; G1 continuity takes execution priority. |
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
| Live CRM catalogue fidelity | 🟠 WAITING | Authoritative Render Postgres read remains unavailable through the connector; do not guess. Database-side Render logs can establish infrastructure binding but do not replace application-level catalogue truth. |
| Controlled booking creation | 🟠 WAITING | Requires real Dummy Test booking and CRM + Calendar verification. |
| Cancellation/reschedule acceptance | 🟠 WAITING | Requires controlled real appointment first. |
| Client communication lifecycle | 🟠 WAITING | Backend fixes deployed; real WhatsApp/provider acceptance outstanding. |
| Error recovery / conversational resilience | 🟢 VERIFIED (CODE-LEVEL) | PR #163 is deployed. Accepted-but-unacknowledged shared/practitioner Google Calendar writes now use a durable deterministic recovery ledger scoped to the same practitioner and exact slot; rolled-back attempts are cleaned before retry and cleanup uncertainty fails closed before another Calendar write. Real provider/WhatsApp acceptance remains governed by the existing WAITING client-path items and is not inferred. |
| Privacy synthetic transaction/rollback simulator | 🟢 VERIFIED (SAFE FOUNDATION) | PR #164 is deployed. CI proved the contract red before implementation (#379), green on the branch (#380), and green on the exact final PR candidate (#381). The simulator is synthetic/in-memory only, never mutates caller state, blocks manual-review data, proves full rollback under injected failure, contains no DB/network execution path, and always keeps `executionReady=false` / `destructiveActionAllowed=false`. |
| Goldie historical retention inventory | 🟢 VERIFIED (SAFE FOUNDATION) | PR #165 is deployed. Test-first branch CI #385 failed before implementation; corrected branch CI #387 passed; clean PR CI #388 passed on the exact production candidate. The inventory performs read-only count queries, returns sanitized counts/classification states only, never decodes or returns Goldie payload contents, fails closed if the historical tables cannot be read, and always keeps `executionReady=false` / `destructiveActionAllowed=false`. Raw client staging/source payloads remain policy-decision-required; reconciliation provenance remains retain-pending-legal-basis; non-personal historical catalogue/provenance can be classified separately. |
| Provider/subprocessor technical data-flow map | 🟢 VERIFIED (TECHNICAL MAP) | `docs/PRIVACY-PROVIDER-DATA-FLOW-REGISTER.md` is live on `main`. It records code/infrastructure-observed boundaries for Meta/WhatsApp, Render, OpenAI and Google Calendar while explicitly refusing to infer legal approval, DPA acceptance, Section 72 basis, retention approval or account configuration. It confirms current OpenAI `store:true`, broad Google Calendar scope/field duplication, and Oregon Render processing. |
| Client privacy/data minimization | 🔵 ACTIVE | Technical mapping has advanced materially, but governance is not complete. Establish account-level provider/DPA evidence, lawful/cross-border processing basis, privacy-notice/data-subject handling, approved retention/legal basis and owner-approval handling. Calendar treatment/service visibility remains staff-workflow decision-gated. Destructive execution stays disabled. |
| Client-facing hostname / registration URL | ⚪ READY (LOWER PRIORITY) | Agreed target is `shiloh-ai`; production is still `shiloh-whatsapp-bot.onrender.com`. Verify Meta webhook/external callbacks and post-cutover reachability before renaming. No custom domain is currently owned. |
| Practitioner-information conversational audit | ⚪ READY | Public profile/service-mapping foundations are implemented; real client acceptance must prove `What does each practitioner do?`, `Tell me about Marietjie`, `Who does massage?` are authoritative and consistent with booking eligibility. |
| Final Client Perspective release gate | ⚪ READY (GATED) | Close only after all actionable items are verified or explicitly waiting/fail-closed and the real happy path is proven. |

## Current production baseline

- GitHub `main` and Render production were positively aligned on docs-only commit `86ea6d4f51958857d81930494def8c6553d008d4` (`Add evidence-bounded provider data-flow register`) when Render deploy `dep-d9ushlbm8hqs7399tjc0` reached `live` on 2026-08-13. Runtime application code remains the PR #165 production ancestry; re-verify at the start of every new engineering session.
- **Urgent continuity evidence:** Render account state shows the production Postgres `shiloh-memory` / `shiloh_memory` in Oregon on the free plan with `expiresAt=2026-09-06T14:24:54Z`. Database-side logs show `shiloh_memory_user` connections from Render private-network clients during the exact production deploy/startup window, positively binding it to Shiloh production. Render's free-Postgres policy means this cannot be treated as durable production storage. GitHub issue #166 is the closure record. No paid-plan/billing change is authorized merely by this finding.
- PR #163 closed the code-level C1.9 distributed Calendar uncertainty edge without promoting any human/provider truth: Calendar write attempts are durably identified before creation; retries reconcile only the same practitioner + exact slot; canonical CRM appointments are protected; rolled-back attempts are cleaned; and uncertain cleanup blocks the retry rather than risking a duplicate provider write.
- PR #164 adds rehearsal infrastructure only. It does not activate real client-data erasure or de-identification, grant privacy authorization, establish a legal basis, or create a production destructive executor.
- PR #165 adds a read-only historical-retention inventory only. It separates raw Goldie personal staging/source copies from reconciliation provenance and non-personal historical catalogue/provenance, reports only sanitized counts/classification states, and does not delete, de-identify, decode or expose Goldie source payload contents. Real retention periods/legal basis and owner authorization remain unresolved policy truth.
- `docs/PRIVACY-PROVIDER-DATA-FLOW-REGISTER.md` is a technical/governance evidence map only. It does not establish POPIA compliance, transfer authority, accepted provider contracts or destructive-processing authorization.

## Preserved practitioner/client-booking truth

- Canonical client-facing full business name: **Shiloh Massage Therapy and Aesthetic Clinic**. Use `Shiloh` naturally as the short brand; never expand/use `Shiloh MTC` as `Shiloh Medical Training Centre` in client-facing copy.
- `bot` is an internal implementation term, not the intended client-facing identity. Preferred future Render name is **`shiloh-ai`**; the current `shiloh-whatsapp-bot.onrender.com` URL remains authoritative until a controlled cutover is positively verified. Repository code currently has no hard-coded `onrender.com` reference, but external Meta/webhook dependencies still require explicit verification before rename. A future custom domain is optional branding infrastructure; none is currently owned.
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
| **Hostname Change Implications** | 🟢 RECONCILED | Full source-chat re-read now accounts for the client-facing decision to move away from `bot` terminology and preserve **`shiloh-ai`** as the preferred future Render name; confirms no rename actually occurred and current production remains `shiloh-whatsapp-bot.onrender.com`; preserves the no-hard-coded-Render-hostname repository evidence plus the still-required Meta/external callback cutover verification and optional future custom-domain path. The same source then expanded into the Shiloh privacy/data-flow audit and production hardening: P-PRIV-1 custom-attribute/preference minimization (PRs #82/#83), P-PRIV-2 bounded local OpenAI session-state retention (PR #85), P-PRIV-3 temporary registration-state expiry (PR #86), and P-PRIV-4 non-destructive privacy inventory/retention/request-authorization gates (PRs #88/#89/#90). PR #164 completes the synthetic transaction/rollback simulator sub-step, PR #165 completes the read-only Goldie historical-retention inventory/classification sub-step, and the provider data-flow register completes the current technical mapping sub-step without claiming legal/account approval. Master C1.10 still preserves Google Calendar minimization, final retention/legal-basis decisions, health-data red line, provider/account/cross-border POPIA governance, owner-authorization work and development-chat data-minimization rule. The same verification exposed separate production-continuity issue #166: the bound free Render Postgres expires 2026-09-06. No destructive privacy executor, paid infrastructure change, hostname cutover, Meta callback truth or other external/human truth was inferred. |
| **Shiloh OS Progress Update** — historical sessions (multiple) | 🟠 PARTIAL / VERIFY SOURCES | Much of the production ancestry is represented in the master (attendance, earnings, Admin, Demo Client, privacy, Client Perspective), but each same-titled source session has not yet been individually matched to a unique source record. Preserve as reconciliation debt rather than assuming coverage. |
| **Shiloh OS — extended 11–12 Aug production source chat** | 🟢 RECONCILED | Full source-chat reconciliation now accounts for the canonical `Shiloh Massage Therapy and Aesthetic Clinic` brand rule and forwardable walk-in registration surface; guarded August Goldie missing-booking recovery and cleanup; Abigail/Christel earnings rules, salary and Last Week/reporting-integrity UX; practitioner-team Admin service scope; WhatsApp-as-booking-entry versus CRM/Calendar authority split; practitioner-calendar mirroring and unlinked-event integrity monitoring; real WhatsApp interactive-control requirement; the Demo Client DOB crash/natural-DOB/scoped rollout/mandatory cleanup/Admin escape history **and its later PR #134 retirement from production UI**; Admin Today/Tomorrow/Last Week/client-lookup routing fixes and later PR #110/#150 stable-ID supersession; client service↔practitioner discovery/profile requirements and their later PR #118/#131/#154 implementation foundations while preserving live C2/C3 acceptance; P3 client-care/reminder-confirmation foundation; birthday Meta PENDING/fail-closed state; and PR #129 P4 architecture/pure-state completion with live Ozow activation still blocked. All still-open consequences have explicit homes in Master A1–A3, A2/B1–B2, C1–C3, D1, E1–E2 and existing F work; no human/provider truth was inferred. |
| **12 Aug attendance / earnings / Admin production source chat** | 🟢 RECONCILED | Full source-chat reconciliation accounted for the shared Admin `Check next available` no-slot recovery; practitioner-owned attendance certification (Marietjie self, Abigail self, Christel self+Abigail, Jean-Pierre review-only); end-of-day/next-morning template-gated reminders; the exact human-confirmed 1–8 Aug Christel/Abigail historical scope and successful 29-record canonical completion correction; completed-only earnings rules and explicit period picker; real Abigail/Christel August provisional report evidence; Marietjie 100%-of-completed-solo-treatment earnings/no-salary rule plus self/Christel/Jean-Pierre access; Jean-Pierre/Demo Client/test-identity strategy; supporting shared-chat links; and cleanup/supersession of temporary test modes, maintenance hooks, failed-closed maintenance-query attempts and placeholder repository artifacts. Still-open consequences remain explicitly housed in Master A1–A3, A2/B1–B2 and C1–C3; no attendance, Meta approval or real-account acceptance was inferred. |
| **Shiloh OS Production Continuation** | 🟢 RECONCILED | Exact source re-read and GitHub evidence accounted for the guarded Chenique/Juvan test-client reset (PR #151), active-booking discovery recovery (PR #152), bundled registration + neutral booking resume (PR #153), CRM-backed service-family-first booking with Marietjie/Christel/Abigail eligibility rules (PR #154), and the live Dummy Test HIFU practitioner-query repair (PR #155). The source also established that Demo Client does not replace true external client acceptance and led into the dedicated Client Perspective workstream. All still-open consequences already have explicit homes in Master B2/C1–C3; no human/provider truth was inferred. |
| **Client Perspective Testing / Client Testing Update** | 🟢 RECONCILED | Dedicated handoff plus master C1–C3 and this tracker preserve the current audit, fixes through PR #165, provider-map evidence, live-acceptance blockers and practitioner-information requirement. |
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
4. Resolve any 🔴 production-continuity/safety hold before lower-priority engineering; no spend/billing mutation is implied by a hold.
5. Read the specialist handoff only for the active workstream.
6. Work the highest-priority 🔵 ACTIVE / ⚪ READY item while preserving 🟠 WAITING items fail-closed.
7. Before ending a substantial session, reconcile both the master ledger and this tracker.

The tracker is a view of the master, not an independent authority. If they disagree, verify operational evidence and reconcile the discrepancy rather than silently choosing one.