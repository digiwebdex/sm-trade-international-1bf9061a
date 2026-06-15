#!/bin/bash
BACKUP_DIR="/var/www/smtradeapp/server/backups"
mkdir -p "$BACKUP_DIR"
FILENAME="smtrade_$(date +%Y%m%d_%H%M%S).sql.gz"
mysqldump --no-tablespaces -u smtrade_user -p'StrongPass123!' smtrade_db | gzip > "$BACKUP_DIR/$FILENAME"
rclone copy "$BACKUP_DIR/$FILENAME" gdrive:SMTradeBackups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
echo "$(date): $FILENAME uploaded" >> /var/log/smtrade-backup.log
