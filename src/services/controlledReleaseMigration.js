const migrationServiceDefault = require('./migrations');

const CONTROLLED_RELEASE_MIGRATION_ENV = 'SHILOH_CONTROLLED_RELEASE_MIGRATION';

class ControlledReleaseMigrationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ControlledReleaseMigrationError';
    this.code = code;
    this.details = details;
  }
}

function normalizeRequestedFilename(value) {
  const filename = String(value || '').trim();
  if (!filename) return null;
  if (!/^\d+_[A-Za-z0-9][A-Za-z0-9._-]*\.sql$/.test(filename)) {
    throw new ControlledReleaseMigrationError(
      'CONTROLLED_RELEASE_MIGRATION_INVALID_FILENAME',
      'Controlled release migration filename is malformed.',
      { filename }
    );
  }
  return filename;
}

async function readPendingAuthority(migrationService) {
  try {
    const state = await migrationService.verifyMigrationState();
    return { pending: Array.isArray(state.pending) ? state.pending : [] };
  } catch (error) {
    if (error?.code !== 'MIGRATION_PENDING') throw error;
    const pending = Array.isArray(error?.details?.filenames) ? error.details.filenames : [];
    return { pending };
  }
}

async function runControlledReleaseMigration({
  requestedFilename = process.env[CONTROLLED_RELEASE_MIGRATION_ENV],
  migrationService = migrationServiceDefault,
} = {}) {
  const filename = normalizeRequestedFilename(requestedFilename);
  if (!filename) {
    return { enabled: false, action: 'disabled', filename: null };
  }

  // verifyMigrationState refuses checksum drift and ledger rows absent from the
  // release before it reports pending migrations. Only MIGRATION_PENDING is
  // accepted as a pre-mutation state here.
  const { pending } = await readPendingAuthority(migrationService);
  const status = await migrationService.getMigrationStatus();
  const requested = status.find((item) => item.filename === filename);

  if (!requested) {
    throw new ControlledReleaseMigrationError(
      'CONTROLLED_RELEASE_MIGRATION_UNKNOWN_FILE',
      'Controlled release migration is not present in this release.',
      { filename }
    );
  }

  if (requested.applied) {
    if (requested.checksumMatches !== true) {
      throw new ControlledReleaseMigrationError(
        'CONTROLLED_RELEASE_MIGRATION_CHECKSUM_MISMATCH',
        'Controlled release migration checksum does not match the applied ledger row.',
        { filename }
      );
    }
    if (pending.length !== 0) {
      throw new ControlledReleaseMigrationError(
        'CONTROLLED_RELEASE_MIGRATION_UNEXPECTED_PENDING',
        'Controlled release migration is already applied but other migrations are pending.',
        { filename, pending }
      );
    }
    return { enabled: true, action: 'already_applied', filename };
  }

  if (pending.length !== 1 || pending[0] !== filename) {
    throw new ControlledReleaseMigrationError(
      'CONTROLLED_RELEASE_MIGRATION_PENDING_MISMATCH',
      'Controlled release migration refused because the requested file is not the sole pending migration.',
      { filename, pending }
    );
  }

  const applied = await migrationService.applyMigrationFile(filename);
  const finalState = await migrationService.verifyMigrationState();

  return {
    enabled: true,
    action: applied.applied ? 'applied' : 'already_applied',
    filename,
    migrationFiles: finalState.migrationFiles,
    ledgerRows: finalState.ledgerRows,
  };
}

module.exports = {
  CONTROLLED_RELEASE_MIGRATION_ENV,
  ControlledReleaseMigrationError,
  normalizeRequestedFilename,
  runControlledReleaseMigration,
};
