# 快速开始指南（5分钟上手）

## 第一次使用？按照这个步骤

### 步骤 1：准备（2分钟）

1. **下载 Node.js**
   - 访问 https://nodejs.org/
   - 下载 LTS 版本（推荐 v18.x 或更高）
   - 安装（一直点 Next）

2. **验证安装**
   ```bash
   node --version  # 应显示 v18.x.x 或更高
   npm --version   # 应显示 9.x.x 或更高
   ```

### 步骤 2：获取代码（1分钟）

```bash
# 从 ZIP 文件解压
unzip airport-equipment-management.zip
cd airport-equipment-management

# 或从 Git 克隆
git clone <repo-url>
cd airport-equipment-management
```

### 步骤 3：配置环境变量（30秒）

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件（可选，默认使用 SQLite）
# 如需使用 PostgreSQL/MySQL，请修改 DATABASE_URL
```

### 步骤 4：初始化数据库（1分钟）

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 导入初始数据
npm run prisma:seed
```

### 步骤 5：启动应用（1分钟）

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

**看到这样的信息说明成功：**

后端成功：
```
🚀 服务器运行在 http://localhost:5000
✅ 数据库连接成功
```

前端成功：
```
✓ Ready in 2.3s
- Local:        http://localhost:3000
```

### 步骤 6：访问应用

打开浏览器，访问 **http://localhost:3000**

**默认登录账号：**
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| operator | operator123 | 普通用户 |

完成！🎉

---

## 常见任务

### 添加新用户
1. 登录系统（使用 admin 账号）
2. 进入"用户管理"（左侧管理员菜单）
3. 点击"添加用户"
4. 填写用户名、密码、角色
5. 保存

### 添加新站点
1. 进入"站点管理"
2. 点击"添加站点"
3. 填写站点名称、代码、类型
4. 保存
5. 点击站点可添加柜台和设备

### 为柜台添加设备
1. 进入"仪表盘"
2. 在相应柜台点击"添加设备"按钮
3. 从备机库搜索需要的设备
4. 选择设备，点击"确认添加"
5. 完成设备安装

### 导出数据
- **设备表**：进入"设备管理" → 点击"导出"
- **站点表**：进入"站点管理" → 点击"导出"
- **用户表**：进入"用户管理" → 点击"导出"

### 导入数据
1. 准备 CSV 文件（先导出一份查看格式）
2. 进入对应管理页面
3. 点击"导入"按钮
4. 选择 CSV 文件
5. 查看导入结果（成功/失败/跳过数量）

### 修改设备状态
1. 在"设备管理"找到目标设备
2. 点击状态下拉菜单
3. 选择新状态（损坏/送修/备机/使用中）
4. 填写变更原因（必填）
5. 确认变更

---

## 文件说明

```
airport-equipment-management/
├── app/                           # Next.js 前端应用
│   ├── page.tsx                   # 登录页面
│   ├── dashboard/                 # 仪表盘页面
│   ├── devices/                   # 设备管理页面
│   ├── stations/                  # 站点管理页面
│   ├── change-records/            # 更换记录页面
│   ├── paper-records/             # 换纸记录页面
│   └── admin/                     # 管理员功能
│       ├── users/                 # 用户管理
│       └── device-types/          # 设备类型管理
├── components/                    # React 组件
│   ├── dashboard/                 # 仪表盘组件
│   ├── layout/                    # 布局组件
│   ├── auth/                      # 认证组件
│   └── ui/                        # UI 组件库
├── lib/                           # 工具函数和类型
│   ├── api.ts                     # API 请求封装
│   ├── types.ts                   # TypeScript 类型定义
│   ├── store.ts                   # 全局状态管理
│   ├── store-context.tsx          # Context Provider
│   └── export.ts                  # 导入导出功能
├── server/                        # Express 后端服务器
│   ├── index.ts                   # 服务器入口
│   ├── prisma.ts                  # Prisma 客户端
│   ├── seed.ts                    # 初始数据脚本
│   ├── middleware/                # 中间件
│   │   └── auth.ts                # JWT 认证中间件
│   └── routes/                    # API 路由
│       ├── auth.ts                # 认证接口
│       ├── users.ts               # 用户接口
│       ├── stations.ts            # 站点接口
│       ├── counters.ts            # 柜台接口
│       ├── devices.ts             # 设备接口
│       └── ...                    # 其他接口
├── prisma/                        # Prisma ORM
│   ├── schema.prisma              # 数据库模型定义
│   └── migrations/                # 数据库迁移文件
├── docs/                          # 文档
│   ├── sql/                       # SQL 脚本目录
│   │   ├── schema_postgresql.sql
│   │   ├── schema_mysql.sql
│   │   └── initial_data.sql
│   ├── QUICK_START.md             # 快速开始（本文档）
│   ├── DEPLOYMENT_GUIDE.md        # 详细部署指南
│   ├── PRODUCTION_SETUP.md        # 生产环境配置
│   ├── 项目详解.md                # 完整技术文档
│   └── 新手入门详解.md            # 新手入门教程
├── .env.example                   # 环境变量模板
└── package.json                   # 项目配置
```

---

## 故障排除

### 问题 1：npm install 失败
**解决方案：**
```bash
# 清除缓存
npm cache clean --force

# 重新安装
npm install

# 如果仍失败，尝试使用 pnpm
npm install -g pnpm
pnpm install
```

### 问题 2：端口 3000 或 5000 被占用
**解决方案：**
```bash
# Windows - 查找占用进程
netstat -ano | findstr :3000
# 然后根据 PID 结束进程
taskkill /F /PID <PID>

# Mac/Linux - 查找占用进程
lsof -i :3000
kill -9 <PID>
```

### 问题 3：数据库连接失败
**检查清单：**
- [ ] 确认 `.env` 文件中的 `DATABASE_URL` 配置正确
- [ ] 确认数据库服务已启动（PostgreSQL/MySQL）
- [ ] 确认数据库用户名和密码正确
- [ ] 如果使用 SQLite，确认 `prisma/dev.db` 文件存在且有权限

### 问题 4：登录失败
**检查清单：**
- [ ] 确认用户名和密码正确（默认 admin/admin123）
- [ ] 确认后端服务器已启动（http://localhost:5000）
- [ ] 打开浏览器控制台（F12）查看网络请求是否正常

### 问题 5：Prisma 迁移失败
**解决方案：**
```bash
# 重新生成 Prisma 客户端
npm run prisma:generate

# 如果迁移历史有问题，尝试重置
npx prisma migrate reset
```

### 问题 6：导入数据报错
**常见原因：**
- CSV 文件格式不正确（缺少列、格式不匹配）
- 序列号重复（设备序列号必须唯一）
- 站点/柜台/设备类型名称不存在

**解决方案：**
1. 先导出一份数据查看正确格式
2. 按照模板格式准备导入文件
3. 查看导入结果中的错误详情

---

## 后续步骤

- 阅读 [项目详解](项目详解.md) 了解完整技术架构
- 阅读 [详细部署指南](DEPLOYMENT_GUIDE.md) 了解生产部署
- 阅读 [生产环境配置](PRODUCTION_SETUP.md) 了解数据库优化
- 阅读 [新手入门详解](新手入门详解.md) 学习全栈开发知识

---

## 需要帮助？

- 检查浏览器控制台（F12）查看错误信息
- 查看后端日志（终端窗口）
- 确保 Node.js 版本 >= 18.17.0
- 确保后端服务器运行在 http://localhost:5000

祝您使用愉快！
