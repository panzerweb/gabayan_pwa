import { flushPromises } from '@vue/test-utils'

import type { WeatherAlertsRepository } from '@pages/weather-alerts/domain/weather-alerts.repository.interface'
import { useWeatherAlerts } from '@pages/weather-alerts/presentation/composables/useWeatherAlerts'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import {
  forecastUnavailable,
  hotForecast,
  locationMissing,
} from '../../unit/weather-alerts/fixtures'
import { mountComposable } from '../support/app'

async function mountWeather(getWeatherAlerts: ReturnType<typeof vi.fn>) {
  const mounted = await mountComposable(
    () => useWeatherAlerts({ getWeatherAlerts } as unknown as WeatherAlertsRepository),
    { name: ROUTE_NAMES.home },
  )
  await flushPromises()
  return mounted
}

describe('useWeatherAlerts', () => {
  it("reads the farm's current alerts and caches them under the weather-alerts prefix", async () => {
    const getWeatherAlerts = vi.fn().mockResolvedValue(envelope(hotForecast))

    const { result, queryClient } = await mountWeather(getWeatherAlerts)

    expect(getWeatherAlerts).toHaveBeenCalledWith('access_1')
    expect(result.alerts.value.map((alert) => alert.kind)).toEqual(['HIGH_TEMPERATURE'])
    expect(result.needsLocation.value).toBe(false)
    expect(result.loading.value).toBe(false)
    expect(queryClient.getQueryData(['weather-alerts', 'current'])).toEqual(envelope(hotForecast))
  })

  it('treats a farm without a location as an answer that asks for one, not a failure', async () => {
    const { result } = await mountWeather(vi.fn().mockResolvedValue(envelope(locationMissing)))

    expect(result.needsLocation.value).toBe(true)
    expect(result.loadFailed.value).toBe(false)
    expect(result.alerts.value).toEqual([])
  })

  it('says when the forecast could not be read', async () => {
    const { result } = await mountWeather(vi.fn().mockResolvedValue(envelope(forecastUnavailable)))

    expect(result.forecastUnavailable.value).toBe(true)
    expect(result.loadFailed.value).toBe(false)
  })

  it('reports a failed request so the card can offer a retry', async () => {
    const { result } = await mountWeather(vi.fn().mockRejectedValue(new TypeError('network')))

    expect(result.loadFailed.value).toBe(true)
    expect(result.loading.value).toBe(false)
  })
})
