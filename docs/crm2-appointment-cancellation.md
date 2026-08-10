# CRM-2 appointment cancellation flow

Issue #62. This documents the required guarded admin cancellation contract while the existing booking implementation is being wired to the application service.

## Contract

- Accept a canonical appointment ID from an admin session.
- Load and display the exact appointment before any write.
- Require a short cancellation reason; `SKIP` is not accepted.
- Require explicit confirmation (`CONFIRM CANCELLATION`) before writing.
- Re-check appointment state immediately before the write.
- Cancel through the application's authoritative appointment write path; never mutate the database directly from the WhatsApp handler.
- Return the cancellation result and affected appointment ID.
- Regression: cancellation of a test appointment must not affect other appointments and the slot must become available only after the authoritative cancellation is committed.
