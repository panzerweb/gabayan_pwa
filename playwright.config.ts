import { defineConfig, devices } from '@playwright/test'

import { journeyServers } from './tests/e2e/support/api-target.js'

const servers = journeyServers(process.env)

// The servers start from their binaries rather than package scripts, so a package manager's
// pre-run dependency check can never block the journeys. Neither is ever reused: a server
// already listening was built against an unknown API or holds another run's data, so a busy
// port fails the run instead. The mock is started - from a fresh copy of its seed - only when
// the app talks to it; another server named by VITE_API_BASE_URL is started and seeded
// beforehand (README "Running against another API").
const mockApiServer = (port: string) => ({
  command: 'node mock-api/reset.mjs && node mock-api/server.mjs',
  url: `http://localhost:${port}/api/v1/health`,
  env: { MOCK_API_PORT: port },
  reuseExistingServer: false,
})

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: servers.appUrl,
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
      command: `npx vite --host 127.0.0.1 --port ${servers.appPort} --strictPort`,
      url: servers.appUrl,
      env: { VITE_API_BASE_URL: servers.apiBaseUrl },
      reuseExistingServer: false,
    },
    ...(servers.mockApiPort ? [mockApiServer(servers.mockApiPort)] : []),
  ],
})
