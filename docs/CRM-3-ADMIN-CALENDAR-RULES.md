# CRM-3 — Shared Calendar Admin Rules

The shared calendar is `Shiloh — Bookings`.

## Manual admin entries

For a manual appointment or practitioner-specific block, include the practitioner's exact CRM display name in the event title or description.

Recommended title pattern:

```text
CLIENT — SERVICE — STAFF
```

Example:

```text
Jane Smith — Full Body Swedish — Christel
```

Or use a description line:

```text
Staff: Christel
```

Shiloh-created events add the staff name automatically and also store private staff metadata.

## Clinic-wide blocks

A busy/opaque calendar event with no identifiable practitioner is treated as a clinic-wide block. Use this intentionally for closures, maintenance, meetings that stop all bookings, or other whole-clinic unavailability.

## Concurrent bookings

Events assigned to different practitioners may overlap. Shiloh only treats a shared-calendar event as a practitioner conflict when the event belongs to that practitioner, unless the event is an unassigned clinic-wide block.

## Transparent events

Events marked **Free** / transparent do not block bookings.
