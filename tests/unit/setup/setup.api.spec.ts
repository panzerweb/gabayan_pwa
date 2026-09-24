import { apiBaseUrl } from '@core/http'
import {
  createCultivationApi,
  createStockingEstimateApi,
  getCompatibilityApi,
  getEquipmentRecommendationsApi,
  listCultureEnvironmentsApi,
  listSpeciesApi,
} from '@pages/setup/data/setup.api'
import { setupKeys } from '@pages/setup/data/setup.keys'
import { setupRepository } from '@pages/setup/data/setup.repository'

import { batch001Detail } from '../cultivations/fixtures'
import { envelope, page } from '../marketplace/fixtures'
import { compatible, inRangeEstimate, milkfish, pond, recommendations, tilapia } from './fixtures'

function respondWith(payload: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function sent(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  const headers = new Headers(init.headers)
  return {
    url: String(url).replace(apiBaseUrl, ''),
    method: init.method,
    headers,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  }
}

describe('setup api', () => {
  it('lists active species without a session, sending only the filters given', async () => {
    const fetchMock = respondWith(page([tilapia, milkfish]))

    const species = await listSpeciesApi({ active: true })

    expect(species.data.map(({ id }) => id)).toEqual(['sp_tilapia', 'sp_milkfish'])
    expect(sent(fetchMock)).toMatchObject({ url: '/species?active=true', method: 'GET' })
    expect(sent(fetchMock).headers.get('Authorization')).toBeNull()

    const unfiltered = respondWith(page([tilapia]))
    await listSpeciesApi()
    expect(sent(unfiltered).url).toBe('/species')
  })

  it('lists only active culture environments', async () => {
    const fetchMock = respondWith(page([pond]))

    expect((await listCultureEnvironmentsApi()).data[0]?.dimensionModel).toBe('RECTANGULAR_VOLUME')
    expect(sent(fetchMock).url).toBe('/culture-environments?active=true')
  })

  it('asks for the compatibility of one species and environment', async () => {
    const fetchMock = respondWith(envelope(compatible))

    const result = await getCompatibilityApi('sp_tilapia', 'env_pond')

    expect(result.data.status).toBe('COMPATIBLE')
    expect(sent(fetchMock).url).toBe('/compatibility?speciesId=sp_tilapia&environmentId=env_pond')
  })

  it('posts the planned stocking to the estimate endpoint with the session token', async () => {
    const fetchMock = respondWith(envelope(inRangeEstimate))
    const body = {
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
      plannedFingerlings: 500,
    }

    const estimate = await createStockingEstimateApi(body, 'access_1')

    expect(estimate.data.recommendedMaximum).toBe(550)
    const request = sent(fetchMock)
    expect(request).toMatchObject({ url: '/stocking-estimates', method: 'POST', body })
    expect(request.headers.get('Authorization')).toBe('Bearer access_1')
  })

  it('creates a cultivation with the Idempotency-Key it is given', async () => {
    const fetchMock = respondWith(envelope(batch001Detail), 201)
    const body = {
      estimateId: 'est_demo_tilapia_pond_500',
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
      initialFingerlings: 500,
      stockedOn: null,
    }

    const created = await createCultivationApi(body, 'key_1', 'access_1')

    expect(created.data.id).toBe('cul_tilapia_001')
    const request = sent(fetchMock)
    expect(request).toMatchObject({ url: '/cultivations', method: 'POST', body })
    expect(request.headers.get('Idempotency-Key')).toBe('key_1')
  })

  it('reads the equipment recommendations of a new cultivation', async () => {
    const fetchMock = respondWith(envelope(recommendations))

    const result = await getEquipmentRecommendationsApi('cul_00002', 'access_1')

    expect(result.data.sections[0]?.products[0]?.price.amountMinor).toBe(129900)
    expect(sent(fetchMock).url).toBe('/cultivations/cul_00002/equipment-recommendations')
  })

  it('refuses an estimate that leaves out its disclaimer', async () => {
    const { disclaimer: _omitted, ...withoutDisclaimer } = inRangeEstimate
    void _omitted
    respondWith(envelope(withoutDisclaimer))

    await expect(
      createStockingEstimateApi(
        {
          speciesId: 'sp_tilapia',
          environmentId: 'env_pond',
          dimensions: inRangeEstimate.dimensions,
          plannedFingerlings: 500,
        },
        'access_1',
      ),
    ).rejects.toThrow()
  })

  it('maps each repository method to its api function', () => {
    expect(setupRepository).toEqual({
      listSpecies: listSpeciesApi,
      listCultureEnvironments: listCultureEnvironmentsApi,
      getCompatibility: getCompatibilityApi,
      createStockingEstimate: createStockingEstimateApi,
      createCultivation: createCultivationApi,
      getEquipmentRecommendations: getEquipmentRecommendationsApi,
    })
  })

  it('keys every setup query under the feature name', () => {
    for (const key of [
      setupKeys.species(),
      setupKeys.environments(),
      setupKeys.compatibility('sp_tilapia', 'env_pond'),
      setupKeys.equipmentRecommendations('cul_00002'),
    ]) {
      expect(key[0]).toBe('setup')
    }
  })
})
