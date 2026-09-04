from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one replacement target, found {count}')
    p.write_text(text.replace(old, new, 1))


status_path = 'src/services/whatsappStatusEvidence.js'
old = """    const result = await db.query(
      `/* whatsappStatusEvidence:persist */
       UPDATE customer_message_deliveries
          SET ${column}=COALESCE(${column}, $2::timestamptz),
              provider_error=CASE
                WHEN $3::jsonb IS NOT NULL THEN COALESCE(provider_error, $3::jsonb)
                ELSE provider_error
              END,
              updated_at=NOW()
        WHERE provider_message_id=$1
      RETURNING appointment_id, message_kind`,
      [metaMessageId, occurredAt.toISOString(), providerError]
    );
    return {
      matched: Array.isArray(result.rows) ? result.rows.length : Number(result.rowCount || 0),
      providerStatus,
      occurredAt: occurredAt.toISOString(),
    };
"""
new = """    const asyncFailure = providerStatus === 'failed';
    const result = await db.query(
      `/* whatsappStatusEvidence:persist */
       UPDATE customer_message_deliveries
          SET ${column}=COALESCE(${column}, $2::timestamptz),
              provider_error=CASE
                WHEN $3::jsonb IS NOT NULL THEN COALESCE(provider_error, $3::jsonb)
                ELSE provider_error
              END,
              status=CASE
                WHEN $4::boolean
                 AND message_kind='booking_confirmation'
                 AND status='sent'
                 AND provider_delivered_at IS NULL
                 AND provider_read_at IS NULL
                 AND (provider_sent_at IS NULL OR $2::timestamptz > provider_sent_at)
                THEN 'failed'
                ELSE status
              END,
              next_attempt_at=CASE
                WHEN $4::boolean
                 AND message_kind='booking_confirmation'
                 AND status='sent'
                 AND provider_delivered_at IS NULL
                 AND provider_read_at IS NULL
                 AND (provider_sent_at IS NULL OR $2::timestamptz > provider_sent_at)
                THEN NOW()+INTERVAL '5 minutes'
                ELSE next_attempt_at
              END,
              last_error=CASE
                WHEN $4::boolean
                 AND message_kind='booking_confirmation'
                 AND status='sent'
                 AND provider_delivered_at IS NULL
                 AND provider_read_at IS NULL
                 AND (provider_sent_at IS NULL OR $2::timestamptz > provider_sent_at)
                THEN 'provider_async_failed'
                ELSE last_error
              END,
              updated_at=NOW()
        WHERE provider_message_id=$1
      RETURNING appointment_id, message_kind, status, last_error`,
      [metaMessageId, occurredAt.toISOString(), providerError, asyncFailure]
    );
    const rows = Array.isArray(result.rows) ? result.rows : [];
    return {
      matched: rows.length || Number(result.rowCount || 0),
      providerStatus,
      occurredAt: occurredAt.toISOString(),
      retryReopened: rows.some(row => row.message_kind === 'booking_confirmation'
        && row.status === 'failed' && row.last_error === 'provider_async_failed'),
    };
"""
replace_once(status_path, old, new)

booking_path = 'src/services/customerBookingConfirmation.js'
replace_once(
    booking_path,
    "const BOOKING_CONFIRMATION_RECOVERY_STALE_MS = 10 * 60 * 1000;\n",
    "const BOOKING_CONFIRMATION_RECOVERY_STALE_MS = 10 * 60 * 1000;\nconst MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS = 3;\n",
)
old_flush = """async function flushCustomerBookingConfirmations(){
  await ensureDeliveryTable();
  const due=await pool.query(`
    SELECT appointment_id
      FROM customer_message_deliveries
     WHERE message_kind='booking_confirmation'
       AND status IN ('pending','failed')
       AND next_attempt_at<=NOW()
     ORDER BY next_attempt_at,appointment_id
     LIMIT 25`);
  const results=[];
  for(const row of due.rows){
    results.push({appointmentId:Number(row.appointment_id),result:await sendCustomerBookingConfirmationForAppointment(row.appointment_id)});
  }
  return {attempted:results.length,results};
}
"""
new_flush = """async function flushCustomerBookingConfirmations(){
  await ensureDeliveryTable();
  const due=await pool.query(`
    SELECT appointment_id,last_error,attempt_count
      FROM customer_message_deliveries
     WHERE message_kind='booking_confirmation'
       AND status IN ('pending','failed')
       AND next_attempt_at<=NOW()
       AND (COALESCE(last_error,'')<>'provider_async_failed'
         OR attempt_count<${MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS})
     ORDER BY next_attempt_at,appointment_id
     LIMIT 25`);
  const results=[];
  for(const row of due.rows){
    const automaticProviderRecovery=String(row.last_error||'')==='provider_async_failed';
    results.push({
      appointmentId:Number(row.appointment_id),
      result:await sendCustomerBookingConfirmationForAppointment(
        row.appointment_id,
        automaticProviderRecovery?{recovery:true}:{}
      ),
    });
  }
  return {attempted:results.length,results};
}
"""
replace_once(booking_path, old_flush, new_flush)
replace_once(
    booking_path,
    'BOOKING_CONFIRMATION_RETRY_MS,BOOKING_CONFIRMATION_RECOVERY_STALE_MS};',
    'BOOKING_CONFIRMATION_RETRY_MS,BOOKING_CONFIRMATION_RECOVERY_STALE_MS,MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS};',
)

