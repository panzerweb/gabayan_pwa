import { usesMockApi } from '../../e2e/support/api-target'

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
