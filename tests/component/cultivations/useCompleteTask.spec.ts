import { flushPromises } from '@vue/test-utils'

import type { CultivationsRepository } from '@pages/cultivations/domain/cultivations.repository.interface'
import { useCompleteTask } from '@pages/cultivations/presentation/composables/useCompleteTask'
import { ROUTE_NAMES } from '@router/route-names'

import { afternoonFeeding, feedingCompletion } from '../../unit/cultivations/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, mountComposable } from '../support/app'

function stubRepository() {
  return {
    listCultivations: vi.fn(),
    getCultivation: vi.fn(),
    getCultivationTimeline: vi.fn(),
    listTasks: vi.fn(),
    completeTask: vi.fn().mockResolvedValue(envelope(feedingCompletion)),
  }
}

async function mountCompletion(repository: ReturnType<typeof stubRepository>) {
  const mounted = await mountComposable(
    () => useCompleteTask(repository as unknown as CultivationsRepository),
    { name: ROUTE_NAMES.cultivationTasks, params: { cultivationId: 'cul_tilapia_001' } },
  )
  mounted.result.begin(afternoonFeeding)
  return mounted
}

function keysSent(completeTask: ReturnType<typeof vi.fn>) {
  return completeTask.mock.calls.map((call) => call[2] as string)
}

describe('useCompleteTask', () => {
  it('starts from the planned amount and records the feeding the farmer entered', async () => {
    const repository = stubRepository()
    const { result, toast } = await mountCompletion(repository)
    expect(result.amount.value).toBe('1.2')

    result.amount.value = '1.1'
    result.notes.value = ' Fish responded normally. '
    expect(await result.submit()).toBe(true)

    const [taskId, body, key, token] = repository.completeTask.mock.calls[0]!
    expect(taskId).toBe('task_feed_pm')
    expect(body).toMatchObject({
      actualAmount: { value: 1.1, unit: 'KG' },
      notes: 'Fish responded normally.',
      completedAt: expect.any(String),
    })
    expect(key).toEqual(expect.any(String))
    expect(token).toBe('access_1')
    expect(toast.messages.map((item) => item.message)).toContain('Feeding record saved.')
  })

  it('invalidates Home, tasks, detail, timeline and notifications through the @core/query map', async () => {
    const repository = stubRepository()
    const { result, queryClient } = await mountCompletion(repository)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.submit()

    for (const queryKey of [
      ['home'],
      ['cultivations', 'tasks'],
      ['cultivations', 'detail'],
      ['cultivations', 'timeline'],
      ['notifications'],
      ['home-dashboard'],
    ]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey })
    }
  })

  it('reuses one Idempotency-Key when the same submission is retried', async () => {
    const repository = stubRepository()
    repository.completeTask
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(envelope(feedingCompletion))
    const { result } = await mountCompletion(repository)

    expect(await result.submit()).toBe(false)
    expect(result.formError.value).not.toBe('')
    expect(await result.submit()).toBe(true)

    const [first, second] = keysSent(repository.completeTask)
    expect(second).toBe(first)
  })

  it('gives a new submission its own Idempotency-Key', async () => {
    const repository = stubRepository()
    const { result } = await mountCompletion(repository)

    await result.submit()
    result.begin(afternoonFeeding)
    await result.submit()

    const [first, second] = keysSent(repository.completeTask)
    expect(second).not.toBe(first)
  })

  it('stops a blank amount at the form without calling the server', async () => {
    const repository = stubRepository()
    const { result } = await mountCompletion(repository)

    result.amount.value = ''
    expect(await result.submit()).toBe(false)

    expect(result.amountError.value).toBe('Enter an amount greater than 0.')
    expect(repository.completeTask).not.toHaveBeenCalled()
  })

  it('sends nothing while offline and says the feeding was not queued', async () => {
    const repository = stubRepository()
    const { result } = await mountCompletion(repository)

    result.isOnline.value = false
    expect(await result.submit()).toBe(false)

    expect(result.formError.value).toBe(
      'Reconnect before recording this feeding. It has not been queued.',
    )
    expect(repository.completeTask).not.toHaveBeenCalled()
  })

  it('shows the server’s amount message beside the amount input', async () => {
    const repository = stubRepository()
    repository.completeTask.mockRejectedValue(
      apiError(422, 'VALIDATION_ERROR', 'Review the completion details.', {
        actualAmount: ['Enter a feeding amount greater than 0 in g or kg.'],
      }),
    )
    const { result } = await mountCompletion(repository)

    expect(await result.submit()).toBe(false)
    await flushPromises()

    expect(result.amountError.value).toBe('Enter a feeding amount greater than 0 in g or kg.')
    expect(result.formError.value).toBe('')
  })
})
