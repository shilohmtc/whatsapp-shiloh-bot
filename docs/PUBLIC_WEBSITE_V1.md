# Shiloh public website V1

## Outcome

The existing Render web service serves a complete public website at `https://app.shilohmtc.co.za/` while preserving the established booking, workspace, database, branch and webhook behavior.

Public routes:

- `/` — Home
- `/treatments` — the current client-bookable catalogue
- `/about` — clinic introduction
- `/contact` — visit and booking guidance
- `/book` — the existing canonical booking experience

## Authority boundaries

- Treatments, timing and prices come from `getPublicServiceCatalogue()`.
- Public website pages do not query availability, create appointments or write to the database.
- `/book` remains the canonical client booking handoff.
- `/health`, `/calendar`, `/admin`, Meta webhooks and the service/database topology are unchanged.

## Release and rollback

This release changes only application routes and presentation. It does not change DNS or create another Render service.

Rollback is a normal revert of the merge commit. That restores the prior JSON response at `/` and the previous standalone `/book` presentation while leaving booking data, staff access and integrations intact.

An apex-domain move from `app.shilohmtc.co.za` to `shilohmtc.co.za` is deliberately a separate DNS/custom-domain release. The website can be verified on the current canonical host first.
