const { getMigrationStatus, applyPendingMigrations } = require('./migrations');
const logger = require('../lib/logger');
const ALLOWED = new Set(['038_service_customer_content.sql','039_service_customer_descriptions.sql']);
async function runServiceCatalogueMigrationsFromEnv(){
  if(String(process.env.RUN_SERVICE_CATALOGUE_MIGRATIONS||'').toLowerCase()!=='true') return {status:'disabled'};
  const status=await getMigrationStatus();
  const changed=status.filter(x=>x.applied&&x.checksumMatches===false);if(changed.length)throw new Error(`Applied migration checksum mismatch: ${changed.map(x=>x.filename).join(', ')}`);
  const pending=status.filter(x=>!x.applied);const unexpected=pending.filter(x=>!ALLOWED.has(x.filename));if(unexpected.length)throw new Error(`Refusing catalogue migration because unexpected migrations are pending: ${unexpected.map(x=>x.filename).join(', ')}`);
  const result=await applyPendingMigrations();
  logger.info({result},'Guarded service catalogue migrations completed');return {status:'complete',...result};
}
module.exports={runServiceCatalogueMigrationsFromEnv,ALLOWED};
