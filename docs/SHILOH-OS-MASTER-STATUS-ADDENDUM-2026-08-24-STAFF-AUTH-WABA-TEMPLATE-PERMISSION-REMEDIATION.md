# Shiloh OS — Master Status Addendum — Staff Auth WABA Template Permission Remediation

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Verified operational truth

The application-side staff-auth WhatsApp delivery repair is complete and verified live.

Authoritative application behavior now includes sanitized WhatsApp delivery-status callback processing and an exact fail-closed Authentication OTP template contract `shiloh_staff_auth_otp_v1` (`en_US`). Production staff-auth no longer has an authorized generic free-form transport.

The exact Authentication OTP template does not currently exist in the provider inventory because Meta rejected the single authorized creation request before creation with HTTP 400 / provider code 10: `This WhatsApp Business Account does not have permission to create message template`.

This is a provider/account permission gate. It does not invalidate the existing browser session, pilot gate, Calendar projection, Day/Week/Agenda, or staff access UX architecture.

## Provider-permission target state

Before any further template submission, the owning workstream must establish the exact Meta/WABA condition responsible for template-creation denial and restore template-creation capability without unnecessarily broadening account, user, token, asset, ownership or credential authority.

Read-only evidence must distinguish WABA/account restriction from app/token permission, system-user/human-user asset assignment, ownership/sharing or another provider restriction.

## Security authority boundary

No blanket permission escalation is authorized.

Changes to Business Manager roles, system-user access, token scopes, WABA ownership/sharing, phone-number ownership/registration, provider credentials or business ownership require a separate exact Control authorization once the minimum necessary mutation is known.

A provider-side enablement that restores template creation without changing identity, credential, role, ownership or asset-access boundaries may be completed under the authorized remediation unit and then verified read-only.

## Subsequent activation order

1. Restore WABA template-creation capability.
2. Control accepts that provider remediation.
3. Control separately authorizes exactly one creation/submission of `shiloh_staff_auth_otp_v1`.
4. Meta must report APPROVED and Shiloh exact provider readback must pass.
5. Control separately authorizes one bounded genuine Christel read-only Calendar pilot challenge.
6. Successful pilot unlocks `SHILOH-CALENDAR-CREATE-BOOKING` under 10 — Booking & Admin UX.

Until then all staff Calendar/auth pilot activation gates remain OFF and no second genuine Christel challenge is authorized.
