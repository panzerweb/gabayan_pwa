import { appOrigin, journeyServers, usesMockApi } from '../../e2e/support/api-target'

describe('usesMockApi', () => {
  it('runs the journeys on the mock when no API base URL is set', () => {
    expect(usesMockApi(undefined)).toBe(true)
    expect(usesMockApi('  ')).toBe(true)
  })

  it('recognises the mock on a loopback host and its port', () => {
    expect(usesMockApi('http://localhost:3001/api/v1')).toBe(true)
    expect(usesMockApi('http://127.0.0.1:3001/api/v1')).toBe(true)
    expect(usesMockApi('http://localhost:3002/api/v1', '3002')).toBe(true)
  })

  it('leaves any other server to whoever started it', () => {
    expect(usesMockApi('http://127.0.0.1:8000/api/v1')).toBe(false)
    expect(usesMockApi('https://staging.gabayan.example/api/v1')).toBe(false)
    expect(usesMockApi('http://192.168.1.20:3001/api/v1')).toBe(false)
    expect(usesMockApi('not a url')).toBe(false)
  })
})

describe('appOrigin', () => {
  it('opens the app on 127.0.0.1 when the API is there, so the refresh cookie is same-site', () => {
    expect(appOrigin('http://127.0.0.1:8000/api/v1')).toBe('http://127.0.0.1:5173')
    expect(appOrigin('http://127.0.0.1:3001/api/v1')).toBe('http://127.0.0.1:5173')
  })

  it('keeps the app on localhost for the default mock and any other server', () => {
    expect(appOrigin(undefined)).toBe('http://localhost:5173')
    expect(appOrigin('http://localhost:3001/api/v1')).toBe('http://localhost:5173')
    expect(appOrigin('https://staging.gabayan.example/api/v1')).toBe('http://localhost:5173')
    expect(appOrigin('not a url')).toBe('http://localhost:5173')
  })

  it('follows a different app port', () => {
    expect(appOrigin('http://127.0.0.1:8000/api/v1', '4173')).toBe('http://127.0.0.1:4173')
  })
})

describe('journeyServers', () => {
  it('starts its own mock and app away from the development ports when no API is named', () => {
    expect(journeyServers({})).toEqual({
      appUrl: 'http://localhost:5174',
      appPort: '5174',
      apiBaseUrl: 'http://localhost:3101/api/v1',
      mockApiPort: '3101',
    })
  })

  it('never treats a development mock on 3001 as its own', () => {
    const servers = journeyServers({ VITE_API_BASE_URL: 'http://localhost:3001/api/v1' })
    expect(servers.mockApiPort).toBeNull()
    expect(servers.apiBaseUrl).toBe('http://localhost:3001/api/v1')
  })

  it('opens the app on 5173 on the API host for FastAPI, the origin its CORS allows', () => {
    expect(journeyServers({ VITE_API_BASE_URL: 'http://127.0.0.1:8000/api/v1' })).toEqual({
      appUrl: 'http://127.0.0.1:5173',
      appPort: '5173',
      apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
      mockApiPort: null,
    })
  })

  it('follows port overrides for the journey mock and app', () => {
    expect(
      journeyServers({
        VITE_API_BASE_URL: 'http://127.0.0.1:3201/api/v1',
        E2E_MOCK_API_PORT: '3201',
        E2E_APP_PORT: '5190',
      }),
    ).toEqual({
      appUrl: 'http://127.0.0.1:5190',
      appPort: '5190',
      apiBaseUrl: 'http://127.0.0.1:3201/api/v1',
      mockApiPort: '3201',
    })
  })
})
