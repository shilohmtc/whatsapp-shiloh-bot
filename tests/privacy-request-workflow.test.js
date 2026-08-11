const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflow = require('../src/services/privacyRequestWorkflow');

const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/privacy.js'), 'utf8');
const serviceSource = fs.readFileSync(path.join(__dirname, '../src/services/privacyRequestWorkflow.js'), 'utf8');
const migrationSource = fs.readFileSync(path.join(__dirname, '../migrations/042_privacy_request_workflow.sql'), 'utf8');

test('privacy workflow accepts only explicit rights actions and verification methods', () => {
  assert.equal(workflow.REQUEST_ACTIONS.has('deletion'), true);
  assert.equal(workflow.REQUEST_ACTIONS.has('access'), true);
  assert.equal(workflow.REQUEST_ACTIONS.has('anything'), false);
  assert.equal(workflow.VERIFICATION_METHODS.has('verified_whatsapp_contact'), true);
  assert.equal(workflow.VERIFICATION_METHODS.has('raw_document_upload'), false);
});

test('owner approval fails closed when secret is absent or incorrect', () => {
  const before = process.env.PRIVACY_OWNER_APPROVAL_KEY;
  delete process.env.PRIVACY_OWNER_APPROVAL_KEY;
  assert.equal(workflow.ownerApprovalConfigured(), false);
  assert.equal(workflow.ownerApprovalAuthorized('anything'), false);
  process.env.PRIVACY_OWNER_APPROVAL_KEY = 'synthetic-owner-secret';
  assert.equal(workflow.ownerApprovalConfigured(), true);
  assert.equal(workflow.ownerApprovalAuthorized('wrong'), false);
  assert.equal(workflow.ownerApprovalAuthorized('synthetic-owner-secret'), true);
  if (before === undefined) delete process.env.PRIVACY_OWNER_APPROVAL_KEY;
  else process.env.PRIVACY_OWNER_APPROVAL_KEY = before;
});

test('verification and authorization routes require a separate owner approval header', () => {
  assert.match(routeSource, /x-privacy-owner-key/);
  assert.match(routeSource, /requireOwnerApproval/);
  assert.match(routeSource, /requests\/:id\/verify/);
  assert.match(routeSource, /requests\/:id\/authorize/);
  assert.match(routeSource, /Privacy owner approval is not configured/);
  assert.match(routeSource, /Owner authorization required/);
});

test('workflow remains non-destructive even after owner authorization', () => {
  assert.match(serviceSource, /executionReady: false/);
  assert.match(serviceSource, /destructiveActionAllowed: false/);
  assert.match(serviceSource, /destructive_executor_not_enabled/);
  assert.doesNotMatch(serviceSource, /DELETE\s+FROM\s+clients/i);
  assert.doesNotMatch(serviceSource, /UPDATE\s+clients\s+SET/i);
  assert.doesNotMatch(routeSource, /router\.delete\(/i);
});

test('privacy request table stores minimal workflow evidence and restricts client deletion', () => {
  assert.match(migrationSource, /REFERENCES clients\(id\) ON DELETE RESTRICT/);
  assert.match(migrationSource, /verification_method/);
  assert.match(migrationSource, /identity_verified_at/);
  assert.match(migrationSource, /owner_authorized_at/);
  assert.doesNotMatch(migrationSource, /document_blob|identity_document|phone|date_of_birth/i);
});
