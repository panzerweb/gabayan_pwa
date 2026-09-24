import { z } from 'zod'

export const EXPERIENCE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED'] as const

export const farmProfileSchema = z.object({
  id: z.string().min(1),
  ownerUserId: z.string().min(1),
  name: z.string(),
  region: z.string().nullable(),
  province: z.string().nullable(),
  municipality: z.string().nullable(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const addressSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  recipientName: z.string(),
  mobileNumber: z.string(),
  line1: z.string(),
  line2: z.string().nullable().optional(),
  barangay: z.string(),
  cityMunicipality: z.string(),
  province: z.string(),
  region: z.string(),
  postalCode: z.string(),
  countryCode: z.literal('PH'),
  deliveryInstructions: z.string().nullable().optional(),
  isDefault: z.boolean(),
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
  timezone: z.string().min(1),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]
export type FarmProfile = z.infer<typeof farmProfileSchema>
export type Address = z.infer<typeof addressSchema>
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

// Contract §6 `UpdateUserRequest`: at least one field. Email changes are not in v1.
export type UpdateUserRequest = Partial<{
  fullName: string
  mobileNumber: string
  avatarUrl: string
  locale: string
  timezone: string
}>

export type UpsertFarmRequest = Pick<
  FarmProfile,
  'name' | 'region' | 'province' | 'municipality' | 'experienceLevel' | 'notes'
>

export interface AddressWrite {
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

export type AddressPatch = Partial<AddressWrite>

export type NotificationSettingsPatch = Partial<Omit<NotificationSettings, 'updatedAt' | 'version'>>

// Profile changes are high-impact writes: they are refused while offline, never queued.
export const PROFILE_OFFLINE_MESSAGE =
  'Reconnect before saving profile changes. Changes are not queued offline.'

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  EXPERIENCED: 'Experienced',
}

// Two-letter initials shown in the profile summary.
export function initialsOf(fullName: string | null | undefined) {
  return (fullName?.trim() || 'Gabayan User')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

// Municipality, province and region in reading order, skipping the ones not given.
export function farmLocation(farm: FarmProfile) {
  return (
    [farm.municipality, farm.province, farm.region].filter(Boolean).join(', ') ||
    'Location not added'
  )
}

// One-line delivery address for an address card.
export function addressSummary(address: Address) {
  const street = [address.line1, address.line2].filter(Boolean).join(', ')
  return `${street}, ${address.barangay}, ${address.cityMunicipality}, ${address.province} ${address.postalCode}`
}

// --- Personal details form

export const personalDetailsFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter a name between 2 and 100 characters.')
    .max(100, 'Enter a name between 2 and 100 characters.'),
  mobileNumber: z.string().trim().min(1, 'Enter your mobile number.'),
})

export type PersonalDetailsForm = z.input<typeof personalDetailsFormSchema>

// --- Farm form

export const farmFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter a farm name between 2 and 120 characters.')
    .max(120, 'Enter a farm name between 2 and 120 characters.'),
  municipality: z.string().trim(),
  province: z.string().trim(),
  region: z.string().trim(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, { error: 'Choose your experience level.' }),
  notes: z.string().trim().max(300, 'Keep farm notes under 300 characters.'),
})

export type FarmForm = z.input<typeof farmFormSchema>

export function toFarmForm(farm: FarmProfile | null): FarmForm {
  return {
    name: farm?.name ?? '',
    municipality: farm?.municipality ?? '',
    province: farm?.province ?? '',
    region: farm?.region ?? '',
    experienceLevel: farm?.experienceLevel ?? 'BEGINNER',
    notes: farm?.notes ?? '',
  }
}

// Blank optional fields are sent as null so the farm profile clears them.
export function toUpsertFarmRequest(form: z.output<typeof farmFormSchema>): UpsertFarmRequest {
  return {
    name: form.name,
    municipality: form.municipality || null,
    province: form.province || null,
    region: form.region || null,
    experienceLevel: form.experienceLevel,
    notes: form.notes || null,
  }
}

