const express = require('express');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

const UPLOAD_BASE = path.join(__dirname, '..', 'uploads');

// POST /api/remove-bg — AI background removal (self-hosted, no Supabase)
// Requires an image-capable AI provider configured in backend/.env:
//   AI_IMAGE_API_KEY   (falls back to AI_API_KEY)
//   AI_IMAGE_API_URL   (default: https://api.openai.com/v1/chat/completions)
//   AI_IMAGE_MODEL     (default: gpt-4o-mini — set to a model that returns images)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { image_url, product_id } = req.body || {};
    if (!image_url) return res.status(400).json({ error: 'image_url required' });

    const AI_API_KEY = process.env.AI_IMAGE_API_KEY || process.env.AI_API_KEY;
    const AI_API_URL = process.env.AI_IMAGE_API_URL || 'https://api.openai.com/v1/chat/completions';
    const AI_MODEL = process.env.AI_IMAGE_MODEL || 'gpt-4o-mini';

    if (!AI_API_KEY) {
      return res.status(500).json({ error: 'AI_IMAGE_API_KEY (or AI_API_KEY) is not configured on the server' });
    }

    // Resolve relative URLs to an absolute, publicly fetchable URL for the AI provider.
    const publicOrigin = process.env.PUBLIC_SITE_ORIGIN || 'https://smtradeint.com';
    const absoluteImageUrl = /^https?:\/\//i.test(image_url)
      ? image_url
      : `${publicOrigin}${image_url.startsWith('/') ? '' : '/'}${image_url}`;

    const aiResp = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Remove the background from this product image completely. Output a clean PNG with a fully transparent background. Keep the product itself fully intact, sharp, and centered. Do not add any shadow, reflection, color cast, watermark, or text. Preserve original colors and details exactly.',
              },
              { type: 'image_url', image_url: { url: absoluteImageUrl } },
            ],
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (aiResp.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    if (!aiResp.ok) {
      const t = await aiResp.text().catch(() => '');
      console.error('remove-bg AI error:', aiResp.status, t);
      return res.status(502).json({ error: 'AI provider error' });
    }

    const data = await aiResp.json();
    const dataUrl =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
      data?.data?.[0]?.b64_json;
    if (!dataUrl) {
      return res.status(502).json({ error: 'AI did not return an image' });
    }

    // Accept either a data URL or raw base64
    let base64;
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
      base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    } else {
      base64 = dataUrl;
    }
    const bytes = Buffer.from(base64, 'base64');

    // Save locally under uploads/products/nobg/
    const dir = path.join(UPLOAD_BASE, 'products', 'nobg');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${product_id || 'img'}-${Date.now()}.png`;
    fs.writeFileSync(path.join(dir, filename), bytes);

    const relativePath = `products/nobg/${filename}`;
    const newUrl = `/uploads/${relativePath}`;

    // Update the product row directly
    if (product_id) {
      try {
        await pool.query('UPDATE products SET image_url = $1, updated_at = now() WHERE id = $2', [newUrl, product_id]);
      } catch (e) {
        console.error('remove-bg DB update error:', e.message);
      }
    }

    return res.json({ url: newUrl, path: relativePath });
  } catch (err) {
    console.error('remove-bg error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

module.exports = router;
