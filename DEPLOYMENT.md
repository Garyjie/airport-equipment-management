# 机场设备管理系统 - 部署说明

## 系统概述

本系统是一个用于机场设备管理的 Web 应用，支持设备状态监控、更换记录、站点管理等功能。

## 部署方式

### 方式一：Vercel 在线部署（推荐）

1. **直接发布**：在 v0 界面点击右上角的 "发布" 按钮即可部署到 Vercel

2. **通过 GitHub 部署**：
   - 将代码推送到 GitHub 仓库
   - 在 Vercel 官网导入该仓库
   - 自动完成部署

### 方式二：本地开发运行

#### 前置要求
- Node.js 18+ 
- npm 或 pnpm 或 yarn

#### 安装步骤

```bash
# 1. 克隆或下载代码
# 在 v0 界面点击 "..." → "下载 ZIP" 获取代码

# 2. 解压并进入项目目录
cd airport-equipment-management

# 3. 安装依赖
npm install
# 或
pnpm install

# 4. 启动开发服务器
npm run dev
# 或
pnpm dev

# 5. 打开浏览器访问
# http://localhost:3000
```

### 方式三：本地生产构建

```bash
# 1. 构建生产版本
npm run build

# 2. 启动生产服务器
npm run start

# 生产服务默认运行在 http://localhost:3000
```

### 方式四：Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# 构建镜像
docker build -t airport-equipment-management .

# 运行容器
docker run -p 3000:3000 airport-equipment-management
```

## 数据存储说明

### 当前版本：浏览器本地存储

本演示版本使用 **localStorage** 存储数据，特点：
- ✅ 无需数据库配置
- ✅ 开箱即用
- ✅ 数据持久化在浏览器中
- ⚠️ 数据仅存在于当前浏览器
- ⚠️ 清除浏览器数据会丢失

### 生产环境推荐：数据库存储

对于正式部署，建议接入数据库：

#### 选项 1：Supabase（推荐）
```bash
# 安装 Supabase 客户端
npm install @supabase/supabase-js

# 配置环境变量
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

#### 选项 2：PostgreSQL + Prisma
```bash
# 安装 Prisma
npm install prisma @prisma/client

# 配置数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/airport_db"

# 初始化数据库
npx prisma migrate dev
```

#### 选项 3：MySQL
```bash
# 安装 MySQL 客户端
npm install mysql2

# 配置连接
DATABASE_URL="mysql://user:password@localhost:3306/airport_db"
```

## 环境变量配置

创建 `.env.local` 文件：

```env
# 如果使用数据库
DATABASE_URL=your_database_url

# 如果使用 Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# 可选：自定义端口
PORT=3000
```

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 操作员 | operator | operator123 |

## 功能说明

### 核心功能
- **仪表盘监控**：实时设备状态、统计数据、下钻查看
- **设备管理**：增删改查、状态变更、批量导入导出
- **站点管理**：值机岛/登机口/自助服务区管理
- **柜台管理**：柜台下设备管理、拖拽替换
- **换纸记录**：CUSS 自助机耗材管理
- **更换记录**：设备变更历史追踪

### 批量操作
- 设备批量导入/导出 (CSV)
- 站点批量导入/导出 (CSV)
- 用户批量导入/导出 (CSV)

### 界面特性
- 深色/浅色主题切换
- 响应式设计
- 实时数据刷新

## 技术栈

- **框架**：Next.js 16
- **UI 组件**：shadcn/ui
- **样式**：Tailwind CSS v4
- **状态管理**：React Context + 自定义 Hook
- **数据存储**：localStorage（演示版）

## 扩展开发

如需扩展系统功能，可参考以下文件结构：

```
├── app/                    # 页面路由
│   ├── dashboard/          # 仪表盘
│   ├── devices/            # 设备管理
│   ├── stations/           # 站点管理
│   ├── paper-records/      # 换纸记录
│   ├── change-records/     # 更换记录
│   └── admin/              # 管理员功能
├── components/             # UI 组件
│   ├── dashboard/          # 仪表盘组件
│   ├── layout/             # 布局组件
│   └── auth/               # 认证组件
├── lib/                    # 工具库
│   ├── types.ts            # 类型定义
│   ├── store.ts            # 数据状态管理
│   └── export.ts           # 导入导出功能
└── hooks/                  # 自定义 Hooks
```

## 常见问题

### Q: 如何重置演示数据？
A: 在登录页面点击 "重置演示数据" 按钮

### Q: 数据如何持久化？
A: 当前版本使用 localStorage，刷新页面数据不会丢失。清除浏览器数据或换浏览器会重置。

### Q: 如何切换主题？
A: 点击顶部导航栏的太阳/月亮图标切换深色/浅色主题

### Q: 如何批量导入数据？
A: 
1. 下载 CSV 模板
2. 按模板格式填写数据
3. 点击导入按钮上传 CSV 文件

## 支持

如有问题，请提交 Issue 或联系开发团队。
