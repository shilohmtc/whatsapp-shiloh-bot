const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cleanupPath = path.join(__dirname,'..','src','services','demoMandatoryCleanup.js');
const demoPath = path.join(__dirname,'..','src','services','adminClientDemo.js');
const appPath = path.join(__dirname,'..','app.js');
const cleanup = fs.readFileSync(cleanupPath,'utf8');
const demo = fs.readFileSync(demoPath,'utf8');
const app = fs.readFileSync(appPath,'utf8');
const { intervalMs } = require(cleanupPath);

test('mandatory demo cleanup scheduler starts in production app lifecycle',()=>{
  assert.match(app,/startMandatoryDemoCleanupScheduler/);
  assert.ok(app.indexOf('startMandatoryDemoCleanupScheduler()') > app.indexOf('logger.info({ port: PORT }, "Shiloh started")'));
});

test('automatic cleanup only scans successfully created booked demo sessions',()=>{
  assert.match(cleanup,/WHERE s\.state='booked'/);
  assert.match(cleanup,/s\.demo_client_id IS NOT NULL/);
  assert.match(cleanup,/s\.demo_appointment_id IS NOT NULL/);
  assert.match(demo,/SET active=FALSE,state='booked',demo_appointment_id=\$2/);
});

test('cleanup is proof-bound to the synthetic client and demo appointment source',()=>{
  assert.match(cleanup,/row\.source !== 'shiloh_demo_whatsapp'/);
  assert.match(cleanup,/row\.client_source !== 'whatsapp_demo'/);
  assert.match(cleanup,/custom_attributes\?\.demo_admin_id/);
  assert.match(cleanup,/String\(row\.client_id\) !== String\(session\.demo_client_id\)/);
  assert.match(cleanup,/owner !== String\(session\.admin_id\)/);
});

test('calendar-backed demos must prove the canonical Google event before purge',()=>{
  assert.match(cleanup,/if \(calendarEnabled\(\)\)/);
  assert.match(cleanup,/if \(!row\.event_id\) return \{ verified:false, reason:'calendar_mapping_missing' \}/);
  assert.match(cleanup,/const event = await getBookingEvent\(row\.event_id\)/);
  assert.match(cleanup,/calendar_appointment_mismatch/);
  const verify = cleanup.indexOf('const verified = await verifyDemoBooking(session)');
  const purge = cleanup.indexOf('const result = await purgeVerifiedDemo(session, verified)');
  assert.ok(verify >= 0 && purge > verify);
});

test('Google cleanup happens before CRM appointment deletion and synthetic client removal',()=>{
  const cancel = cleanup.indexOf('await cancelBookingEvent(row.event_id)');
  const appointmentDelete = cleanup.indexOf('DELETE FROM appointments WHERE id=$1');
  const clientRemoval = cleanup.indexOf("'demo_removed_from_active_crm',true");
  assert.ok(cancel >= 0 && appointmentDelete > cancel && clientRemoval > appointmentDelete);
});

test('cleanup preserves audit evidence and never sends WhatsApp messages',()=>{
  assert.match(cleanup,/admin\.demo_booking_verified_for_cleanup/);
  assert.match(cleanup,/admin\.demo_booking_auto_purged/);
  assert.match(cleanup,/mandatoryCleanup: true/);
  assert.doesNotMatch(cleanup,/sendWhatsAppMessage/);
  assert.doesNotMatch(cleanup,/require\(['"]\.\/whatsapp['"]\)/);
});

test('cleanup failure is fail-closed and the next demo remains blocked by existing appointment',()=>{
  assert.match(cleanup,/Mandatory demo cleanup failed closed/);
  assert.match(demo,/if \(existing\?\.demo_appointment_id\)/);
  assert.match(demo,/Send \*DELETE DEMO BOOKING\* first/);
});

test('cleanup cadence is near-immediate but bounded',()=>{
  const old = process.env.DEMO_CLEANUP_INTERVAL_MS;
  delete process.env.DEMO_CLEANUP_INTERVAL_MS;
  assert.equal(intervalMs(),5000);
  process.env.DEMO_CLEANUP_INTERVAL_MS='10';
  assert.equal(intervalMs(),1000);
  if (old === undefined) delete process.env.DEMO_CLEANUP_INTERVAL_MS;
  else process.env.DEMO_CLEANUP_INTERVAL_MS=old;
});
