# Shiloh OS — Data-subject rights lifecycle

## Status

P-PRIV-4 is intentionally being implemented in phases. The first production phase is inventory/preview only. It does not erase, anonymise, archive, update, or otherwise mutate client records.

## Why preview comes first

A privacy deletion/destruction request is not the same as the existing operational `Delete client` command. The operational command archives a client while preserving CRM and appointment history. A privacy request must instead identify every linked data class, determine what Shiloh remains authorised or required to retain, and erase or de-identify only the eligible categories.

Irreversible deletion is forbidden until the retention decision layer is explicit and tested.

## Preview endpoint

Protected internal endpoint:

`GET /admin/privacy/clients/:id/preview`

Authentication: existing `x-admin-key` admin API protection.

The response contains counts/classifications only. It does not return phone numbers, email addresses, DOB, appointment details, notes, treatment names, profile values, or raw audit metadata.

The preview discovers direct foreign-key references to the canonical `clients` table dynamically. This is deliberate: a future table that links to a client but has not yet been privacy-classified must fail closed as `manual_review_required` rather than being silently omitted or automatically deleted.

The preview also counts known phone-linked operational stores without returning the phone values themselves, including legacy profile/session mappings where those tables exist.

## Classification meanings

- `retain_pending_policy`: history that may have a legal, accounting, operational, dispute, or audit retention purpose; no automated deletion decision has been made.
- `erase_or_deidentify_candidate`: data that may be eligible for erasure or de-identification after identity verification and lawful-retention review.
- `erase_candidate_short_lived`: short-lived operational state expected to be removable when no longer necessary.
- `erase_candidate_operational`: temporary operational intent/state requiring a defined retention decision.
- `temporary_should_expire`: staging state already governed by short automatic retention controls.
- `manual_review_required`: unknown or sensitive data class that must never be auto-deleted or auto-retained without classification.

## Safety invariants

1. Preview is GET-only.
2. Preview performs database reads only.
3. Preview never exposes contact values in its response.
4. Preview never authorises a destructive action; `destructiveActionAllowed` is always `false` in this phase.
5. Unknown future client-linked tables fail closed to manual review.
6. Appointment history causes the proposed action to prefer de-identification after retention review rather than blind record deletion.
7. Existing operational archive behavior remains unchanged.

## Next phase

After production preview behavior is verified, P-PRIV-4 continues with a retention-decision policy and an owner-only request workflow. The eventual destructive/de-identification execution path must require explicit confirmation, write a non-sensitive audit record, avoid reintroducing erased personal data into audit metadata, and be covered by synthetic transaction/rollback tests before any production use.
