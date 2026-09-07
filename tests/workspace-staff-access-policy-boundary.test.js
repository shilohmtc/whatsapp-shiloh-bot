const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { finalizeAppointment } = require('../src/services/adminAppointmentFinalization');
const { createWorkspaceDashboardService } = require('../src/services/workspaceDashboard');
const { createWorkspaceStaffMutationRouter } = require('../src/routes/workspaceStaffMutations');
const { renderStaffDetailPage } = require('../src/presentation/workspaceStaffUx');
const { decorateStaffDetailAccessHtml, workspaceStaffAccessClientScript } = require('../src/presentation/workspaceStaffAccessUx');

const revision = '2026-09-05T06:30:00.000Z';
function principal(capability = true) {
  return { id: 91, staff_id: 17, display_name: 'Synthetic Practitioner', admin_active: true, staff_status: 'active',
    business_role: 'employee_practitioner', calendar_scope: 'own_appointments', service_scope: 'own_services',
    permissions: { 'appointment:view': true, 'booking:update': capability },
    calendarAuthority: { capabilities: ['appointment:view'], linkedStaffId: 17, businessRole: 'employee_practitioner', calendarScope: 'own_appointments', serviceScope: 'own_services' } };
}
function finalizationDatabase(assigned) {
  const calls = [];
  const query = async (text, params = []) => {
    const sql = text.replace(/\s+/g, ' ').trim(); calls.push({ sql, params });
    if (sql.includes('FROM appointments a')) {
      assert.match(sql, /FOR UPDATE OF a/);
      assert.equal(params[0], false); // No owner/business-wide shortcut.
      assert.equal(params[1], 17);
      // Even if the appointment pre-read returns a row, certification must independently decide.
      return { rows: [{ id: 51, client_id: 81, status: 'confirmed', updated_at: revision, starts_at: '2026-09-05T07:00:00Z', ends_at: '2026-09-05T08:00:00Z', total_price: 500 }] };
    }
    if (sql.includes('FROM staff')) return { rows: [{ id: 17 }] };
    if (sql.includes('FROM appointment_staff')) {
      // Match the real query's NULL filtering, rather than silently treating unresolved links as absent in the fixture.
      const ids = sql.includes('staff_id IS NOT NULL') ? assigned.filter(id => id !== null) : assigned;
      return { rows: [...new Set(ids)].map(staff_id => ({ staff_id })) };
    }
    return { rows: [], rowCount: 1 };
  };
  return { calls, connect: async () => ({ query, release() {} }) };
}
async function runFinalization(assigned, capability = true) {
  const db = finalizationDatabase(assigned);
  const service = createWorkspaceDashboardService({
    resolvePrincipal: async () => principal(capability),
    finalizeAppointmentFn: (admin, id, outcome, options) => finalizeAppointment(admin, id, outcome, { ...options, connectionPool: db }),
  });
  try {
    const result = await service.finalizeVisit({ adminId: 91, viewer: { calendarScope: 'own_staff', staffId: 17 }, appointmentId: 51, expectedRevision: revision, outcome: 'completed', now: new Date('2026-09-05T10:00:00Z') });
    return { result, db };
  } catch (error) { return { error, db }; }
}
test('global Workspace finalizer retains own success and independently rejects other/shared/missing assignments', async () => {
  assert.equal((await runFinalization([17])).result.ok, true);
  for (const assigned of [[18], [17, 18], [], [null]]) {
    const { error, db } = await runFinalization(assigned);
    assert.equal(error.httpStatus, 403);
    assert.equal(db.calls.some(c => /^(UPDATE|INSERT)/.test(c.sql)), false);
  }
});
test('lack of booking:update denies the real Dashboard-to-finalizer path before writes', async () => {
  const { error, db } = await runFinalization([17], false);
  assert.equal(error.httpStatus, 400);
  assert.equal(db.calls.length, 0);
});
test('#745 cannot offer booking:update: unresolved secondary assignment defeats complete ownership proof', async () => {
  const migration = fs.readFileSync(path.join(__dirname, '../migrations/005_crm_appointments_calendar.sql'), 'utf8');
  assert.match(migration, /staff_id BIGINT REFERENCES staff\(id\) ON DELETE SET NULL/);
  const { result, db } = await runFinalization([17, null]);
  assert.equal(result.ok, true, 'documents the existing authority gap; #745 must not expand access to it');
  assert.ok(db.calls.some(c => c.sql.includes('FROM appointment_staff') && c.sql.includes('staff_id IS NOT NULL')));
  assert.equal(fs.existsSync(path.join(__dirname, '../src/services/workspaceStaffAccessPolicy.js')), false, 'no optional-safe policy service remains');
  assert.doesNotMatch(workspaceStaffAccessClientScript(), /POLICY_SUFFIX|access\/policy|name="capability"/);
});
test('existing and incompatible Access principals are read-only with no misleading save/toggles/private material', () => {
  for (const access of [
    { businessRole: 'employee_practitioner', calendarScope: 'own_appointments', serviceScope: 'own_services', capabilities: ['appointment:view'] },
    { businessRole: 'owner', calendarScope: 'all_business', serviceScope: 'all_services', capabilities: ['staff:manage', 'booking:update'] },
  ]) {
    const model = { staff: { id: 17, display_name: 'Synthetic Practitioner', status: 'active', resource_type: 'practitioner', business_role: 'employee_practitioner' }, services: [], access, accessManageAllowed: true };
    const html = decorateStaffDetailAccessHtml(renderStaffDetailPage(model), model);
    assert.match(html, /data-staff-access-readonly/);
    assert.match(html, /No optional practitioner access changes are available/);
    assert.doesNotMatch(html, /Save access|data-access-policy-editor|name="capability"|data-staff-access-enable-form/);
    assert.doesNotMatch(html, /name="(password|whatsappNumber|totp|session)"/);
  }
  assert.doesNotMatch(workspaceStaffAccessClientScript(), /window\.confirm|\bconfirm\(/);
});
test('removed policy endpoint rejects all grants/escalations without calling any mutation service', async () => {
  let mutations = 0;
  const deniedMutation = async () => { mutations++; throw new Error('unexpected mutation'); };
  const app = express(); app.use(express.json());
  app.use('/calendar/team', createWorkspaceStaffMutationRouter({
    env: { SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true', SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true' },
    sessionService: { validateSessionToken: async () => ({ ok: true, adminId: 61 }), validateCsrfToken: () => true },
    service: new Proxy({}, { get: () => deniedMutation }),
    accessService: { enableWorkspaceAccess: deniedMutation }, accessCompletionService: { completeWorkspaceAccess: deniedMutation },
  }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const payload of [{ capabilities: ['booking:update'] }, { capabilities: ['staff_access:manage'] }, { capabilities: [] }, { calendar_scope: 'all_business', business_role: 'owner' }, { permissions: { arbitrary: true } }]) {
      const response = await fetch(`${origin}/calendar/team/17/access/policy`, { method: 'POST', headers: { 'content-type': 'application/json', origin, cookie: 'shiloh_staff_session=synthetic', 'x-shiloh-csrf-token': 'synthetic' }, body: JSON.stringify(payload) });
      assert.equal(response.status, 404);
    }
    assert.equal(mutations, 0);
  } finally { await new Promise(r => server.close(r)); }
});
