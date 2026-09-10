'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const {
  isSharedReceptionViewer,
  accountNavigationMetadata,
  receptionLockNavigationClientScript,
} = require('../src/routes/workspaceOperational');

const PASSKEY_ENV = { SHILOH_STAFF_PASSKEY_AUTH_ENABLED: 'true' };

function receptionViewer(overrides = {}) {
  return {
    id: 3,
    role: 'receptionist',
    businessRole: 'booking_operator',
    linkedStaffId: null,
    calendarScope: 'all_business',
    serviceScope: 'all_services',
    ...overrides,
  };
}

function runLockScript(navigationPayload) {
  const attributes = new Map();
  const listeners = new Map();
  const status = { textContent: '' };
  const button = {
    textContent: 'Sign out',
    dataset: {},
    setAttribute(name, value) { attributes.set(name, value); },
    addEventListener(name, handler) { listeners.set(name, handler); },
  };
  const context = {
    document: {
      querySelector(selector) {
        if (selector === '[data-shiloh-logout]') return button;
        if (selector === '[data-shiloh-calendar-access-status]') return status;
        return null;
      },
    },
    fetch: async (url, options) => {
      assert.equal(url, '/calendar/workspace/navigation');
      assert.equal(options.credentials, 'same-origin');
      return { ok: true, async json() { return navigationPayload; } };
    },
    setTimeout(handler) { handler(); },
  };
  vm.runInNewContext(receptionLockNavigationClientScript(PASSKEY_ENV), context);
  return new Promise((resolve) => setImmediate(() => resolve({ button, status, attributes, listeners })));
}

test('#808 recognizes only the canonical shared Reception principal shape', () => {
  assert.equal(isSharedReceptionViewer(receptionViewer()), true);
  assert.equal(isSharedReceptionViewer(receptionViewer({ role: 'owner' })), false);
  assert.equal(isSharedReceptionViewer(receptionViewer({ businessRole: 'business_admin' })), false);
  assert.equal(isSharedReceptionViewer(receptionViewer({ linkedStaffId: 9 })), false);
  assert.equal(isSharedReceptionViewer(receptionViewer({ calendarScope: 'own_practitioner' })), false);
  assert.equal(isSharedReceptionViewer(receptionViewer({ serviceScope: 'assigned_services' })), false);
});

test('#808 account metadata is presentation-only and requires passkey availability for Lock workspace', () => {
  assert.deepEqual(accountNavigationMetadata({ viewer: receptionViewer(), passkeyEnabled: true }), {
    mode: 'shared_reception',
    lockWorkspace: true,
  });
  assert.deepEqual(accountNavigationMetadata({ viewer: receptionViewer(), passkeyEnabled: false }), {
    mode: 'shared_reception',
    lockWorkspace: false,
  });
  assert.deepEqual(accountNavigationMetadata({ viewer: receptionViewer({ role: 'owner' }), passkeyEnabled: true }), {
    mode: 'personal',
    lockWorkspace: false,
  });
});

test('#808 shared Reception navigation relabels the existing logout control as Lock workspace', async () => {
  const proof = await runLockScript({ account: { mode: 'shared_reception', lockWorkspace: true } });
  assert.equal(proof.button.textContent, 'Lock workspace');
  assert.equal(proof.button.dataset.shilohLockWorkspace, 'true');
  assert.equal(proof.attributes.get('aria-label'), 'Lock Shiloh Workspace');
  assert.equal(proof.listeners.has('click'), true);
  proof.listeners.get('click')();
  assert.equal(proof.status.textContent, 'Locking workspace…');
});

test('#808 personal principals retain normal Sign out semantics', async () => {
  const proof = await runLockScript({ account: { mode: 'personal', lockWorkspace: false } });
  assert.equal(proof.button.textContent, 'Sign out');
  assert.equal(proof.button.dataset.shilohLockWorkspace, undefined);
  assert.equal(proof.attributes.has('aria-label'), false);
  assert.equal(proof.listeners.has('click'), false);
});

test('#808 Lock workspace presentation is absent when passkey auth is disabled', () => {
  assert.equal(receptionLockNavigationClientScript({ SHILOH_STAFF_PASSKEY_AUTH_ENABLED: 'false' }), '');
});
