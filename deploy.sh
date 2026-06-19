#!/bin/bash

# ========================================
# 机场设备管理系统 - 一键部署脚本
# ========================================

set -e  # 遇到错误立即退出

# ============ 配置区域（请根据实际情况修改）============
DB_PASSWORD="你的数据库密码"           # 修改为你的数据库密码
DOMAIN="你的域名或IP"                  # 修改为你的域名或服务器IP
PROJECT_DIR="/var/www/airport-equipment"  # 修改为你的项目目录
# ====================================================

echo "=========================================="
echo "机场设备管理系统 - 开始部署"
echo "=========================================="

# 1. 更新系统
echo "[1/8] 更新系统..."
sudo apt update && sudo apt upgrade -y

# 2. 安装必要软件
echo "[2/8] 安装必要软件..."
sudo apt install -y nodejs npm nginx postgresql postgresql-contrib certbot python3-certbot-nginx curl

# 3. 配置 PostgreSQL
echo "[3/8] 配置数据库..."
sudo -u postgres psql <<EOF
CREATE DATABASE airport_equipment;
CREATE USER airport_admin WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE airport_equipment TO airport_admin;
\q
EOF

# 4. 创建项目目录并复制代码
echo "[4/8] 部署应用代码..."
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# 如果是 Git 仓库，使用 git clone
# git clone <你的仓库地址> $PROJECT_DIR

# 复制当前目录到项目目录（本地部署时使用）
cp -r . $PROJECT_DIR

# 5. 安装依赖和构建
echo "[5/8] 安装依赖并构建..."
cd $PROJECT_DIR
npm install
npm run build

# 6. 配置环境变量
echo "[6/8] 配置环境变量..."
cat > $PROJECT_DIR/.env.production <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://airport_admin:$DB_PASSWORD@localhost:5432/airport_equipment
SESSION_SECRET=随机密钥至少32字符_请修改
CORS_ORIGIN=http://$DOMAIN
EOF

chmod 600 $PROJECT_DIR/.env.production

# 7. 导入数据库
echo "[7/8] 导入数据库..."
sudo -u postgres psql -d airport_equipment -f $PROJECT_DIR/docs/schema_postgresql.sql
sudo -u postgres psql -d airport_equipment -f $PROJECT_DIR/docs/initial_data.sql

# 8. 配置 PM2
echo "[8/8] 配置 PM2 并启动..."
npm install -g pm2

cat > $PROJECT_DIR/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'airport-equipment',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    }
  }]
};
EOF

pm2 start $PROJECT_DIR/ecosystem.config.js
pm2 save
pm2 startup

# 9. 配置 Nginx
echo "配置 Nginx 反向代理..."
sudo cat > /etc/nginx/sites-available/airport <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/airport /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. 配置防火墙
echo "配置防火墙..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# 11. 配置自动备份
echo "配置自动备份..."
sudo mkdir -p /var/backups/airport
sudo cat > /usr/local/bin/backup_airport.sh <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/airport"
DATE=\$(date +%Y%m%d_%H%M%S)
pg_dump -U airport_admin airport_equipment > "\$BACKUP_DIR/backup_\$DATE.sql"
gzip "\$BACKUP_DIR/backup_\$DATE.sql"
find \$BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
EOF
sudo chmod +x /usr/local/bin/backup_airport.sh
sudo crontab -l | grep -q "backup_airport.sh" || sudo crontab -l; echo "0 2 * * * /usr/local/bin/backup_airport.sh >> /var/log/backup.log 2>&1" | sudo crontab -

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "📌 访问地址：http://$DOMAIN"
echo "📌 默认账号：admin"
echo "📌 默认密码：admin"
echo ""
echo "📌 常用命令："
echo "   查看状态：pm2 status"
echo "   查看日志：pm2 logs airport-equipment"
echo "   重启应用：pm2 restart airport-equipment"
echo "   备份数据库：/usr/local/bin/backup_airport.sh"
echo ""
echo "⚠️  重要提醒："
echo "   1. 请立即修改默认密码！"
echo "   2. 建议申请 SSL 证书启用 HTTPS"
echo "   3. 定期检查备份文件"
echo ""
