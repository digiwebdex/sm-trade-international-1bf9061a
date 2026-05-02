# S. M. Trade International — VPS Deployment Guide

## Server: 187.77.144.38 | Domain: smtradeint.com

---

## Prerequisites
- Ubuntu 22.04+ VPS (Hostinger KVM)
- Root SSH access
- Domain DNS pointing to 187.77.144.38

---

## Step-by-Step Deployment

### 1. SSH into VPS
```bash
ssh root@187.77.144.38
```

### 2. Create project directory (isolated from existing sites)
```bash
mkdir -p /var/www/sm-trade-international
cd /var/www/sm-trade-international
```

### 3. Clone repository
```bash
git clone https://github.com/digiwebdex/sm-trade-international-8d81a20f.git .
```

### 4. Install system dependencies
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PostgreSQL 16
apt-get install -y postgresql postgresql-contrib

# Nginx (if not already installed)
apt-get install -y nginx certbot python3-certbot-nginx
```

### 5. Setup database
```bash
chmod +x migration/*.sh

# Create database & user
DB_PASSWORD="YOUR_SECURE_PASSWORD" ./migration/setup_database.sh
```

### 6. Export data from Supabase (run on local machine with psql)
```bash
# Get your Supabase DB URL from Lovable Cloud settings
export SUPABASE_DB_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres"
./migration/export_supabase_data.sh

# Copy data.sql to VPS
scp database/data.sql root@187.77.144.38:/var/www/sm-trade-international/database/
```

### 7. Run migration on VPS
```bash
DB_PASSWORD="YOUR_SECURE_PASSWORD" ./migration/run_migration.sh
```

### 8. Seed admin user
```bash
cd /var/www/sm-trade-international
cd backend && npm install && cd ..

DB_PASSWORD="YOUR_SECURE_PASSWORD" \
ADMIN_EMAIL="admin@smtradeint.com" \
ADMIN_PASSWORD="your_admin_password" \
./migration/seed_data.sh
```

### 9. Configure backend
```bash
cd /var/www/sm-trade-international/backend
cp ../.env.example .env
nano .env  # Fill in all values
```

### 10. Frontend: Migrate from Supabase to API client
Before building the frontend, you MUST replace all Supabase imports:

```bash
# In the project root, run this find-and-replace:
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  "s|import { supabase } from '@/integrations/supabase/client'|import { supabase } from '@/lib/apiClient'|g"

# Update AuthContext to use API client
# Update QuoteRequestForm edge function URL to /api/generate-quote

# Also update .env for frontend build:
echo 'VITE_API_BASE_URL=https://smtradeint.com/api' > .env
```

### 11. Build frontend
```bash
cd /var/www/sm-trade-international
npm install
npm run build

# Move dist to frontend directory
mkdir -p frontend
mv dist frontend/
```

### 12. Start backend with PM2
```bash
npm install -g pm2

cd /var/www/sm-trade-international
pm2 start ecosystem.config.cjs --only sm-trade-backend
pm2 save
pm2 startup  # Auto-start on reboot
```

### 13. Configure Nginx
```bash
cp nginx/smtradeint.conf /etc/nginx/sites-available/smtradeint.com
ln -sf /etc/nginx/sites-available/smtradeint.com /etc/nginx/sites-enabled/

# Get SSL certificate
certbot --nginx -d smtradeint.com -d www.smtradeint.com

# Test & reload
nginx -t
systemctl reload nginx
```

### 14. Verify
```bash
# Health check
curl https://smtradeint.com/api/health

# Check PM2
pm2 status

# Check logs
pm2 logs sm-trade-backend
```

---

## Directory Structure on VPS

```
/var/www/sm-trade-international/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── crud.js
│   │   ├── upload.js
│   │   └── generateQuote.js
│   ├── uploads/         ← uploaded files stored here
│   ├── .env
│   └── package.json
├── frontend/
│   └── dist/            ← built React app
├── database/
│   ├── schema.sql
│   ├── constraints.sql
│   ├── functions.sql
│   ├── indexes.sql
│   ├── data.sql         ← exported production data
│   └── seed.sql
├── migration/
│   ├── setup_database.sh
│   ├── run_migration.sh
│   ├── seed_data.sh
│   └── export_supabase_data.sh
├── nginx/
│   └── smtradeint.conf
├── docker-compose.yml   ← optional Docker deployment
└── .env.example
```

---

## Port Allocation (no conflicts with existing sites)

| Service          | Port  | Access          |
|-----------------|-------|-----------------|
| PostgreSQL       | 5432  | localhost only   |
| Backend API      | 4000  | localhost only   |
| Nginx (HTTP)     | 80    | shared           |
| Nginx (HTTPS)    | 443   | shared           |

If port 5432 is already in use by another PostgreSQL instance, change `DB_PORT` in `.env` and use a different port.

---

## Docker Alternative (Optional)
```bash
cd /var/www/sm-trade-international
cp .env.example .env
nano .env  # Fill in values

docker compose up -d
```

---

## Maintenance

```bash
# Update code
cd /var/www/sm-trade-international
git pull
cd backend && npm install
cd ..
pm2 restart sm-trade-backend --update-env

# Rebuild frontend
npm run build
cp -r dist/* frontend/dist/

# Database backup
pg_dump -U smtrade_user smtrade_db > backup_$(date +%Y%m%d).sql

# View logs
pm2 logs sm-trade-backend --lines 100
```
