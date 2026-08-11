const express = require('express');

const router = express.Router();

const APPROVED = {
  'massage-general': 6560304,
  'hot-stone': 18120173,
  'foot-care': 6663577,
  'facial-general': 7446656,
  'facial-premium': 3985332,
  'microneedling': 29648626,
  'permanent-makeup': 6135621,
  'advanced-aesthetics': 3736280,
  'consultation': 29648640,
  'wellness-heat': 25084818,
  'facial-technology': 3736279,
  'facial-device': 5069425,
};

router.get('/internal/approved-pexels/:key', async (req, res) => {
  const id = APPROVED[req.params.key];
  if (!id) return res.status(404).json({ error: 'Unknown approved asset key' });
  if (!process.env.PEXELS_API_KEY) return res.status(503).json({ error: 'Pexels API unavailable' });

  try {
    const metaResponse = await fetch(`https://api.pexels.com/v1/photos/${id}`, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });
    if (!metaResponse.ok) return res.status(502).json({ error: 'Pexels metadata fetch failed', status: metaResponse.status });
    const photo = await metaResponse.json();
    const imageUrl = photo?.src?.large2x || photo?.src?.large || photo?.src?.original;
    if (!imageUrl) return res.status(502).json({ error: 'Pexels image source missing' });

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return res.status(502).json({ error: 'Pexels image fetch failed', status: imageResponse.status });
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    res.set('Content-Type', imageResponse.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'private, no-store');
    res.set('X-Shiloh-Asset-Key', req.params.key);
    res.set('X-Pexels-Photo-Id', String(id));
    return res.status(200).send(bytes);
  } catch (error) {
    return res.status(502).json({ error: 'Approved image retrieval failed' });
  }
});

module.exports = router;
