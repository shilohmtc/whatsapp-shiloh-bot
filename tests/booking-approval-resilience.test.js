const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('pending approval list and resend implementation is removed at cutover', () => {
  assert.equal(fs.existsSync(path.join(root, 'src/services/adminPendingBookingApprovals.js')), false);
  assert.doesNotMatch(source('src/controllers/webhookController.js'), /resend_booking_approval_|admin_action_pending_approvals/);
  assert.doesNotMatch(source('src/services/adminInteractiveMenu.js'), /Pending approvals|sendWhatsAppTemplate/);
});

test('legacy staff decision IDs cannot reach a booking mutation', () => {
  const webhook = source('src/controllers/webhookController.js');
  const approval = source('src/services/clientBookingApproval.js');
  assert.doesNotMatch(webhook, /booking_approval_(?:approve|decline)_/);
  assert.doesNotMatch(approval, /booking_approval_(?:approve|decline)_/);
  assert.match(source('src/services/adminAuthorityRetirement.js'), /booking_approval_\(\?:approve\|decline\)_/);
});
