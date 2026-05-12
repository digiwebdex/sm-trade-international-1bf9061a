const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── SMTP transporter (lazy) ─────────────────────────────────
let nodemailerInstance = null;
function getTransporter() {
  if (!nodemailerInstance) nodemailerInstance = require('nodemailer');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailerInstance.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1',
      [normalizedEmail]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — validate token
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/change-password (logged-in)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Invalid password input' });
    }
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password — send reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });
    const normalizedEmail = String(email).toLowerCase().trim();

    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1',
      [normalizedEmail]
    );

    // Always respond OK to prevent email enumeration
    if (rows.length === 0) {
      return res.json({ success: true });
    }
    const user = rows[0];

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const baseUrl = process.env.PUBLIC_SITE_URL || 'https://smtradeint.com';
    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee">
        <div style="background:#1a2540;color:#fff;padding:20px;text-align:center">
          <h1 style="margin:0;font-size:22px">🔐 Password Reset Request</h1>
          <p style="margin:6px 0 0;opacity:0.85">S. M. Trade International — Admin Panel</p>
        </div>
        <div style="padding:24px;background:#fbf8f1;color:#222;font-size:14px;line-height:1.6">
          <p>Hello,</p>
          <p>We received a request to reset your admin password. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
          <p style="text-align:center;margin:28px 0">
            <a href="${resetUrl}" style="background:#1a2540;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Reset Password</a>
          </p>
          <p style="font-size:12px;color:#666">Or copy this link:<br/><span style="word-break:break-all">${resetUrl}</span></p>
          <p style="font-size:12px;color:#888;margin-top:24px">If you did not request this, you can safely ignore this email.</p>
        </div>
        <div style="background:#1a2540;color:#fff;padding:12px;text-align:center;font-size:12px">smtradeint.com</div>
      </div>`;

    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Reset your admin password — S. M. Trade International',
        html,
      });
    } catch (mailErr) {
      console.error('Reset email send error:', mailErr);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password — consume token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

    const { rows } = await pool.query(
      `SELECT id, user_id, expires_at, used_at FROM password_resets
       WHERE token_hash = $1 LIMIT 1`,
      [tokenHash]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const row = rows[0];
    if (row.used_at) return res.status(400).json({ error: 'Token already used' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, row.user_id]);
    await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [row.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
