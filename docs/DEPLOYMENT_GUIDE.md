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
- **数据库**: SQLite（默认，无需额外安装）

### 生产环境
- **Node.js**: 18.17.0 或更高版本
- **数据库**: PostgreSQL 15+ 或 MySQL 8.0+（推荐）
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

# 或使用 pnpm
pnpm install
```

### 第3步：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
# 默认使用 SQLite，如需使用 PostgreSQL/MySQL，请修改 DATABASE_URL
```

### 第4步：初始化数据库

```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 导入初始数据
npm run prisma:seed
```

### 第5步：启动服务

**需要两个终端窗口：**

```bash
# 终端 1：启动后端服务器（Express）
npm run server
# 后端运行在 http://localhost:5000
```

```bash
# 终端 2：启动前端开发服务器（Next.js）
npm run dev
# 前端运行在 http://localhost:3000
```

**输出应该类似这样：**

后端成功：
```
🚀 服务器运行在 http://localhost:5000
✅ 数据库连接成功
```

前端成功：
```
> dev
> next dev

  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

### 第6步：访问应用

打开浏览器，访问：
```
http://localhost:3000
```

**默认登录账号：**
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| operator | operator123 | 普通用户 |

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

本项目使用 **Prisma ORM**，支持三种数据库：
- **SQLite**：默认，无需额外安装，适合开发测试
- **PostgreSQL**：推荐用于生产环境
- **MySQL**：也适合生产环境

### 方案一：SQLite（开发测试）

无需额外配置，直接使用即可。数据文件存储在 `prisma/dev.db`。

### 方案二：PostgreSQL（推荐用于生产环境）

#### 安装 PostgreSQL

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

#### 创建数据库和用户

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

#### 配置环境变量

编辑 `.env` 文件：
```env
DATABASE_URL="postgresql://airport_admin:your_secure_password@localhost:5432/airport_equipment"
```

#### 初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 方案三：MySQL

#### 安装 MySQL

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

#### 创建数据库和用户

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

#### 配置环境变量

编辑 `.env` 文件：
```env
DATABASE_URL="mysql://airport_admin:your_secure_password@localhost:3306/airport_equipment"
```

#### 初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

---

## 生产环境部署

### 构建生产版本

```bash
# 1. 构建优化的应用
npm run build

# 2. 启动生产服务器（前端）
npm run start

# 应用将在 http://localhost:3000 运行
```

### 同时启动前后端

生产环境推荐使用 PM2 管理进程：

```bash
# 启动后端
pm2 start npm --name "airport-backend" -- server

# 启动前端
pm2 start npm --name "airport-frontend" -- start
```

### Vercel 部署（仅前端）

1. 在 Vercel 界面创建新项目
2. 连接 Git 仓库
3. 配置环境变量：
   - `NEXT_PUBLIC_API_URL`: 后端 API 地址（如 https://api.your-domain.com）
4. 按步骤完成部署
5. Vercel 会自动分配一个公网域名

---

## Docker 部署

### 为什么用 Docker？

Docker 可以把整个应用（前端、后端、数据库）打包成"集装箱"，一次配置，到处运行。
不用担心环境不一致的问题，部署就像启动一个程序一样简单。

### 部署到 Windows 还是 Linux？

**推荐：Linux（生产环境首选）**

| 对比项 | Linux 服务器 | Windows 服务器 |
|--------|-------------|---------------|
| Docker 性能 | ⭐⭐⭐⭐⭐ 原生运行 | ⭐⭐⭐ 需要虚拟化，有损耗 |
| 资源占用 | 低（几百MB内存） | 高（系统本身开销大） |
| 稳定性 | 高，适合7x24运行 | 一般，常需更新重启 |
| 成本 | 低（免费发行版） | 高（需购买授权） |

**结论：**
- 生产环境 → 选 **Linux**（推荐 Ubuntu 22.04/24.04）
- 本地测试 → Windows 装 Docker Desktop 也可以

### 架构说明

Docker 部署包含 3 个容器，互相配合工作：

```
用户浏览器 → Nginx (80端口) → 前端 (3000端口)
                           → 后端 API (5000端口)
                           → 数据库 PostgreSQL (5432端口)
