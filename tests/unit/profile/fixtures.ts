import type { UserProfile } from '@pages/auth/domain/auth.model'
import type {
  Address,
  FarmProfile,
  NotificationSettings,
} from '@pages/profile/domain/profile.model'

export const user: UserProfile = {
  id: 'usr_juan',
  fullName: 'Juan Dela Cruz',
  email: 'juan@example.com',
  mobileNumber: '+639171234567',
  avatar: null,
  emailVerified: true,
  mobileVerified: true,
  locale: 'en-PH',
  timezone: 'Asia/Manila',
  createdAt: '2026-08-06T00:00:00Z',
  updatedAt: '2026-08-06T00:00:00Z',
  version: 1,
}

export const farm: FarmProfile = {
  id: 'farm_juan',
  ownerUserId: 'usr_juan',
  name: 'Dela Cruz Family Fish Farm',
  region: 'CALABARZON',
  province: 'Laguna',
  municipality: 'San Pablo City',
  experienceLevel: 'BEGINNER',
  notes: 'Small-scale freshwater pond operation.',
  createdAt: '2026-08-06T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  version: 1,
}

export const address: Address = {
  id: 'addr_juan_home',
  label: 'Farm address',
  recipientName: 'Juan Dela Cruz',
  mobileNumber: '+639171234567',
  line1: '18 Mabini Street',
  line2: null,
  barangay: 'San Roque',
  cityMunicipality: 'San Pablo City',
  province: 'Laguna',
  region: 'CALABARZON',
  postalCode: '4000',
  countryCode: 'PH',
  deliveryInstructions: 'Call before entering the farm gate.',
  isDefault: true,
  createdAt: '2026-08-06T00:00:00Z',
  updatedAt: '2026-08-06T00:00:00Z',
  version: 1,
}

export const settings: NotificationSettings = {
  feedingReminders: true,
  waterMaintenance: true,
  growthSampling: true,
  harvestReminders: true,
  orderUpdates: true,
  educationalTips: true,
  morningFeedingTime: '08:00',
  afternoonFeedingTime: '16:30',
  timezone: 'Asia/Manila',
  updatedAt: '2026-09-21T00:00:00Z',
  version: 1,
}

export const meta = { requestId: 'req_1' }

export const pageInfo = { cursor: null, nextCursor: null, limit: 100, total: 1 }
