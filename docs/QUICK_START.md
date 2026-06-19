# 快速开始指南（5分钟上手）

## 第一次使用？按照这个步骤

### 步骤 1：准备（2分钟）

1. **下载 Node.js**
   - 访问 https://nodejs.org/
   - 下载 LTS 版本（推荐）
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

### 步骤 3：启动应用（2分钟）

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**看到这样的信息说明成功：**
```
✓ Ready in 2.3s
- Local:        http://localhost:3000
```

### 步骤 4：访问应用

打开浏览器，访问 **http://localhost:3000**

完成！🎉

---

## 常见任务

### 添加新用户
1. 登录系统
2. 进入"用户管理"（管理员菜单）
3. 点击"添加用户"
4. 填写用户信息
5. 保存

### 添加新站点
1. 进入"站点管理"
2. 点击"添加站点"
3. 填写站点名称、代码等
4. 保存
5. 点击站点可添加柜台和设备

### 为柜台添加设备
1. 进入"仪表盘"
2. 在相应柜台点击"添加设备"按钮
3. 搜索需要的备机设备
4. 选择设备，点击"确认添加"
5. 完成替换或新增

### 导出数据
- **设备表**：进入"设备管理" → 点击"导出"
- **站点表**：进入"站点管理" → 点击"导出"
- **用户表**：进入"用户管理" → 点击"导出"

### 导入数据
1. 准备 CSV 文件（参考导出的文件格式）
2. 进入对应管理页面
3. 点击"导入"按钮
4. 选择 CSV 文件
5. 确认导入

---

## 文件说明

```
airport-equipment-management/
├── app/                           # Next.js 应用目录
│   ├── page.tsx                   # 登录页面
│   ├── dashboard/                 # 仪表盘页面
│   ├── devices/                   # 设备管理页面
│   ├── stations/                  # 站点管理页面
│   ├── admin/                     # 管理员功能
│   │   ├── users/                 # 用户管理
│   │   └── device-types/          # 设备类型管理
│   ├── change-records/            # 更换记录页面
│   └── paper-records/             # 换纸记录页面
├── components/                    # React 组件
│   ├── dashboard/                 # 仪表盘组件
│   ├── layout/                    # 布局组件
│   └── auth/                      # 认证组件
├── lib/                           # 工具函数和类型
│   ├── types.ts                   # TypeScript 类型定义
│   ├── store.ts                   # 数据存储管理
│   ├── export.ts                  # 导入导出功能
│   └── store-context.tsx          # 数据上下文
├── docs/                          # 文档
│   ├── DEPLOYMENT_GUIDE.md        # 详细部署指南
│   ├── PRODUCTION_SETUP.md        # 生产环境配置
│   ├── schema_postgresql.sql      # PostgreSQL 数据库脚本
│   ├── schema_mysql.sql           # MySQL 数据库脚本
│   └── initial_data.sql           # 初始数据脚本
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

# 如果仍失败，尝试使用 yarn
npm install -g yarn
yarn install
```

### 问题 2：端口 3000 被占用
**解决方案：**
```bash
# 方案 A：使用其他端口
npm run dev -- -p 3001

# 方案 B：查找占用进程（Windows）
netstat -ano | findstr :3000

# 方案 C：查找占用进程（Mac/Linux）
lsof -i :3000
# 然后 kill 进程
kill -9 <PID>
```

### 问题 3：登录失败
**检查清单：**
- [ ] 用户名和密码是否正确
- [ ] 是否首次登录（系统会自动创建示例用户）
- [ ] 浏览器 localStorage 是否禁用（检查浏览器设置）

### 问题 4：数据丢失
- 数据保存在浏览器 localStorage 中
- 不要清除浏览器数据
- 定期导出数据备份

---

## 后续步骤

- 阅读 [详细部署指南](DEPLOYMENT_GUIDE.md) 了解所有部署选项
- 阅读 [生产环境配置](PRODUCTION_SETUP.md) 了解数据库集成
- 查看 SQL 脚本文件了解数据库结构

---

## 需要帮助？

- 查看应用内的帮助文档
- 检查浏览器控制台（F12）查看错误信息
- 确保 Node.js 版本 >= 18.17.0

祝您使用愉快！
