import { z } from 'zod'

import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'
import { userProfileSchema } from '@pages/auth/domain/auth.model'

import {
  addressSchema,
  farmProfileSchema,
  notificationSettingsSchema,
  type AddressPatch,
  type AddressWrite,
  type NotificationSettingsPatch,
  type UpdateUserRequest,
  type UpsertFarmRequest,
} from '../domain/profile.model'

// An account holds a handful of addresses; one page of 100 reads them all.
const ADDRESS_PAGE_LIMIT = 100

export async function updateCurrentUserApi(body: UpdateUserRequest, accessToken: string) {
  return apiRequest(ENDPOINTS.currentUser.root, {
    method: 'PATCH',
    body,
    accessToken,
    schema: envelopeSchema(userProfileSchema),
  })
}

// Answers 404 NOT_FOUND until the farmer creates a farm profile.
export async function getFarmProfileApi(accessToken: string) {
  return apiRequest(ENDPOINTS.currentUser.farm, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(farmProfileSchema),
  })
}

// Creates the farm profile on first save and replaces its writable fields afterwards.
export async function upsertFarmProfileApi(body: UpsertFarmRequest, accessToken: string) {
  return apiRequest(ENDPOINTS.currentUser.farm, {
    method: 'PUT',
    body,
    accessToken,
    schema: envelopeSchema(farmProfileSchema),
  })
}

export async function listAddressesApi(accessToken: string) {
  return apiRequest(`${ENDPOINTS.addresses.root}?limit=${ADDRESS_PAGE_LIMIT}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(addressSchema),
  })
}

export async function createAddressApi(body: AddressWrite, accessToken: string) {
  return apiRequest(ENDPOINTS.addresses.root, {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(addressSchema),
  })
}

export async function updateAddressApi(addressId: string, body: AddressPatch, accessToken: string) {
  return apiRequest(ENDPOINTS.addresses.detail(addressId), {
    method: 'PATCH',
    body,
    accessToken,
    schema: envelopeSchema(addressSchema),
  })
}

// Answers 204 No Content; deleting the default address is refused with 409 CONFLICT.
export async function deleteAddressApi(addressId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.addresses.detail(addressId), {
    method: 'DELETE',
    accessToken,
    schema: z.undefined(),
  })
}

export async function getNotificationSettingsApi(accessToken: string) {
  return apiRequest(ENDPOINTS.currentUser.notificationSettings, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(notificationSettingsSchema),
  })
}

export async function updateNotificationSettingsApi(
  body: NotificationSettingsPatch,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.currentUser.notificationSettings, {
    method: 'PATCH',
    body,
    accessToken,
    schema: envelopeSchema(notificationSettingsSchema),
  })
}
