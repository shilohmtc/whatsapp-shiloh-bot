const express = require('express');
const axios = require('axios');
const logger = require('../lib/logger');

const router = express.Router();
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
    const response = await axios.get(
      `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}`,
      {
        params: { fields: 'display_phone_number,verified_name' },
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
        timeout: 10000,
      }
    );
    const number = normalizeNumber(response.data?.display_phone_number);
    if (!number) return null;
    cachedNumber = number;
    cachedAt = Date.now();
    return number;
  } catch (error) {
    logger.error({ err: error, status: error.response?.status }, 'Unable to resolve public WhatsApp number for walk-in QR');
    return null;
  }
}

router.get('/walk-in', async (req, res) => {
  const number = await resolveWhatsAppNumber();
  if (!number) {
    return res.status(503).type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh Walk-in Registration</title></head><body style="font-family:system-ui;padding:32px;max-width:560px;margin:auto"><h1>Shiloh 🌿</h1><p>Walk-in registration is temporarily unavailable. Please ask the clinic team to assist you.</p></body></html>`);
  }
  const message = "Hi Shiloh 👋 I'm visiting the clinic and would like to register as a walk-in.";
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  return res.redirect(302, url);
});

router.get('/walk-in/health', async (req, res) => {
  const number = await resolveWhatsAppNumber();
  return res.status(number ? 200 : 503).json({ status: number ? 'ok' : 'unavailable', whatsappConfigured: Boolean(number) });
});

module.exports = router;
