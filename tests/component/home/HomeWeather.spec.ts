import { flushPromises } from '@vue/test-utils'

import HomeView from '@pages/home/presentation/views/HomeView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { dashboard, newcomerDashboard } from '../../unit/home/fixtures'
import { hotForecast } from '../../unit/weather-alerts/fixtures'
import { mountInApp } from '../support/app'

const repositories = vi.hoisted(() => ({
  home: { getHomeDashboard: vi.fn() },
  weather: { getWeatherAlerts: vi.fn() },
}))

vi.mock('@pages/home/data/home.repository', () => ({ homeRepository: repositories.home }))
vi.mock('@pages/weather-alerts/data/weather-alerts.repository', () => ({
  weatherAlertsRepository: repositories.weather,
}))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-23T08:00:00+08:00'))
  repositories.home.getHomeDashboard.mockReset().mockResolvedValue(envelope(dashboard))
  repositories.weather.getWeatherAlerts.mockReset().mockResolvedValue(envelope(hotForecast))
})

afterEach(() => {
  vi.useRealTimers()
})

async function open() {
  const { wrapper } = await mountInApp(HomeView, { name: ROUTE_NAMES.home })
  await flushPromises()
  return wrapper
}

// The headings of Home's cards, top to bottom.
function cardHeadings(wrapper: Awaited<ReturnType<typeof open>>) {
  return wrapper.findAll('.card h2').map((heading) => heading.text())
}

describe('HomeView weather card', () => {
  it('sits below the cultivation guidance and above the learning tip', async () => {
    const wrapper = await open()

    const headings = cardHeadings(wrapper)
    const weather = headings.indexOf('Weather alerts')
    expect(weather).toBeGreaterThan(headings.indexOf('Tilapia Batch #001'))
    expect(weather).toBeLessThan(headings.indexOf(dashboard.tip.title))
    expect(wrapper.text()).toContain('Hot days ahead')
  })

  it('still shows the weather to a farmer who has not started a cultivation', async () => {
    repositories.home.getHomeDashboard.mockResolvedValue(envelope(newcomerDashboard))
    const wrapper = await open()

    expect(wrapper.text()).toContain('Start your first cultivation')
    expect(wrapper.text()).toContain('Hot days ahead')
  })
})
