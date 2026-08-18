# Christel ↔ Abigail cross-confirm guard

This controlled change permits Christel and Abigail to confirm each other's pending Admin bookings without broadening booking-confirmation authority to other staff.

Safeguards:
- both the confirmer and preparer must be active Admin identities with `appointment:create`;
- only Admin identities whose first canonical Admin display-name token is exactly `Christel` or `Abigail` are eligible;
- if more than one eligible pending booking exists across the pair, Shiloh fails closed and will not guess;
- a cross-confirmed pending session is explicitly claimed by the confirmer before the existing booking confirmation routine runs;
- the existing confirmation routine still performs final CRM, clinic-hours, practitioner-schedule, conflict, shared Google Calendar, and practitioner Google Calendar checks;
- the cross-confirm claim writes an audit event containing both preparer and confirmer identity details;
- the normal booking-created audit remains attributed to the actual confirmer.

The change does not alter client identity rules, practitioner eligibility, appointment creation permissions, or the final conflict/provider guards.
