# Shiloh OS — Master Status Addendum — Staff Auth WhatsApp Delivery Repair

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Verified operational truth

The secure browser staff/Admin session boundary, Calendar access UX, and canonical-account pilot gate remain implemented and verified live.

The first genuine Christel read-only staff Calendar pilot failed before authentication because the WhatsApp challenge did not arrive at the intended user. The system was then re-locked and remains default-off.

The failure does NOT invalidate the session, Calendar projection, Day/Week/Agenda, or pilot-gate architecture.

## Provider-delivery truth established by Control

For the consumed pilot challenge:

- Shiloh generated/processed the challenge request;
- the WhatsApp dispatcher invoked the current provider sender;
- Meta accepted the send request and returned a WhatsApp message ID;
- the browser challenge endpoint returned HTTP 202;
- Meta subsequently called Shiloh's `/webhook` endpoint;
- current Shiloh webhook handling ignores status-only callbacks because it returns early when `value.messages` is absent;
- therefore the historical Meta delivery state/error carried by the status callback is not preserved in Shiloh evidence;
- current staff-auth challenge transport is a free-form text send through `sendWhatsAppMessage`;
- current exact template-contract inventory has no dedicated staff authentication OTP template.

The final historical non-delivery cause remains UNPROVEN and must not be guessed.

## Authorized target architecture

The staff-auth WhatsApp delivery path must gain two properties before another real pilot challenge:

### 1. Delivery-status observability

Shiloh must process WhatsApp `value.statuses` callbacks separately from inbound `value.messages` and preserve sanitized provider delivery state correlated by Meta message ID.

No authentication code, message body containing the code, full recipient phone number, session token, CSRF token, or provider credential may be logged or persisted for this purpose.

### 2. Exact authentication-template transport

Production staff sign-in OTP delivery should use an exact, approved, configured Meta authentication/OTP template contract rather than relying on a generic free-form text path.

If the current provider account supports Meta Authentication-category OTP templates, that is the required target. The send must fail closed unless the exact template contract is approved and configured.

If provider constraints prevent this target, the owning workstream must return exact provider evidence to Control rather than silently weakening to free-form or unrelated template delivery.

## Authority boundary

This addendum authorizes implementation and, if necessary, submission of exactly one dedicated Shiloh staff authentication OTP template for provider review.

It does not authorize a real recipient send or a second Christel challenge.

All staff Calendar/auth pilot activation controls remain OFF until a later explicit Control pilot authorization.

## Ownership

Implementation owner: 30 — WhatsApp & Meta Integration.
Render rollout support: 40 — Production & DevOps as required.
Final acceptance: 00 — Control & Reconciliation.

## Product priority

This provider-delivery repair is the highest current Calendar dependency. After a successful repeat Christel read-only pilot, the next highest-priority product unit is guarded Calendar Create Booking under 10 — Booking & Admin UX, including the ability for Christel to book eligible clients with Abigail through canonical scheduling and permission guards.