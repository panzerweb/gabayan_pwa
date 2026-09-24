import { flushPromises } from '@vue/test-utils'

import CultivationHarvestView from '@pages/cultivations/presentation/views/CultivationHarvestView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import {
  harvestCompletion,
  monitorReadiness,
  readyReadiness,
  unmeasuredReadiness,
} from '../../unit/cultivations/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, goOffline, mountInApp } from '../support/app'
import { button, labelled, submitButton } from './support'

const repositories = vi.hoisted(() => ({
  cultivations: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/cultivations/data/cultivations.repository', () => ({
  get cultivationsRepository() {
    return repositories.cultivations
  },
}))

beforeEach(() => {
  repositories.cultivations = {
    getHarvestReadiness: vi.fn().mockResolvedValue(envelope(readyReadiness)),
    completeHarvest: vi.fn().mockResolvedValue(envelope(harvestCompletion)),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function open() {
  const mounted = await mountInApp(CultivationHarvestView, {
    name: ROUTE_NAMES.cultivationHarvest,
    params: { cultivationId: 'cul_tilapia_harvest' },
  })
  await flushPromises()
  return mounted
}

async function fillHarvest(wrapper: Awaited<ReturnType<typeof open>>['wrapper']) {
  await labelled(wrapper, 'Fish harvested').setValue('470')
  await labelled(wrapper, 'Total harvest weight').setValue('169.2')
  await labelled(wrapper, 'Average fish weight').setValue('360')
  await labelled(wrapper, 'Selling price per kg').setValue('120')
}

describe('CultivationHarvestView readiness states', () => {
  it('offers the harvest form when the estimate says the fish may be ready', async () => {
    const { wrapper } = await open()

    const card = wrapper.get('.readiness-card').text()
    expect(card).toContain('POTENTIALLY READY')
    expect(card).toContain('360 g')
    expect(card).toContain('172.8 kg')
    expect(card).toContain('Latest recorded average-weight sample')
    expect(card).toContain('Harvest readiness is an estimate, not a guarantee.')
    expect(card).toContain('Rule demo-2026-09')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('asks for a fresh growth sample instead of a harvest while growth is monitored', async () => {
    repositories.cultivations.getHarvestReadiness!.mockResolvedValue(envelope(monitorReadiness))
    const { wrapper } = await open()

    expect(wrapper.get('.readiness-card').text()).toContain('Continue monitoring growth.')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Readiness is never inferred from elapsed time alone.')
    expect(wrapper.get('a[href="/app/cultivations/cul_tilapia_harvest/growth"]').text()).toBe(
      'Update growth measurement',
    )
  })

  it('says what is missing when there is no current sample', async () => {
    repositories.cultivations.getHarvestReadiness!.mockResolvedValue(envelope(unmeasuredReadiness))
    const { wrapper } = await open()

    const card = wrapper.get('.readiness-card').text()
    expect(card).toContain('INSUFFICIENT DATA')
    expect(card).toContain('Not recorded')
    expect(card).toContain('Unavailable')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('offers a retry when readiness cannot load', async () => {
    repositories.cultivations.getHarvestReadiness!.mockRejectedValueOnce(
      apiError(503, 'SERVICE_UNAVAILABLE', 'Unavailable'),
    )
    const { wrapper } = await open()

    await button(wrapper, 'Try Again').trigger('click')
    await flushPromises()

    expect(wrapper.find('.readiness-card').exists()).toBe(true)
  })
})

describe('CultivationHarvestView harvest form', () => {
  it('labels every harvest field with its unit', async () => {
    const { wrapper } = await open()

    expect(labelled(wrapper, 'Harvest date').attributes('type')).toBe('date')
    expect(labelled(wrapper, 'Fish harvested').attributes('inputmode')).toBe('numeric')
    expect(labelled(wrapper, 'Total harvest weight').attributes('inputmode')).toBe('decimal')
    expect(labelled(wrapper, 'Selling price per kg').attributes('inputmode')).toBe('decimal')
    expect(wrapper.get('form').text()).toContain('kg')
    expect(wrapper.get('form').text()).toContain('PHP')
  })

  it('stops an incomplete harvest at the form with a message per field', async () => {
    const { wrapper } = await open()

    await labelled(wrapper, 'Fish harvested').setValue('470')
    await labelled(wrapper, 'Selling price per kg').setValue('12.345')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter the total harvest weight in kg.')
    expect(wrapper.text()).toContain('Enter the average fish weight in g.')
    expect(wrapper.text()).toContain('Enter the selling price per kg in pesos, like 120 or 120.50.')
    expect(labelled(wrapper, 'Fish harvested').attributes('aria-invalid')).toBeUndefined()
    expect(repositories.cultivations.completeHarvest).not.toHaveBeenCalled()
  })

  it('records the harvest in centavos and shows the server’s completion summary', async () => {
    const { wrapper, toast } = await open()

    await fillHarvest(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const [cultivationId, body, key, token] =
      repositories.cultivations.completeHarvest!.mock.calls[0]!
    expect(cultivationId).toBe('cul_tilapia_harvest')
    expect(body).toMatchObject({
      numberHarvested: 470,
      totalHarvestWeight: { value: 169.2, unit: 'KG' },
      averageFishWeight: { value: 360, unit: 'G' },
      sellingPricePerKg: { amountMinor: 12000, currency: 'PHP' },
    })
    expect(key).toEqual(expect.any(String))
    expect(token).toBe('access_1')
    expect(toast.messages.map((item) => item.message)).toContain(
      'Harvest recorded. Cultivation moved to Completed.',
    )
    const text = wrapper.text()
    expect(text).toContain('Cultivation completed')
    expect(text).toContain('Tilapia Harvest Demo')
    expect(text).toContain('₱20,304.00')
    expect(text).toContain('94%')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('a[href="/app/cultivations?view=completed"]').text()).toBe(
      'View completed cultivations',
    )
  })

  it('reuses the submission’s Idempotency-Key when a failed harvest is retried', async () => {
    repositories.cultivations.completeHarvest!.mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    )
    const { wrapper } = await open()
    await fillHarvest(wrapper)

    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('form [role="alert"]').exists()).toBe(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const [first, second] = repositories.cultivations.completeHarvest!.mock.calls.map(
      (call) => call[2],
    )
    expect(second).toBe(first)
    expect(wrapper.text()).toContain('Cultivation completed')
  })

  it('shows the server’s refusal beside the harvested count', async () => {
    repositories.cultivations.completeHarvest!.mockRejectedValueOnce(
      apiError(422, 'VALIDATION_ERROR', 'Review the harvest record.', {
        numberHarvested: ['Enter a harvested count within the estimated live fish.'],
      }),
    )
    const { wrapper } = await open()
    await fillHarvest(wrapper)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter a harvested count within the estimated live fish.')
    expect(labelled(wrapper, 'Fish harvested').attributes('aria-invalid')).toBe('true')
  })

  it('keeps the harvest disabled offline and says it will not be queued', async () => {
    goOffline()
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Reconnect to save this harvest; it will not be queued.')
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()
  })
})