```

- **Nginx**: 反向代理，统一入口，把 `/api` 请求转发给后端
- **app**: 应用容器，同时运行前端和后端
- **db**: PostgreSQL 数据库容器，数据持久化存储

### 准备工作

#### 1. 安装 Docker 和 Docker Compose

**Linux (Ubuntu/Debian):**
```bash
# 更新软件源
sudo apt-get update

# 安装必要的包
sudo apt-get install -y ca-certificates curl gnupg

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 软件源
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

**Windows:**
1. 下载 Docker Desktop：https://www.docker.com/products/docker-desktop/
2. 安装时勾选 "Use WSL 2 instead of Hyper-V"（推荐）
3. 安装完成后启动 Docker Desktop
4. 打开 PowerShell 验证：
   ```powershell
   docker --version
   docker compose version
   ```

#### 2. 获取项目代码

```bash
git clone <项目地址> airport-equipment-management
cd airport-equipment-management
```

### 快速部署（3步搞定）

#### 第1步：配置环境变量

```bash
# 复制环境变量模板
cp .env.docker.example .env.docker

# 编辑配置文件（修改密码和密钥）
nano .env.docker
```

**必须修改的配置项：**
- `POSTGRES_PASSWORD`: 数据库密码（改成你自己的强密码）
- `DATABASE_URL`: 里面的密码要和上面一致
- `JWT_SECRET`: 至少32位随机字符串，用于加密登录Token

**生成随机密钥的方法（Linux）：**
```bash
openssl rand -base64 48
```

#### 第2步：构建并启动

```bash
# 构建镜像并后台启动所有服务
docker compose up -d --build
```

第一次启动需要下载镜像和构建，大约需要 5-10 分钟，请耐心等待。

#### 第3步：验证部署

```bash
# 查看所有容器状态，应该都是 Up 状态
docker compose ps

# 查看启动日志
docker compose logs -f app
```

看到类似以下输出就说明启动成功了：
```
🚀 服务器运行在 http://0.0.0.0:5000
✓ Ready in 2.3s
```

**访问应用：**
打开浏览器访问 `http://你的服务器IP`

**默认登录账号：**
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| operator | operator123 | 普通用户 |

### 常用操作命令

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f app       # 查看应用日志
docker compose logs -f db        # 查看数据库日志
docker compose logs -f nginx     # 查看 Nginx 日志

# 进入应用容器
docker exec -it airport-app sh

# 重新构建（代码更新后）
docker compose up -d --build

# 查看资源占用
docker stats
```

### 数据库备份与恢复

#### 备份数据库
```bash
docker exec airport-db pg_dump -U airport_admin airport_equipment > backup_$(date +%Y%m%d).sql
```

#### 恢复数据库
```bash
# 先停止应用
docker compose stop app

# 恢复数据
docker exec -i airport-db psql -U airport_admin -d airport_equipment < backup_20240101.sql

# 重启应用
docker compose start app
```

### 更新应用版本

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并启动
docker compose up -d --build

# 3. 查看状态
docker compose ps
```

### 配置 HTTPS（可选）

如果需要配置 HTTPS，建议在 Nginx 前面再加一层反向代理（如 Traefik），或者直接修改 nginx.conf 添加 SSL 配置。

**简单方案：使用 Let's Encrypt + certbot**

在服务器上直接安装 certbot，然后在宿主机 Nginx 上配置 SSL（不要在 Docker 的 Nginx 里配置）。

### 常见问题

**Q1: 启动后访问不了？**
- 检查容器状态：`docker compose ps`，确保都是 Up
- 检查防火墙是否开放了 80 端口
- 查看日志找错误：`docker compose logs app`

**Q2: 数据库连不上？**
- 确认 `.env.docker` 中 `DATABASE_URL` 的密码和 `POSTGRES_PASSWORD` 一致
- 数据库启动需要一点时间，等待 30 秒后再试
- 查看数据库日志：`docker compose logs db`

**Q3: 忘记管理员密码怎么办？**
```bash
# 进入数据库容器
docker exec -it airport-db psql -U airport_admin -d airport_equipment

# 重置密码为 admin123（bcrypt 加密后的值）
UPDATE "User" SET password = '$2a$10$YourBcryptHashHere' WHERE username = 'admin';

# 退出
\q
```

