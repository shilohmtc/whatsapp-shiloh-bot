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

### P3.4 Native client cancellation and reschedule
- The previous client-facing Goldie handoff has been removed from the active appointment-change flow.
- Shiloh now resolves the requesting WhatsApp number to that client's own upcoming canonical CRM appointments.
- If more than one booking exists, the client is required to choose the specific booking number; unrelated bookings remain untouched.
- Cancellation requires explicit confirmation, writes canonical status/history/audit records, marks the lifecycle cancelled, and removes the matching Google Calendar event where available.
- Rescheduling requires explicit confirmation and re-checks clinic hours, practitioner schedule, CRM conflicts and Google Calendar conflicts before writing the new time.
- Successful reschedules update the CRM appointment, reminder lifecycle and Google Calendar event together.
- The 24-hour/50% late-cancellation policy is surfaced when relevant; this flow does not automatically charge a fee.

## Safety rules
- CRM remains the appointment source of truth.
- Google Calendar is a synchronized operational view.
- No bulk customer messaging was triggered during this rollout.
- No historical Goldie bookings were sent new booking confirmations.
- QR registration never exposes admin routes or credentials.
- Client appointment mutations are always scoped back to the WhatsApp number's canonical client identity and require explicit confirmation.

## Still to complete in P3
- Explicit reminder confirmation tracking if desired (for example a dedicated `CONFIRM APPOINTMENT` response).
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
- `f97b44b2f2876f1fcb085958f090f155f199b015` — canonical client change-intent migration.
- `f3612094eafdf21182d2f4436b81a67f22a7ccbf` — Shiloh-native client cancel/reschedule flow.
