const axios = require('axios');
const logger = require('../lib/logger');

let cachedNumber = null;
let cachedAt = 0;
const CACHE_MS = 60 * 60 * 1000;

function normalizeNumber(value = '') {
  return String(value || '').replace(/[^0-9]/g, '');
}

async function resolveWhatsAppNumber() {
  const configured = normalizeNumber(process.env.SHILOH_PUBLIC_WHATSAPP_NUMBER);
  if (configured) return configured;
  if (cachedNumber && Date.now() - cachedAt < CACHE_MS) return cachedNumber;
  if (!process.env.PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) return null;
  try {
    const response = await axios.get(`https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}`, {
      params: { fields: 'display_phone_number,verified_name' },
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      timeout: 10000,
    });
    const number = normalizeNumber(response.data?.display_phone_number);
    if (!number) return null;
    cachedNumber = number;
    cachedAt = Date.now();
    return number;
  } catch (error) {
    logger.error({ err: error, status: error.response?.status }, 'Unable to resolve public WhatsApp number');
    return null;
  }
}

module.exports = { normalizeNumber, resolveWhatsAppNumber };
