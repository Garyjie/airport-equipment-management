# 机场设备管理系统 - 测试指南

## 环境要求

1. 确保后端服务运行在 http://localhost:5000
2. 确保前端服务运行在 http://localhost:3000

## 安装 Playwright

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## 运行测试

```bash
# 运行所有测试
npx playwright test

# 运行特定测试
npx playwright test dogfood-output/playwright-test.spec.ts

# 生成 HTML 报告
npx playwright test --reporter=html
npx playwright show-report
```

## 手动测试检查清单

如果无法运行自动化测试，请按以下清单手动测试：

### 1. 登录功能
- [ ] 访问 http://localhost:3000
- [ ] 输入用户名: admin
- [ ] 输入密码: admin123
- [ ] 点击登录按钮
- [ ] 应该跳转到仪表盘页面

### 2. 仪表盘页面
- [ ] 检查统计数据是否正确显示
- [ ] 检查柜台数量（应该约 25 个）
- [ ] 检查站点设备分布是否显示
- [ ] 检查是否有控制台错误

### 3. 设备管理页面
- [ ] 访问 http://localhost:3000/devices
- [ ] 点击"添加设备"按钮
- [ ] 选择设备类型为"CUSS 自助值机机"
- [ ] 检查"纸卷类型 *"字段是否显示
- [ ] 测试搜索功能
- [ ] 测试筛选功能

### 4. 站点管理页面
- [ ] 访问 http://localhost:3000/stations
- [ ] 检查站点列表是否显示

### 5. 用户管理页面
- [ ] 访问 http://localhost:3000/admin/users
- [ ] 检查用户列表是否显示

### 6. 更换记录页面
- [ ] 访问 http://localhost:3000/change-records
- [ ] 检查记录列表是否显示

### 7. 换纸记录页面
- [ ] 访问 http://localhost:3000/paper-records
- [ ] 检查记录列表是否显示

### 8. 控制台错误检查
打开浏览器开发者工具 (F12)，检查 Console 面板：
- [ ] 不应该有 `[getThemeColors] TypeError` 错误
- [ ] 不应该有 `net::ERR_ABORTED` 错误
- [ ] 不应该有其他红色错误

### 9. 导航测试
- [ ] 多次在页面间切换
- [ ] 检查是否有 ERR_ABORTED 错误出现
- [ ] 检查重定向是否正常工作

### 10. 主题切换
- [ ] 点击"切换到浅色模式"按钮
- [ ] 检查主题是否正确切换
- [ ] 页面样式是否正常
