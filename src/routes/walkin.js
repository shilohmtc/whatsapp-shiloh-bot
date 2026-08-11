const express = require('express');
const { resolveWhatsAppNumber } = require('../services/publicWhatsApp');

const router = express.Router();

router.get('/walk-in', async (req, res) => {
  const number = await resolveWhatsAppNumber();
  if (!number) {
    return res.status(503).type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh Walk-in Registration</title></head><body style="font-family:system-ui;padding:32px;max-width:560px;margin:auto"><h1>Shiloh 🌿</h1><p>Walk-in registration is temporarily unavailable. Please ask the clinic team to assist you.</p></body></html>`);
  }
  const message = "Hi Shiloh 👋 I'm visiting the clinic and would like to register as a walk-in.";
  return res.redirect(302, `https://wa.me/${number}?text=${encodeURIComponent(message)}`);
});

router.get('/walk-in/health', async (req, res) => {
  const number = await resolveWhatsAppNumber();
  return res.status(number ? 200 : 503).json({ status: number ? 'ok' : 'unavailable', whatsappConfigured: Boolean(number) });
});

module.exports = router;
