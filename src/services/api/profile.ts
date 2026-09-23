import { z } from 'zod'

import { userProfileSchema } from './auth'
import { addressSchema } from './commerce'
import { apiRequest } from './http'
import { envelopeSchema, pageSchema } from './schemas'

export const farmProfileSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  name: z.string(),
  region: z.string().nullable(),
  province: z.string().nullable(),
  municipality: z.string().nullable(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED']),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const notificationSettingsSchema = z.object({
  feedingReminders: z.boolean(),
  waterMaintenance: z.boolean(),
  growthSampling: z.boolean(),
  harvestReminders: z.boolean(),
  orderUpdates: z.boolean(),
  educationalTips: z.boolean(),
  morningFeedingTime: z.string().nullable(),
  afternoonFeedingTime: z.string().nullable(),
  timezone: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export type FarmProfile = z.infer<typeof farmProfileSchema>
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>
export type AddressWrite = {
  label: string
  recipientName: string
  mobileNumber: string
  line1: string
  line2?: string | null
  barangay: string
  cityMunicipality: string
  province: string
  region: string
  postalCode: string
  countryCode: 'PH'
  deliveryInstructions?: string | null
  isDefault: boolean
}
export type FarmWrite = Pick<
  FarmProfile,
  'name' | 'region' | 'province' | 'municipality' | 'experienceLevel' | 'notes'
>
export type NotificationSettingsPatch = Partial<Omit<NotificationSettings, 'updatedAt' | 'version'>>

export const profileQueryKeys = {
  farm: ['profile', 'farm'] as const,
  addresses: ['profile', 'addresses'] as const,
  notifications: ['profile', 'notification-settings'] as const,
}

export function updateCurrentUser(
  body: { fullName?: string; mobileNumber?: string; locale?: string; timezone?: string },
  accessToken: string,
) {
  return apiRequest('/users/me', {
    method: 'PATCH',
    body,
    accessToken,
    schema: envelopeSchema(userProfileSchema),
  })
}

export function getFarmProfile(accessToken: string) {
  return apiRequest('/users/me/farm', {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(farmProfileSchema),
  })
}

export function upsertFarmProfile(body: FarmWrite, accessToken: string) {
  return apiRequest('/users/me/farm', {
    method: 'PUT',
    body,
    accessToken,
    schema: envelopeSchema(farmProfileSchema),
  })
}

export function getProfileAddresses(accessToken: string) {
  return apiRequest('/users/me/addresses?limit=100', {
    method: 'GET',
    accessToken,
    schema: pageSchema(addressSchema),
  })
}

export function createProfileAddress(body: AddressWrite, accessToken: string) {
  return apiRequest('/users/me/addresses', {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(addressSchema),
  })
}

export function updateProfileAddress(
  addressId: string,
  body: Partial<AddressWrite>,
  accessToken: string,
) {
  return apiRequest(`/users/me/addresses/${addressId}`, {
    method: 'PATCH',
    body,
    accessToken,
    schema: envelopeSchema(addressSchema),
  })
}

export function deleteProfileAddress(addressId: string, accessToken: string) {
  return apiRequest(`/users/me/addresses/${addressId}`, {
    method: 'DELETE',
    accessToken,
    schema: z.undefined(),
  })
}

export function getNotificationSettings(accessToken: string) {
  return apiRequest('/users/me/notification-settings', {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(notificationSettingsSchema),
  })
}

export function updateNotificationSettings(body: NotificationSettingsPatch, accessToken: string) {
  return apiRequest('/users/me/notification-settings', {
    method: 'PATCH',
    body,
    accessToken,
    schema: envelopeSchema(notificationSettingsSchema),
  })
}
