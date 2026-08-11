#!/usr/bin/env node
require('dotenv').config();

const { validateEnv } = require('../src/config/env');
const { closePool } = require('../src/db/pool');
const logger = require('../src/lib/logger');
const startupTestRequest = require('../config/shiloh-test-request.json');

const COMMANDS = {
  'db-migrate': {
    mutates: true,
    description: 'Apply pending database migrations.',
    run: async () => require('../src/services/migrations').applyPendingMigrations(),
  },
  'jean-pierre-identity-repair': {
    mutates: true,
    description: 'Run the guarded Jean-Pierre identity repair.',
    run: async () => require('../src/services/identityRepair').repairJeanPierreIdentity(),
  },
  'chenique-diagnostic': {
    mutates: false,
    description: 'Run the read-only Chenique identity diagnostic.',
    run: async () => require('../src/services/cheniqueDiagnostic').inspectCheniqueIdentity(),
  },
  'natasha-staff-repair': {
    mutates: true,
    description: 'Run the guarded Natasha practitioner assignment repair.',
    run: async () => require('../src/services/natashaStaffRepair').repairNatashaStaffAssignment(),
  },
  'crm6-smoke': {
    mutates: false,
    description: 'Run the CRM-6 production smoke test.',
    run: async () => require('../src/services/crm6ProductionSmokeTest').runCrm6ProductionSmokeTest(),
  },
  'p2-staff-smoke': {
    mutates: false,
    description: 'Run the P2 staff-scope rollout smoke test.',
    run: async () => require('../src/services/p2StaffRolloutSmokeTest').runP2StaffRolloutSmokeTest(),
  },
  'marietjie-calendar-rollout': {
    mutates: true,
    description: 'Run the guarded Marietjie calendar rollout using configured environment values.',
    run: async () => {
      process.env.RUN_MARIETJIE_CALENDAR_ROLLOUT = 'true';
      return require('../src/services/marietjieCalendarRollout').runMarietjieCalendarRolloutFromEnv();
    },
  },
  'abigail-calendar-rollout': {
    mutates: true,
    description: 'Run the guarded Abigail calendar rollout using configured environment values.',
    run: async () => {
      process.env.RUN_ABIGAIL_CALENDAR_ROLLOUT = 'true';
      return require('../src/services/abigailCalendarRollout').runAbigailCalendarRolloutFromEnv();
    },
  },
  'catalogue-polish': {
    mutates: true,
    description: 'Run the guarded catalogue/imported-client presentation cleanup.',
    run: async () => {
      process.env.RUN_CATALOGUE_POLISH = 'true';
      return require('../src/services/cataloguePolish').runCataloguePolishFromEnv();
    },
  },
  'startup-test-command': {
    mutates: false,
    description: 'Run the configured Shiloh startup test command explicitly.',
    run: async () => require('../src/services/startupTestCommand').runStartupTestCommand(startupTestRequest),
  },
  'goldie-future-import-dry-run': {
    mutates: false,
    description: 'Reconcile the configured Goldie future-import payload in dry-run mode.',
    run: async () => require('../src/services/goldieFutureImport').runGoldieFutureImport({ mode: 'dry-run' }),
  },
  'goldie-future-import-commit': {
    mutates: true,
    description: 'Commit the configured Goldie future-import payload. Run the dry-run first.',
    run: async () => require('../src/services/goldieFutureImport').runGoldieFutureImport({ mode: 'commit' }),
  },
  'google-calendar-reconcile-dry-run': {
    mutates: false,
    description: 'Inspect future CRM-to-Google Calendar reconciliation without writes.',
    run: async () => require('../src/services/googleCalendarReconciliation').reconcileFutureAppointmentsToGoogleCalendar({ mode: 'dry-run' }),
  },
  'google-calendar-reconcile-commit': {
    mutates: true,
    description: 'Commit future CRM-to-Google Calendar reconciliation. Run the dry-run first.',
    run: async () => require('../src/services/googleCalendarReconciliation').reconcileFutureAppointmentsToGoogleCalendar({ mode: 'commit' }),
  },
  'google-calendar-access-setup': {
    mutates: true,
    description: 'Apply configured writer ACLs to the shared Shiloh booking calendar.',
    run: async () => {
      process.env.RUN_GOOGLE_CALENDAR_ACCESS_SETUP = 'true';
      return require('../src/services/googleCalendarAccessSetup').runGoogleCalendarAccessSetupFromEnv();
    },
  },
  'calendar-presentation-reconcile': {
    mutates: true,
    description: 'Run the guarded CRM-6 calendar presentation reconciliation.',
    run: async () => require('../src/services/calendarPresentationReconciliation').runCalendarPresentationReconciliation(),
  },
};

function usage() {
  console.log('Usage: npm run maintenance -- <command> [--confirm]');
  console.log('');
  console.log('Commands:');
  for (const [name, command] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(38)} ${command.mutates ? '[WRITE]' : '[READ] '} ${command.description}`);
  }
  console.log('');
  console.log('Mutating commands refuse to run unless --confirm is supplied.');
}

async function main() {
  const args = process.argv.slice(2);
  const commandName = args.find((arg) => !arg.startsWith('--'));
  if (!commandName || commandName === 'help' || args.includes('--help')) {
    usage();
    return;
  }
  const command = COMMANDS[commandName];
  if (!command) {
    usage();
    throw new Error(`Unknown maintenance command: ${commandName}`);
  }
  if (command.mutates && !args.includes('--confirm')) {
    throw new Error(`Refusing mutating maintenance command "${commandName}" without --confirm.`);
  }

  validateEnv();
  logger.info({ command: commandName, mutates: command.mutates }, 'Explicit maintenance command started');
  const result = await command.run();
  logger.info({ command: commandName, result }, 'Explicit maintenance command completed');
  if (result !== undefined) console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'Maintenance command failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closePool();
    } catch (_) {}
  });
