const axios = require("axios");
const crypto = require("crypto");
const { pool } = require("../db/pool");
const { replaceDocumentBySource } = require("./knowledge");
const logger = require("../lib/logger");

const SOURCE_KEY = "google-business-profile:shiloh";
let syncInProgress = false;
let schedulerTimer = null;

function configured() {
  return Boolean(
    process.env.GOOGLE_BUSINESS_CLIENT_ID &&
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET &&
    process.env.GOOGLE_BUSINESS_REFRESH_TOKEN &&
    process.env.GOOGLE_BUSINESS_LOCATION_NAME
  );
}

async function getAccessToken() {
  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID,
      client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_BUSINESS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    { timeout: 15000, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data.access_token;
}

function timeOfDay(value) {
  if (!value) return null;
  const h = String(value.hours ?? 0).padStart(2, "0");
  const m = String(value.minutes ?? 0).padStart(2, "0");
  return `${h}:${m}`;
}

function normalizeRegularHours(regularHours) {
  return (regularHours?.periods || []).map((period) => ({
    openDay: period.openDay,
    openTime: timeOfDay(period.openTime),
    closeDay: period.closeDay,
    closeTime: timeOfDay(period.closeTime),
  }));
}

function normalizeSpecialHours(specialHours) {
  return (specialHours?.specialHourPeriods || []).map((period) => ({
    startDate: period.startDate || null,
    endDate: period.endDate || null,
    openTime: timeOfDay(period.openTime),
    closeTime: timeOfDay(period.closeTime),
    closed: Boolean(period.closed),
  }));
}

function formatAddress(address = {}) {
  const parts = [
    ...(address.addressLines || []),
    address.locality,
    address.administrativeArea,
    address.postalCode,
  ].filter(Boolean);
  return parts.join(", ");
}

function buildKnowledgeText(location) {
  const regular = normalizeRegularHours(location.regularHours);
  const special = normalizeSpecialHours(location.specialHours);
  const lines = [
    "Shiloh Google Business Profile",
    `Business name: ${location.title || "Shiloh"}`,
  ];
  if (location.phoneNumbers?.primaryPhone) lines.push(`Public phone: ${location.phoneNumbers.primaryPhone}`);
  if (location.websiteUri) lines.push(`Website: ${location.websiteUri}`);
  const address = formatAddress(location.storefrontAddress);
  if (address) lines.push(`Public address: ${address}`);

  if (regular.length) {
    lines.push("", "Regular business hours:");
    for (const p of regular) lines.push(`${p.openDay}: ${p.openTime} - ${p.closeTime}`);
  }
  if (special.length) {
    lines.push("", "Special/holiday hours (override regular hours):");
    for (const p of special) {
      const date = p.startDate ? `${p.startDate.year}-${String(p.startDate.month).padStart(2, "0")}-${String(p.startDate.day).padStart(2, "0")}` : "special date";
      lines.push(`${date}: ${p.closed ? "Closed" : `${p.openTime} - ${p.closeTime}`}`);
    }
  }
  lines.push("", "Authority: Google Business Profile is authoritative for public business hours, special hours, public address, public phone and website. Special hours override regular hours.");
  return lines.join("\n");
}

async function fetchLocation() {
  const accessToken = await getAccessToken();
  const locationName = process.env.GOOGLE_BUSINESS_LOCATION_NAME;
  const readMask = "name,title,phoneNumbers,storefrontAddress,websiteUri,regularHours,specialHours";
  const response = await axios.get(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}`,
    {
      timeout: 20000,
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { readMask },
    }
  );
  return response.data;
}

async function persistSnapshot(location) {
  const regularHours = normalizeRegularHours(location.regularHours);
  const specialHours = normalizeSpecialHours(location.specialHours);
  const locationName = location.name || process.env.GOOGLE_BUSINESS_LOCATION_NAME;
  await pool.query(
    `INSERT INTO clinic_business_profile (
       provider, external_location_name, title, website_uri, primary_phone,
       address, regular_hours, special_hours, raw_snapshot,
       last_synced_at, last_status, last_error, updated_at
     ) VALUES (
       'google_business_profile',$1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,NOW(),'synced',NULL,NOW()
     )
     ON CONFLICT (external_location_name) DO UPDATE SET
       title=EXCLUDED.title,
       website_uri=EXCLUDED.website_uri,
       primary_phone=EXCLUDED.primary_phone,
       address=EXCLUDED.address,
       regular_hours=EXCLUDED.regular_hours,
       special_hours=EXCLUDED.special_hours,
       raw_snapshot=EXCLUDED.raw_snapshot,
       last_synced_at=NOW(),
       last_status='synced',
       last_error=NULL,
       updated_at=NOW()`,
    [
      locationName,
      location.title || null,
      location.websiteUri || null,
      location.phoneNumbers?.primaryPhone || null,
      JSON.stringify(location.storefrontAddress || {}),
      JSON.stringify(regularHours),
      JSON.stringify(specialHours),
      JSON.stringify(location),
    ]
  );
}

async function saveError(error) {
  const locationName = process.env.GOOGLE_BUSINESS_LOCATION_NAME;
  if (!locationName) return;
  try {
    await pool.query(
      `INSERT INTO clinic_business_profile (provider, external_location_name, last_status, last_error, updated_at)
       VALUES ('google_business_profile',$1,'error',$2,NOW())
       ON CONFLICT (external_location_name) DO UPDATE SET last_status='error',last_error=$2,updated_at=NOW()`,
      [locationName, String(error.message || error).slice(0, 1000)]
    );
  } catch (persistError) {
    logger.error({ err: persistError }, "Failed to persist Google Business Profile sync error");
  }
}

async function syncGoogleBusinessProfile() {
  if (!configured()) return { status: "not_configured", changed: false };
  if (syncInProgress) return { status: "busy", changed: false };
  syncInProgress = true;
  try {
    const location = await fetchLocation();
    const content = buildKnowledgeText(location);
    const contentHash = crypto.createHash("sha256").update(content).digest("hex");
    await persistSnapshot(location);
    await replaceDocumentBySource({
      title: "Shiloh Google Business Profile Knowledge",
      source: SOURCE_KEY,
      content,
    });
    return { status: "synced", changed: true, contentHash, locationName: location.name };
  } catch (error) {
    logger.error({ err: error }, "Google Business Profile sync failed");
    await saveError(error);
    throw error;
  } finally {
    syncInProgress = false;
  }
}

function startGoogleBusinessProfileSyncScheduler() {
  if (schedulerTimer || !configured()) {
    if (!configured()) logger.info("Google Business Profile sync is not configured; scheduler disabled");
    return schedulerTimer;
  }
  const hours = Math.max(1, Math.min(Number(process.env.GOOGLE_BUSINESS_SYNC_INTERVAL_HOURS) || 6, 168));
  const run = () => syncGoogleBusinessProfile().catch(() => {});
  setTimeout(run, 20000).unref();
  schedulerTimer = setInterval(run, hours * 60 * 60 * 1000);
  schedulerTimer.unref();
  logger.info({ intervalHours: hours }, "Google Business Profile sync scheduler started");
  return schedulerTimer;
}

module.exports = {
  SOURCE_KEY,
  configured,
  syncGoogleBusinessProfile,
  startGoogleBusinessProfileSyncScheduler,
  normalizeRegularHours,
  normalizeSpecialHours,
  buildKnowledgeText,
};
