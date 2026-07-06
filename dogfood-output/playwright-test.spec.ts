import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe.serial('机场设备管理系统 - 全方位测试', () => {
  let page: Page;
  let issueCount = 0;
  const issues: Array<{
    id: string;
    title: string;
    severity: 'High' | 'Medium' | 'Low';
    description: string;
    screenshot?: string;
    consoleErrors?: string[];
  }> = [];

  const recordIssue = (
    title: string,
    severity: 'High' | 'Medium' | 'Low',
    description: string,
    consoleErrors?: string[]
  ) => {
    issueCount++;
    const id = `ISSUE-${String(issueCount).padStart(3, '0')}`;
    const screenshot = `dogfood-output/screenshots/issue-${String(issueCount).padStart(3, '0')}.png`;
    page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    issues.push({ id, title, severity, description, screenshot, consoleErrors });
    console.log(`\n[${id}] ${severity}: ${title}`);
    console.log(`  ${description}`);
  };

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // 收集所有控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Console Error] ${msg.text()}`);
      }
    });
  });

  test.afterAll(async () => {
    // 生成报告
    const report = generateReport(issues);
    const fs = require('fs');
    fs.writeFileSync('dogfood-output/report.md', report);
    console.log(`\n\n=== 测试完成 ===`);
    console.log(`共发现 ${issues.length} 个问题`);
    console.log(`报告已保存到 dogfood-output/report.md`);
    await page.close();
  });

  test('1. 登录页面测试', async () => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 检查页面标题
    const title = await page.title();
    expect(title).toContain('机场设备管理系统');

    // 检查登录表单是否存在
    const hasUsernameInput = await page.getByPlaceholder(/用户名|账号|username/i).isVisible().catch(() => false);
    const hasPasswordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const hasLoginButton = await page.getByRole('button', { name: /登录|Login/i }).isVisible().catch(() => false);

    if (!hasUsernameInput || !hasPasswordInput || !hasLoginButton) {
      recordIssue(
        '登录页面表单元素缺失',
        'High',
        `登录页面缺少必要的表单元素: username=${hasUsernameInput}, password=${hasPasswordInput}, button=${hasLoginButton}`,
        consoleErrors
      );
    }

    // 检查是否有 ERR_ABORTED 错误
    const abortErrors = consoleErrors.filter(e => e.includes('ERR_ABORTED'));
    if (abortErrors.length > 0) {
      recordIssue(
        '登录页面存在 ERR_ABORTED 网络错误',
        'Medium',
        `页面加载时出现 ${abortErrors.length} 个 ERR_ABORTED 错误`,
        abortErrors
      );
    }

    // 检查 getThemeColors 错误
    const themeErrors = consoleErrors.filter(e => e.includes('getThemeColors'));
    if (themeErrors.length > 0) {
      recordIssue(
        'getThemeColors TypeError 控制台错误',
        'Medium',
        'sonner 组件在 ThemeProvider 初始化前调用 useTheme 导致错误',
        themeErrors
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/01-login-page.png', fullPage: true });
  });

  test('2. 登录功能测试', async () => {
    // 填写登录表单
    const usernameInput = page.getByPlaceholder(/用户名|账号|username/i).first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.getByRole('button', { name: /登录|Login/i }).first();

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    
    // 点击登录
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}),
      loginButton.click(),
    ]);
    await page.waitForTimeout(3000);

    // 检查是否成功跳转
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('/dashboard') || 
                       await page.getByText(/仪表盘|设备管理|站点管理/i).first().isVisible().catch(() => false);

    if (!isLoggedIn) {
      recordIssue(
        '登录失败或跳转异常',
        'High',
        `使用 admin/admin123 登录后未跳转到仪表盘，当前URL: ${currentUrl}`
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/02-after-login.png', fullPage: true });
  });

  test('3. 仪表盘页面测试', async () => {
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 检查仪表盘标题
    const hasDashboardTitle = await page.getByText(/运营监控仪表盘|仪表盘|Dashboard/i).first().isVisible().catch(() => false);
    if (!hasDashboardTitle) {
      recordIssue(
        '仪表盘页面标题缺失',
        'Medium',
        '仪表盘页面未找到标题文字'
      );
    }

    // 检查统计数据 - 使用API验证
    try {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      if (token) {
        const response = await fetch('http://localhost:5000/api/counters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const counters = await response.json();
        const expectedCount = counters.length;
        
        // 在页面上查找站点卡片中的柜台数量
        const counterText = await page.locator('[class*="card"]').filter({ hasText: '站点数量' }).textContent().catch(() => '');
        const counterMatch = counterText?.match(/(\d+)\s+个柜台/);
        
        if (counterMatch) {
          const displayedCount = parseInt(counterMatch[1]);
          if (displayedCount !== expectedCount) {
            recordIssue(
              '柜台数量统计数据异常',
              'Medium',
              `仪表盘显示 ${displayedCount} 个柜台，但API返回 ${expectedCount} 个`
            );
          }
        }
      }
    } catch (err) {
      console.log('API验证柜台数量失败:', err);
    }

    // 检查站点设备分布
    const hasStationView = await page.getByText(/站点设备分布|站点/i).first().isVisible().catch(() => false);
    if (!hasStationView) {
      recordIssue(
        '仪表盘缺少站点设备分布',
        'Low',
        '仪表盘页面未找到站点设备分布区域'
      );
    }

    // 检查 ERR_ABORTED
    const abortErrors = consoleErrors.filter(e => e.includes('ERR_ABORTED'));
    if (abortErrors.length > 0) {
      recordIssue(
        '仪表盘页面存在 ERR_ABORTED 错误',
        'Medium',
        `仪表盘加载时出现 ${abortErrors.length} 个 ERR_ABORTED 错误`,
        abortErrors
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/03-dashboard.png', fullPage: true });
  });

  test('4. 设备管理页面测试', async () => {
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 检查页面标题
    const hasDevicesTitle = await page.getByText('设备管理').first().isVisible().catch(() => false);
    if (!hasDevicesTitle) {
      recordIssue(
        '设备管理页面标题缺失',
        'Medium',
        '设备管理页面未找到"设备管理"标题'
      );
    }

    // 查找并点击添加设备按钮
    const addDeviceBtn = page.getByRole('button', { name: /添加设备/i }).first();
    const btnExists = await addDeviceBtn.isVisible().catch(() => false);

    if (btnExists) {
      await addDeviceBtn.click();
      await page.waitForTimeout(1500);

      // 检查对话框是否打开
      const dialog = page.locator('[role="dialog"]').first();
      const dialogVisible = await dialog.isVisible().catch(() => false);

      if (dialogVisible) {
        // 测试设备类型选择
        const typeSelect = dialog.getByRole('combobox').first();
        const typeSelectExists = await typeSelect.isVisible().catch(() => false);

        if (typeSelectExists) {
          await typeSelect.click();
          await page.waitForTimeout(800);

          // 查找 CUSS 自助值机机选项 - 使用更精确的选择器，只查找列表框中的选项
          const cussOption = dialog.locator('listbox').locator('option', { hasText: /CUSS|自助值机/i }).first();
          const cussExists = await cussOption.isVisible().catch(() => false);

          if (cussExists) {
            await cussOption.click();
            await page.waitForTimeout(1000);

            // 检查纸卷类型字段是否显示
            const hasPaperType = await dialog.getByText(/纸卷类型/i).isVisible().catch(() => false);
            
            if (!hasPaperType) {
              recordIssue(
                'CUSS 设备类型的自定义属性字段不显示',
                'High',
                '选择 CUSS 自助值机机类型后，纸卷类型等自定义属性字段未正确显示'
              );
            }
          } else {
            // 如果列表框选项没找到，尝试查找其他可能的下拉选项
            const cussOptionFallback = dialog.getByRole('option', { name: /CUSS|自助值机/i }).first();
            const cussFallbackExists = await cussOptionFallback.isVisible().catch(() => false);
            if (cussFallbackExists) {
              await cussOptionFallback.click();
              await page.waitForTimeout(1000);
              const hasPaperType = await dialog.getByText(/纸卷类型/i).isVisible().catch(() => false);
              if (!hasPaperType) {
                recordIssue(
                  'CUSS 设备类型的自定义属性字段不显示',
                  'High',
                  '选择 CUSS 自助值机机类型后，纸卷类型等自定义属性字段未正确显示'
                );
              }
            }
          }
        }

        await page.screenshot({ path: 'dogfood-output/screenshots/04-add-device-dialog.png', fullPage: true });

        // 关闭对话框
        const closeBtn = dialog.getByRole('button', { name: /取消|关闭|Cancel/i }).first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    } else {
      recordIssue(
        '设备管理页面缺少添加设备按钮',
        'Medium',
        '设备管理页面未找到"添加设备"按钮'
      );
    }

    // 检查 ERR_ABORTED
    const abortErrors = consoleErrors.filter(e => e.includes('ERR_ABORTED'));
    if (abortErrors.length > 0) {
      recordIssue(
        '设备管理页面存在 ERR_ABORTED 错误',
        'Medium',
        `设备管理页面出现 ${abortErrors.length} 个 ERR_ABORTED 错误`,
        abortErrors
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/04-devices-page.png', fullPage: true });
  });

  test('5. 站点管理页面测试', async () => {
    await page.goto(`${BASE_URL}/stations`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasStationsTitle = await page.getByText('站点管理').first().isVisible().catch(() => false);
    if (!hasStationsTitle) {
      recordIssue(
        '站点管理页面标题缺失',
        'Low',
        '站点管理页面未找到标题'
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/05-stations-page.png', fullPage: true });
  });

  test('6. 用户管理页面测试', async () => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasUsersTitle = await page.getByText('用户管理').first().isVisible().catch(() => false);
    if (!hasUsersTitle) {
      recordIssue(
        '用户管理页面标题缺失',
        'Low',
        '用户管理页面未找到标题'
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/06-users-page.png', fullPage: true });
  });

  test('7. 更换记录页面测试', async () => {
    await page.goto(`${BASE_URL}/change-records`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasRecordsTitle = await page.getByText('更换记录').first().isVisible().catch(() => false);
    if (!hasRecordsTitle) {
      recordIssue(
        '更换记录页面标题缺失',
        'Low',
        '更换记录页面未找到标题'
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/07-change-records.png', fullPage: true });
  });

  test('8. 换纸记录页面测试', async () => {
    await page.goto(`${BASE_URL}/paper-records`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasRecordsTitle = await page.getByText('换纸记录').first().isVisible().catch(() => false);
    if (!hasRecordsTitle) {
      recordIssue(
        '换纸记录页面标题缺失',
        'Low',
        '换纸记录页面未找到标题'
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/08-paper-records.png', fullPage: true });
  });

  test('9. 导航和重定向测试', async () => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 多次导航测试
    const pages = ['/dashboard', '/devices', '/stations', '/dashboard', '/devices', '/stations'];
    
    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    const abortErrors = consoleErrors.filter(e => e.includes('ERR_ABORTED'));
    if (abortErrors.length > 0) {
      recordIssue(
        '导航过程中存在 ERR_ABORTED 错误',
        'High',
        `在多次页面导航过程中出现 ${abortErrors.length} 个 ERR_ABORTED 错误，可能存在导航竞态问题`,
        abortErrors
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/09-navigation-test.png', fullPage: true });
  });

  test('10. 主题切换测试', async () => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 查找主题切换按钮 - 通过按钮名称查找（"切换到深色模式"或"切换到浅色模式"）
    const themeButton = page.getByRole('button', { name: /切换到.*模式/i }).first();
    const btnExists = await themeButton.isVisible().catch(() => false);

    if (btnExists) {
      const initialHasDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
      
      await themeButton.click();
      await page.waitForTimeout(800);
      
      const afterHasDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
      
      // 检查主题是否切换 - 应该从深色切换到浅色或反之
      if (initialHasDark === afterHasDark) {
        recordIssue(
          '主题切换功能异常',
          'Low',
          '点击主题切换按钮后，主题未切换'
        );
      }
    } else {
      recordIssue(
        '主题切换按钮未找到',
        'Low',
        '未找到主题切换按钮'
      );
    }

    await page.screenshot({ path: 'dogfood-output/screenshots/10-theme-toggle.png', fullPage: true });
  });
});

function generateReport(issues: Array<{
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  screenshot?: string;
  consoleErrors?: string[];
}>): string {
  const high = issues.filter(i => i.severity === 'High').length;
  const medium = issues.filter(i => i.severity === 'Medium').length;
  const low = issues.filter(i => i.severity === 'Low').length;

  let report = `# 机场设备管理系统 - 测试报告

**测试日期**: ${new Date().toISOString().split('T')[0]}  
**测试范围**: 全功能测试  
**测试状态**: 已完成

## 测试摘要

| 项目 | 数量 |
|------|------|
| 总测试用例 | 10 |
| 发现问题 | ${issues.length} |

### 问题汇总

| 严重程度 | 数量 |
|---------|------|
| 🔴 High | ${high} |
| 🟡 Medium | ${medium} |
| 🟢 Low | ${low} |

---

`;

  issues.forEach(issue => {
    const severityIcon = issue.severity === 'High' ? '🔴' : issue.severity === 'Medium' ? '🟡' : '🟢';
    report += `## ${issue.id}: ${issue.title}

**严重程度**: ${severityIcon} ${issue.severity}

**问题描述**:
${issue.description}

`;
    if (issue.screenshot) {
      report += `**截图**:
![${issue.id}](${issue.screenshot.replace('dogfood-output/', '')})

`;
    }
    if (issue.consoleErrors && issue.consoleErrors.length > 0) {
      report += `**控制台错误**:
\`\`\`
${issue.consoleErrors.slice(0, 5).join('\n')}
${issue.consoleErrors.length > 5 ? `... 还有 ${issue.consoleErrors.length - 5} 条` : ''}
\`\`\`

`;
    }
    report += `---

`;
  });

  report += `## 测试覆盖

- [x] 登录页面
- [x] 仪表盘页面
- [x] 设备管理页面
- [x] 站点管理页面
- [x] 用户管理页面
- [x] 更换记录页面
- [x] 换纸记录页面
- [x] 控制台错误检查
- [x] 导航测试
- [x] 主题切换

## 后续行动

- [ ] 修复 High 严重程度问题
- [ ] 修复 Medium 严重程度问题
- [ ] 修复 Low 严重程度问题
- [ ] 重新测试验证修复
`;

  return report;
}
