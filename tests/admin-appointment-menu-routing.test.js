const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const byDatePath=path.join(__dirname,'..','src','services','adminAppointmentsByDate.js');
const menuPath=path.join(__dirname,'..','src','services','adminAppointmentsMenu.js');
const webhookPath=path.join(__dirname,'..','src','controllers','webhookController.js');
const source=fs.readFileSync(byDatePath,'utf8');
const menu=fs.readFileSync(menuPath,'utf8');
const webhook=fs.readFileSync(webhookPath,'utf8');
const { relativeCommand,lastWeekBounds }=require(byDatePath);

test('numbered menu choices 1 and 2 map deterministically to today and tomorrow',()=>{
  assert.equal(relativeCommand('1'),'today');
  assert.equal(relativeCommand('2'),'tomorrow');
  assert.equal(relativeCommand("Today's clients"),'today');
  assert.equal(relativeCommand("Tomorrow's clients"),'tomorrow');
});

test('last week is a real Appointments list option and means a completed seven-day week',()=>{
  assert.equal(relativeCommand('last week'),'last_week');
  assert.equal(relativeCommand("Last week's clients"),'last_week');
  assert.match(menu,/id: 'last week'/);
  assert.match(menu,/Last week(?:'s)? clients/);
  const {start,end}=lastWeekBounds();
  const days=(new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/(24*3600*1000);
  assert.equal(days,7);
});

test('appointment date router runs before generic mobile/admin assistant fallthrough',()=>{
  const appointments=webhook.indexOf('processAdminAppointmentsByDateMessage(from,text)');
  const mobile=webhook.indexOf('processAdminMobileMenuMessage(from,text)');
  const assistant=webhook.indexOf('processAdminAssistantMessage(from,text)');
  assert.ok(appointments>=0 && mobile>=0 && assistant>=0);
  assert.ok(appointments < mobile);
  assert.ok(appointments < assistant);
});

test('appointment list query remains scope-bound and excludes cancelled appointments',()=>{
  assert.match(source,/a\.status <> 'cancelled'/);
  assert.match(source,/staff_services ss_scope/);
  assert.match(source,/authorized service scope/);
});
