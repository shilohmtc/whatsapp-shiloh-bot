# Shiloh OS — Reconciliation — Admin practitioner block time

Date: 2026-08-20
Owning workstream: Booking & Admin UX
Status: VERIFIED LIVE / CONTROLLED UNIT COMPLETE

## Scope

Deliver a dedicated WhatsApp Admin capability for practitioners to block genuine unavailable time without manufacturing client appointments. This reconciliation records only evidence established in GitHub and Render. No real block, client booking, appointment, CRM identity, Calendar event or WhatsApp customer message was created merely for proof.

## Accepted application delivery

- PR #360, **Add guarded practitioner block-time workflow**, merged to `main` as `1090c284e3971e159ea740dbb3388d0e2f7431ec`.
- The implementation reuses the existing canonical `calendar_blocks` primitive. No schema migration and no fake appointment model were introduced.
- Existing authoritative availability already excludes overlapping `calendar_blocks`, so client and Admin slot discovery automatically treat a committed block as unavailable.
- The new Admin workflow provides Block time creation plus future Shiloh-created blocked-time management with date, start, duration, reason and explicit final review.
- Existing/imported Goldie blocks are not opened to edit/remove by this new UI.

## Authority contract

Blocking authority is deliberately narrower than general booking authority:

- Christel may block **Myself** or **Abigail**.
- Abigail may block **herself only**.
- Marietjie may block **herself only**.
- Jean-Pierre and other Admin identities receive **no Block time authority**.
- Ambiguous or missing practitioner identity fails closed. In particular, Christel does not guess an Abigail target if canonical Abigail identity is ambiguous.

This is a separate authority contract and must not inherit Jean-Pierre's existing business booking exception.

## Mutation and conflict safety

Before a block is written or changed, the guarded flow re-resolves the Admin/practitioner authority and checks the requested interval against canonical appointment and calendar-block conflicts. A conflict fails closed before the write.

Successful create/update/remove operations affect `calendar_blocks` only and write CRM audit evidence. The workflow does not create or mutate client identity, treatment, appointment, attendance, payment or revenue truth and does not send a client WhatsApp message.

## CI evidence

The first PR #360 CI run exposed one pre-existing regression contract asserting that Jean-Pierre's Appointments menu must always match Christel's except finalization. That assertion was no longer correct after the explicitly approved Block time authority boundary.

The repair changed the regression contract, not production authority: Jean-Pierre remains excluded from both practitioner finalization and practitioner Block time.

Final PR head `add6d8ec1e0e35fa381c2dbfced8bb04070b5b87` passed GitHub Actions CI run **#1148**. The complete non-mutating regression test step passed, including the new block-time authority, parsing, overlap, availability and no-fake-appointment coverage.

## Render production verification

Workspace: **My Workspace** (`tea-d9qb67n10e5c739at6j0`).

Production service: **shiloh-whatsapp-bot** (`srv-d9qbfmk9v7es73emgam0`), branch `main`, auto-deploy on commit, health-check path `/health`.

Render deploy **`dep-da3dbm1srm7s7396eop0`** was triggered by the #360 merge commit and reached **LIVE** on exact commit `1090c284e3971e159ea740dbb3388d0e2f7431ec` at 2026-08-20 10:24:53Z.

Post-deploy Render metrics showed one running instance continuously through the verification window and recorded an HTTP **200** response after the deployment, with no 404 response in that sampled window. No manual deploy, environment-variable change or same-commit redeploy was used for this verification.

## Preserved boundaries

This controlled unit does not change or activate practitioner-approved client rescheduling. Its Meta/provider gate and `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED=false` remain preserved.

It also does not supersede:

- CRM Dummy Test reassignment completion and do-not-redo evidence;
- Juvan booking approval and handset evidence;
- booking-confirmation v1/v2 provider state;
- booking-update natural-delivery evidence gate;
- own-practitioner attendance authority;
- appointment #558 HOLD;
- Google Calendar fail-closed booking guard;
- Visual Calendar deferment;
- GBP, Ozow, privacy and Goldie-description gates.

## Reconciliation result

Admin practitioner Block time is **VERIFIED LIVE** at the application/deployment boundary.

The capability should now be treated as durable Booking & Admin behaviour with the exact authority above. No manufactured block is required as additional proof. A future genuine block can provide natural handset/CRM evidence when an actual business need occurs.
