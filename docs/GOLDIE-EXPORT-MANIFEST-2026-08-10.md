# Goldie Export Manifest — 10 Aug 2026

## Security decision

The raw Goldie ZIP is **not committed to GitHub**. It contains client names, contact information, notes/photos and appointment data. Putting that archive into Git history would create an unnecessary long-lived PII copy.

The exact export can instead be identified by this manifest and SHA-256 checksum. Keep the original ZIP in a secure private archive outside source control.

## Export identity

- Original filename: `export-2026-08-10.zip`
- Size: 618,788 bytes
- SHA-256: `be7d0bcbceb25175bb2a34b1fb6dcd242ed9f9bdd3917940a0490e4ea3381c47`
- Export contents:
  - `Appointments.csv` — 820 rows
  - `Appointments.ics`
  - `Clients.csv` — 976 rows in this fresh archive
  - `Services.csv` — 52 rows
  - `BusinessData.json`
  - client photo files
  - user/business photo

## Migration/reference observations

- The fresh `Clients.csv` contains 976 rows, while an earlier staged Goldie client import reported 975. Treat this as a one-record delta that must be understood if/when a final client reconciliation is performed.
- The export contains 52 services.
- Goldie staff mappings are **historical source data, not Shiloh authorization truth**. For example, the export associates Abigail with many Marietjie aesthetic services and lists freelancers on several massage services. Shiloh's staff-scoped rules override these legacy mappings.
- `Pressotherapy Single Session` exists in this export, but Pressotherapy was subsequently removed from Shiloh's offered services.
- `Lymphatic Drainage Reset Package` appears in Goldie with multiple staff values; Shiloh's authoritative rule is Abigail-only.

## Public Goldie page observations at audit time

The public Goldie booking page was still live on 10 Aug 2026 and exposed business hours, policies, loyalty information, staff, services and online booking.

Items to preserve or deliberately replace before disconnect:

- Hours: Mon–Fri 08:00–17:00, Sat 08:00–14:00, Sun closed.
- Cancellation policy: 24-hour cancellation; late cancellation/missed appointment incurs a 50% fee before the next booking.
- Loyalty program: 10% off reward after 5 visits.
- Address/contact/social/review links.
- Public copy states that treatments are available as couples treatments and for group/spa-day bookings; confirm whether this should remain universally true after staff/service authorization rules.

## Catalogue cleanup findings

The public Goldie page still showed `Pressotherapy Single Session`, so public Goldie and Shiloh are not yet catalogue-equivalent.

There are also many presentation issues worth fixing during catalogue polish, including examples such as:

- `Permanant Makeup` → `Permanent Makeup`
- `Mikroneedling` → `Microneedling`
- `BoiMicroneedling` → likely `BioMicroneedling`
- `Hot Stone Masage` → `Hot Stone Massage`
- `Targated Area Specific Sports Massage` → `Targeted Area-Specific Sports Massage`
- inconsistent currency formatting on variable-price services
- descriptions containing spelling/grammar errors and some embedded practitioner contact numbers

Do not blindly import Goldie's wording into Shiloh. Use it as source material, then publish a professionally edited canonical catalogue.

## Goldie exit rule

Before Goldie is disconnected, take a **new final export**, compare its future appointments against Shiloh, import only the delta, reconcile Google Calendar, and verify zero unresolved future bookings. This 10 Aug archive is a historical cross-reference, not the final disconnect snapshot.
