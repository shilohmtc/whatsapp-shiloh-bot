# Project Tracker Addendum — Emergency Christel Calendar Booking

Date: 2026-08-25

## Active highest-priority controlled unit

`SHILOH-EMERGENCY-CHRISTEL-CALENDAR-BOOKING`

Owner: 10 — Booking & Admin UX
Control: 00 — Control & Reconciliation
Support: 30 only for existing WhatsApp bootstrap integration as needed; 40 only for production activation/verification after implementation acceptance.

Status: AUTHORIZED FOR IMPLEMENTATION NOW.

Business reason: WhatsApp Admin booking is operational but too slow for current booking volume. Christel requires high-throughput browser Calendar booking for real client work now.

Required deliverable:
- Christel-only emergency browser bootstrap initiated from her existing canonical authenticated Shiloh Admin WhatsApp identity;
- exchange into existing opaque staff browser session architecture;
- Calendar Create Booking for canonical clients;
- eligible Christel and Abigail practitioner/service paths;
- existing canonical availability/conflict/CRM/approval/provider safeguards;
- booking visible immediately in SchedulingTimeline.

Do not wait for Meta staff-OTP convergence to implement this unit. The Meta convergence unit continues in parallel.

Not authorized: public/unauthenticated Calendar, broad staff rollout, reschedule, cancel, drag/drop, schedule/block/leave writes, Google authority changes.

Completion: implementation -> focused tests -> full regression -> PR -> CI -> merge -> Render verification -> Tracker/Master reconciliation -> 00 acceptance.
