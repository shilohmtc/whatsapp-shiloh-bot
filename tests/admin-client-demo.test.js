const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const servicePath = path.join(__dirname,'..','src','services','adminClientDemo.js');
const webhookPath = path.join(__dirname,'..','src','controllers','webhookController.js');
const migrationPath = path.join(__dirname,'..','migrations','041_christel_client_demo_mode.sql');
const source = fs.readFileSync(servicePath,'utf8');
const webhook = fs.readFileSync(webhookPath,'utf8');
const migration = fs.readFileSync(migrationPath,'utf8');
const { exactTime, localDateTime, practitionerName } = require(servicePath);

test('demo permission is explicit and granted only to Christel owner',()=>{
  assert.match(migration,/"demo:client":true/);
  assert.match(migration,/LOWER\(display_name\) = 'christel'/);
  assert.match(migration,/business_role = 'owner'/);
  assert.doesNotMatch(migration,/business_role IN \('owner','business_admin'\)/);
});

test('demo mode uses isolated virtual identity and never imports outbound WhatsApp sender',()=>{
  assert.match(source,/virtual_phone/);
  assert.match(source,/isolatedVirtualIdentity: true/);
  assert.match(source,/source='whatsapp_demo'/);
  assert.doesNotMatch(source,/require\(['"]\.\/whatsapp['"]\)/);
  assert.doesNotMatch(source,/sendWhatsAppMessage\(/);
});

test('demo handler runs before ordinary admin routing',()=>{
  const demo = webhook.indexOf('processAdminClientDemoMessage(from,text)');
  const slots = webhook.indexOf('processAdminAvailableSlotsMessage(from,text)');
  const assistant = webhook.indexOf('processAdminAssistantMessage(from,text)');
  assert.ok(demo >= 0 && slots >= 0 && assistant >= 0);
  assert.ok(demo < slots);
  assert.ok(demo < assistant);
});

test('demo booking purge is proof-bound and cannot be an arbitrary appointment delete',()=>{
  assert.match(source,/demo_appointment_id/);
  assert.match(source,/a\.source !== 'shiloh_demo_whatsapp'/);
  assert.match(source,/a\.client_source !== 'whatsapp_demo'/);
  assert.match(source,/custom_attributes\?\.demo_admin_id/);
  assert.match(source,/CONFIRM DELETE DEMO BOOKING/);
  assert.match(source,/DELETE FROM appointments WHERE id=\$1/);
  assert.match(source,/loyalty_redemptions WHERE appointment_id=\$1/);
  assert.doesNotMatch(source,/delete\s+(?:appointment|booking)\s+#?\\d+/i);
});

test('Google Calendar cleanup happens before the demo appointment delete',()=>{
  const cancel = source.indexOf('await cancelBookingEvent(row.event_id)');
  const remove = source.indexOf('DELETE FROM appointments WHERE id=$1');
  assert.ok(cancel >= 0 && remove >= 0 && cancel < remove);
});

test('demo booking is tagged distinctly and audited',()=>{
  assert.match(source,/source='shiloh_demo_whatsapp'/);
  assert.match(source,/admin\.demo_booking_created/);
  assert.match(source,/admin\.demo_booking_purged/);
  assert.match(source,/admin\.client_demo_started/);
});

test('demo time parser accepts exact client-like clock forms safely',()=>{
  assert.equal(exactTime('14:30'),'14:30');
  assert.equal(exactTime('2pm'),'14:00');
  assert.equal(exactTime('2:30pm'),'14:30');
  assert.equal(exactTime('12am'),'00:00');
  assert.equal(exactTime('12pm'),'12:00');
  assert.equal(exactTime('morning'),null);
  assert.equal(exactTime('25:00'),null);
  assert.equal(localDateTime('2026-08-20','2pm'),'20/08/2026 14:00');
});

test('demo practitioner aliases remain limited to client-bookable named practitioners',()=>{
  assert.equal(practitionerName('Christel'),'Christel');
  assert.equal(practitionerName('Abigail'),'Abigail');
  assert.equal(practitionerName('Marietjie'),'Marietjie');
  assert.equal(practitionerName('Mariethie'),'Marietjie');
  assert.equal(practitionerName('Savanna'),null);
  assert.equal(practitionerName('Pieter'),null);
});
