import type { ProfileRepository } from '../domain/profile.repository.interface'
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
} from './profile.api'

export const profileRepository: ProfileRepository = {
  updateCurrentUser: updateCurrentUserApi,
  getFarmProfile: getFarmProfileApi,
  upsertFarmProfile: upsertFarmProfileApi,
  listAddresses: listAddressesApi,
  createAddress: createAddressApi,
  updateAddress: updateAddressApi,
  deleteAddress: deleteAddressApi,
  getNotificationSettings: getNotificationSettingsApi,
  updateNotificationSettings: updateNotificationSettingsApi,
}
