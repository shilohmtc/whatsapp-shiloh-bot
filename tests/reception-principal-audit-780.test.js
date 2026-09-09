'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const audit = require('../src/services/receptionPrincipalAudit780');

test('#780 sanitizer exposes only operational authority', () => {
  const projected = audit.sanitizePrincipal({
    id: 7, staff_id: null, display_name: 'Shiloh Reception', active: true,
    role: 'receptionist', business_role: 'booking_operator', calendar_scope: 'all_business', service_scope: 'all_services', staff_scope: '',
    permissions: { 'appointment:view': true, 'client:lookup': true },
  }, { includeDisplayName: true });
  assert.equal(projected.displayName, 'Shiloh Reception');
  assert.deepEqual(projected.capabilities, ['appointment:view', 'client:lookup']);
});

test('#780 audit source is read-only and exact-target bounded', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'receptionPrincipalAudit780.js'), 'utf8');
  assert.match(source, /TARGET_NAME = 'Shiloh Reception'/);
  assert.match(source, /business_role='booking_operator'/);
  assert.doesNotMatch(source, /\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bALTER\b|\bDROP\b/i);
});

test('#780 configured audit is disabled unless explicitly true', async () => {
  const result = await audit.runConfiguredAudit({ env: {}, db: { query() { throw new Error('must not query'); } }, log: { info() {} } });
  assert.deepEqual(result, { status: 'disabled' });
});
