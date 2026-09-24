import type { Envelope, Page } from '@core/http'
import type { UserProfile } from '@pages/auth/domain/auth.model'

import type {
  Address,
  AddressPatch,
  AddressWrite,
  FarmProfile,
  NotificationSettings,
  NotificationSettingsPatch,
  UpdateUserRequest,
  UpsertFarmRequest,
} from './profile.model'

export interface ProfileRepository {
  updateCurrentUser(body: UpdateUserRequest, accessToken: string): Promise<Envelope<UserProfile>>
  getFarmProfile(accessToken: string): Promise<Envelope<FarmProfile>>
  upsertFarmProfile(body: UpsertFarmRequest, accessToken: string): Promise<Envelope<FarmProfile>>
  listAddresses(accessToken: string): Promise<Page<Address>>
  createAddress(body: AddressWrite, accessToken: string): Promise<Envelope<Address>>
  updateAddress(
    addressId: string,
    body: AddressPatch,
    accessToken: string,
  ): Promise<Envelope<Address>>
  deleteAddress(addressId: string, accessToken: string): Promise<void>
  getNotificationSettings(accessToken: string): Promise<Envelope<NotificationSettings>>
  updateNotificationSettings(
    body: NotificationSettingsPatch,
    accessToken: string,
  ): Promise<Envelope<NotificationSettings>>
}
