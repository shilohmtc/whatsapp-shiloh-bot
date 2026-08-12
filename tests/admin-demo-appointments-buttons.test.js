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

test('legacy Demo Client control remains normalized for regression infrastructure only',()=>{
  assert.equal(commandForAdminButton('admin_menu_appointments'),'Appointments');
  assert.equal(commandForAdminButton('admin_demo_client_start'),'Demo Client');
  assert.match(menuSource,/if\(has\(admin,'demo:client'\)\)buttons\.push/);
});

test('production Appointments panels do not expose Demo Client even if a stale permission copy exists',()=>{
  for (const admin of [
    { display_name:'Abigail', business_role:'employee_practitioner', calendar_scope:'own_appointments', permissions:commonPermissions },
    { display_name:'Marietjie', business_role:'tenant_practitioner', calendar_scope:'own_services', permissions:commonPermissions },
    { display_name:'Christel', business_role:'owner', calendar_scope:'all_business', permissions:commonPermissions },
  ]) {
    const panel = appointmentsInteractive(admin);
    assert.equal(panel.type,'list');
    assert.equal(panel.sectionTitle,'Appointments');
    assert.equal(panel.rows.some(row=>/demo/i.test(row.id)||/Demo Client/i.test(row.title)),false);
    assert.ok(panel.rows.some(row=>row.id==='admin_appointment_booking'));
    assert.ok(panel.rows.some(row=>row.id==='admin_appointment_availability'));
    assert.ok(panel.rows.length <= 10);
  }
});

test('Jean-Pierre production Appointments panel also excludes Demo Client',()=>{
  const panel = appointmentsInteractive({
    display_name:'Jean-Pierre',
    business_role:'business_admin',
    calendar_scope:'all_business',
    permissions:{'appointment:view':true,'appointment:create':true,'booking:update':true},
  });
  assert.equal(panel.rows.some(row=>/demo/i.test(row.id)||/Demo Client/i.test(row.title)),false);
});

test('flat-menu Demo Client fallback remains permission-gated but production bootstrap revokes that permission',()=>{
  assert.match(menuSource,/key:'demo_client',label:'🧪 Demo Client',section:'Appointments'/);
  assert.match(menuSource,/if\(has\(admin,'demo:client'\)\)options\.push/);
  assert.match(menuSource,/selected\.key==='demo_client'/);
});
