# 机场设备管理系统 - 详细部署指南

## 📋 目录
1. [系统要求](#系统要求)
2. [快速开始（5分钟）](#快速开始)
3. [完整部署步骤](#完整部署步骤)
4. [数据库配置](#数据库配置)
5. [生产环境部署](#生产环境部署)
6. [Docker 部署](#docker-部署)
7. [Nginx 反向代理配置](#nginx-反向代理配置)
8. [PM2 进程管理](#pm2-进程管理)
9. [HTTPS 配置](#https-配置)
10. [常见问题](#常见问题)

---

## 系统要求

### 开发环境
- **Node.js**: 18.17.0 或更高版本
- **npm**: 9.0.0 或更高版本
- **操作系统**: Windows / macOS / Linux

### 生产环境
- **Node.js**: 18.17.0 或更高版本
- **数据库**: PostgreSQL 12+ 或 MySQL 5.7+ 或 SQLite 3
- **内存**: 至少 1GB
- **磁盘空间**: 至少 2GB
- **网络**: 支持 HTTP/HTTPS

---

## 快速开始

### 第1步：获取项目代码

```bash
# 方式一：直接克隆
git clone <项目地址> airport-equipment-management
cd airport-equipment-management

# 方式二：解压 ZIP 包
# 1. 解压 ZIP 文件
# 2. 打开命令行/终端，进入项目目录
cd airport-equipment-management
```

### 第2步：安装依赖

```bash
# 使用 npm 安装（推荐）
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 第3步：启动开发服务器

```bash
npm run dev
```

**输出应该类似这样：**
```
> dev
> next dev

  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

### 第4步：访问应用

打开浏览器，访问：
```
http://localhost:3000
```

现在可以看到登录页面。由于当前使用 localStorage 存储，数据保存在浏览器本地。

**默认登录账号（localStorage 模式）：**
- 用户名：admin
- 密码：admin

---

## 完整部署步骤

### 步骤 1：环境准备

#### Windows 用户：
1. 下载 Node.js：https://nodejs.org/
2. 选择 LTS 版本（推荐）
3. 按向导安装，一直点击 "Next" 和 "Install"
4. 安装完成后，打开命令提示符（cmd）或 PowerShell
5. 验证安装：
   ```bash
   node --version
   npm --version
   ```

#### Mac 用户：
1. 使用 Homebrew 安装（推荐）：
   ```bash
   brew install node
   ```
2. 验证安装：
   ```bash
   node --version
   npm --version
   ```

#### Linux 用户（Ubuntu/Debian）：
```bash
# 更新软件源
sudo apt-get update

# 安装 Node.js 和 npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node --version
npm --version
```

---

## 数据库配置

### 从 localStorage 迁移到数据库

#### 方案一：PostgreSQL（推荐用于生产环境）

##### 安装 PostgreSQL

**Windows:**
1. 下载：https://www.postgresql.org/download/windows/
2. 运行安装程序，记住设置的密码
3. 默认端口：5432

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

##### 创建数据库和用户

```bash
# 连接到 PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE airport_equipment;
CREATE USER airport_admin WITH ENCRYPTED PASSWORD 'your_secure_password';
ALTER ROLE airport_admin WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE airport_equipment TO airport_admin;

# 退出
\q
```

##### 导入 SQL 脚本

```bash
# 使用提供的 schema.sql 文件
psql -U airport_admin -d airport_equipment -f docs/schema_postgresql.sql

# 导入初始数据
psql -U airport_admin -d airport_equipment -f docs/initial_data.sql
```

#### 方案二：MySQL

##### 安装 MySQL

**Windows:**
1. 下载：https://dev.mysql.com/downloads/mysql/
2. 运行 MSI 安装程序

**Mac:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

##### 创建数据库和用户

```bash
# 连接到 MySQL
mysql -u root -p

# 执行以下命令
CREATE DATABASE airport_equipment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'airport_admin'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON airport_equipment.* TO 'airport_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

##### 导入 SQL 脚本

```bash
# 导入 schema
mysql -u airport_admin -p airport_equipment < docs/schema_mysql.sql

# 导入初始数据
mysql -u airport_admin -p airport_equipment < docs/initial_data.sql
```

---

## 生产环境部署

### 构建生产版本

```bash
# 1. 构建优化的应用
npm run build

# 2. 启动生产服务器
npm run start

# 应用将在 http://localhost:3000 运行
```

### Vercel 部署（推荐，最简单）

1. 在 v0 界面右上角点击"发布"按钮
2. 选择部署到 Vercel
3. 按步骤完成部署
4. Vercel 会自动分配一个公网域名

---

## Docker 部署

### 方式一：使用 Dockerfile

创建 `Dockerfile` 文件：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

运行：
```bash
# 构建镜像
docker build -t airport-equipment .

# 运行容器
docker run -p 3000:3000 airport-equipment
```

### 方式二：使用 Docker Compose（推荐）

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://airport_admin:password@db:5432/airport_equipment
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=airport_equipment
      - POSTGRES_USER=airport_admin
      - POSTGRES_PASSWORD=your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docs/schema_postgresql.sql:/docker-entrypoint-initdb.d/1_schema.sql
      - ./docs/initial_data.sql:/docker-entrypoint-initdb.d/2_data.sql
    restart: unless-stopped

volumes:
  postgres_data:
```

运行：
```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## Nginx 反向代理配置

### 安装 Nginx

```bash
sudo apt-get install nginx
```

### 配置反向代理

创建配置文件：
```bash
sudo nano /etc/nginx/sites-available/airport-equipment
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向 HTTP 到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 安全头部
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # 应用代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # WebSocket 支持
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/airport-equipment /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## PM2 进程管理

### 安装 PM2

```bash
npm install -g pm2
```

### 启动应用

```bash
# 启动应用
pm2 start npm --name "airport-equipment" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs airport-equipment

# 重启应用
pm2 restart airport-equipment

# 停止应用
pm2 stop airport-equipment
```

### 开机自启

```bash
# 设置开机自启
pm2 startup

# 保存当前进程配置
pm2 save
```

### PM2 配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'airport-equipment',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/airport-equipment-management',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
    }
  }]
};
```

使用配置文件启动：
```bash
pm2 start ecosystem.config.js
```

---

## HTTPS 配置

### 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动更新证书
sudo certbot renew --dry-run
```

### 手动配置 SSL

1. 购买 SSL 证书（如从阿里云、腾讯云购买）
2. 将证书文件上传到服务器
3. 在 Nginx 配置中指定证书路径

---

## 环境变量配置

### 创建 .env.production 文件

```env
# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=机场设备管理系统
NEXT_PUBLIC_APP_VERSION=1.0.0

# 数据库配置（选择一个）
# PostgreSQL
DATABASE_URL=postgresql://airport_admin:password@localhost:5432/airport_equipment

# MySQL
# DATABASE_URL=mysql://airport_admin:password@localhost:3306/airport_equipment

# 服务器配置
PORT=3000
HOSTNAME=0.0.0.0

# 安全配置
SESSION_SECRET=your_secret_key_min_32_characters
CORS_ORIGIN=https://your-domain.com
```

---

## 常见问题

### Q1: 如何修改登录账号？

当前版本使用 localStorage 存储。修改用户信息：
1. 进入"管理员"菜单 → "用户管理"
2. 点击"添加用户"创建新账号
3. 编辑或删除现有用户

### Q2: 如何备份数据？

**localStorage 版本：**
- 使用"导出"功能导出 CSV 文件
- 所有数据都可以导出为 CSV，然后用 Excel 打开

**数据库版本：**
```bash
# PostgreSQL
pg_dump -U airport_admin airport_equipment > backup.sql

# MySQL
mysqldump -u airport_admin -p airport_equipment > backup.sql

# SQLite
sqlite3 airport_equipment.db ".dump" > backup.sql
```

### Q3: 忘记密码怎么办？

**开发/测试环境：**
1. 打开浏览器开发工具 (F12)
2. 在控制台执行：
   ```javascript
   localStorage.removeItem('airport-equipment-state');
   window.location.reload();
   ```
3. 系统会重置为初始状态

**生产环境：**
直接在数据库中修改用户密码（需要 DBA 权限）

### Q4: 如何处理大量历史数据？

使用批量导入功能：
1. 准备 CSV 文件（按照模板格式）
2. 在对应页面点击"导入"按钮
3. 选择 CSV 文件上传

### Q5: 性能优化建议

**当前 localStorage 版本：**
- 适合 < 10000 条记录
- 超过此数量建议迁移到数据库

**数据库版本：**
- 添加数据库索引优化查询速度
- 定期清理历史记录
- 使用缓存（Redis）存储热点数据

### Q6: 应用启动失败？

检查以下内容：
1. Node.js 版本是否 >= 18.17.0
2. 端口 3000 是否被占用
3. 环境变量是否配置正确
4. 查看日志：`pm2 logs airport-equipment`

### Q7: 数据库连接失败？

检查以下内容：
1. 数据库服务是否启动
2. 数据库用户名和密码是否正确
3. 数据库端口是否开放
4. 防火墙是否允许访问

---

## 支持和帮助

- 遇到问题可以查看日志：`pm2 logs airport-equipment`
- 检查浏览器控制台（F12）是否有错误信息
- 确保 Node.js 版本 >= 18.17.0
- 确保系统已安装所有依赖：`npm install`
- 查看 [生产环境配置](PRODUCTION_SETUP.md) 获取更多配置细节
