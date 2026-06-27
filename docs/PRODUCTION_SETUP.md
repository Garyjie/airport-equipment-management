# 机场设备管理系统 - 生产环境配置指南

## 📋 目录
1. [生产环境要求](#生产环境要求)
2. [数据库配置](#数据库配置)
3. [安全配置](#安全配置)
4. [性能优化](#性能优化)
5. [备份策略](#备份策略)
6. [监控告警](#监控告警)
7. [故障排查](#故障排查)
8. [运维脚本](#运维脚本)

---

## 生产环境要求

### 硬件要求

| 配置级别 | CPU | 内存 | 磁盘 | 适用场景 |
|---------|-----|------|------|---------|
| 入门级 | 2核 | 2GB | 40GB SSD | 小型机场、测试环境 |
| 标准级 | 4核 | 4GB | 80GB SSD | 中型机场 |
| 高级级 | 8核 | 8GB | 160GB SSD | 大型机场、高并发 |

### 软件要求

- **操作系统**: Ubuntu 22.04 LTS / CentOS 8+
- **Node.js**: 18.17.0+ (LTS)
- **数据库**: PostgreSQL 15+ 或 MySQL 8.0+（推荐）
- **Web服务器**: Nginx 1.20+
- **进程管理**: PM2 5.0+

---

## 数据库配置

### Prisma ORM 迁移

本项目使用 Prisma ORM 管理数据库迁移，不建议手动执行 SQL 脚本。

```bash
# 生成 Prisma 客户端（每次修改 schema 后执行）
npm run prisma:generate

# 创建新的迁移文件（修改 schema 后执行）
npx prisma migrate dev --name <migration_name>

# 运行所有迁移（部署时执行）
npm run prisma:migrate

# 查看迁移状态
npx prisma migrate status

# 重置数据库（仅开发环境使用）
npx prisma migrate reset
```

### PostgreSQL 详细配置

#### 优化配置文件

编辑 `/etc/postgresql/15/main/postgresql.conf`：

```ini
# 连接配置
listen_addresses = '*'
port = 5432
max_connections = 100

# 内存配置（根据服务器内存调整）
shared_buffers = 2GB           # 约为总内存的 25%
work_mem = 64MB                # 单个查询工作内存
maintenance_work_mem = 512MB   # 维护操作内存

# 日志配置
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'all'
log_min_duration_statement = 100  # 记录慢查询（毫秒）

# 性能优化
effective_cache_size = 6GB     # 约为总内存的 75%
random_page_cost = 1.1         # SSD 存储建议降低
cpu_tuple_cost = 0.003
cpu_index_tuple_cost = 0.001
cpu_operator_cost = 0.0005

# 自动清理
autovacuum = on
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05
```

#### 配置防火墙

```bash
# 允许本地访问
sudo ufw allow from 127.0.0.1 to any port 5432

# 允许应用服务器访问（如果数据库在不同服务器）
sudo ufw allow from 192.168.1.100 to any port 5432

# 启用防火墙
sudo ufw enable
```

#### 创建只读用户（用于报表/备份）

```sql
CREATE USER airport_readonly WITH ENCRYPTED PASSWORD 'readonly_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO airport_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO airport_readonly;
```

### MySQL 详细配置

#### 优化配置文件

编辑 `/etc/mysql/my.cnf` 或 `/etc/mysql/mysql.conf.d/mysqld.cnf`：

```ini
[mysqld]
# 基本配置
user = mysql
pid-file = /var/run/mysqld/mysqld.pid
socket = /var/run/mysqld/mysqld.sock
port = 3306
basedir = /usr
datadir = /var/lib/mysql
tmpdir = /tmp
lc-messages-dir = /usr/share/mysql
skip-external-locking

# 连接配置
max_connections = 150
wait_timeout = 600
interactive_timeout = 600

# 内存配置
key_buffer_size = 256M
max_allowed_packet = 64M
table_open_cache = 2048
sort_buffer_size = 2M
read_buffer_size = 2M
read_rnd_buffer_size = 8M
myisam_sort_buffer_size = 64M

# InnoDB 优化
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
innodb_log_buffer_size = 64M
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table = 1
innodb_autoinc_lock_mode = 2

# 日志配置
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
log_error = /var/log/mysql/error.log

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

#### 配置防火墙

```bash
sudo ufw allow from 127.0.0.1 to any port 3306
sudo ufw enable
```

---

## 安全配置

### 密码策略

#### 数据库密码
- 长度至少 16 位
- 包含大小写字母、数字和特殊字符
- 定期更换（建议每 90 天）

#### JWT Secret
- 长度至少 32 位
- 使用随机生成的字符串
- 不要提交到代码仓库

#### 环境变量安全
```bash
# 设置文件权限
chmod 600 .env.production

# 加密敏感配置
# 使用 dotenv-vault 或类似工具加密环境变量
```

### 安全检查清单

- [ ] 禁用 root 用户远程登录
- [ ] 配置防火墙限制数据库端口访问
- [ ] 使用 HTTPS/TLS 加密传输
- [ ] 定期更新系统和依赖包
- [ ] 配置自动备份
- [ ] 设置审计日志
- [ ] 限制文件上传大小和类型
- [ ] 配置 CORS 策略
- [ ] 使用强密码策略

### Nginx 安全配置

```nginx
# 添加到 server 块中
server {
    # 隐藏服务器信息
    server_tokens off;

    # 限制请求大小
    client_max_body_size 50M;

    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 安全响应头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}
```

---

## 性能优化

### 数据库索引优化

> **注意**: 本项目使用 Prisma ORM，索引会通过 schema.prisma 文件定义。
> 以下索引建议可通过在 schema.prisma 中添加 `@@index` 或 `@unique` 实现。

#### 推荐索引

```sql
-- PostgreSQL / MySQL 通用索引建议

-- 设备表索引
CREATE INDEX idx_devices_station_id ON devices(station_id);
CREATE INDEX idx_devices_counter_id ON devices(counter_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_type_id ON devices(type_id);
CREATE INDEX idx_devices_is_active ON devices(is_active);

-- 变更记录表索引
CREATE INDEX idx_device_change_records_device_id ON device_change_records(device_id);
CREATE INDEX idx_device_change_records_created_at ON device_change_records(created_at);
CREATE INDEX idx_device_change_records_operator_id ON device_change_records(operator_id);
CREATE INDEX idx_device_change_records_from_station_id ON device_change_records(from_station_id);
CREATE INDEX idx_device_change_records_to_station_id ON device_change_records(to_station_id);

-- 站点和柜台索引
CREATE INDEX idx_stations_type ON stations(type);
CREATE INDEX idx_stations_is_active ON stations(is_active);
CREATE INDEX idx_counters_station_id ON counters(station_id);
CREATE INDEX idx_counters_is_active ON counters(is_active);

-- 换纸记录表索引
CREATE INDEX idx_paper_change_records_device_id ON paper_change_records(device_id);
CREATE INDEX idx_paper_change_records_created_at ON paper_change_records(created_at);

-- 耗材记录表索引
CREATE INDEX idx_consumable_records_device_id ON consumable_records(device_id);
CREATE INDEX idx_consumable_records_created_at ON consumable_records(created_at);

-- 用户表索引
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- 审计日志索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### 查询优化

#### 慢查询日志分析

**PostgreSQL:**
```bash
# 查看慢查询
pgBadger /var/log/postgresql/postgresql-*.log

# 分析查询性能
EXPLAIN ANALYZE SELECT * FROM devices WHERE status = 'active' AND is_active = true;
```

**MySQL:**
```bash
# 查看慢查询
mysqldumpslow /var/log/mysql/slow.log

# 分析查询性能
EXPLAIN SELECT * FROM devices WHERE status = 'active' AND is_active = true;
```

### 应用性能优化

#### 缓存策略

```bash
# 启用 Redis 缓存（可选）
# 安装 Redis
sudo apt-get install redis-server
sudo systemctl start redis-server

# 在应用中配置 Redis 缓存
# 缓存用户信息、设备类型、站点信息等不频繁变化的数据
```

#### 连接池配置

**PostgreSQL 连接池（PGBouncer）：**
```bash
# 安装 PGBouncer
sudo apt-get install pgbouncer

# 配置 /etc/pgbouncer/pgbouncer.ini
[databases]
airport_equipment = host=localhost port=5432 dbname=airport_equipment

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

---

## 备份策略

### 数据库备份脚本

#### PostgreSQL 备份脚本 (`backup_postgresql.sh`)

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="airport_equipment"
DB_USER="airport_admin"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# 压缩备份
gzip "$BACKUP_DIR/backup_$DATE.sql"

# 删除过期备份
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
```

#### MySQL 备份脚本 (`backup_mysql.sh`)

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="airport_equipment"
DB_USER="airport_admin"
DB_PASS="your_password"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# 执行备份
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# 压缩备份
gzip "$BACKUP_DIR/backup_$DATE.sql"

# 删除过期备份
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
```

#### 配置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加以下内容（每天凌晨 2 点执行备份）
0 2 * * * /path/to/backup_postgresql.sh >> /var/log/backup.log 2>&1

# 添加每周全量备份（周日凌晨 3 点）
0 3 * * 0 /path/to/backup_postgresql.sh full >> /var/log/backup.log 2>&1
```

### 文件备份

#### 备份应用代码和配置

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/path/to/airport-equipment-management"

mkdir -p $BACKUP_DIR

# 备份应用代码（排除 node_modules）
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="*.log" \
    --exclude="prisma/*.db" \
    $APP_DIR

echo "App backup completed: $BACKUP_DIR/app_backup_$DATE.tar.gz"
```

---

## 监控告警

### 应用监控

#### PM2 监控

```bash
# 启动监控面板
pm2 monit

# 查看应用状态
pm2 status

# 设置告警（需要 pm2-plus 或自定义脚本）
pm2 notify
```

#### 自定义监控脚本

```bash
#!/bin/bash

APP_NAME="airport-backend"
PORT=5000

# 检查应用是否运行
if ! pm2 list | grep -q $APP_NAME; then
    echo "应用 $APP_NAME 未运行，尝试重启..."
    pm2 restart $APP_NAME
    exit 1
fi

# 检查端口是否监听
if ! nc -z localhost $PORT; then
    echo "端口 $PORT 未监听，应用可能异常..."
    pm2 restart $APP_NAME
    exit 1
fi

echo "应用状态正常"
exit 0
```

#### 配置定时检查

```bash
crontab -e

# 每分钟检查一次
* * * * * /path/to/check_app.sh >> /var/log/app_check.log 2>&1
```

### 数据库监控

#### PostgreSQL 监控查询

```sql
-- 查看连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- 查看表大小
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) 
FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;

-- 查看索引使用情况
SELECT 
    idx.relname AS index_name,
    tbl.relname AS table_name,
    idx_scan AS index_scans
FROM pg_stat_user_indexes idx
JOIN pg_class tbl ON idx.schemaname = tbl.schemaname AND idx.schemaname = 'public'
ORDER BY idx_scan ASC;
```

#### MySQL 监控查询

```sql
-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';

-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 查看表大小
SELECT table_name, 
       data_length/1024/1024 AS data_size_mb, 
       index_length/1024/1024 AS index_size_mb 
FROM information_schema.tables 
WHERE table_schema = 'airport_equipment';

-- 查看索引使用情况
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'airport_equipment';
```

---

## 故障排查

### 常见问题

#### 应用无法启动

**检查步骤：**
1. 检查 Node.js 版本：`node --version`
2. 检查端口占用：`netstat -tlnp | grep 3000` 或 `netstat -tlnp | grep 5000`
3. 查看 PM2 日志：`pm2 logs airport-backend` 或 `pm2 logs airport-frontend`
4. 检查环境变量：`cat .env.production`
5. 检查依赖：`npm install`

#### 数据库连接失败

**检查步骤：**
1. 检查数据库服务状态：
   ```bash
   # PostgreSQL
   sudo systemctl status postgresql

   # MySQL
   sudo systemctl status mysql
   ```

2. 检查数据库配置：
   ```bash
   # PostgreSQL
   psql -U airport_admin -d airport_equipment

   # MySQL
   mysql -u airport_admin -p airport_equipment
   ```

3. 检查防火墙配置：
   ```bash
   sudo ufw status
   ```

4. 检查 `.env` 文件中的 `DATABASE_URL` 是否正确

#### 性能问题

**排查步骤：**
1. 查看服务器资源使用：`htop`
2. 查看慢查询日志
3. 检查数据库索引使用情况
4. 检查应用内存使用：`pm2 monit`
5. 查看数据库连接池状态

#### JWT 认证失败

**检查步骤：**
1. 检查 `JWT_SECRET` 环境变量是否配置
2. 检查 Token 是否过期
3. 检查 Token 是否正确传递（Authorization header）
4. 检查后端日志中的认证错误

---

## 运维脚本

### 重启应用脚本

```bash
#!/bin/bash

APP_NAME_BACKEND="airport-backend"
APP_NAME_FRONTEND="airport-frontend"

echo "停止应用..."
pm2 stop $APP_NAME_BACKEND
pm2 stop $APP_NAME_FRONTEND

echo "拉取最新代码..."
cd /path/to/airport-equipment-management
git pull

echo "安装依赖..."
npm install

echo "生成 Prisma 客户端..."
npm run prisma:generate

echo "运行数据库迁移..."
npm run prisma:migrate

echo "构建应用..."
npm run build

echo "启动应用..."
pm2 start $APP_NAME_BACKEND
pm2 start $APP_NAME_FRONTEND

echo "应用已重启"
```

### 数据库清理脚本

```bash
#!/bin/bash

# 清理超过 30 天的变更记录（保留最近 30 天）
# 注意：根据实际需求调整保留天数

echo "清理超过 30 天的设备变更记录..."

# PostgreSQL
psql -U airport_admin -d airport_equipment <<EOF
DELETE FROM device_change_records 
WHERE created_at < NOW() - INTERVAL '30 days';
EOF

# MySQL
mysql -u airport_admin -p airport_equipment <<EOF
DELETE FROM device_change_records 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
EOF

echo "清理超过 30 天的换纸记录..."

# PostgreSQL
psql -U airport_admin -d airport_equipment <<EOF
DELETE FROM paper_change_records 
WHERE created_at < NOW() - INTERVAL '30 days';
EOF

# MySQL
mysql -u airport_admin -p airport_equipment <<EOF
DELETE FROM paper_change_records 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
EOF

echo "清理完成"
```

### 数据库迁移脚本

```bash
#!/bin/bash

# 数据库迁移脚本模板
# 使用 Prisma 迁移工具执行，不要手动执行此脚本

echo "开始数据库迁移..."

# 使用 Prisma 执行迁移
npx prisma migrate deploy

echo "数据库迁移完成"
```

---

## 升级指南

### 从开发版本升级到生产版本

1. **备份数据**：使用导出功能导出所有数据为 CSV
2. **安装数据库**：根据需要选择 PostgreSQL 或 MySQL
3. **配置环境变量**：创建 `.env.production` 文件，设置正确的 `DATABASE_URL`
4. **初始化数据库**：执行 `npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed`
5. **迁移数据**：将导出的 CSV 数据导入到数据库
6. **构建应用**：`npm run build`
7. **启动应用**：`pm2 start npm --name "airport-backend" -- server` 和 `pm2 start npm --name "airport-frontend" -- start`

### 版本升级

1. **备份数据**
2. **停止应用**：`pm2 stop airport-backend` 和 `pm2 stop airport-frontend`
3. **拉取更新**：`git pull`
4. **安装依赖**：`npm install`
5. **生成 Prisma 客户端**：`npm run prisma:generate`
6. **运行迁移**：`npm run prisma:migrate`
7. **构建应用**：`npm run build`
8. **启动应用**：`pm2 start airport-backend` 和 `pm2 start airport-frontend`
9. **验证功能**：访问应用确认正常运行

---

## 总结

生产环境配置的关键要点：

1. **安全第一**：配置防火墙、使用 HTTPS、定期更新、使用强密码
2. **性能优化**：添加数据库索引、优化查询、配置缓存、使用连接池
3. **备份策略**：定期备份数据库和代码、测试恢复流程
4. **监控告警**：实时监控应用状态、及时发现问题
5. **文档记录**：记录所有配置变更、便于维护和排查

按照此指南配置后，系统可以稳定运行在生产环境中。如有任何问题，请查看日志或联系技术支持。
