import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './dogfood-output',
  testMatch: 'playwright-test.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'dogfood-output/playwright-report' }],
    ['list'],
  ],
  use: {
    // 使用系统安装的 Chrome 浏览器
    channel: 'chrome',
    headless: false,
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'dogfood-output/test-results',
});
