# 机场设备管理系统

专为机场设计的设备状态监控和更换管理平台，支持实时监控、灵活配置、数据导出等功能。采用前后端分离架构，后端使用 Express + Prisma ORM，支持 SQLite、PostgreSQL、MySQL 等多种数据库。

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-18.17.0+-green)

## 📋 功能特性

### 核心功能
- **实时监控仪表盘** - 设备状态一目了然，支持统计卡片下钻查看详情
- **设备管理** - 完整的设备生命周期管理（增删改查、导入导出）
- **站点管理** - 值机岛、登机口、自助服务区等站点灵活配置
- **设备替换** - 点击式便捷操作，从备机库快速搜索和安装设备
- **更换记录** - 完整的设备移动、状态变更历史追溯
- **换纸记录** - CUSS 自助机专用耗材更换记录管理
- **耗材管理** - 通用耗材更换记录管理

### 高级功能
- 🌓 **深浅色主题** - 支持黑白主题切换
- 📤 **数据导入导出** - CSV 格式支持批量操作，自动识别 GBK/UTF-8 编码
- 👥 **用户管理** - 管理员和普通用户角色分离
- 🔒 **权限控制** - 基于角色的访问控制（JWT + bcrypt）
- 📝 **审计日志** - 所有操作记录，支持安全审计
- 📱 **响应式设计** - 支持桌面和平板展示

### 设备状态管理
- ✅ **使用中** - 设备正常运行
- 🔄 **备机** - 设备在库房待命
- ⚠️ **损坏** - 设备故障待修复
- 🔧 **送修** - 设备已送外维修

## 🚀 快速开始

### 环境要求
- **Node.js**: 18.17.0+
- **npm**: 9.0.0+ 或 pnpm
- **数据库**: SQLite（默认）/ PostgreSQL 15+ / MySQL 8.0+

### 安装步骤

```bash
# 1. 克隆项目
git clone <repo-url>
cd airport-equipment-management

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接和 JWT 密钥

# 4. 初始化数据库
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. 启动后端服务器
npm run server
# 服务器运行在 http://localhost:5000

# 6. 启动前端开发服务器（新开一个终端）
npm run dev
# 前端运行在 http://localhost:3000
```

### 默认登录账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| operator | operator123 | 普通用户 |

**更详细的指南请查看：[快速开始指南](docs/QUICK_START.md)**

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | Next.js 16 + React 19 | SSR/SSG 框架 |
| **UI** | shadcn/ui + Tailwind CSS v4 | 组件库和样式 |
| **状态管理** | React Context + Hooks | 全局状态 |
| **后端** | Express 5.x | API 服务器 |
| **ORM** | Prisma 5.x | 数据库 ORM |
| **数据库** | SQLite / PostgreSQL / MySQL | 数据存储 |
| **认证** | JWT + bcrypt | 身份认证 |
| **类型检查** | TypeScript | 类型安全 |

### 项目结构

```
airport-equipment-management/
├── app/                     # Next.js 前端应用
│   ├── layout.tsx           # 全局布局
│   ├── page.tsx             # 登录页
│   ├── dashboard/           # 仪表盘
│   ├── devices/             # 设备管理
│   ├── stations/            # 站点管理
│   ├── change-records/      # 更换记录
│   ├── paper-records/       # 换纸记录
│   └── admin/               # 管理功能
│       ├── users/           # 用户管理
│       └── device-types/    # 设备类型管理
├── components/              # React 组件
│   ├── auth/                # 认证组件
│   ├── dashboard/           # 仪表盘组件
│   ├── layout/              # 布局组件
│   └── ui/                  # UI 组件库
├── lib/                     # 工具和类型
│   ├── api.ts               # API 请求封装
│   ├── store.ts             # 全局状态管理
│   ├── store-context.tsx    # Context Provider
│   ├── types.ts             # TypeScript 类型定义
│   ├── export.ts            # 导入导出功能
│   └── utils.ts             # 工具函数
├── server/                  # Express 后端
│   ├── index.ts             # 服务器入口
│   ├── prisma.ts            # Prisma 客户端
│   ├── seed.ts              # 初始数据脚本
│   ├── middleware/
│   │   └── auth.ts          # JWT 认证中间件
│   └── routes/              # API 路由
│       ├── auth.ts          # 认证接口
│       ├── users.ts         # 用户接口
│       ├── deviceTypes.ts   # 设备类型接口
│       ├── stations.ts      # 站点接口
│       ├── counters.ts      # 柜台接口
│       ├── devices.ts       # 设备接口
│       ├── changeRecords.ts # 变更记录接口
│       ├── paperRecords.ts  # 换纸记录接口
│       └── consumableRecords.ts # 耗材记录接口
├── prisma/                  # Prisma ORM
│   ├── schema.prisma        # 数据库模型定义
│   └── migrations/          # 数据库迁移
├── docs/                    # 项目文档
│   ├── sql/                 # SQL 脚本
│   │   ├── schema_postgresql.sql
│   │   ├── schema_mysql.sql
│   │   └── initial_data.sql
│   ├── QUICK_START.md       # 快速开始
│   ├── DEPLOYMENT_GUIDE.md  # 部署指南
│   ├── PRODUCTION_SETUP.md  # 生产环境配置
│   ├── 项目详解.md          # 项目详细文档
│   └── 新手入门详解.md      # 新手入门教程
├── public/                  # 静态资源
├── package.json             # 项目配置
└── .env.example             # 环境变量示例
```

## 🗄️ 数据库

### 支持的数据库

