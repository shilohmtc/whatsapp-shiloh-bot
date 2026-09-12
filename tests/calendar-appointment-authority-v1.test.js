const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  evaluateCalendarAuthority,
  operationsForAuthority,
} = require('../src/services/calendarAuthorization');
const { calendarAppointmentDetailsClientScript } = require('../src/presentation/calendarAppointmentDetailsUx');
const {
  renderCalendarRetrospectiveBookingPage,
  calendarRetrospectiveBookingClientScript,
} = require('../src/presentation/calendarRetrospectiveBookingV1Ux');

const EDIT_PERMISSIONS = {
  'appointment:view': true,
  'calendar:booking:reschedule': true,
  'calendar:booking:cancel': true,
  'calendar:booking:reassign': true,
};

function authority(name, permissions = EDIT_PERMISSIONS) {
  return evaluateCalendarAuthority({
    id: 10,
    display_name: name,
    admin_active: true,
    staff_id: null,
    staff_status: null,
    business_role: 'booking_operator',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions,
  });
}

test('Calendar view and edit remain separate canonical authorities', () => {
  const reader = authority('Any active Calendar viewer', { 'appointment:view': true });
  assert.ok(reader);
  assert.deepEqual(operationsForAuthority(reader), []);
  const editor = authority('Any appointment editor');
  assert.deepEqual(operationsForAuthority(editor), [
    'appointment:reschedule',
    'appointment:cancel',
    'appointment:reassign',
  ]);
});

test('Christel and Reception can share the same capability/scope tuple without name branches', () => {
  const christel = authority('Christel');
  const reception = authority('Reception');
  assert.deepEqual(
    { calendarScope: christel.calendarScope, serviceScope: christel.serviceScope, capabilities: christel.capabilities },
    { calendarScope: reception.calendarScope, serviceScope: reception.serviceScope, capabilities: reception.capabilities },
  );
});

test('JP test elevation is removable by canonical permission data only', () => {
  assert.equal(operationsForAuthority(authority('JP', EDIT_PERMISSIONS)).length, 3);
  assert.deepEqual(operationsForAuthority(authority('JP', { 'appointment:view': true })), []);
});

test('every visible canonical appointment is enhanced for read-only details independently of edit attributes', () => {
  const script = calendarAppointmentDetailsClientScript();
  assert.match(script, /event-card\[data-kind=\\"appointment\\"\]\[data-canonical=\\"true\\"\]/);
  assert.match(script, /appointmentDetailsReady/);
  assert.match(script, /setAttribute\('role','button'\)/);
  assert.match(script, /setAttribute\('tabindex','0'\)/);
  assert.match(script, /min-height:44px/);
  assert.match(script, /appointmentManagementTarget==='true'/);
});

test('past appointment UX exposes Custom service and Add New Appointment from production renderer', () => {
  const html = renderCalendarRetrospectiveBookingPage({ options: { staff: [], services: [] } });
  const script = calendarRetrospectiveBookingClientScript();
  assert.match(html, />Custom service</);
  assert.match(html, /data-custom-service-field/);
  assert.match(html, /does not create a Shiloh service or catalogue entry/);
  assert.match(html, /data-add-past/);
  assert.match(script, /customServiceName/);
  assert.match(script, /window\.location\.reload/);
});

test('custom historical service persistence never creates a canonical service record', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'calendarRetrospectiveBookingV1.js'), 'utf8');
  assert.match(source, /appointment_services\(appointment_id,service_id/);
  assert.match(source, /VALUES\(\$1,NULL,1,\$2,NULL,\$3\)/);
  assert.match(source, /catalogueServiceCreated: false/);
  assert.doesNotMatch(source, /INSERT\s+INTO\s+services/i);
  assert.doesNotMatch(source, /UPDATE\s+services/i);
});

test('custom service remains bounded by canonical record-past and all-business service authority', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'calendarRetrospectiveBookingV1.js'), 'utf8');
  assert.match(source, /CALENDAR_CAPABILITIES\.BOOKING_CREATE/);
  assert.match(source, /CALENDAR_CAPABILITIES\.RECORD_PAST/);
  assert.match(source, /authority\.serviceScope !== 'all_services'/);
  assert.match(source, /calendarScopeAllowsBookingTarget/);
  assert.match(source, /retrospectiveClientAllows/);
});
