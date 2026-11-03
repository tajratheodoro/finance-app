import 'dotenv/config'
import { defineConfig, devices } from '@playwright/test'

// The E2E suite owns its database. Never point it at finance (dev) or finance_test (integration).
const testDatabaseUrl = process.env.TEST_DATABASE_URL
if (
  !testDatabaseUrl ||
  !new URL(testDatabaseUrl).pathname.endsWith('/finance_test_e2e')
) {
  throw new Error(
    'TEST_DATABASE_URL must point to the finance_test_e2e database.',
  )
}

// The app's Prisma client reads DATABASE_URL, so the dev server started below uses the E2E database.
process.env.DATABASE_URL = testDatabaseUrl

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  },
})
