import { apiBaseUrl } from '@core/http'
import { getWeatherAlertsApi } from '@pages/weather-alerts/data/weather-alerts.api'
import { weatherAlertsKeys } from '@pages/weather-alerts/data/weather-alerts.keys'
import { weatherAlertsRepository } from '@pages/weather-alerts/data/weather-alerts.repository'

import { envelope } from '../marketplace/fixtures'
import { hotForecast, without } from './fixtures'

function respondWith(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('weather-alerts api', () => {
  it("reads the farm's weather alerts with the farmer's token", async () => {
    const fetchMock = respondWith(envelope(hotForecast))

    const result = await getWeatherAlertsApi('access_1')

    expect(result.data.alerts[0]?.periodStart).toBe('2026-09-24')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(String(url).replace(apiBaseUrl, '')).toBe('/weather-alerts')
    expect(init.method).toBe('GET')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access_1')
  })

  it('fails loudly when the answer leaves out a required field', async () => {
    respondWith(envelope(without(hotForecast, 'forecastDays')))

    await expect(getWeatherAlertsApi('access_1')).rejects.toThrow()
  })

  it('maps the domain verb to the api function and keys under the weather-alerts prefix', () => {
    expect(weatherAlertsRepository.getWeatherAlerts).toBe(getWeatherAlertsApi)
    expect(weatherAlertsKeys.current()).toEqual(['weather-alerts', 'current'])
    expect(weatherAlertsKeys.current().slice(0, 1)).toEqual(weatherAlertsKeys.all())
  })
})
