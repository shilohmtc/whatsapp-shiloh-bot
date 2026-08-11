const express = require('express');
const { resolveWhatsAppNumber } = require('../services/publicWhatsApp');
const { renderBookingPage } = require('../services/publicBookingPage');

const router = express.Router();

router.get('/book', async (req, res) => {
  const number = await resolveWhatsAppNumber();
  return res.status(number ? 200 : 503).type('html').send(renderBookingPage(number));
});

router.get('/book/health', async (req, res) => {
  const number = await resolveWhatsAppNumber();
  return res.status(number ? 200 : 503).json({
    status: number ? 'ok' : 'unavailable',
    whatsappConfigured: Boolean(number),
  });
});

module.exports = router;
