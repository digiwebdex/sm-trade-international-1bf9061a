#!/bin/bash
BACKUP_DIR="/var/www/smtradeapp/backups"
DB_NAME="smtradeapp_db"
DB_USER="smtradeapp_user"
DB_PASS="SmTrade#2026!Db@A9x"
DATE=$(date +%Y-%m-%d_%H-%M)

# Backup নাও
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

# gzip করো
gzip "$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

# ৭ দিনের পুরনো backup মুছে দাও
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup done: ${DB_NAME}_${DATE}.sql.gz"
