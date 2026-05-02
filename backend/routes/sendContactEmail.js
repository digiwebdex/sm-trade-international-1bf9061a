const express = require('express');
const router = express.Router();

const RECIPIENT_EMAIL = process.env.CONTACT_RECIPIENT_EMAIL || 'info@smtradeint.com';

let nodemailerInstance = null;
function getNodemailer() {
  if (nodemailerInstance) return nodemailerInstance;
  nodemailerInstance = require('nodemailer');
  return nodemailerInstance;
}

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

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email || '');
    const safePhone = escapeHtml(phone);
    const safeMessage = escapeHtml(message || '').replace(/\n/g, '<br/>');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee">
        <div style="background:#1a2540;color:#fff;padding:20px;text-align:center">
          <h1 style="margin:0;font-size:22px">📨 New Contact Message</h1>
          <p style="margin:6px 0 0;opacity:0.85">S. M. Trade International</p>
        </div>
        <div style="padding:24px;background:#fbf8f1">
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#222">
            <tr><td style="padding:6px 0;width:120px;color:#888">Name</td><td style="padding:6px 0"><strong>${safeName}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0">${safePhone}</td></tr>
            ${safeEmail ? `<tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0">${safeEmail}</td></tr>` : ''}
          </table>
          <h3 style="color:#1a2540;border-bottom:2px solid #c89a4a;padding-bottom:8px;margin-top:20px">Message</h3>
          <div style="background:#fff;padding:14px;border-radius:6px;border:1px solid #eee;font-size:14px;line-height:1.6;color:#333">
            ${safeMessage || '<em style="color:#999">(no message provided)</em>'}
          </div>
        </div>
        <div style="background:#1a2540;color:#fff;padding:12px;text-align:center;font-size:12px">
          Sent from smtradeint.com contact form
        </div>
      </div>
    `;

    const plainText =
      `New Contact Message\n\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      (email ? `Email: ${email}\n` : '') +
      `\nMessage:\n${message || '(no message provided)'}`;

    const transporter = getTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SM Trade International" <noreply@smtradeint.com>`,
      to: RECIPIENT_EMAIL,
      replyTo: email || undefined,
      subject: `New Contact Message from ${name}`,
      text: plainText,
      html,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Send contact email error:', err);
    res.status(500).json({ error: 'Failed to send contact email', details: err.message });
  }
});

module.exports = router;
