# Shiloh OS — Reconciliation — Christel Service Catalogue Correction

Date: 2026-08-18
Owning workstream: CRM & Identity
Observers: Booking & Admin UX for catalogue/booking behaviour; Production / DevOps for CI, Render and database evidence; Control & Reconciliation for shared continuity and the separate description-approval gate.

## Authoritative business rule

The reviewed Christel catalogue correction is now durable production truth:

- service #27, **Full Body Sports Massage**, Goldie `1d734e8b-d21e-44c3-9a3f-b2a7165a7787`, remains as historical evidence but is **inactive**, has no practitioner eligibility and is absent from active public, client and Admin booking catalogues;
- service #34, **Sports Massage Full Body**, Goldie `46043512-d1df-4169-92b4-132160fca809`, remains a distinct active **120-minute** service;
- **Medi-Heel Pedicure (No Gel Toes) & Foot Massage** is 60 base + 0 processing + 0 extra = **60 minutes**;
- **Full Body Swedish** is 90 base + 0 processing + 0 extra = **90 minutes**;
- **Lower Back, Hip & Psoas Release** is 90 base + 0 processing + 0 extra = **90 minutes**;
- package-only service #65, **Sports Massage — Package Session**, remains active at **50 minutes**, with the existing four-session / R1,400 / 30-day package rule unchanged.

Durations are canonical service-level values. Existing practitioners who share one of the corrected service records inherit the same corrected total; no practitioner-specific duration override exists or is authorized.

## Implementation and safeguards

PR #328 added checksum-tracked migration `062_christel_service_catalogue_correction.sql` and a production startup bootstrap/verifier. Before mutation it queries every active service mapped to the one exact active Christel practitioner and aborts if an unreviewed processing/extra-time value exists. It then validates the exact target identities and reviewed source values inside one transaction.

The migration only:

- sets service #27 inactive;
- removes service #27 rows from `staff_services`;
- sets the two reviewed extra-time values and one reviewed processing-time value to zero.

It does not delete the service, appointments or `appointment_services`; change prices, names, descriptions, base durations or package rules; publish Goldie wording; or modify non-retired practitioner mappings. Postconditions re-query the target catalogue, active Christel scope, public eligibility, retained mappings, package rule and appointment-history counts before startup can accept traffic. Availability and booking continue to derive their reservation/end window from base + processing + extra canonical minutes.

## Delivery and production verification

- PR **#328**, head **`2f4fd605392c827509694d4cddb527656bb510f8`**, merged to `main` as **`78ece8d5bcf38aaf5d01dbaaefacde253bdef6e3`**.
- Focused catalogue/availability/booking regression passed **35 / 0** locally.
- Full post-rebase local regression passed **688 / 0**.
- GitHub Actions CI **#1051** passed **688 / 0** on Node 24.14.1.
- Render deploy **`dep-da2ba6f10e5c73cp6l60`** reached **LIVE** on the merge commit.
- Startup recorded migration `applied=true`, checksum verified, with Christel's active mapped service count changing **16 → 15**. The complete preflight list contained only the three reviewed non-zero buffers; the postflight list contained none.
- Postflight target evidence recorded #27 inactive/public-ineligible with no mapping; #34 active/public-eligible at 120; the three corrected services active/public-eligible at 60/90/90; and #65 active at 50.
- Non-retired mappings were byte-for-byte stable across the transaction. Postflight mappings remain: Medi-Heel No Gel → Christel; Full Body Swedish → Abigail, Christel, Pieter and Savanna; Lower Back, Hip & Psoas → Abigail, Christel and Pieter; service #34 → Abigail, Christel and Pieter; service #65 → Abigail and Christel.
- Linked appointment counts were **7 → 7** for service #27 and **17 → 17** for service #34.
- Package evidence remained service #65, four sessions, R1,400, 30 days, 24-hour cancellation notice, active.
- Production `/health` returned application/database OK. The sanitized `/audit-read/catalogue/status` returned 49 active services, omitted Full Body Sports Massage, and returned the corrected/retained duration fields. Production `/book` omitted the retired duplicate and rendered Sports Massage Full Body 120 min, Medi-Heel No Gel 60 min, Full Body Swedish 90 min, and Lower Back, Hip & Psoas Release 90 min.
- Post-deploy error/fatal logs were clear. No appointment, booking change or outbound message was manufactured for verification.

## Completed — do not redo

Do not reactivate or remap service #27, merge it into service #34, delete either service or their appointment history, change service #34 from 120 minutes, change service #65 from 50 minutes, restore the three removed buffers, introduce practitioner-specific duration overrides, or repeat the correction for evidence. Do not bulk-publish Goldie descriptions as part of this work.

## Remaining gates and ownership

The controlled catalogue correction has no remaining Booking & Admin UX or Production / DevOps dependency. Its runtime, database, public catalogue and booking-duration contracts are verified live.

Recovered Goldie wording remains a separate **Control/business approval gate** because of phone-number, treatment-identity, medical-claim and misplaced-text exceptions. Control & Reconciliation owns the approval decision and routing. Booking & Admin UX must not publish that wording before approval; CRM & Identity must not treat the verified snapshot hash as content approval. This separate gate does not reopen the completed catalogue correction.

Other project gates—including Meta/provider state, Google Business Profile access, historical attendance/#558 human truth and genuine lifecycle evidence—are unchanged and remain with their recorded owners.

## Final CRM & Identity checkpoint

- **What became authoritative:** service #27 is retired without history deletion; #34/#65 remain 120/50; the three reviewed canonical totals are 60/90/90; mappings, package rules and booking permissions outside the approved retirement are unchanged.
- **Completed / do not redo:** implementation, full regression, CI, merge, Render/database verification, public catalogue verification and booking-duration verification are complete. Do not repeat or expand the correction.
- **Unresolved:** only the separately gated Goldie description exceptions remain; they are not catalogue-correction work.
- **Reconciliation:** Project Tracker and durable Master reconciliation are completed by the reconciliation PR carrying this document.
- **Dependency owner:** Control & Reconciliation owns any future description approval/routing. Booking & Admin UX and Production / DevOps own no remaining dependency for this correction.
