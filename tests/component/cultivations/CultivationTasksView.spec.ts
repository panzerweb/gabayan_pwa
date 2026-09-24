import { flushPromises } from '@vue/test-utils'

import CultivationTasksView from '@pages/cultivations/presentation/views/CultivationTasksView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { afternoonFeeding, feedingCompletion, waterCheck } from '../../unit/cultivations/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { mountInApp } from '../support/app'

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
    listTasks: vi.fn().mockResolvedValue(page([waterCheck, afternoonFeeding])),
    completeTask: vi.fn().mockResolvedValue(envelope(feedingCompletion)),
  }
})

async function open() {
  const mounted = await mountInApp(CultivationTasksView, {
    name: ROUTE_NAMES.cultivationTasks,
    params: { cultivationId: 'cul_tilapia_001' },
  })
  await flushPromises()
  return mounted
}

describe('CultivationTasksView', () => {
  it('lists the cultivation’s tasks and offers feeding completion only on the feeding task', async () => {
    const { wrapper } = await open()

    expect(repositories.cultivations.listTasks).toHaveBeenCalledWith(
      { cultivationId: 'cul_tilapia_001' },
      'access_1',
    )
    const cards = wrapper.findAll('.task-card')
    expect(cards.map((card) => card.get('h3').text())).toEqual([
      'Check water condition',
      'Afternoon feeding',
    ])
    expect(cards[0]?.find('button').exists()).toBe(false)
    expect(cards[1]?.get('button').text()).toBe('Record feeding')
  })

  it('records a feeding from the sheet and closes it', async () => {
    const { wrapper } = await open()

    await wrapper.findAll('.task-card')[1]!.get('button').trigger('click')
    await flushPromises()
    const amount = wrapper.get('input[type="number"]')
    expect((amount.element as HTMLInputElement).value).toBe('1.2')
    await amount.setValue('1.1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(repositories.cultivations.completeTask).toHaveBeenCalledWith(
      'task_feed_pm',
      expect.objectContaining({ actualAmount: { value: 1.1, unit: 'KG' } }),
      expect.any(String),
      'access_1',
    )
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('keeps the sheet open with a message beside an empty amount', async () => {
    const { wrapper } = await open()

    await wrapper.findAll('.task-card')[1]!.get('button').trigger('click')
    await flushPromises()
    await wrapper.get('input[type="number"]').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter an amount greater than 0.')
    expect(repositories.cultivations.completeTask).not.toHaveBeenCalled()
  })

  it('says so when no tasks are scheduled', async () => {
    repositories.cultivations.listTasks!.mockResolvedValue(page([]))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('No tasks scheduled')
  })
})
