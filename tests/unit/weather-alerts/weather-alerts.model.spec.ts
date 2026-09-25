import { notificationSchema } from '@pages/notifications/domain/notifications.model'
import {
  weatherAlertsSchema,
  weatherKindDisplay,
  weatherPeakLine,
  weatherPeriodLabel,
  weatherPlace,
  weatherSeverityDisplay,
} from '@pages/weather-alerts/domain/weather-alerts.model'

import {
  heatAlert,
  heatNotification,
  hotForecast,
  locationMissing,
  overcastAlert,
  without,
} from './fixtures'

describe('weather-alerts model', () => {
  it('parses a forecast answer with an alert and the answer for a farm without a location', () => {
    expect(weatherAlertsSchema.parse(hotForecast).alerts[0]?.kind).toBe('HIGH_TEMPERATURE')
    expect(weatherAlertsSchema.parse(locationMissing).location).toBeNull()
  })

  it('refuses an alert without its provenance, so a contract change fails at the boundary', () => {
    const result = weatherAlertsSchema.safeParse({
      ...hotForecast,
      alerts: [without(heatAlert, 'disclaimer')],
    })
    expect(result.success).toBe(false)
  })

  it('refuses a status or kind the contract does not define', () => {
    expect(weatherAlertsSchema.safeParse({ ...hotForecast, status: 'SUNNY' }).success).toBe(false)
    expect(
      weatherAlertsSchema.safeParse({ ...hotForecast, alerts: [{ ...heatAlert, kind: 'RAIN' }] })
        .success,
    ).toBe(false)
  })

  it('parses a weather notification with its alert, and older notifications without the field', () => {
    expect(notificationSchema.parse(heatNotification).weatherAlert?.id).toBe(heatAlert.id)
    const older = { ...without(heatNotification, 'weatherAlert'), type: 'SYSTEM' }
    expect(notificationSchema.parse(older).weatherAlert).toBeUndefined()
  })

  it('words the period as Manila calendar days, once for a single day', () => {
    expect(weatherPeriodLabel('2026-09-24', '2026-09-25')).toBe('Thu, Sep 24 – Fri, Sep 25')
    expect(weatherPeriodLabel('2026-09-24', '2026-09-24')).toBe('Thu, Sep 24')
  })

  it('puts the forecast figure beside the demo value that raises an alert, with units', () => {
    expect(weatherPeakLine(heatAlert)).toBe(
      'Forecast high of 35.3 °C air temperature; alerts start at 34 °C.',
    )
    expect(weatherPeakLine(overcastAlert)).toBe(
      'Forecast cloud cover up to 92%; alerts start at 80% for two days or more.',
    )
  })

  it('gives every kind and severity a label and an icon, not colour alone', () => {
    expect(weatherKindDisplay('HIGH_TEMPERATURE')).toEqual({
      label: 'Hot weather',
      tone: 'warning',
      icon: 'sun',
    })
    expect(weatherKindDisplay('OVERCAST_SPELL').icon).toBe('cloud')
    expect(weatherSeverityDisplay('WARNING')).toEqual({
      label: 'Warning',
      tone: 'danger',
      icon: 'warning',
    })
    expect(weatherSeverityDisplay('ADVISORY').label).toBe('Advisory')
    expect(weatherPlace(heatAlert.location)).toBe('Dagupan City, Pangasinan')
  })
})
