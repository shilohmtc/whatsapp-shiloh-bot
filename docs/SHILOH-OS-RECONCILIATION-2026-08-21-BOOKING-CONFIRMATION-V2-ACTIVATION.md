# Shiloh OS — Booking Confirmation v2 Activation and Meta Template Reconciliation

Date: 2026-08-21
Scope: verify the newly Active Meta inventory, activate the frozen `shiloh_booking_confirmation_v2` contract without weakening v1 rollback or canonical handlers, and reconcile every current/legacy identity without manufacturing operational evidence.

## Authority preserved

- GitHub `main` began at PR #382 / `93d688ea1f04b2365093045406f31e1b086aa2ff`.
- PR #382's completed `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1` provider verification and production activation remain unchanged and must not be redone.
- The supplied WhatsApp Manager screenshot is current human evidence for **Active — Quality pending**.
- API quality remains separately reported as `UNKNOWN`; neither quality label is handset delivery evidence.
- `hello_world` remains Meta's default template, outside the Shiloh contract registry and non-operational.

## Fresh booking confirmation v2 provider gate

Verifier deploy `dep-da439mjncjis73auosgg` ran on unchanged PR #382 application code while v1 remained selected. It returned:

- `submitted=false / already_exists_exact`;
- provider **APPROVED**;
- category **UTILITY**;
- language `en`;
- exact static HEADER `Appointment confirmed`;
- exact frozen five-variable BODY and variable order;
- exact FOOTER `Shiloh Massage Therapy & Aesthetic Clinic`;
- exact QUICK_REPLY button order: `Add to calendar`, `Manage booking`, `My appointments`; and
- `duplicateCount=0`.

No provider identity was submitted, edited or duplicated. The one-shot verifier was restored to `false` by deploy `dep-da43a28ae00c739j2kk0`.

## Guarded implementation, CI and merge

PR #383 merged as `7d0493cc6a977ef1136efb57303607f7d6342667`.

- Final head: `1dceae9f09211fbb8dedfc7edb61d251c03bc821`.
- CI #1204: **832/832 passed**.
- V2 is allowed only when the shared selector names the exact v2 identity and the centralized provider gate is APPROVED/exact/configured/duplicate-free.
- The send contract is five ordered body values followed by three appointment-scoped quick-reply payloads in provider button order.
- Calendar, Manage booking and My appointments delegate to existing canonical handlers.
- Redundant automatic supplements are suppressed for both v1 and v2.
- Provider-accepted delivery preserves template name and provider message ID; a post-acceptance evidence failure does not release the delivery claim.
- V1 remains the explicit single-selector rollback and is not deleted or weakened.

PR #384 merged as `aed805842818983eb5d4e3ca50054627eea7fe0c`.

- Final head: `bef5ab69a1e3aef8a6950979acd00cb9cfc39df9`.
- CI #1206: passed.
- Startup now idempotently verifies migration `071_booking_confirmation_template_evidence.sql` and the delivery-evidence columns without requiring a booking/message.

## Full production/provider inventory

The sanitized full inventory ran on deploy `dep-da43feuk1f9s73ajj6m0`. Controlled v2 activation ran on `dep-da43frojo6nc73diqvg0`. Final flag-off deploy `dep-da43g9mk1f9s73ajl33g` is LIVE on exact PR #384 merge SHA.