ux_path = 'src/presentation/calendarOperationalMutationsUx.js'
request_line = "async function request(path,method,payload){var token=await csrf();var response=await fetch(API+path,{method:method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':token},body:JSON.stringify(payload||{})});token='';var body=await json(response);if(!response.ok){var error=new Error(body.error||'The canonical Calendar operation failed closed.');error.code=body.code;throw error;}return body;}\n"
read_line = "async function read(path){var response=await fetch(API+path,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});var body=await json(response);if(!response.ok){var error=new Error(body.error||'The requested Workspace evidence is unavailable.');error.code=body.code;throw error;}return body;}\n"
replace_once(ux_path, request_line, request_line + read_line)

close_line = "function closePanel(){var panel=managementPanel();activeAppointmentCard=null;if(panel&&panel.open)panel.close();}\n"
helpers = """function ensureBookingConfirmationPanel(panel){var section=one('[data-panel-confirmation]',panel);if(section)return section;section=document.createElement('section');section.className='panel-summary';section.dataset.panelConfirmation='true';section.hidden=true;section.innerHTML='<span class=\"eyebrow\">Communication</span><strong data-panel-confirmation-status>Checking booking confirmation…</strong><span data-panel-confirmation-evidence></span><span data-panel-confirmation-reason></span><button class=\"event-operation\" type=\"button\" data-booking-confirmation-recover hidden>Retry booking confirmation</button>';var actions=one('.panel-actions',panel);if(actions&&actions.parentNode)actions.parentNode.insertBefore(section,actions);else one('.management-card',panel).appendChild(section);return section;}
function formatConfirmationEvidence(value){if(!value)return'';var date=new Date(value);if(Number.isNaN(date.getTime()))return'';try{return new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Johannesburg'}).format(date);}catch(_error){return date.toISOString();}}
function resetBookingConfirmation(panel){var section=ensureBookingConfirmationPanel(panel);section.hidden=false;one('[data-panel-confirmation-status]',section).textContent='Checking booking confirmation…';one('[data-panel-confirmation-evidence]',section).textContent='';one('[data-panel-confirmation-reason]',section).textContent='';var button=one('[data-booking-confirmation-recover]',section);button.hidden=true;button.disabled=false;button.removeAttribute('data-appointment-id');}
async function loadBookingConfirmation(appointmentId,panel){var section=ensureBookingConfirmationPanel(panel);try{var state=await read('/appointments/'+appointmentId+'/booking-confirmation');if(!activeAppointmentCard||Number(activeAppointmentCard.dataset.appointmentId)!==Number(appointmentId))return;var confirmation=state.confirmation||{};section.hidden=false;one('[data-panel-confirmation-status]',section).textContent='Booking confirmation: '+String(confirmation.statusLabel||'Unknown / uncertain');var evidence=formatConfirmationEvidence(confirmation.lastEvidenceAt);one('[data-panel-confirmation-evidence]',section).textContent=evidence?'Last evidence: '+evidence:'';one('[data-panel-confirmation-reason]',section).textContent=state.reasonMessage||'';var button=one('[data-booking-confirmation-recover]',section);button.hidden=state.canRecover!==true;button.disabled=false;if(state.canRecover===true){button.dataset.appointmentId=String(appointmentId);button.textContent=state.actionLabel||'Retry booking confirmation';}else button.removeAttribute('data-appointment-id');}catch(error){if(error.code==='WORKSPACE_CLIENT_NOTIFY_FORBIDDEN'){section.hidden=true;return;}section.hidden=false;one('[data-panel-confirmation-status]',section).textContent='Booking confirmation status unavailable';one('[data-panel-confirmation-evidence]',section).textContent='';one('[data-panel-confirmation-reason]',section).textContent=error.message||'Refresh Calendar and retry.';one('[data-booking-confirmation-recover]',section).hidden=true;}}
"""
replace_once(ux_path, close_line, close_line + helpers)
replace_once(
    ux_path,
    "if(cancel){cancel.reset();}panel.showModal();}\n",
    "if(cancel){cancel.reset();}resetBookingConfirmation(panel);panel.showModal();loadBookingConfirmation(data.id,panel);}\n",
)

