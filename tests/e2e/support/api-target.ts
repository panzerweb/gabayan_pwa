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
