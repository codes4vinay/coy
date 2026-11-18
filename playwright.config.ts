import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  reporter: 'list',
  timeout: 30000,
  webServer: [
    {
      command: 'npm run e2e:serve -w apps/api',
      url: 'http://localhost:4100/health',
      env: {
        MONGODB_URI:
          process.env.E2E_MONGODB_URI ||
          'mongodb://127.0.0.1:27018/coy_discover_e2e?replicaSet=coy-local',
        PORT: '4100',
        WEB_ORIGIN: 'http://localhost:3100',
      },
      timeout: 30000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -w apps/web -- --port 3100',
      url: 'http://localhost:3100',
      env: { NEXT_PUBLIC_API_URL: 'http://localhost:4100' },
      timeout: 60000,
      reuseExistingServer: false,
    },
  ],
});
