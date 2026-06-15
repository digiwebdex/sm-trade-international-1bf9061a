const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { filename: f, size: stat.size, created: stat.mtime.toISOString(), type: f.includes('auto') ? 'auto' : 'manual' };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    res.json(files);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `smtrade_manual_${ts}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'smtrade_user';
    const dbPass = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'smtrade_db';
    execSync(`mysqldump -h ${dbHost} -u ${dbUser} -p'${dbPass}' ${dbName} | gzip > ${filepath}`, { timeout: 60000 });
    const stat = fs.statSync(filepath);
    res.json({ filename, size: stat.size, created: stat.mtime.toISOString(), type: 'manual' });
  } catch (err) { res.status(500).json({ error: 'Backup failed: ' + err.message }); }
});

router.get('/:filename/download', (req, res) => {
  const filepath = path.join(BACKUP_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });
  res.download(filepath);
});

router.post('/:filename/upload-drive', (req, res) => {
  try {
    const filepath = path.join(BACKUP_DIR, path.basename(req.params.filename));
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });
    execSync(`rclone copy "${filepath}" gdrive:SMTradeBackups/ --config /root/.config/rclone/rclone.conf`, { timeout: 120000 });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Drive upload failed: ' + err.message }); }
});

router.delete('/:filename', (req, res) => {
  const filepath = path.join(BACKUP_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filepath);
  res.json({ success: true });
});

module.exports = router;
