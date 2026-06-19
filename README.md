# 机场设备管理系统

专为机场设计的设备状态监控和更换管理平台，支持实时监控、灵活配置、数据导出等功能。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
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

### 高级功能
- 🌓 **深浅色主题** - 支持黑白主题切换
- 📤 **数据导入导出** - CSV 格式支持批量操作
- 👥 **用户管理** - 管理员和普通用户角色分离
- 🔒 **权限控制** - 基于角色的访问控制
- 📱 **响应式设计** - 支持桌面和平板展示

### 设备状态管理
- ✅ **使用中** - 设备正常运行
- 🔄 **备机** - 设备在库房待命
- ⚠️ **损坏** - 设备故障待修复
- 🔧 **送修** - 设备已送外维修

## 🚀 快速开始

### 最简单的方式（5分钟）

```bash
# 1. 下载并进入项目目录
cd airport-equipment-management

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问
# http://localhost:3000
```

**默认登录账号（localStorage 模式）：**
- 用户名：admin
- 密码：admin

**更详细的指南请查看：[快速开始指南](docs/QUICK_START.md)**

## 📖 文档

| 文档 | 描述 |
|------|------|
| [快速开始指南](docs/QUICK_START.md) | 5分钟快速上手，最简单的开始方式 |
| [详细部署指南](docs/DEPLOYMENT_GUIDE.md) | 完整的部署步骤，包括本地开发、生产部署等 |
| [生产环境配置](docs/PRODUCTION_SETUP.md) | 数据库配置、密码加密、安全检查清单 |
| [PostgreSQL 数据库脚本](docs/schema_postgresql.sql) | PostgreSQL 数据库表结构 |
| [MySQL 数据库脚本](docs/schema_mysql.sql) | MySQL 数据库表结构 |
| [初始数据脚本](docs/initial_data.sql) | 示例数据（用户、站点、设备等） |

## 🏗️ 项目结构

```
airport-equipment-management/
├── app/                     # Next.js 应用
│   ├── page.tsx             # 登录页
│   ├── dashboard/           # 仪表盘
│   ├── devices/             # 设备管理
│   ├── stations/            # 站点管理
│   ├── admin/               # 管理功能
│   │   ├── users/           # 用户管理
│   │   └── device-types/    # 设备类型管理
│   ├── change-records/      # 更换记录
│   └── paper-records/       # 换纸记录
├── components/              # React 组件
│   ├── dashboard/           # 仪表盘组件
│   ├── layout/              # 布局组件
│   └── ui/                  # UI 组件
├── lib/                     # 工具和类型
│   ├── types.ts             # TypeScript 类型定义
│   ├── store.ts             # 数据存储管理
│   ├── export.ts            # 导入导出功能
│   └── store-context.tsx    # 数据上下文
├── hooks/                   # 自定义 Hook
├── docs/                    # 完整文档和 SQL 脚本
│   ├── QUICK_START.md       # 快速开始指南
│   ├── DEPLOYMENT_GUIDE.md  # 部署指南
│   ├── PRODUCTION_SETUP.md  # 生产环境配置
│   ├── schema_postgresql.sql # PostgreSQL 数据库脚本
│   ├── schema_mysql.sql     # MySQL 数据库脚本
│   └── initial_data.sql     # 初始数据脚本
├── public/                  # 静态资源
├── package.json             # 项目配置
└── next.config.js           # Next.js 配置
```

## 🗄️ 数据库支持

系统支持以下数据库，可根据需求选择：

| 数据库 | 推荐 | 适用场景 |
|--------|------|--------|
| **PostgreSQL** | ✅ 推荐 | 生产环境、大型机场 |
| **MySQL** | ✅ 推荐 | 生产环境、中小型机场 |
| **SQLite** | - | 测试环境、小型机场 |
| **localStorage**（当前） | - | 开发测试阶段 |

**迁移到数据库？** 查看[生产环境配置](docs/PRODUCTION_SETUP.md)

### 数据库表结构

| 表名 | 描述 |
|------|------|
| users | 用户信息 |
| stations | 站点信息（值机岛、登机口、自助服务区） |
| counters | 柜台信息 |
| device_types | 设备类型定义 |
| devices | 设备信息 |
| device_change_records | 设备更换记录 |
| paper_change_records | 换纸记录 |
| audit_logs | 审计日志 |