| 数据库 | 推荐 | 适用场景 |
|--------|------|----------|
| **SQLite** | - | 开发测试、小型机场 |
| **PostgreSQL** | ✅ 推荐 | 生产环境、大型机场 |
| **MySQL** | ✅ 推荐 | 生产环境、中小型机场 |

### 数据库表结构

| 表名 | 说明 | 记录数（示例） |
|------|------|--------------|
| `users` | 用户信息 | 2 |
| `stations` | 站点信息（值机岛、登机口、自助服务区） | 8 |
| `counters` | 柜台信息 | 17 |
| `device_types` | 设备类型定义 | 8 |
| `devices` | 设备信息 | 30 |
| `device_change_records` | 设备更换记录 | 3 |
| `paper_change_records` | 换纸记录 | - |
| `consumable_records` | 耗材更换记录 | - |
| `audit_logs` | 系统审计日志 | - |

**详细数据库说明请查看：[生产环境配置](docs/PRODUCTION_SETUP.md)**

## 🔐 安全特性

- ✅ 密码使用 bcrypt 加密存储（10轮加盐）
- ✅ JWT Token 身份认证
- ✅ 基于角色的访问控制（RBAC）
- ✅ 审计日志记录所有操作
- ✅ SQL 注入防护（Prisma 参数化查询）
- ✅ XSS 防护（React 自动转义）
- ✅ 软删除机制（数据可恢复）
- ✅ 操作原因记录（状态变更需填写原因）

## 📖 文档列表

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [快速开始指南](docs/QUICK_START.md) | 5分钟快速上手 | 初学者 |
| [详细部署指南](docs/DEPLOYMENT_GUIDE.md) | 完整的部署步骤 | 运维人员 |
| [生产环境配置](docs/PRODUCTION_SETUP.md) | 数据库配置、安全检查 | 运维/开发 |
| [项目详解](docs/项目详解.md) | 完整的项目技术文档 | 开发者 |
| [新手入门详解](docs/新手入门详解.md) | 通俗讲解，从零开始 | 初学者 |
| [PostgreSQL 脚本](docs/sql/schema_postgresql.sql) | PostgreSQL 数据库表结构 | DBA/开发 |
| [MySQL 脚本](docs/sql/schema_mysql.sql) | MySQL 数据库表结构 | DBA/开发 |
| [初始数据脚本](docs/sql/initial_data.sql) | 示例数据导入 | 开发者 |

## 🎯 API 接口概览

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 管理接口
- `GET/POST/PUT/DELETE /api/users` - 用户管理
- `GET/POST/PUT/DELETE /api/device-types` - 设备类型管理
- `GET/POST/PUT/DELETE /api/stations` - 站点管理
- `GET/POST/PUT/DELETE /api/counters` - 柜台管理
- `GET/POST/PUT/DELETE /api/devices` - 设备管理

### 业务接口
- `POST /api/devices/:id/move` - 移动设备位置
- `POST /api/devices/:id/status` - 更新设备状态
- `GET /api/change-records` - 变更记录列表
- `GET/POST /api/paper-records` - 换纸记录
- `GET/POST /api/consumable-records` - 耗材记录

**完整 API 文档请查看：[项目详解 - API接口清单](docs/项目详解.md#七-api接口完整清单)**

## 📦 可用脚本

```bash
# 开发
npm run dev              # 启动前端开发服务器
npm run server           # 启动后端开发服务器
npm run server:dev       # 启动后端开发服务器（watch模式）

# 构建
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库
npm run prisma:generate  # 生成 Prisma 客户端
npm run prisma:migrate   # 运行数据库迁移
npm run prisma:seed      # 导入初始数据
npm run prisma:studio    # 打开 Prisma Studio

# 代码检查
npm run lint             # 运行代码检查
npm run typecheck        # 运行类型检查
```

## 🔄 数据备份

### 自动备份（PostgreSQL）

```bash
# 每日备份脚本
pg_dump -U airport_admin airport_equipment > backup_$(date +%Y%m%d).sql
```

### 手动备份
- 使用应用内"导出"功能导出所有数据为 CSV
- 定期保存导出文件到安全位置
- SQLite 数据库文件可直接复制备份

## 🐛 常见问题

### Q: 如何修改管理员密码？
A: 登录后进入"用户管理"页面可以修改用户信息和密码。

### Q: 数据存储在哪里？
A: 生产版数据存储在数据库中（SQLite/PostgreSQL/MySQL），默认使用 SQLite。

### Q: 支持多用户同时操作吗？
A: 是的，生产版完全支持多用户并发操作，数据实时同步。

### Q: 如何从演示版升级到生产版？
A: 先导出演示版数据为 CSV，然后在生产版中导入。

### Q: 备机设备如何安装到柜台？
A: 在仪表盘或站点管理中，点击柜台的"添加设备"按钮，从备机区选择设备即可安装。

### Q: 设备状态如何流转？
A: 使用中 → 损坏 → 送修 → 备机 → 使用中，每次变更都需要填写原因。

## 📞 支持和反馈

- 查看 [详细部署指南](docs/DEPLOYMENT_GUIDE.md) 了解所有部署方式
- 查看 [生产环境配置](docs/PRODUCTION_SETUP.md) 了解数据库集成
- 检查浏览器控制台（F12）查看错误信息
- 确保已安装 Node.js 18.17.0 或更高版本

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙏 致谢

感谢所有贡献者和使用者的支持！

---

**版本**: 2.0.0  
**最后更新**: 2026年6月  
**项目状态**: 可部署上线
