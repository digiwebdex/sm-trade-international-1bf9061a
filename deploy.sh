#!/bin/bash
set -e
APP_DIR="/var/www/smtradeapp"
cd "$APP_DIR"

echo "📦 Backup .env..."
cp server/.env /root/.smtradeapp_env_backup_$(date +%Y%m%d_%H%M).env

echo "⬇️  Pull latest..."
git pull origin main

echo "🔧 Frontend build..."
npm install
npm run build

echo "🔧 Backend deps..."
cd server && npm install --omit=dev && cd ..

echo "🔄 Restart PM2..."
pm2 restart smtradeapp --update-env
pm2 save

echo "🌐 Reload Nginx..."
sudo systemctl reload nginx

echo "✅ Health check..."
sleep 2
curl -s -o /dev/null -w "API status: %{http_code}\n" http://localhost:3107/api/invoices
