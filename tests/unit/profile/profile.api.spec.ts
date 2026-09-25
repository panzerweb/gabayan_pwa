import { apiBaseUrl } from '@core/http'
import {
  createAddressApi,
  deleteAddressApi,
  getFarmProfileApi,
  getNotificationSettingsApi,
  listAddressesApi,
  updateAddressApi,
  updateCurrentUserApi,
  updateNotificationSettingsApi,
  upsertFarmProfileApi,
} from '@pages/profile/data/profile.api'
import type { AddressWrite } from '@pages/profile/domain/profile.model'

import { address, farm, meta, pageInfo, settings, user } from './fixtures'

function respondWith(payload: unknown, status = 200) {
  const body = status === 204 ? null : JSON.stringify(payload)
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(body, { status, headers: { 'Content-Type': 'application/json' } }),
    )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function sent(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  return {
    url,
    method: init.method,
    body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
    authorization: new Headers(init.headers).get('Authorization'),
  }
}

const addressWrite: AddressWrite = {
  label: address.label,
  recipientName: address.recipientName,
  mobileNumber: address.mobileNumber,
  line1: address.line1,
  barangay: address.barangay,
  cityMunicipality: address.cityMunicipality,
  province: address.province,
  region: address.region,
  postalCode: address.postalCode,
  countryCode: 'PH',
  deliveryInstructions: null,
  isDefault: false,
}

describe('profile api', () => {
  it.each([
    [
      'updateCurrentUserApi',
      () => updateCurrentUserApi({ fullName: 'Juan D. Cruz' }, 'access_1'),
      user,
      '/users/me',
      'PATCH',
      { fullName: 'Juan D. Cruz' },
    ],
    [
      'getFarmProfileApi',
      () => getFarmProfileApi('access_1'),
      farm,
      '/users/me/farm',
      'GET',
      undefined,
    ],
    [
      'upsertFarmProfileApi',
      () =>
        upsertFarmProfileApi(
          {
            name: farm.name,
            region: null,
            province: null,
            municipality: null,
            experienceLevel: 'INTERMEDIATE',
            notes: null,
          },
          'access_1',
        ),
      farm,
      '/users/me/farm',
      'PUT',
      {
        name: farm.name,
        region: null,
        province: null,
        municipality: null,
        experienceLevel: 'INTERMEDIATE',
        notes: null,
      },
    ],
    [
      'createAddressApi',
      () => createAddressApi(addressWrite, 'access_1'),
      address,
      '/users/me/addresses',
      'POST',
      addressWrite,
    ],
    [
      'updateAddressApi',
      () => updateAddressApi('addr juan/2', { isDefault: true }, 'access_1'),
      address,
      '/users/me/addresses/addr%20juan%2F2',
      'PATCH',
      { isDefault: true },
    ],
    [
      'getNotificationSettingsApi',
      () => getNotificationSettingsApi('access_1'),
      settings,
      '/users/me/notification-settings',
      'GET',
      undefined,
    ],
    [
      'updateNotificationSettingsApi',
      () => updateNotificationSettingsApi({ feedingReminders: false }, 'access_1'),
      settings,
      '/users/me/notification-settings',
      'PATCH',
      { feedingReminders: false },
    ],
  ])(
    '%s calls its contract path with the access token and parses the answer',
    async (_name, call, data, path, method, body) => {
      const fetchMock = respondWith({ data, meta })

      const result = await call()

      expect(result.data).toEqual(data)
      expect(sent(fetchMock)).toEqual({
        url: `${apiBaseUrl}${path}`,
        method,
        body,
        authorization: 'Bearer access_1',
      })
    },
  )

  it('lists every address on one page', async () => {
    const fetchMock = respondWith({ data: [address], page: pageInfo, meta })

    const result = await listAddressesApi('access_1')

    expect(result.data).toEqual([address])
    expect(sent(fetchMock)).toMatchObject({
      url: `${apiBaseUrl}/users/me/addresses?limit=100`,
      method: 'GET',
      authorization: 'Bearer access_1',
    })
  })

  it('deletes an address and accepts the empty answer', async () => {
    const fetchMock = respondWith(null, 204)

    await expect(deleteAddressApi('addr_2', 'access_1')).resolves.toBeUndefined()
    expect(sent(fetchMock)).toMatchObject({
      url: `${apiBaseUrl}/users/me/addresses/addr_2`,
      method: 'DELETE',
      authorization: 'Bearer access_1',
    })
  })

  it('refuses a farm profile with an experience level outside the contract', async () => {
    respondWith({ data: { ...farm, experienceLevel: 'EXPERT' }, meta })

    await expect(getFarmProfileApi('access_1')).rejects.toThrow()
  })

  it('refuses an address answer without its default flag', async () => {
    const withoutDefault: Partial<typeof address> = { ...address }
    delete withoutDefault.isDefault
    respondWith({ data: withoutDefault, meta })

    await expect(createAddressApi(addressWrite, 'access_1')).rejects.toThrow()
  })
})
