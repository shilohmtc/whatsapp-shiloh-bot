# Shiloh OS Reconciliation — Public Booking Catalogue Phase 1

**Date:** 2026-08-17  
**Authoritative branch:** `main`  
**Workstream:** Public booking catalogue / Goldie replacement Phase 1

## Outcome

Phase 1 of Shiloh's own public booking catalogue is complete and production-verified at `/book`.

PR **#280 — Build Phase 1 Shiloh public service catalogue** was merged to `main`. The public page is now a read-only projection of Shiloh's canonical production service catalogue rather than a duplicated Goldie catalogue.

## Production behaviour

- `/book` renders Shiloh's current catalogue grouped by canonical service category.
- Public service cards display the canonical service name, duration, price, customer description and booking note when present.
- Service-specific **Book this treatment** actions hand the exact canonical service name to the existing Shiloh WhatsApp booking flow.
- The general **Ask Shiloh to help me choose** path remains available.
- Availability is **not** guessed or exposed by the webpage; it remains authoritative only inside the existing Shiloh booking flow.
- Existing production Shiloh visual assets under `/assets/service-images/*` are used for the Phase-1 branded presentation, so the page has no unresolved image references.
- Newly supplied clinic-atmosphere photographs remain approved for later visual enhancement; treatment/category photography can be attached progressively without changing the catalogue architecture.

## Safety / source-of-truth boundary

This work does **not** create a second service database. The webpage is presentation-only and does not mutate service rows, prices, durations, practitioner eligibility, appointments, availability, schedules or conflict rules.

Goldie is therefore historical/reference material for catalogue copy and assets only. Shiloh production data remains authoritative.

## Verification completed

- Full repository regression suite passed on the Phase-1 branch before merge.
- Production `/book` returned the new Phase-1 page.
- Production `/book/health` returned healthy WhatsApp configuration.
- Required Phase-1 static visual assets returned successfully from production.
- Service-specific WhatsApp handoff preserves the selected canonical service name.

## Continuation

The next public-booking enhancement is visual/content refinement rather than booking-engine replacement: progressively attach approved clinic/treatment photography and, where useful, improve public descriptions while preserving canonical Shiloh service identity and booking rules.

Do not reintroduce Goldie as an operational source of truth and do not duplicate pricing/service state in static webpage data.
