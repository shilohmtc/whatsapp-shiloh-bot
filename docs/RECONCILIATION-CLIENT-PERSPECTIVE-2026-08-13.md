# Shiloh OS — Client Perspective Reconciliation Delta — 2026-08-13

Status: authoritative project-management reconciliation supplement to `docs/SHILOH-OS-MASTER-STATUS.md` until safely folded into that large ledger. It does not replace the Master or Tracker.

## Operational baseline

- GitHub `main`: `0f4e6b966d0635e74ddf45824f85488283083435` (PR #170, `Polish family treatment copy`).
- Render production: deploy `dep-d9v0bu5bedkc73c470g0` reached `live` on the exact same commit.
- Product-Critical Gate remains real Client Perspective acceptance of the WhatsApp booking and booking-management lifecycle.

## Reconciled production changes

- PR #167: guarded Dummy Test reset exposed to JP/Christel Admin → Clients. `JP` means the existing Jean-Pierre identity; do not create a parallel identity.
- PR #168: WhatsApp self-registration uses inbound WhatsApp identity and does not ask the client to re-enter the number; new registration requests First name + Surname + DOB + Gender together and supports bundled/progressive replies; registered-client entry exposes Beauty & Aesthetics / Massage / Lymphatic Drainage / Elim MediHeel Pedicures.
- PR #169: initial booking copy polished and moved to safe client-copy config surface. Production wording: `Choose a service below and I’ll show you the available treatments and practitioners. 🌿`
- PR #170: family treatment prompt polished through a presentation/config boundary without changing CRM catalogue/eligibility behavior. Production wording: `Choose the treatment you’d like to book. 🌿`

## Real WhatsApp acceptance evidence

Dummy Test real-client journey has positively established:

1. Unregistered identity detection works on inbound WhatsApp.
2. Registration does not ask the client to repeat the WhatsApp number.
3. Bundled message `Dummy Test, 14 May 1990, Female` completed registration.
4. Registration transitioned directly to booking.
5. Four-family WhatsApp list rendered correctly: Beauty & Aesthetics / Massage / Lymphatic Drainage / Elim MediHeel Pedicures.
6. Beauty & Aesthetics routed to Marietjie and the polished treatment prompt rendered correctly.
7. Treatments list opened and returned real catalogue rows with duration/pricing plus pagination.

## Current proven defect / exact continuation point

🔴 **Beauty & Aesthetics treatment-list presentation polish is the immediate next engineering item before continuing the client journey.**

Observed real-client UX issues:

- long treatment names are heavily truncated in WhatsApp row titles;
- price display is inconsistent (`R1250 - R2200`, `1000 - 1200`, `350 - 450`, `R500-R1250`, etc.); normalize client presentation while preserving canonical CRM values;
- first displayed page shows `More treatments →` with `Page 2 of 4`, which is ambiguous and should clearly communicate that the action navigates to the next page rather than implying the client is already on page 2.

This is presentation work only. Preserve active CRM catalogue filtering, service-family ownership, practitioner eligibility and stable IDs fail-closed. Apply self-test-first engineering, deploy, verify, then resume the same Dummy Test journey at Treatments.

## GitHub workflow / engineering debt

- GitHub plugin permission was positively inspected and is already `Allow all actions`.
- Intermittent write refusal is therefore not missing owner permission; it is a separate safety-classification layer affecting some CRM/booking/mutation-heavy files.
- Continue separating harmless client-facing copy/presentation from sensitive implementation modules so routine UX changes can be made through safe config/presentation surfaces.
- Do not make manual GitHub editing by the owner the normal workflow; exhaust supported automated paths first.
- Test-client reset allowlist should likewise move to a separate non-destructive config surface in a later lower-priority engineering slice while reset mechanics remain guarded.

## Cross-chat continuation

A fresh Production Engineering chat should:

1. Read Master first, Tracker second, and this reconciliation delta as a subordinate continuity supplement.
2. Verify current GitHub `main` and Render production before changing code.
3. Keep Client Perspective Testing as the Product-Critical Gate.
4. Start with the treatment-list presentation defect above; do not resume C1.10 or ordinary Admin acceptance first.
5. After fixing/deploying it, resume Dummy Test from Beauty & Aesthetics → Treatments and continue treatment → practitioner → availability → booking → canonical CRM + Google Calendar evidence → WhatsApp confirmation → view/reschedule/cancel/lifecycle.
6. Preserve unavailable human/provider/external truth fail-closed.
7. Reconcile changed state back into Master + Tracker before ending substantial work.