**Q4: 如何修改端口？**
编辑 `docker-compose.yml`，修改 nginx 的 ports 映射：
```yaml
ports:
  - "8080:80"   # 左边是宿主机端口，改成你想要的
```
然后重启：`docker compose up -d`

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

    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 前端代理
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
# 启动后端
pm2 start npm --name "airport-backend" -- server

# 启动前端
pm2 start npm --name "airport-frontend" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs airport-backend
pm2 logs airport-frontend

# 重启应用
pm2 restart airport-backend
pm2 restart airport-frontend

# 停止应用
pm2 stop airport-backend
pm2 stop airport-frontend
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
    name: 'airport-backend',
    script: 'npm',
    args: 'run server',
    cwd: '/path/to/airport-equipment-management',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
    }
  }, {
    name: 'airport-frontend',
    script: 'npm',
    args: 'run start',
    cwd: '/path/to/airport-equipment-management',
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
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_API_URL=http://localhost:5000

# 数据库配置（选择一个）
# PostgreSQL
DATABASE_URL=postgresql://airport_admin:password@localhost:5432/airport_equipment

# MySQL
# DATABASE_URL=mysql://airport_admin:password@localhost:3306/airport_equipment

# 服务器配置
PORT=5000
HOSTNAME=0.0.0.0

# JWT 认证配置
JWT_SECRET=your_jwt_secret_key_min_32_characters
JWT_EXPIRES_IN=7d

# 安全配置
CORS_ORIGIN=https://your-domain.com
```

---

## 常见问题

### Q1: 如何修改登录账号？

使用管理员账号登录后：
1. 进入"用户管理"页面
2. 点击"添加用户"创建新账号
3. 编辑或删除现有用户
4. 修改密码需要知道原密码

### Q2: 如何备份数据？

**数据库备份：**
```bash
# PostgreSQL
pg_dump -U airport_admin airport_equipment > backup.sql

# MySQL
mysqldump -u airport_admin -p airport_equipment > backup.sql

# SQLite
sqlite3 prisma/dev.db ".dump" > backup.sql
```

**应用内导出：**
- 使用"导出"功能导出所有数据为 CSV
- 所有数据都可以导出为 CSV，然后用 Excel 打开

### Q3: 忘记密码怎么办？

**开发/测试环境：**
1. 使用 Prisma Studio 修改密码
   ```bash
   npx prisma studio
   ```
2. 打开 http://localhost:5555
3. 修改 users 表中的密码字段

**生产环境：**
直接在数据库中修改用户密码（需要 DBA 权限）

### Q4: 如何处理大量历史数据？

使用批量导入功能：
1. 准备 CSV 文件（按照模板格式）
2. 在对应页面点击"导入"按钮
3. 选择 CSV 文件上传
4. 查看导入结果（成功/失败/跳过数量）

### Q5: 性能优化建议

- 添加数据库索引优化查询速度
- 定期清理历史记录
- 使用缓存（Redis）存储热点数据
- 启用 Gzip 压缩

### Q6: 应用启动失败？

检查以下内容：
1. Node.js 版本是否 >= 18.17.0
2. 端口 3000/5000 是否被占用
3. 环境变量是否配置正确
4. 查看日志：`pm2 logs airport-backend` 或 `pm2 logs airport-frontend`

### Q7: 数据库连接失败？

检查以下内容：
1. 数据库服务是否启动
2. 数据库用户名和密码是否正确
3. 数据库端口是否开放
4. 防火墙是否允许访问
5. `.env` 文件中的 `DATABASE_URL` 是否配置正确

### Q8: JWT Token 过期怎么办？

- 默认 Token 有效期为 7 天
- 用户需要重新登录获取新 Token
- 可以通过修改 `JWT_EXPIRES_IN` 环境变量调整有效期

---

## 支持和帮助

- 遇到问题可以查看日志：`pm2 logs airport-backend`
- 检查浏览器控制台（F12）是否有错误信息
- 确保 Node.js 版本 >= 18.17.0
- 确保系统已安装所有依赖：`npm install`
- 确保后端服务器运行在 http://localhost:5000
- 查看 [生产环境配置](PRODUCTION_SETUP.md) 获取更多配置细节
