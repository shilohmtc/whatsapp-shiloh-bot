const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { appointmentsInteractive } = require('../src/services/adminAppointmentsMenu');
const { commandForAdminButton } = require('../src/services/adminEarningsButtons');
const menuSource = fs.readFileSync(path.join(__dirname,'..','src','services','adminMobileMenu.js'),'utf8');

const commonPermissions = {
  'appointment:view': true,
  'appointment:create': true,
  'booking:update': true,
  'demo:client': true,
};

test('Appointments opens through a real WhatsApp reply button',()=>{
  assert.equal(commandForAdminButton('admin_menu_appointments'),'Appointments');
  assert.match(menuSource,/interactive:\{type:'button',body,buttons:\[\{id:'admin_menu_appointments',title:'Appointments'\}\]\}/);
  assert.match(menuSource,/if\(v==='appointments'\)/);
  assert.match(menuSource,/appointmentsInteractive\(admin\)/);
});

test('Abigail and Marietjie appointment panels contain a real Demo Client list row',()=>{
  for (const admin of [
    { display_name:'Abigail', business_role:'employee_practitioner', calendar_scope:'own_appointments', permissions:commonPermissions },
    { display_name:'Marietjie', business_role:'tenant_practitioner', calendar_scope:'own_services', permissions:commonPermissions },
  ]) {
    const panel = appointmentsInteractive(admin);
    assert.equal(panel.type,'list');
    assert.equal(panel.sectionTitle,'Appointments');
    assert.ok(panel.rows.some(row=>row.id==='demo client' && row.title==='🧪 Demo Client'));
    assert.ok(panel.rows.some(row=>row.id==='make a booking'));
    assert.ok(panel.rows.some(row=>row.id==='find an available time'));
    assert.ok(panel.rows.length <= 10);
  }
});

test('Demo Client is not exposed through the appointments panel without explicit permission',()=>{
  const panel = appointmentsInteractive({
    display_name:'Jean-Pierre',
    business_role:'business_admin',
    calendar_scope:'all_business',
    permissions:{'appointment:view':true,'appointment:create':true,'booking:update':true},
  });
  assert.equal(panel.rows.some(row=>row.id==='demo client'),false);
});

test('flat-menu fallback also places Demo Client in the Appointments section only when permitted',()=>{
  assert.match(menuSource,/key:'demo_client',label:'🧪 Demo Client',section:'Appointments'/);
  assert.match(menuSource,/if\(has\(admin,'demo:client'\)\)options\.push/);
  assert.match(menuSource,/selected\.key==='demo_client'/);
});
