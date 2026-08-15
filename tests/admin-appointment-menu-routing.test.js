const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const byDatePath=path.join(__dirname,'..','src','services','adminAppointmentsByDate.js');
const menuPath=path.join(__dirname,'..','src','services','adminAppointmentsMenu.js');
const mobileMenuPath=path.join(__dirname,'..','src','services','adminMobileMenu.js');
const buttonsPath=path.join(__dirname,'..','src','services','adminEarningsButtons.js');
const webhookPath=path.join(__dirname,'..','src','controllers','webhookController.js');
const source=fs.readFileSync(byDatePath,'utf8');
const menu=fs.readFileSync(menuPath,'utf8');
const mobileMenu=fs.readFileSync(mobileMenuPath,'utf8');
const buttons=fs.readFileSync(buttonsPath,'utf8');
const webhook=fs.readFileSync(webhookPath,'utf8');
const { relativeCommand,lastWeekBounds }=require(byDatePath);
const { commandForAdminButton }=require(buttonsPath);

test('today tomorrow and last-week stable IDs normalize deterministically',()=>{
  assert.equal(commandForAdminButton('admin_appointment_today'),'Appointments today');
  assert.equal(commandForAdminButton('admin_appointment_tomorrow'),'Appointments tomorrow');
  assert.equal(commandForAdminButton('admin_appointment_last_week'),'Appointments last week');
  assert.equal(relativeCommand('Appointments today'),'today');
  assert.equal(relativeCommand('Appointments tomorrow'),'tomorrow');
  assert.equal(relativeCommand('Appointments last week'),'last_week');
  assert.equal(relativeCommand("Today's clients"),'today');
  assert.equal(relativeCommand("Tomorrow's clients"),'tomorrow');
});

test('every advertised Appointments list action has a stable normalized route',()=>{
  const ids=[
    'admin_appointment_today','admin_appointment_tomorrow','admin_appointment_last_week',
    'admin_appointment_availability','admin_appointment_booking','admin_appointment_manage','admin_appointment_finalize',
  ];
  for(const id of ids){
    assert.match(menu,new RegExp(`id: '${id}'`));
    assert.ok(commandForAdminButton(id),`${id} must normalize at webhook ingress`);
  }
  assert.doesNotMatch(menu,/id: 'today'/);
  assert.doesNotMatch(menu,/id: 'tomorrow'/);
  assert.doesNotMatch(menu,/Demo Client is isolated training data/);
});

test('literal Admin is a canonical top-level admin menu entry command',()=>{
  assert.match(mobileMenu,/\['menu','admin menu','home','admin'\]\.includes\(v\)\|\|isGreeting\(raw\)/);
});

test('last week is a completed seven-day week',()=>{
  const {start,end}=lastWeekBounds();
  const days=(new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/(24*3600*1000);
  assert.equal(days,7);
});

test('interactive admin adapter gets first chance and appointment-date routing remains before assistant fallback',()=>{
  const adapter=webhook.indexOf('processAdminInteractiveMenuMessage(from,text)');
  const appointments=webhook.indexOf('processAdminAppointmentsByDateMessage(from,text)');
  const assistant=webhook.indexOf('processAdminAssistantMessage(from,text)');
  assert.ok(adapter>=0 && appointments>=0 && assistant>=0);
  assert.ok(adapter < appointments);
  assert.ok(appointments < assistant);
});

test('appointment list query remains scope-bound and excludes cancelled appointments',()=>{
  assert.match(source,/a\.status <> 'cancelled'/);
  assert.match(source,/staff_services ss_scope/);
  assert.match(source,/authorized service scope/);
});
