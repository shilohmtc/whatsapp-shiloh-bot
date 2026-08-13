from pathlib import Path

master = Path('docs/SHILOH-OS-MASTER-STATUS.md')
m = master.read_text()
old6 = "6. 🟡 **Controlled booking creation acceptance** — backend commit path is policy-gated, transaction-locked, conflict-revalidated and Calendar-compensating, but the required real Dummy Test WhatsApp booking plus exact CRM/Calendar acceptance evidence has not been performed in this session."
new6 = "6. ✅ **Controlled booking creation acceptance** — real Dummy Test appointment #561 was created through WhatsApp for HIFU / Marietjie and independently evidenced on both `Shiloh — Bookings` and the Marietjie practitioner Calendar. The canonical commit path remains policy-gated, transaction-locked, service/practitioner eligibility-revalidated and Calendar-compensating. Direct connector-side CRM-row confirmation remains tooling-limited and must not be invented."
old7 = "7. 🟡 **Client self-service appointment management** — backend reschedule race/partial-Calendar failure defects were fixed and deployed in PR #158; final cancellation/reschedule acceptance still requires a real controlled Dummy Test appointment from item 6."
new7 = "7. 🟡 **Client self-service appointment management** — real Dummy Test rescheduling is now production-accepted: #561 moved from 11:00–11:30 to 10:00–10:30 with both Calendar mirrors verified, and PR #184's Today / Tomorrow / Choose another date UX was subsequently real-accepted. Cancellation of the same appointment remains the next human acceptance step."
for old, new in ((old6,new6),(old7,new7)):
    if old not in m: raise SystemExit('Master anchor missing')
    m = m.replace(old,new,1)
parity = "- ✅ **Christel / Abigail practitioner-parity audit (non-mutating):** current client flows use the same guarded booking, availability, commit, Calendar and appointment-change machinery after CRM-backed practitioner resolution. Massage is bounded to Christel/Abigail, Lymphatic Drainage to Abigail, and specific service/practitioner combinations are revalidated through `staff_services`. Existing regressions cover mixed Christel/Abigail slots, practitioner-bound slot IDs, final eligibility checks, explicit practitioner Calendar mappings and generic reschedule atomicity; `main` CI #467 is green. Exhaustive manual treatment-by-treatment testing is not required. This does not assert unseen live CRM mappings or future Calendar configuration; those remain authoritative and fail closed."
if parity not in m:
    m = m.replace(new7, new7+'\n'+parity,1)
master.write_text(m)

tracker = Path('docs/SHILOH-OS-PROJECT-TRACKER.md')
t = tracker.read_text()
c1_old = "| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Dummy Test has passed first-time registration, discovery, booking creation, reschedule mutation and the PR #184 reschedule date-choice UX in real WhatsApp. Continue cancellation and lifecycle/template acceptance without resetting the journey. |"
c1_new = "| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Dummy Test has passed first-time registration, discovery, booking creation, reschedule mutation and PR #184 date-choice UX. Non-mutating parity audit confirms Christel/Abigail use the same guarded booking/availability/commit engine; do not exhaustively retest every treatment. Continue cancellation and lifecycle/template acceptance. |"
if c1_old not in t: raise SystemExit('Tracker C1 anchor missing')
t = t.replace(c1_old,c1_new,1)
anchor = "| HIFU → Marietjie routing | 🟢 VERIFIED (REAL WHATSAPP) | Dummy Test selected HIFU and Shiloh displayed Marietjie as practitioner with date selection. |"
row = "| Christel / Abigail booking-engine parity | 🟢 VERIFIED (CODE + REGRESSION, NON-MUTATING) | Massage is bounded to CRM-eligible Christel/Abigail; Lymphatic is Abigail-only; resolved practitioners share availability, selected-slot revalidation, canonical commit, Calendar mirroring and appointment-change machinery. No exhaustive manual treatment matrix is required; live CRM mappings/config remain authoritative and fail-closed. |"
if anchor not in t: raise SystemExit('Tracker parity anchor missing')
if row not in t: t = t.replace(anchor,anchor+'\n'+row,1)
oldbase = "- Before this documentation-only reconciliation commit, GitHub `main` and Render production were positively aligned on **`66259e53ae2a897e089e895b322c712cbf4ef1c6`** from PR #185 (`Provision booking confirmation utility`), with Render deploy **`dep-d9v39h8ae00c73adc38g`** live on 2026-08-13."
newbase = "- Before this documentation-only practitioner-parity reconciliation, GitHub `main` and Render production were positively aligned on **`e8d1b6a299248d5a9ca9b480c27ac3f75ca11db4`** from PR #186, with Render deploy **`dep-d9v3goojo6nc73aaspt0`** live on 2026-08-13; push CI **#467** passed on that exact `main` SHA."
if oldbase not in t: raise SystemExit('Tracker baseline anchor missing')
t = t.replace(oldbase,newbase,1)
tracker.write_text(t)
