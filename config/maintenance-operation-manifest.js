'use strict';

const { createRegistry } = require('../src/maintenance/operationFramework');

// PR #437 authorizes repository framework only. No live operation is registered here.
// A concrete operation must be added in a separately reviewed commit and remains disabled
// until its exact live execution receives separate Control authorization.
const MANIFEST_VERSION = 1;
const OPERATIONS = Object.freeze([]);
const registry = createRegistry(OPERATIONS);

module.exports = {
  MANIFEST_VERSION,
  OPERATIONS,
  registry,
};