## 🔐 安全性

- ✅ 密码使用 bcrypt 加密存储
- ✅ 基于角色的访问控制 (RBAC)
- ✅ 审计日志记录所有操作
- ✅ 支持 HTTPS/TLS 加密传输
- ✅ SQL 注入防护
- ✅ XSS 和 CSRF 防护

## 🎯 主要模块说明

### 仪表盘（Dashboard）
- 实时设备状态统计
- 站点设备分布显示
- 统计卡片支持下钻查看详情
- 快速设备替换操作

### 设备管理
- 设备列表增删改查
- 批量导入导出（CSV）
- 设备类型自定义
- 自定义属性管理
- 按站点分组显示（备机区、损坏区、送修区）

### 站点管理
- 站点增删改查
- 柜台管理（值机岛和登机口）
- 支持逐级下钻到设备
- 批量导入导出

### 用户管理（管理员）
- 用户账号管理
- 角色权限分配
- 批量导入导出用户

### 更换记录
- 设备移动历史追踪
- 状态变更记录
- 搜索和筛选功能

### 换纸记录
- CUSS 自助机换纸记录
- 耗材使用统计
- 导出报表

## 📱 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🛠️ 技术栈

- **前端框架**: React 19 + Next.js 16
- **UI 组件**: shadcn/ui
- **样式**: Tailwind CSS v4
- **状态管理**: React Context + Hooks
- **数据存储**: localStorage（开发） / PostgreSQL/MySQL（生产）
- **类型检查**: TypeScript
- **构建工具**: Turbopack

## 📦 生产部署

### 环境要求

| 环境 | Node.js | 内存 | 磁盘 |
|------|---------|------|------|
| 开发 | 18.17.0+ | 512MB+ | 1GB+ |
| 生产 | 18.17.0+ | 1GB+ | 2GB+ |

### 部署方式

#### 1. 构建生产版本

```bash
npm run build
npm run start
```

#### 2. Docker 部署

```bash
# 构建镜像
docker build -t airport-equipment .

# 运行容器
docker run -p 3000:3000 airport-equipment
```

#### 3. Vercel 部署

1. 在 v0 界面点击"发布"按钮
2. 选择部署到 Vercel
3. 按步骤完成部署

#### 4. Linux 服务器部署

详见[完整部署指南](docs/DEPLOYMENT_GUIDE.md)

## 🔄 数据备份

### 自动备份

```bash
# PostgreSQL 每日备份脚本
pg_dump -U airport_admin airport_equipment > backup_$(date +%Y%m%d).sql
```

### 手动备份
- 使用应用内"导出"功能导出所有数据为 CSV
- 定期保存导出文件到安全位置

## 🐛 常见问题

### Q: 如何修改登录账号？
A: 进入"用户管理"页面可以添加、编辑、删除用户。

### Q: 数据存储在哪里？
A: 当前版本存储在浏览器 localStorage 中。迁移到数据库请查看[生产环境配置](docs/PRODUCTION_SETUP.md)。

### Q: 如何备份数据？
A: 使用导出功能将所有数据导出为 CSV 文件，或定期进行数据库备份。

### Q: 支持多用户同时操作吗？
A: 当前 localStorage 版本不支持实时同步。迁移到数据库后完全支持。

### Q: 如何处理大量数据？
A: 使用批量导入导出功能，支持 CSV 格式的大数据量操作。

### Q: 备机设备如何安装到柜台？
A: 在仪表盘或站点管理中，点击柜台的"添加设备"按钮，从备机区选择设备即可安装。

### Q: 设备状态如何流转？
A: 使用中 → 损坏 → 送修 → 备机 → 使用中

## 📞 支持和反馈

- 查看[详细部署指南](docs/DEPLOYMENT_GUIDE.md)了解所有部署方式
- 查看[生产环境配置](docs/PRODUCTION_SETUP.md)了解数据库集成
- 检查浏览器控制台（F12）查看错误信息
- 确保已安装 Node.js 18.17.0 或更高版本

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙏 致谢

感谢所有贡献者和使用者的支持！

---

**版本**: 1.0.0  
**最后更新**: 2026年6月  
**项目状态**: 可部署上线
