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
