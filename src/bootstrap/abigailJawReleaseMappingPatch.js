const logger = require('../lib/logger');
const christelCatalogueBootstrap = require('../services/christelServiceCatalogueCorrectionBootstrap');
const { ensureAbigailJawReleaseMappingCorrection } = require('../services/abigailJawReleaseMappingBootstrap');

const originalEnsureChristelServiceCatalogueCorrection = christelCatalogueBootstrap.ensureChristelServiceCatalogueCorrection;

christelCatalogueBootstrap.ensureChristelServiceCatalogueCorrection = async (...args) => {
  const result = await originalEnsureChristelServiceCatalogueCorrection(...args);
  const correction = await ensureAbigailJawReleaseMappingCorrection();
  logger.info(correction, 'Abigail Jaw Release mapping verified');
  return result;
};
