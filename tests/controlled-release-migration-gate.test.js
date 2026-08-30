const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  ControlledReleaseMigrationError,
  normalizeRequestedFilename,
  runControlledReleaseMigration,
} = require('../src/services/controlledReleaseMigration');

function migrationError(code, filenames = []) {
  const error = new Error(code);
  error.code = code;
  error.details = { filenames };
  return error;
}

test('production startup keeps one migration authority entrypoint and no apply-all startup path', () => {
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const verifier = fs.readFileSync(path.join(root, 'scripts/verify-migrations.js'), 'utf8');
  assert.match(pkg.scripts.start, /^node scripts\/verify-migrations\.js && node /);
  assert.doesNotMatch(pkg.scripts.start, /scripts\/migrate\.js|db:migrate|applyPendingMigrations/);
  assert.match(verifier, /runControlledReleaseMigration\(\)/);
  assert.match(verifier, /verifyMigrationState\(\)/);
  assert.doesNotMatch(verifier, /applyPendingMigrations/);
});

test('controlled release migration gate is a no-op when the flag is unset', async () => {
  const migrationService = new Proxy({}, {
    get() {
      throw new Error('migration service must not be touched when gate is disabled');
    },
  });
  const result = await runControlledReleaseMigration({ requestedFilename: '', migrationService });
  assert.deepEqual(result, { enabled: false, action: 'disabled', filename: null });
});

test('controlled release migration gate rejects malformed filenames before DB access', async () => {
  assert.throws(
    () => normalizeRequestedFilename('../089.sql'),
    (error) => error instanceof ControlledReleaseMigrationError
      && error.code === 'CONTROLLED_RELEASE_MIGRATION_INVALID_FILENAME'
  );
});

test('controlled release migration gate preserves checksum and unknown-ledger failures', async () => {
  for (const code of ['MIGRATION_CHECKSUM_MISMATCH', 'MIGRATION_LEDGER_UNKNOWN_FILE']) {
    const migrationService = {
      verifyMigrationState: async () => { throw migrationError(code); },
    };
    await assert.rejects(
      runControlledReleaseMigration({
        requestedFilename: '089_workspace_staff_view_capability.sql',
        migrationService,
      }),
      (error) => error.code === code
    );
  }
});

test('controlled release migration gate rejects unknown requested files', async () => {
  const migrationService = {
    verifyMigrationState: async () => { throw migrationError('MIGRATION_PENDING', ['089_workspace_staff_view_capability.sql']); },
    getMigrationStatus: async () => [],
  };
  await assert.rejects(
    runControlledReleaseMigration({
      requestedFilename: '089_workspace_staff_view_capability.sql',
      migrationService,
    }),
    (error) => error.code === 'CONTROLLED_RELEASE_MIGRATION_UNKNOWN_FILE'
  );
});

test('controlled release migration gate refuses extra or different pending migrations', async () => {
  const filename = '089_workspace_staff_view_capability.sql';
  for (const pending of [
    ['089_workspace_staff_view_capability.sql', '090_other.sql'],
    ['090_other.sql'],
  ]) {
    let applied = false;
    const migrationService = {
      verifyMigrationState: async () => { throw migrationError('MIGRATION_PENDING', pending); },
      getMigrationStatus: async () => [{ filename, applied: false, checksumMatches: null }],
      applyMigrationFile: async () => { applied = true; },
    };
    await assert.rejects(
      runControlledReleaseMigration({ requestedFilename: filename, migrationService }),
      (error) => error.code === 'CONTROLLED_RELEASE_MIGRATION_PENDING_MISMATCH'
    );
    assert.equal(applied, false);
  }
});

test('controlled release migration gate is idempotent when the requested migration is already applied', async () => {
  let applied = false;
  const filename = '089_workspace_staff_view_capability.sql';
  const migrationService = {
    verifyMigrationState: async () => ({ pending: [], migrationFiles: 93, ledgerRows: 93 }),
    getMigrationStatus: async () => [{ filename, applied: true, checksumMatches: true }],
    applyMigrationFile: async () => { applied = true; },
  };
  const result = await runControlledReleaseMigration({ requestedFilename: filename, migrationService });
  assert.deepEqual(result, { enabled: true, action: 'already_applied', filename });
  assert.equal(applied, false);
});

test('controlled release migration gate applies only the sole explicitly requested pending migration', async () => {
  const filename = '089_workspace_staff_view_capability.sql';
  const calls = [];
  let verifyCount = 0;
  const migrationService = {
    verifyMigrationState: async () => {
      verifyCount += 1;
      calls.push(`verify:${verifyCount}`);
      if (verifyCount === 1) throw migrationError('MIGRATION_PENDING', [filename]);
      return { pending: [], migrationFiles: 93, ledgerRows: 93 };
    },
    getMigrationStatus: async () => {
      calls.push('status');
      return [{ filename, applied: false, checksumMatches: null }];
    },
    applyMigrationFile: async (requested) => {
      calls.push(`apply:${requested}`);
      return { filename: requested, applied: true, checksumVerified: true };
    },
  };

  const result = await runControlledReleaseMigration({ requestedFilename: filename, migrationService });
  assert.deepEqual(result, {
    enabled: true,
    action: 'applied',
    filename,
    migrationFiles: 93,
    ledgerRows: 93,
  });
  assert.deepEqual(calls, ['verify:1', 'status', `apply:${filename}`, 'verify:2']);
});