// --- Address form

const requiredText = (message: string) => z.string().trim().min(1, message)

export const addressFormSchema = z.object({
  label: requiredText('Enter a label, such as Farm address.'),
  recipientName: requiredText('Enter who receives the delivery.'),
  mobileNumber: requiredText('Enter a mobile number for the courier.'),
  line1: requiredText('Enter the street and building.'),
  barangay: requiredText('Enter the barangay.'),
  cityMunicipality: requiredText('Enter the city or municipality.'),
  province: requiredText('Enter the province.'),
  region: requiredText('Enter the region.'),
  postalCode: requiredText('Enter the postal code.'),
  deliveryInstructions: z.string().trim(),
  isDefault: z.boolean(),
})

export type AddressForm = z.input<typeof addressFormSchema>

// A blank address form prefilled with the account holder as recipient.
export function newAddressForm(
  recipient: { fullName: string; mobileNumber: string } | null,
  isDefault: boolean,
): AddressForm {
  return {
    label: 'Farm address',
    recipientName: recipient?.fullName ?? '',
    mobileNumber: recipient?.mobileNumber ?? '',
    line1: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    region: '',
    postalCode: '',
    deliveryInstructions: '',
    isDefault,
  }
}

export function toAddressWrite(form: z.output<typeof addressFormSchema>): AddressWrite {
  return {
    ...form,
    countryCode: 'PH',
    deliveryInstructions: form.deliveryInstructions || null,
  }
}

// --- Reminder settings form

export const REMINDER_TOGGLES = [
  { field: 'feedingReminders', label: 'Feeding reminders' },
  { field: 'waterMaintenance', label: 'Water maintenance' },
  { field: 'growthSampling', label: 'Growth sampling' },
  { field: 'harvestReminders', label: 'Harvest reminders' },
  { field: 'orderUpdates', label: 'Order updates' },
  { field: 'educationalTips', label: 'Educational tips' },
] as const

export type ReminderToggle = (typeof REMINDER_TOGGLES)[number]['field']

export type ReminderSettingsForm = Record<ReminderToggle, boolean> & {
  morningFeedingTime: string
  afternoonFeedingTime: string
  timezone: string
}

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/

// Feeding times are only checked while feeding reminders are on: a reminder needs a time,
// and switched-off reminders keep whatever time was last chosen.
export const reminderSettingsFormSchema = z
  .object({
    feedingReminders: z.boolean(),
    morningFeedingTime: z.string(),
    afternoonFeedingTime: z.string(),
  })
  .superRefine((form, context) => {
    if (!form.feedingReminders) return
    const times = [
      ['morningFeedingTime', 'Choose a morning feeding time.'],
      ['afternoonFeedingTime', 'Choose an afternoon feeding time.'],
    ] as const
    for (const [field, message] of times) {
      if (!TIME_OF_DAY.test(form[field]))
        context.addIssue({ code: 'custom', path: [field], message })
    }
  })

export function toReminderSettingsForm(settings: NotificationSettings): ReminderSettingsForm {
  return {
    feedingReminders: settings.feedingReminders,
    waterMaintenance: settings.waterMaintenance,
    growthSampling: settings.growthSampling,
    harvestReminders: settings.harvestReminders,
    orderUpdates: settings.orderUpdates,
    educationalTips: settings.educationalTips,
    morningFeedingTime: settings.morningFeedingTime ?? '',
    afternoonFeedingTime: settings.afternoonFeedingTime ?? '',
    timezone: settings.timezone,
  }
}

// A blank feeding time is sent as null, which the contract accepts as "no time set".
export function toNotificationSettingsPatch(form: ReminderSettingsForm): NotificationSettingsPatch {
  return {
    ...form,
    morningFeedingTime: form.morningFeedingTime || null,
    afternoonFeedingTime: form.afternoonFeedingTime || null,
  }
}
