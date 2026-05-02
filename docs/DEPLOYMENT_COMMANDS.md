# Deployment Commands Reference — S. M. Trade International

All commands used for deploying and managing the production server.

---

## Quick Deploy (Most Common)

```bash
ssh root@187.77.144.38
cd /var/www/sm-trade-international && bash deploy.sh
```

The `deploy.sh` script automatically:
1. Backs up `backend/.env` and `backend/uploads/`
2. Fetches & resets to latest `origin/main`
3. Restores `.env` and uploads
4. Runs `npm run build`
5. Restarts backend via PM2

---

## SSH Access

```bash
ssh root@187.77.144.38
```

---

## Frontend Commands

```bash
# Build frontend
cd /var/www/sm-trade-international
npm install
npm run build

# Preview build locally
npm run preview
```

---

## Backend Commands

```bash
# Start backend
cd /var/www/sm-trade-international
pm2 start ecosystem.config.cjs --only sm-trade-backend

# Restart backend (with fresh env vars)
pm2 restart sm-trade-backend --update-env

# Stop backend
pm2 stop sm-trade-backend

# View logs
pm2 logs sm-trade-backend
pm2 logs sm-trade-backend --lines 200

# Monitor all processes
pm2 monit

# Save PM2 process list
pm2 save

# Auto-start on reboot
pm2 startup
```

---

## Database Commands

```bash
# Connect to database
psql -U smtrade_user -p 5440 -d smtrade_db

# Backup database
pg_dump -U smtrade_user -p 5440 smtrade_db > /root/backups/smtrade_$(date +%Y%m%d_%H%M).sql

# Restore database
psql -U smtrade_user -p 5440 smtrade_db < backup_file.sql

# Run schema migrations
psql -U smtrade_user -p 5440 smtrade_db < database/schema.sql
psql -U smtrade_user -p 5440 smtrade_db < database/constraints.sql
psql -U smtrade_user -p 5440 smtrade_db < database/indexes.sql
psql -U smtrade_user -p 5440 smtrade_db < database/functions.sql

# Check database status
pg_isready -p 5440

# List tables
psql -U smtrade_user -p 5440 -d smtrade_db -c "\dt"

# Count rows in a table
psql -U smtrade_user -p 5440 -d smtrade_db -c "SELECT COUNT(*) FROM products;"
```

---

## Nginx Commands

```bash
# Test config
nginx -t

# Reload (no downtime)
systemctl reload nginx

# Restart
systemctl restart nginx

# View error logs
tail -f /var/log/nginx/error.log

# View access logs
tail -f /var/log/nginx/access.log

# Edit site config
nano /etc/nginx/sites-available/smtradeint.com
```

---

## SSL Certificate

```bash
# Renew SSL
certbot renew

# Force renew
certbot renew --force-renewal

# Check certificate expiry
certbot certificates

# Initial setup
certbot --nginx -d smtradeint.com -d www.smtradeint.com
```

---

## Git Commands (on VPS)

```bash
cd /var/www/sm-trade-international

# Check current status
git status
git log --oneline -10

# Fetch latest without applying
git fetch origin

# Hard reset to latest (caution: backup .env first!)
git reset --hard origin/main
```

---

## Health Checks

```bash
# API health
curl https://smtradeint.com/api/health

# Check PM2 status
pm2 status

# Check disk space
df -h

# Check memory usage
free -h

# Check running Node processes
ps aux | grep node

# Check port usage
ss -tlnp | grep -E '3011|5440|80|443'
```

---

## Emergency Commands

```bash
# Restart everything
pm2 restart all
systemctl restart nginx
systemctl restart postgresql

# Kill stuck process
pm2 delete sm-trade-backend
pm2 start /var/www/sm-trade-international/ecosystem.config.cjs --only sm-trade-backend

# Check error logs
pm2 logs sm-trade-backend --err --lines 100
journalctl -u nginx --since "1 hour ago"
```

---

## Docker Alternative

```bash
cd /var/www/sm-trade-international

# Start all services
docker compose up -d

# Rebuild and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all
docker compose down
```
