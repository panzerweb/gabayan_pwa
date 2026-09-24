import type { z } from 'zod'

import { zodFieldErrors } from '@core/utils/validation'
import {
  addressFormSchema,
  addressSummary,
  farmFormSchema,
  farmLocation,
  initialsOf,
  newAddressForm,
  personalDetailsFormSchema,
  reminderSettingsFormSchema,
  toAddressWrite,
  toFarmForm,
  toNotificationSettingsPatch,
  toReminderSettingsForm,
  toUpsertFarmRequest,
} from '@pages/profile/domain/profile.model'

import { address, farm, settings } from './fixtures'

function errorsOf(result: { success: true } | { success: false; error: z.ZodError }) {
  return result.success ? {} : zodFieldErrors(result.error)
}

describe('profile model', () => {
  it('builds initials from the first two names', () => {
    expect(initialsOf('juan dela cruz')).toBe('JD')
    expect(initialsOf('  ')).toBe('GU')
    expect(initialsOf(null)).toBe('GU')
  })

  it('reads a farm location in municipality, province, region order', () => {
    expect(farmLocation(farm)).toBe('San Pablo City, Laguna, CALABARZON')
    expect(farmLocation({ ...farm, municipality: null, province: null, region: null })).toBe(
      'Location not added',
    )
  })

  it('summarises an address on one line, including the second line when given', () => {
    expect(addressSummary(address)).toBe('18 Mabini Street, San Roque, San Pablo City, Laguna 4000')
    expect(addressSummary({ ...address, line2: 'Purok 3' })).toBe(
      '18 Mabini Street, Purok 3, San Roque, San Pablo City, Laguna 4000',
    )
  })

  it('asks for a name and a mobile number on personal details', () => {
    const result = personalDetailsFormSchema.safeParse({ fullName: 'J', mobileNumber: ' ' })

    expect(errorsOf(result)).toEqual({
      fullName: 'Enter a name between 2 and 100 characters.',
      mobileNumber: 'Enter your mobile number.',
    })
  })

  it('sends blank optional farm fields as null', () => {
    const parsed = farmFormSchema.parse({ ...toFarmForm(farm), province: '  ', notes: '' })

    expect(toUpsertFarmRequest(parsed)).toEqual({
      name: farm.name,
      municipality: 'San Pablo City',
      province: null,
      region: 'CALABARZON',
      experienceLevel: 'BEGINNER',
      notes: null,
    })
  })

  it('starts a missing farm profile blank at the beginner level', () => {
    expect(toFarmForm(null)).toEqual({
      name: '',
      municipality: '',
      province: '',
      region: '',
      experienceLevel: 'BEGINNER',
      notes: '',
    })
    expect(errorsOf(farmFormSchema.safeParse(toFarmForm(null)))).toEqual({
      name: 'Enter a farm name between 2 and 120 characters.',
    })
  })

  it('names every missing required address field', () => {
    const errors = errorsOf(addressFormSchema.safeParse(newAddressForm(null, false)))

    expect(Object.keys(errors).sort()).toEqual([
      'barangay',
      'cityMunicipality',
      'line1',
      'mobileNumber',
      'postalCode',
      'province',
      'recipientName',
      'region',
    ])
    expect(errors).toMatchObject({ barangay: 'Enter the barangay.' })
  })

  it('prefills the recipient and writes a Philippine address', () => {
    const form = {
      ...newAddressForm({ fullName: 'Juan Dela Cruz', mobileNumber: '+639171234567' }, true),
      line1: '22 Rizal Avenue',
      barangay: 'Santo Angel',
      cityMunicipality: 'San Pablo City',
      province: 'Laguna',
      region: 'CALABARZON',
      postalCode: '4000',
    }

    expect(toAddressWrite(addressFormSchema.parse(form))).toMatchObject({
      label: 'Farm address',
      recipientName: 'Juan Dela Cruz',
      countryCode: 'PH',
      deliveryInstructions: null,
      isDefault: true,
    })
  })

  it('requires feeding times only while feeding reminders are on', () => {
    const form = { ...toReminderSettingsForm(settings), morningFeedingTime: '' }

    expect(errorsOf(reminderSettingsFormSchema.safeParse(form))).toEqual({
      morningFeedingTime: 'Choose a morning feeding time.',
    })
    expect(reminderSettingsFormSchema.safeParse({ ...form, feedingReminders: false }).success).toBe(
      true,
    )
  })

  it('sends a blank feeding time as null', () => {
    const form = { ...toReminderSettingsForm(settings), afternoonFeedingTime: '' }

    expect(toNotificationSettingsPatch(form)).toMatchObject({
      morningFeedingTime: '08:00',
      afternoonFeedingTime: null,
      timezone: 'Asia/Manila',
    })
  })
})