test_path = Path('tests/booking-confirmation-async-provider-retry.test.js')
if test_path.exists():
    raise SystemExit(f'{test_path}: already exists')
test_path.write_text(r'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createWhatsAppStatusEvidenceService } = require('../src/services/whatsappStatusEvidence');
const { MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS } = require('../src/services/customerBookingConfirmation');
const { calendarOperationalMutationsClientScript } = require('../src/presentation/calendarOperationalMutationsUx');

test('current async booking-confirmation failure reopens canonical queue after provider acceptance', async () => {
  let call = null;
  const db = { async query(sql, params) {
    call = { sql: String(sql), params };
    return { rows: [{ appointment_id: 633, message_kind: 'booking_confirmation', status: 'failed', last_error: 'provider_async_failed' }], rowCount: 1 };
  } };
  const service = createWhatsAppStatusEvidenceService({ db, now: () => new Date('2026-09-04T12:00:00Z') });
  const result = await service.persistStatus({ metaMessageId: 'wamid.current', providerStatus: 'failed', providerTimestamp: '1788523200', providerError: { code: 131042 } });
  assert.equal(result.matched, 1);
  assert.equal(result.retryReopened, true);
  assert.equal(call.params[0], 'wamid.current');
  assert.equal(call.params[3], true);
  assert.match(call.sql, /WHERE provider_message_id=\$1/);
  assert.match(call.sql, /message_kind='booking_confirmation'/);
  assert.match(call.sql, /status='sent'/);
  assert.match(call.sql, /provider_delivered_at IS NULL/);
  assert.match(call.sql, /provider_read_at IS NULL/);
  assert.match(call.sql, /\$2::timestamptz > provider_sent_at/);
  assert.match(call.sql, /THEN NOW\(\)\+INTERVAL '5 minutes'/);
  assert.match(call.sql, /THEN 'provider_async_failed'/);
});

test('non-failed provider callbacks cannot request queue reopening', async () => {
  let params = null;
  const db = { async query(_sql, values) {
    params = values;
    return { rows: [{ appointment_id: 633, message_kind: 'booking_confirmation', status: 'sent', last_error: null }], rowCount: 1 };
  } };
  const service = createWhatsAppStatusEvidenceService({ db });
  const result = await service.persistStatus({ metaMessageId: 'wamid.current', providerStatus: 'delivered', providerTimestamp: '1788523201' });
  assert.equal(params[3], false);
  assert.equal(result.retryReopened, false);
});

test('automatic async-provider retry is capped and routed through canonical recovery semantics', () => {
  assert.equal(MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS, 3);
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'customerBookingConfirmation.js'), 'utf8');
  assert.match(source, /attempt_count<\$\{MAX_AUTOMATIC_ASYNC_PROVIDER_ATTEMPTS\}/);
  assert.match(source, /automaticProviderRecovery\?\{recovery:true\}:\{\}/);
});

test('Manage Appointment loads sanitized confirmation evidence and reuses the canonical recovery endpoint', () => {
  const script = calendarOperationalMutationsClientScript();
  assert.match(script, /data-panel-confirmation/);
  assert.match(script, /booking-confirmation/);
  assert.match(script, /Booking confirmation: /);
  assert.match(script, /WORKSPACE_CLIENT_NOTIFY_FORBIDDEN/);
  assert.match(script, /data-booking-confirmation-recover/);
  assert.match(script, /booking-confirmation\/recover/);
  assert.doesNotMatch(script, /provider_message_id|providerError|provider_error/);
});
''')
