# CRM-3 — Google Calendar Booking Integration

## Architecture

PostgreSQL remains Shiloh's canonical CRM record for clients, appointments, services, staff assignments, status history and audit events.

The dedicated Google Calendar **Shiloh — Bookings** is the shared operational schedule used by admins and by Shiloh as an external collision check.

An opaque/busy event created directly by an admin in the shared calendar blocks Shiloh from creating an overlapping booking.

## Recommended production authentication

For the current Render deployment, use **Google OAuth 2.0 refresh-token authentication** with the dedicated `shilohmtc@gmail.com` account. This avoids downloadable Google service-account private keys and does not require changing the organisation policy that blocks service-account key creation.

Render currently does not provide a native Google managed-OIDC integration for this service, so Google Workload Identity Federation is not the simplest operational choice for this interim deployment.

## Production environment variables

Set these on the Render web service:

```text
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_BOOKING_CALENDAR_ID=<secondary calendar ID>
GOOGLE_CALENDAR_AUTH_MODE=oauth_refresh_token
GOOGLE_OAUTH_CLIENT_ID=<OAuth client ID>
GOOGLE_OAUTH_CLIENT_SECRET=<OAuth client secret>
GOOGLE_OAUTH_REFRESH_TOKEN=<refresh token granted by shilohmtc@gmail.com>
```

The OAuth client secret and refresh token are production secrets. Store them only in Render secrets/environment variables and never commit them to GitHub.

The code retains `service_account` auth mode for future environments that allow it:

```text
GOOGLE_CALENDAR_AUTH_MODE=service_account
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service account email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<private key>
```

## Google Cloud one-time OAuth setup

1. Use the existing **Shiloh OS** Google Cloud project.
2. Keep **Google Calendar API** enabled.
3. Configure the Google Auth Platform / OAuth consent screen for the Shiloh application.
4. Create an OAuth client for the one-time authorization flow.
5. Authorize with `shilohmtc@gmail.com` using the Calendar scope needed by CRM-3.
6. Capture the refresh token and store it in Render as `GOOGLE_OAUTH_REFRESH_TOKEN`.
7. Store the OAuth client ID and client secret in Render.
8. Keep the dedicated secondary calendar ID in `GOOGLE_BOOKING_CALENDAR_ID`.
9. Set `GOOGLE_CALENDAR_AUTH_MODE=oauth_refresh_token`.
10. Enable `GOOGLE_CALENDAR_ENABLED=true` only after the credentials are installed.

## CRM-3 invariants

- A booking is checked against canonical CRM schedule rules and Google Calendar before confirmation.
- Availability is checked again immediately before the production appointment write.
- Shiloh-created Google events use deterministic IDs derived from the CRM appointment ID, making retries idempotent.
- A Google event is mapped to its CRM appointment in `appointment_calendar_events`.
- If a booking transaction fails after creating a Google event, Shiloh attempts compensating event deletion.
- Cancelling a CRM appointment attempts to remove its linked Google Calendar event and records sync errors for operational follow-up.
- Google Calendar credentials are required only when `GOOGLE_CALENDAR_ENABLED=true`.
- Access tokens are cached only in process memory and refreshed from Google when required.

## Rollout sequence

1. Deploy the code with `GOOGLE_CALENDAR_ENABLED=false`.
2. Confirm `014_google_calendar_booking_bridge.sql` has applied.
3. Create the OAuth client and obtain the refresh token.
4. Configure the OAuth credentials in Render.
5. Set `GOOGLE_CALENDAR_AUTH_MODE=oauth_refresh_token`.
6. Set `GOOGLE_CALENDAR_ENABLED=true`.
7. Test an admin-created busy event blocking a Shiloh booking.
8. Test a Shiloh booking appearing in the shared calendar.
9. Test cancellation removing the shared-calendar event.
10. Only after these pass, expose conversational client booking through the same booking primitives.
