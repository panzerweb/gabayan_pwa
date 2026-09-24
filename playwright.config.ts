import { defineConfig, devices } from '@playwright/test'

import { appOrigin, DEFAULT_MOCK_API_PORT, usesMockApi } from './tests/e2e/support/api-target.js'

const mockApiPort = process.env.MOCK_API_PORT ?? DEFAULT_MOCK_API_PORT
// The app opens on the API's loopback host so the refresh cookie survives a reload.
const appUrl = appOrigin(process.env.VITE_API_BASE_URL)

// The servers start from their binaries rather than package scripts, so a package manager's
// pre-run dependency check can never block the journeys. The mock is started - from a fresh
// copy of its seed - only when the app talks to it; another server named by
// VITE_API_BASE_URL is started and seeded beforehand (README "Running against another API").
const mockApiServer = {
  command: 'node mock-api/reset.mjs && node mock-api/server.mjs',
  url: `http://localhost:${mockApiPort}/api/v1/health`,
  reuseExistingServer: !process.env.CI,
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: appUrl,
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: [
    {
      command: 'npx vite --host 127.0.0.1',
      url: appUrl,
      reuseExistingServer: !process.env.CI,
    },
    ...(usesMockApi(process.env.VITE_API_BASE_URL, mockApiPort) ? [mockApiServer] : []),
  ],
})
