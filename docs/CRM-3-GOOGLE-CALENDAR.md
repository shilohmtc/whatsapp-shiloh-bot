# CRM-3 — Google Calendar Booking Integration

## Architecture

PostgreSQL remains Shiloh's canonical CRM record for clients, appointments, services, staff assignments, status history and audit events.

The dedicated Google Calendar **Shiloh — Bookings** is the shared operational schedule used by admins and by Shiloh as an external collision check.

An opaque/busy event created directly by an admin in the shared calendar blocks Shiloh from creating an overlapping booking.

## Production environment variables

Set these on the Render web service:

```text
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_BOOKING_CALENDAR_ID=<secondary calendar ID>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service account email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<service account private key, including BEGIN/END lines>
```

Do not commit the private key or service-account JSON file to GitHub.

## Google Cloud one-time setup

1. Create or select a Google Cloud project for Shiloh.
2. Enable **Google Calendar API** for that project.
3. Create a Google Cloud service account dedicated to Shiloh Calendar access.
4. Create a JSON key for that service account and retain it securely.
5. In Google Calendar, open **Settings and sharing** for `Shiloh — Bookings`.
6. Under **Share with specific people or groups**, add the service-account email.
7. Grant **Make changes to events** permission. Do not grant account-wide access.
8. Put the service-account email and private key into Render environment variables.
9. Put the dedicated secondary calendar ID into `GOOGLE_BOOKING_CALENDAR_ID`.
10. Run database migrations before enabling the feature in production.

## CRM-3 invariants

- A booking is checked against canonical CRM schedule rules and Google Calendar before confirmation.
- Availability is checked again immediately before the production appointment write.
- Shiloh-created Google events use deterministic IDs derived from the CRM appointment ID, making retries idempotent.
- A Google event is mapped to its CRM appointment in `appointment_calendar_events`.
- If a booking transaction fails after creating a Google event, Shiloh attempts compensating event deletion.
- Cancelling a CRM appointment attempts to remove its linked Google Calendar event and records sync errors for operational follow-up.
- Google Calendar credentials are required only when `GOOGLE_CALENDAR_ENABLED=true`.

## Rollout sequence

1. Deploy the migration with `GOOGLE_CALENDAR_ENABLED=false` or unset.
2. Confirm `014_google_calendar_booking_bridge.sql` has applied.
3. Configure the service-account credentials and dedicated calendar ID.
4. Share `Shiloh — Bookings` with the service account.
5. Set `GOOGLE_CALENDAR_ENABLED=true`.
6. Test an admin-created busy event blocking a Shiloh booking.
7. Test a Shiloh booking appearing in the shared calendar.
8. Test cancellation removing the shared-calendar event.
9. Only after these pass, expose conversational client booking through the same booking primitives.
