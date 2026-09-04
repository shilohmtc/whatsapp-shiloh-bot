require('dotenv').config();

const { pool } = require('../src/db/pool');
const {
  sendCustomerBookingConfirmationForAppointment,
} = require('../src/services/customerBookingConfirmation');

function requestedAppointmentId(argv = process.argv) {
  const flag = argv.find(value => /^--appointment=/.test(value));
  const id = Number(flag ? flag.split('=')[1] : '');
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Pass a canonical appointment with --appointment=<positive id>.');
  }
  return id;
}

async function main() {
  const appointmentId = requestedAppointmentId();
  const result = await sendCustomerBookingConfirmationForAppointment(appointmentId, {
    db: pool,
    env: process.env,
    controlledE2e: true,
    recovery: true,
  });
  process.stdout.write(`${JSON.stringify({
    appointmentId,
    sent: result.sent === true,
    deliveryStatus: result.deliveryStatus || null,
    reason: result.reason || null,
  })}\n`);
  if (result.sent !== true) process.exitCode = 1;
}

if (require.main === module) {
  main()
    .catch((error) => {
      process.stderr.write(`${error.code || 'CONTROLLED_E2E_FAILED'}: ${error.message}\n`);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { requestedAppointmentId };
