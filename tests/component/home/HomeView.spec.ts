import { flushPromises } from '@vue/test-utils'

import HomeView from '@pages/home/presentation/views/HomeView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { dashboard, newcomerDashboard } from '../../unit/home/fixtures'
import { mountInApp } from '../support/app'

const repository = vi.hoisted(() => ({ getHomeDashboard: vi.fn() }))

vi.mock('@pages/home/data/home.repository', () => ({ homeRepository: repository }))

// Home also holds the weather card; its own spec covers it, so here it reads a calm forecast.
vi.mock('@pages/weather-alerts/data/weather-alerts.repository', async () => {
  const { calmForecast } = await import('../../unit/weather-alerts/fixtures')
  const { envelope: wrap } = await import('../../unit/marketplace/fixtures')
  return { weatherAlertsRepository: { getWeatherAlerts: async () => wrap(calmForecast) } }
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-23T08:00:00+08:00'))
  repository.getHomeDashboard.mockReset().mockResolvedValue(envelope(dashboard))
})

afterEach(() => {
  vi.useRealTimers()
})

async function open() {
  const mounted = await mountInApp(HomeView, { name: ROUTE_NAMES.home })
  await flushPromises()
  return mounted
}

describe('HomeView', () => {
  it('asks for today in Manila and caches it under the home prefix', async () => {
    const { queryClient } = await open()

    expect(repository.getHomeDashboard).toHaveBeenCalledWith('2026-09-23', 'access_1')
    expect(queryClient.getQueryData(['home', 'dashboard', '2026-09-23'])).toEqual(
      envelope(dashboard),
    )
  })

  it('shows the greeting, primary cultivation, farm overview, tasks and tip', async () => {
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Good day, Juan')
    expect(wrapper.get('h1').text()).toBe('Here’s today’s farm plan.')
    expect(wrapper.text()).toContain('Tilapia Batch #001')
    expect(wrapper.text()).toContain('Day 46')
    expect(wrapper.text()).toContain('85 g')
    expect(wrapper.text()).toContain('2.4 kg')
    expect(wrapper.text()).toContain('103 days')
    expect(wrapper.text()).toContain('1 of 3 done')
    expect(wrapper.findAll('.task-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('Demo guidance')
    expect(wrapper.text()).toContain('General demo guidance, not advice for your specific pond.')
    expect(wrapper.get('a[href="/app/cultivations/cul_tilapia_001"]').text()).toBe(
      'View cultivation',
    )
    expect(wrapper.get('[aria-label="3 unread notifications"]').attributes('href')).toBe(
      '/app/notifications',
    )
  })

  it('offers the setup wizard when the farmer has no cultivation yet', async () => {
    repository.getHomeDashboard.mockResolvedValue(envelope(newcomerDashboard))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Start your first cultivation')
    expect(wrapper.get('a[href="/setup"]').text()).toContain('Start cultivation setup')
    expect(wrapper.find('.task-card').exists()).toBe(false)
  })

  it('says when every task is done', async () => {
    repository.getHomeDashboard.mockResolvedValue(
      envelope({ ...dashboard, taskSummary: { completed: 3, total: 3 } }),
    )
    const { wrapper } = await open()

    expect(wrapper.get('[role="status"]').text()).toBe('All planned tasks are complete for today.')
  })

  it('offers a retry when the dashboard fails to load', async () => {
    repository.getHomeDashboard.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('We couldn’t load your dashboard.')
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(repository.getHomeDashboard).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Tilapia Batch #001')
  })
})
