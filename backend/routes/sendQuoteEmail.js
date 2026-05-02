const express = require('express');
const router = express.Router();

const RECIPIENT_EMAIL = process.env.QUOTE_RECIPIENT_EMAIL || 'asomoalamin@yahoo.com';

let nodemailerInstance = null;

function getNodemailer() {
  if (nodemailerInstance) return nodemailerInstance;

  try {
    nodemailerInstance = require('nodemailer');
    return nodemailerInstance;
  } catch (error) {
    const dependencyError = new Error('Email service dependency is missing: nodemailer');
    dependencyError.code = 'EMAIL_DEPENDENCY_MISSING';
    dependencyError.cause = error;
    throw dependencyError;
  }
}

// Create reusable transporter – supports SMTP config via env vars,
// falls back to a direct-send approach (no relay) when none are set.
function getTransporter() {
  const nodemailer = getNodemailer();
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback: direct send (may land in spam but works without config)
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

router.post('/', async (req, res) => {
  try {
    const { items, customerName, customerEmail, customerPhone, message } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in quote basket' });
    }

    // Build HTML email
    const itemRows = items.map((item, i) =>
      `<tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" style="width:50px;height:50px;object-fit:contain" />` : ''}
        </td>
        <td style="padding:8px;border:1px solid #ddd">${item.title}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
      </tr>`
    ).join('');

    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1a1a2e;color:white;padding:20px;text-align:center">
          <h1 style="margin:0;font-size:22px">📋 New Quote Request</h1>
          <p style="margin:5px 0 0;opacity:0.8">S. M. Trade International</p>
        </div>
        
        <div style="padding:20px;background:#f9f9f9">
          ${customerName ? `<p><strong>Name:</strong> ${customerName}</p>` : ''}
          ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ''}
          ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          
          <h3 style="color:#1a1a2e;border-bottom:2px solid #d4a843;padding-bottom:8px">
            Requested Products (${items.length} items, ${totalQty} total qty)
          </h3>
          
          <table style="width:100%;border-collapse:collapse;margin-top:10px">
            <thead>
              <tr style="background:#1a1a2e;color:white">
                <th style="padding:8px;border:1px solid #ddd">#</th>
                <th style="padding:8px;border:1px solid #ddd">Image</th>
                <th style="padding:8px;border:1px solid #ddd">Product</th>
                <th style="padding:8px;border:1px solid #ddd">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>
        
        <div style="background:#1a1a2e;color:white;padding:15px;text-align:center;font-size:12px">
          <p style="margin:0">This quote request was sent from smtradeint.com</p>
        </div>
      </div>
    `;

    const plainText = `New Quote Request\n\n` +
      (customerName ? `Name: ${customerName}\n` : '') +
      (customerEmail ? `Email: ${customerEmail}\n` : '') +
      (customerPhone ? `Phone: ${customerPhone}\n` : '') +
      (message ? `Message: ${message}\n` : '') +
      `\nProducts:\n` +
      items.map((item, i) => `${i + 1}. ${item.title} - Qty: ${item.quantity}`).join('\n') +
      `\n\nTotal Items: ${items.length}, Total Quantity: ${totalQty}`;

    const transporter = getTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SM Trade International" <noreply@smtradeint.com>`,
      to: RECIPIENT_EMAIL,
      replyTo: customerEmail || undefined,
      subject: `New Quote Request - ${items.length} Products (${totalQty} qty)`,
      text: plainText,
      html,
    });

    res.json({ success: true, message: 'Quote request sent successfully' });
  } catch (err) {
    console.error('Send quote email error:', err);
    res.status(500).json({ error: 'Failed to send quote request email', details: err.message });
  }
});

module.exports = router;
