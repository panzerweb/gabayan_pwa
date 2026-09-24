import { appOrigin, usesMockApi } from '../../e2e/support/api-target'

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
