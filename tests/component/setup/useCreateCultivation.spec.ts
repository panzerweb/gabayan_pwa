import type { SetupRepository } from '@pages/setup/domain/setup.repository.interface'
import { useCreateCultivation } from '@pages/setup/presentation/composables/useCreateCultivation'
import { ROUTE_NAMES } from '@router/route-names'

import { batch001Detail } from '../../unit/cultivations/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { aboveRangeEstimate, inRangeEstimate } from '../../unit/setup/fixtures'
import { apiError, mountComposable } from '../support/app'
import { seedDraft, storedDraft } from './support'

function stubRepository() {
  return { createCultivation: vi.fn().mockResolvedValue(envelope(batch001Detail)) }
}

async function mountCreate(repository: ReturnType<typeof stubRepository>) {
  return mountComposable(() => useCreateCultivation(repository as unknown as SetupRepository), {
    name: ROUTE_NAMES.setupReview,
  })
}

function keysSent(create: ReturnType<typeof vi.fn>) {
  return create.mock.calls.map((call) => call[1] as string)
}

beforeEach(() => {
  window.sessionStorage.clear()
  seedDraft({ estimate: inRangeEstimate, cultivationName: 'Pond A' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useCreateCultivation', () => {
  it('creates the cultivation from the estimate and opens its success screen', async () => {
    const repository = stubRepository()
    const { result, router, session } = await mountCreate(repository)

    expect(result.form.cultivationName).toBe('Pond A')
    expect(await result.submit()).toBe(true)

    const [body, key, token] = repository.createCultivation.mock.calls[0] ?? []
    expect(body).toMatchObject({
      name: 'Pond A',
      estimateId: 'est_demo_tilapia_pond_500',
      initialFingerlings: 500,
      stockedOn: null,
    })
    expect(body).not.toHaveProperty('acceptedAboveRangeWarning')
    expect(key).toMatch(/^[0-9a-f-]{36}$/)
    expect(token).toBe('access_1')
    expect(session.hasCultivation).toBe(true)
    expect(router.currentRoute.value).toMatchObject({
      name: ROUTE_NAMES.setupSuccess,
      params: { cultivationId: 'cul_tilapia_001' },
    })
  })

  it('invalidates Home and the cultivation list and detail through the @core/query map', async () => {
    const { result, queryClient } = await mountCreate(stubRepository())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.submit()

    for (const queryKey of [
      ['home'],
      ['cultivations', 'list'],
      ['cultivations', 'detail'],
      ['home-dashboard'],
    ]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey })
    }
  })

  it('reuses one Idempotency-Key when the same submission is retried', async () => {
    const repository = stubRepository()
    repository.createCultivation
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(envelope(batch001Detail))
    const { result } = await mountCreate(repository)

    expect(await result.submit()).toBe(false)
    expect(result.formError.value).not.toBe('')
    expect(await result.submit()).toBe(true)

    const [first, second] = keysSent(repository.createCultivation)
    expect(second).toBe(first)
  })

  it('gives each visit to the review screen its own Idempotency-Key', async () => {
    const firstVisit = stubRepository()
    await (await mountCreate(firstVisit)).result.submit()
    seedDraft({ estimate: inRangeEstimate })
    const secondVisit = stubRepository()
    await (await mountCreate(secondVisit)).result.submit()

    expect(keysSent(secondVisit.createCultivation)[0]).not.toBe(
      keysSent(firstVisit.createCultivation)[0],
    )
  })

  it('refuses an above-range plan the farmer has not confirmed', async () => {
    seedDraft({ estimate: aboveRangeEstimate, acceptedAboveRangeWarning: false })
    const repository = stubRepository()
    const { result } = await mountCreate(repository)

    expect(await result.submit()).toBe(false)

    expect(result.formError.value).toBe(
      'Confirm the above-range warning on the estimate before creating this cultivation.',
    )
    expect(repository.createCultivation).not.toHaveBeenCalled()
  })

  it('sends the explicit above-range confirmation and the farmer’s reason', async () => {
    seedDraft({ estimate: aboveRangeEstimate, acceptedAboveRangeWarning: true })
    const repository = stubRepository()
    const { result } = await mountCreate(repository)
    result.form.aboveRangeReason = 'Extra aeration is installed.'

    await result.submit()

    expect(repository.createCultivation.mock.calls[0]?.[0]).toMatchObject({
      initialFingerlings: 800,
      acceptedAboveRangeWarning: true,
      aboveRangeReason: 'Extra aeration is installed.',
    })
  })

  it('binds the server’s field messages and keeps what was typed in the draft', async () => {
    const repository = stubRepository()
    repository.createCultivation.mockRejectedValue(
      apiError(422, 'VALIDATION_ERROR', 'Check the highlighted fields.', {
        stockedOn: ['Choose a stocking date that is not in the future.'],
      }),
    )
    const { result } = await mountCreate(repository)
    result.form.stockedOn = '2027-01-01'

    expect(await result.submit()).toBe(false)

    expect(result.fieldErrors.value.stockedOn).toBe(
      'Choose a stocking date that is not in the future.',
    )
    expect(storedDraft().stockedOn).toBe('2027-01-01')
  })

  it('sends nothing while offline and says the draft is still saved', async () => {
    const repository = stubRepository()
    const { result } = await mountCreate(repository)

    result.isOnline.value = false
    expect(await result.submit()).toBe(false)

    expect(result.formError.value).toBe(
      'Reconnect before creating this cultivation. Your setup draft is still saved.',
    )
    expect(repository.createCultivation).not.toHaveBeenCalled()
  })
})
