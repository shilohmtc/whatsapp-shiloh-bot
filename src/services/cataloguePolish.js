const { pool } = require('../db/pool');
const logger = require('../lib/logger');

const SERVICE_RENAMES = new Map([
  ['Hot Stone Masage', 'Hot Stone Massage'],
  ['Targated Area Specific Sports Massage', 'Targeted Area-Specific Sports Massage'],
  ['Quick Relieve: Back & Neck (45 min)', 'Quick Relief: Back & Neck (45 min)'],
  ['Sculp Delux', 'Sculpt Deluxe'],
  ['Permanant Makeup- Lips:', 'Permanent Makeup - Lips'],
  ['Permanent Makeup - Eyeliner:', 'Permanent Makeup - Eyeliner'],
  ['Permanent Makeup - Brows:', 'Permanent Makeup - Brows'],
  ['HIFU (High Intensity Focused Ultrasound', 'HIFU (High-Intensity Focused Ultrasound)'],
  ['Basic Facial-Hydrationw/Pigmentation Targeted Break out skin:', 'Basic Facial - Hydration / Pigmentation Targeted'],
  ['Basic Facial-Acne Congested/Hormonal Break out skin:', 'Basic Facial - Acne / Congested / Hormonal Breakout'],
  ['⁠Clarity Facial (Black heads, White heads & Acne', 'Clarity Facial (Blackheads, Whiteheads & Acne)'],
  ['⁠Brightening Facial (Pigmentation)', 'Brightening Facial (Pigmentation)'],
  ['⁠Calm & Clear Facial', 'Calm & Clear Facial'],
  ['⁠Eternal Glow Facial', 'Eternal Glow Facial'],
  ['⁠Stretch Mark Microneedling Consultation', 'Stretch Mark Microneedling Consultation'],
  ['Full Body Sports Massage ', 'Full Body Sports Massage'],
  ['Bamboo Sports Massage Area Specific ', 'Bamboo Sports Massage - Area Specific'],
  ['Lower Back & Hip  & Psoas Release', 'Lower Back, Hip & Psoas Release'],
  ['Dermaplane facial', 'Dermaplane Facial'],
  ['Areola reconstruction', 'Areola Reconstruction'],
  ['Pelvic floor strengthening', 'Pelvic Floor Strengthening']
]);

const CATEGORY_RENAMES = new Map([
  ['Permanant Makeup', 'Permanent Makeup'],
  ['Mikroneedling', 'Microneedling'],
  ['1. SQT BoiMicroneedling', '1. SQT BioMicroneedling']
]);

async function applyMap(db, table, column, map, extraSet='') {
  let changed = 0;
  for (const [from, to] of map) {
    const q = await db.query(`UPDATE ${table} SET ${column}=$1 ${extraSet} WHERE ${column}=$2`, [to, from]);
    changed += q.rowCount;
  }
  return changed;
}

async function runCataloguePolishFromEnv() {
  if (String(process.env.RUN_CATALOGUE_POLISH || '').toLowerCase() !== 'true') return { status: 'disabled' };
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const categories = await applyMap(db, 'service_categories', 'name', CATEGORY_RENAMES, ', updated_at=NOW()');
    const services = await applyMap(db, 'services', 'name', SERVICE_RENAMES, ', updated_at=NOW()');
    const snapshots = await applyMap(db, 'appointment_services', 'service_name_snapshot', SERVICE_RENAMES);
    const clients = await db.query(`UPDATE clients SET display_name=trim(regexp_replace(display_name, '^\\s*Client\\s*-\\s*', '', 'i')), updated_at=NOW() WHERE display_name ~* '^\\s*Client\\s*-\\s*'`);
    const sourceClients = await db.query(`UPDATE appointments SET source_client_name=trim(regexp_replace(source_client_name, '^\\s*Client\\s*-\\s*', '', 'i')), updated_at=NOW() WHERE source_client_name ~* '^\\s*Client\\s*-\\s*'`);
    await db.query(`UPDATE services SET name=trim(regexp_replace(name, '\\s+', ' ', 'g')), updated_at=NOW() WHERE name <> trim(regexp_replace(name, '\\s+', ' ', 'g'))`);
    await db.query(`UPDATE clients SET display_name=trim(regexp_replace(display_name, '\\s+', ' ', 'g')), updated_at=NOW() WHERE display_name IS NOT NULL AND display_name <> trim(regexp_replace(display_name, '\\s+', ' ', 'g'))`);
    await db.query('COMMIT');
    const result = { status:'complete', categories, services, appointmentSnapshots:snapshots, clientNames:clients.rowCount, sourceClientNames:sourceClients.rowCount };
    logger.info(result, 'Catalogue and imported client text polish completed');
    return result;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally { db.release(); }
}

module.exports = { runCataloguePolishFromEnv, SERVICE_RENAMES, CATEGORY_RENAMES };
