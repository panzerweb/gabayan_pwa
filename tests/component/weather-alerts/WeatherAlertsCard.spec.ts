import { flushPromises } from '@vue/test-utils'

import WeatherAlertsCard from '@pages/weather-alerts/presentation/components/WeatherAlertsCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import {
  calmForecast,
  forecastUnavailable,
  heatAlert,
  hotForecast,
  locationMissing,
} from '../../unit/weather-alerts/fixtures'
import { mountInApp } from '../support/app'

const repository = vi.hoisted(() => ({ getWeatherAlerts: vi.fn() }))

vi.mock('@pages/weather-alerts/data/weather-alerts.repository', () => ({
  weatherAlertsRepository: repository,
}))

beforeEach(() => {
  repository.getWeatherAlerts.mockReset().mockResolvedValue(envelope(hotForecast))
})

async function open() {
  const mounted = await mountInApp(WeatherAlertsCard, { name: ROUTE_NAMES.home })
  await flushPromises()
  return mounted
}

describe('WeatherAlertsCard', () => {
  it('says it is checking the weather while the forecast loads', async () => {
    repository.getWeatherAlerts.mockReturnValue(new Promise(() => {}))
    const { wrapper } = await mountInApp(WeatherAlertsCard, { name: ROUTE_NAMES.home })

    expect(wrapper.get('[role="status"]').text()).toBe('Checking the weather…')
  })

  it('shows a heat alert with its days, the risk to the fish, what to do and its demo provenance', async () => {
    const { wrapper } = await open()

    expect(wrapper.get('h2').text()).toBe('Weather alerts')
    expect(wrapper.text()).toContain('Dagupan City, Pangasinan')
    const alert = wrapper.get('article')
    expect(alert.attributes('aria-label')).toBe('Hot weather, Thu, Sep 24 – Fri, Sep 25')
    expect(alert.get('h3').text()).toBe('Hot days ahead')
    expect(alert.text()).toContain('Advisory')
    expect(alert.text()).toContain(
      'Forecast high of 35.3 °C air temperature; alerts start at 34 °C.',
    )
    expect(alert.text()).toContain(heatAlert.explanation)
    expect(alert.findAll('li').map((item) => item.text())).toEqual(heatAlert.actions)
    expect(alert.get('[aria-label="About this alert"]').text()).toContain(heatAlert.disclaimer)
    expect(alert.text()).toContain('Rule demo-2026-09-weather')
  })

  it('says plainly when no hot or cloudy spell is coming', async () => {
    repository.getWeatherAlerts.mockResolvedValue(envelope(calmForecast))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain(calmForecast.message)
    expect(wrapper.find('article').exists()).toBe(false)
  })

  it('asks for the farm location and links to the farm profile when the farm has none', async () => {
    repository.getWeatherAlerts.mockResolvedValue(envelope(locationMissing))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Add your farm’s location')
    expect(wrapper.text()).toContain(locationMissing.message)
    const link = wrapper.get('a[href="/app/profile#farm-profile"]')
    expect(link.text()).toBe('Add farm location')
  })

  it('says when the forecast could not be read, without calling it a failure', async () => {
    repository.getWeatherAlerts.mockResolvedValue(envelope(forecastUnavailable))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain(forecastUnavailable.message)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('offers a retry when the weather cannot be loaded', async () => {
    repository.getWeatherAlerts.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { wrapper } = await open()

    expect(wrapper.get('[role="alert"]').text()).toContain('We couldn’t check the weather')
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(repository.getWeatherAlerts).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Hot days ahead')
  })
})