| Identity | Provider active | Exact contract | Configured | Trigger wired | Production-enabled | Genuine delivery evidence |
|---|---|---|---|---|---|---|
| `shiloh_booking_update_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — future appointment change outbox | Yes | Open; only a natural future change may prove delivery |
| `shiloh_staff_finalization_actions_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — actionable finalization prompt | Yes | Genuine Meta-accepted send exists |
| `shiloh_appointment_followup_v2` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — lifecycle follow-up | Yes | Genuine send exists; genuine rating response remains open |
| `shiloh_booking_approval_outcome_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — first terminal approval decision outcome | Yes | Genuine delivery evidence remains open |
| `shiloh_booking_declined_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — declined booking request | Yes | Genuine decline delivery remains open |
| `shiloh_booking_approval_request_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — practitioner/Admin approval request and resend | Yes | Genuine Meta-accepted send exists |
| `shiloh_reschedule_approval_request_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — practitioner-approved client reschedule | Yes; PR #382 preserved | Genuine natural-use journey remains open |
| `shiloh_reschedule_declined_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — declined reschedule request | Yes; PR #382 preserved | Genuine natural-use journey remains open |
| `shiloh_cancellation_confirmation_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — canonical cancellation | Yes | Genuine cancellation delivery remains open |
| `shiloh_reschedule_confirmation_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — approved completed reschedule | Yes | Genuine natural-use delivery remains open |
| `shiloh_appointment_reminder_actions_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — lifecycle reminder | Yes | Genuine Meta-accepted send exists |
| `shiloh_booking_confirmation_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | No — shared selector now names v2 | Yes — rollback path | No — inactive rollback | Historical genuine handset proof from #352 |
| `shiloh_booking_confirmation_v2` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — canonical confirmed-booking delivery | Yes; `ready=true` | Open; await a natural booking delivery |
| `shiloh_staff_finalization_v1` | Yes — APPROVED / Utility / en | Yes; duplicates 0 | Yes | Yes — finalization reminder | Yes | Genuine Meta-accepted send exists |
| `shiloh_birthday_wish_v2` | Yes — APPROVED / Marketing / en | Yes; duplicates 0 | Yes | Yes — opted-in birthday scheduler | Yes | Genuine eligible birthday delivery remains open |
| `shiloh_birthday_wish_v1` | Yes — APPROVED / Marketing / en | No — full components unknown/non-authoritative; duplicates 0 | Identity visible/configured | No authoritative current trigger | No — `sendable=false / ready=false` | None; legacy evidence only |
| `appointment_followup` | Yes — APPROVED / Utility / en | No — full components unknown/non-authoritative; duplicates 0 | Identity visible/configured | Retired legacy endpoint | No — `sendable=false / ready=false` | None; superseded by v2 |
| `appointment_reminder` | Yes — APPROVED / Utility / en | No — full components unknown/non-authoritative; duplicates 0 | Identity visible/configured | Retired legacy endpoint | No — `sendable=false / ready=false` | None; superseded by action reminder |

## Final production verification

- Final deploy: `dep-da43g9mk1f9s73ajl33g` — LIVE.
- Git commit: `aed805842818983eb5d4e3ca50054627eea7fe0c`.
- Production selector: `shiloh_booking_confirmation_v2`.
- `META_BOOKING_CONFIRMATION_V2_PROVISION_ON_START=false`.
- `META_TEMPLATE_INVENTORY_AUDIT_ON_START=false`.
- Migration 071/template evidence columns: verified.
- `/health`: `status=ok`, `database=ok`.
- Error/fatal logs: none in the final activation window.
- No provider submission, appointment, booking, client message, attendance action, Juvan journey, CRM mutation or Calendar mutation was manufactured.

## Completed / do not redo

- PR #382 reschedule provider verification and activation.
- Booking confirmation v2 provider verification, exact-contract implementation, CI, merge, schema verification, production selection and full inventory reconciliation.
- V1 fallback preservation.
- Legacy template fail-closed enforcement.
- One-shot verifier/audit restoration to false.

## Remaining evidence boundaries and ownership

- **Booking & Admin UX** observes the first genuine v2 booking confirmation and its calendar/manage/my-appointments buttons during natural use.
- **WhatsApp / Meta Integration** investigates only genuine provider/delivery defects and monitors quality changes.
- **Production / DevOps** owns runtime incidents and may roll back by selecting `shiloh_booking_confirmation_v1`; it must not bypass the provider contract gate.
- **Customer Care / CRM & Identity** owns genuine rating and birthday truth where applicable.
- **Control & Reconciliation** preserves this checkpoint and routes new evidence.

Tracker, Master and Meta readiness matrix reconciliation are complete.

**Next specialist:** None — controlled unit complete.
