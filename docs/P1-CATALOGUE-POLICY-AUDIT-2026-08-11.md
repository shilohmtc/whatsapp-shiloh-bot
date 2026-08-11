# P1 Catalogue & Policy Cross-Surface Audit — 11 Aug 2026

## Scope and safety

This audit reconciles the live Shiloh CRM catalogue, Shiloh WhatsApp/customer-facing logic, and the current public Goldie booking page. No client messages were sent, no appointment records were altered, and Goldie remains connected pending its final exit gate.

The Render direct read-only Postgres connector remains unavailable because of its SSL/TLS negotiation issue, so the production CRM catalogue was verified through Shiloh's sanitized read-only `/audit-read/catalogue/status` endpoint and a read-only GitHub Actions fetch. That endpoint exposes only public-business service/category/duration/price data and no client, appointment, staff-contact or external-ID data.

## Production Shiloh catalogue — verified

Live production snapshot generated 11 Aug 2026 at 08:35:01Z:

- 49 active services.
- 14 active categories.
- Legacy service-name scan: PASS — no known legacy spelling/name findings remain in the active CRM catalogue.
- Price presentation: PASS — every active service has a price or display-price presentation.
- Duration presentation: PASS — every active service has a positive duration.

The active CRM catalogue is therefore the authoritative source for current service names, prices and durations.

## Current Goldie discrepancies

The current public Goldie page still contains legacy presentation and service availability that does not match the authoritative Shiloh CRM catalogue. Confirmed examples include:

- `Quick Relieve: Back & Neck (45 min)` vs Shiloh `Quick Relief: Back & Neck (45 min)`.
- `Targated Area Specific Sports Massage` vs Shiloh `Targeted Area-Specific Sports Massage`.
- `Hot Stone Masage` vs Shiloh `Hot Stone Massage`.
- `Sculp Delux` vs Shiloh `Sculpt Deluxe`.
- Goldie still publicly offers `Toe Gel Application`; this is not an active standalone Shiloh CRM service.
- Goldie still publicly offers `Pressotherapy Single Session`; there is no active Pressotherapy category/service in the current Shiloh CRM catalogue.
- Historical Goldie-only/retired offerings such as Waxing must not be treated as current simply because they remain in Goldie/legacy knowledge.

These discrepancies are evidence that Goldie must remain a legacy migration source, not the source of truth for current offerings.

## Shiloh catalogue integrity protections deployed

### Booking flow

Commit `ba7f5940993fc7408fba2fecdc58ece90f4294b2` changes booking service verification to fail closed against `services.status='active'` in the Shiloh CRM.

- Exact active CRM service names can validate.
- Safe aliases validate only when they resolve uniquely.
- Ambiguous generic service text fails closed.
- Retired Goldie-only services do not validate as current offerings.
- If CRM verification is unavailable, service verification fails closed rather than falling back to Goldie knowledge.

Regression coverage explicitly includes `Toe Gel Application`, `Pressotherapy Single Session`, `Waxing`, and ambiguous `Medi-Heel` matching.

### Free-form WhatsApp/AI answers

Commit `bfe690836eef6e6ea854fa2c8b559ec05a56c805` injects the active Shiloh CRM catalogue into AI business context ahead of retrieved legacy knowledge and makes it authoritative for current service names, prices and durations.

Goldie knowledge is explicitly classified as temporary legacy migration reference and must not override or create a current offering when it conflicts with, or is absent from, the active CRM catalogue.

GitHub CI passed and Render deployed `bfe690836eef6e6ea854fa2c8b559ec05a56c805` live.

## Policy parity

### Verified/consistent

- Business name/presentation is aligned to Shiloh Massage Therapy & Aesthetic Clinic.
- Public address baseline: 37 Jacobs St, Heidelberg, Heidelberg - GP, 1441, South Africa.
- Hours baseline: Monday-Friday 08:00-17:00; Saturday 08:00-14:00; Sunday closed. Shiloh availability remains CRM-hours driven.
- Cancellation baseline: 24-hour cancellation policy; late cancellation/missed appointment may incur a 50% fee. Shiloh cancellation/reschedule logic is consistent at the high-level policy layer.
- Google review destination currently used by Goldie matches the review destination already used in Shiloh customer-experience logic.
- Current Goldie social destinations observed on 11 Aug 2026:
  - Facebook: `https://www.facebook.com/profile.php?id=61581837991530`
  - Instagram: `https://www.instagram.com/shilohmassagestudio?igsh=b29mdGswbWlhYmdv&utm_source=qr`

### Owner confirmation required before policy parity can be closed

Goldie currently claims that **all treatments** are available as couples treatments and **all treatments** are available for group/spa-day bookings. This is broader than is operationally safe to assume across every massage and aesthetic treatment.

Recommended canonical wording:

> **Couples and group/spa-day bookings are available for selected treatments. Please contact Shiloh to arrange the most suitable option.**

Recommendation: retain the currently published Facebook and Instagram destinations as the official social links in Shiloh after Goldie retirement, unless the owner explicitly wants different accounts.

## P1 status after this audit

- ✅ Active Shiloh catalogue data quality verified.
- ✅ Current service verification protected from Goldie-only/retired offerings.
- ✅ Free-form AI service facts prioritize the active CRM catalogue over Goldie legacy knowledge.
- ✅ Shared Google Calendar presentation cleanup completed separately.
- 🟡 Business-policy parity awaits owner confirmation of the selected-treatment couples/group wording and retention of the current Facebook/Instagram accounts.
- 🟡 Goldie-vs-Shiloh public discrepancies are documented and contained, but Goldie remains publicly bookable until the final booking delta/cutover gate is proven.

## Final Goldie gate remains unchanged

Do not disable Goldie yet. Final sequence remains:

fresh Goldie export → compare future booking delta → import/reconcile any delta → verify CRM + calendars/staff routing → prove zero unresolved future bookings → disable Goldie public booking → retire Goldie legacy knowledge/sync dependencies.
