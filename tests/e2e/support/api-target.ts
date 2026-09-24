export const DEFAULT_MOCK_API_PORT = '3001'

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Whether the journeys run against the repository's mock API: `VITE_API_BASE_URL` is unset,
 * or names a loopback host on the mock's port. Any other server - FastAPI on port 8000,
 * staging - is started and seeded by whoever runs the journeys, never by Playwright.
 */
export function usesMockApi(
  apiBaseUrl: string | undefined,
  mockApiPort: string = DEFAULT_MOCK_API_PORT,
): boolean {
  if (!apiBaseUrl?.trim()) return true
  let url: URL
  try {
    url = new URL(apiBaseUrl.trim())
  } catch {
    return false
  }
  const port = url.port || (url.protocol === 'https:' ? '443' : '80')
  return loopbackHosts.has(url.hostname) && port === mockApiPort
}

export const DEFAULT_APP_PORT = '5173'

/**
 * The origin the journeys open the app on. It takes the API's host when that is
 * `127.0.0.1`, because the refresh cookie is `SameSite=Lax` and `localhost` and `127.0.0.1`
 * are different sites: a session signed in on one would not survive a reload against an API
 * on the other. Every other API - the mock on `localhost`, a staging server - keeps the app
 * on `localhost`.
 */
export function appOrigin(
  apiBaseUrl: string | undefined,
  appPort: string = DEFAULT_APP_PORT,
): string {
  let host = 'localhost'
  try {
    if (apiBaseUrl?.trim() && new URL(apiBaseUrl.trim()).hostname === '127.0.0.1') {
      host = '127.0.0.1'
    }
  } catch {
    // An unparseable URL leaves the app on localhost; usesMockApi already refuses it.
  }
  return `http://${host}:${appPort}`
}

// Ports the journeys start their own app and mock on, apart from `pnpm dev:all` (5173 and
// 3001), so a development server left running is never mistaken for the journeys' own.
export const JOURNEY_APP_PORT = '5174'
export const JOURNEY_MOCK_API_PORT = '3101'

export interface JourneyServers {
  /** Origin the browser opens the app on. */
  appUrl: string
  appPort: string
  /** API root the app is built against, handed to Vite as `VITE_API_BASE_URL`. */
  apiBaseUrl: string
  /** Port of the mock Playwright starts, or null when another server answers. */
  mockApiPort: string | null
}

/**
 * The servers a journey run needs. With `VITE_API_BASE_URL` unset, or naming a loopback host
 * on the journey mock port, the run starts a freshly seeded mock and the app on the journey
 * ports. Any other API is started and seeded by whoever runs the journeys, and the app opens
 * on 5173, the port that server's CORS origins name. `E2E_APP_PORT` overrides either.
 */
export function journeyServers(env: {
  VITE_API_BASE_URL?: string
  E2E_APP_PORT?: string
  E2E_MOCK_API_PORT?: string
}): JourneyServers {
  const mockPort = env.E2E_MOCK_API_PORT?.trim() || JOURNEY_MOCK_API_PORT
  const requested = env.VITE_API_BASE_URL?.trim()
  const startsMock = usesMockApi(requested, mockPort)
  const apiBaseUrl = requested || `http://localhost:${mockPort}/api/v1`
  const appPort = env.E2E_APP_PORT?.trim() || (startsMock ? JOURNEY_APP_PORT : DEFAULT_APP_PORT)
  return {
    appUrl: appOrigin(apiBaseUrl, appPort),
    appPort,
    apiBaseUrl,
    mockApiPort: startsMock ? mockPort : null,
  }
}
