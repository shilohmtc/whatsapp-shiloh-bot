'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  AUTHORIZED_RUN_ID,
  executeCalendarOccupancyReset,
  runConfiguredCalendarOccupancyReset,
} = require('../src/services/calendarOccupancyReset');

function poolThatMustNotConnect() {
  return {
    connect() {
      throw new Error('database connection must not be attempted');
    },
  };
}

test('calendar occupancy reset is inert when no run id is configured', async () => {
  const result = await runConfiguredCalendarOccupancyReset({ env: {}, dbPool: poolThatMustNotConnect() });
  assert.deepEqual(result, { status: 'disabled' });
});

test('calendar occupancy reset refuses unknown run id before database access', async () => {
  const result = await runConfiguredCalendarOccupancyReset({
    env: {
      SHILOH_CALENDAR_OCCUPANCY_RESET_RUN_ID: 'wrong-run',
      SHILOH_CALENDAR_OCCUPANCY_RESET_RELEASE_SHA: 'a'.repeat(40),
      RENDER_GIT_COMMIT: 'a'.repeat(40),
    },
    dbPool: poolThatMustNotConnect(),
  });
  assert.deepEqual(result, { status: 'refused', reason: 'run_id_mismatch' });
});

test('calendar occupancy reset refuses release mismatch before database access', async () => {
  const result = await runConfiguredCalendarOccupancyReset({
    env: {
      SHILOH_CALENDAR_OCCUPANCY_RESET_RUN_ID: AUTHORIZED_RUN_ID,
      SHILOH_CALENDAR_OCCUPANCY_RESET_RELEASE_SHA: 'a'.repeat(40),
      RENDER_GIT_COMMIT: 'b'.repeat(40),
    },
    dbPool: poolThatMustNotConnect(),
  });
  assert.deepEqual(result, { status: 'refused', reason: 'release_sha_mismatch' });
});

test('direct reset execution also refuses a mismatched run id before database access', async () => {
  const result = await executeCalendarOccupancyReset({ runId: 'wrong-run', dbPool: poolThatMustNotConnect() });
  assert.deepEqual(result, { status: 'refused', reason: 'run_id_mismatch' });
});
