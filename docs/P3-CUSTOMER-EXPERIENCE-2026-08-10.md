# P3 Customer Experience — rollout status — 10 Aug 2026

## Live now

### P3.1 Premium WhatsApp greeting
- New/unknown greeting-only conversations receive the premium Shiloh welcome.
- Returning fully registered clients retain the personal `Welcome back, <name>` experience.
- The assistant remains English-only under the existing language guard.

### P3.2 Walk-in QR registration
- Public entry route: `/walk-in`.
- The route resolves the production WhatsApp display number from Meta using the existing `PHONE_NUMBER_ID` + `WHATSAPP_TOKEN` (or optional `SHILOH_PUBLIC_WHATSAPP_NUMBER`) and redirects to WhatsApp with a pre-filled walk-in registration intent.
- No admin endpoint, admin secret or CRM identifier is exposed in the QR.
- Walk-in registration reuses canonical client identity matching and duplicate-contact safeguards.
- Existing fully registered clients are recognized rather than duplicated.
- New/incomplete clients are asked only for required registration identity fields and receive a concise privacy-use notice.

### P3.3 Confirmation → calendar → reminder/aftercare lifecycle
- Existing booking confirmation flow remains idempotent through `crm_audit_events`.
- Confirmation contains service, practitioner, date/time, location, Google Calendar link and secure ICS link where available.
- New Shiloh bookings that actually receive a confirmation are now enrolled into the appointment lifecycle using the canonical CRM appointment ID.
- 24-hour reminder and post-appointment follow-up templates are already configured in production.
- Reminder/follow-up delivery is idempotent via lifecycle timestamps.
- Migrated Goldie appointments are not bulk-enrolled by this change, so this rollout does not suddenly message historical migrated bookings.
- Follow-up feedback is attached to the canonical appointment ID and can route low ratings to clinic follow-up.

## Safety rules
- CRM remains the appointment source of truth.
- Google Calendar is a synchronized operational view.
- No bulk customer messaging was triggered during this rollout.
- No historical Goldie bookings were sent new booking confirmations.
- QR registration never exposes admin routes or credentials.

## Still to complete in P3
- Direct Shiloh-native client cancellation/reschedule confirmation for canonical appointments (current legacy client-change flow still contains a Goldie handoff and must be replaced carefully).
- Explicit reminder confirmation tracking if desired (e.g. client replies `CONFIRM`).
- Treatment-aware aftercare/rebooking copy rather than a single generic template.
- Loyalty ledger and 10% reward after 5 qualifying completed visits.
- Birthday/customer-care preferences with explicit opt-in/frequency controls.

## Production commits
- `919a2614a468a03ec1760b32476288a21c86ee8d` — premium greeting + walk-in registration intent.
- `b7658b3442b06e4c1cf6a9519bba1b4ebcd3dc90` — public QR walk-in WhatsApp route.
- `3c6933d00fe31b84a12f683342b42268241aee73` — route wired into production app.
- `eb12dedbf64d7247049badc436d969a612af4d53` — canonical lifecycle migration.
- `b31766508e37b831e0f1ae83d7cdf7978fe2113a` — canonical reminder/aftercare lifecycle.
- `c781298cbfd98c9a3d00d594be234e5bbf7f5481` — booking confirmations enroll new Shiloh appointments into lifecycle.
