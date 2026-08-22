const logger = require('../lib/logger');
const { runChristelSaturdayAvailabilityDiagnostic } = require('../services/christelSaturdayAvailabilityDiagnostic');

setImmediate(() => {
  runChristelSaturdayAvailabilityDiagnostic().catch((error) => {
    logger.error({ err: error }, 'Christel Saturday availability diagnostic failed');
  });
});
