import { describe, expect, it } from 'vitest'

import { bearer, registerAccount, signInAsDemo } from '../support/accounts.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

// Contract §12 Weather alerts, against the fixture forecast the mock and the backend's fake
// weather adapter share. Every farmer is a fresh account and every date is counted from the
// server's own today (Home's `date`), so the scenarios hold on the pinned mock and on a live
// server with the fake adapter selected.
const FULL_WATER_CHANGE = /\b(all|whole|entire)\b[^.]*\bwater\b|100 ?%|replace the water/i
const PROVENANCE = {
  basis: expect.any(String),
  isDemo: true,
  sourceStatus: 'DEMO',
  ruleVersion: expect.any(String),
  disclaimer: expect.any(String),
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function farmerAt(client, name, place) {
  const { accessToken } = await registerAccount(client, name)
  const auth = bearer(accessToken)
  const { date: today } = expectEnvelope(
    await client.get('/dashboard/home').set('Authorization', auth),
  )
  if (place) await saveFarmLocation(client, auth, place)
  return { auth, today }
}

async function saveFarmLocation(client, auth, { municipality, province }) {
  return expectEnvelope(
    await client.put('/users/me/farm').set('Authorization', auth).send({
      name: 'Contract Weather Farm',
      region: null,
      province,
      municipality,
      experienceLevel: 'BEGINNER',
      notes: null,
    }),
  )
}

async function weatherAlerts(client, auth) {
  return expectEnvelope(await client.get('/weather-alerts').set('Authorization', auth))
}

// Reads Home, the unread count and the notification list, as a farmer opening the app does.
async function readTwice(client, auth) {
  for (let round = 0; round < 2; round += 1) {
    expectEnvelope(await client.get('/dashboard/home').set('Authorization', auth))
    expectEnvelope(await client.get('/notifications/unread-count').set('Authorization', auth))
    expectPage(await client.get('/notifications?limit=100').set('Authorization', auth))
    await weatherAlerts(client, auth)
  }
}

async function weatherNotifications(client, auth) {
  const list = expectPage(await client.get('/notifications?limit=100').set('Authorization', auth))
  return list.filter((notification) => notification.type === 'WEATHER_ALERT')
}

export function registerWeatherAlertContract(client) {
  describe('weather alerts', () => {
    it('refuses a signed-out read', async () => {
      expectError(await client.get('/weather-alerts'), 401, 'AUTH_REQUIRED')
    })

    it('answers LOCATION_MISSING without a farm profile or with half a location, and raises nothing', async () => {
      const { auth } = await farmerAt(client, 'No Place Farmer')
      const missing = await weatherAlerts(client, auth)
      expect(missing).toEqual({
        status: 'LOCATION_MISSING',
        location: null,
        forecastDays: 3,
        checkedAt: null,
        alerts: [],
        message: expect.stringMatching(/municipality/i),
      })

      await saveFarmLocation(client, auth, { municipality: 'Dagupan City', province: null })
      expect(await weatherAlerts(client, auth)).toMatchObject({
        status: 'LOCATION_MISSING',
        location: null,
        alerts: [],
      })
      await readTwice(client, auth)
      expect(await weatherNotifications(client, auth)).toEqual([])
    })

    it('raises one heat alert for the coming hot days, with its notification, however often it is read', async () => {
      const { auth, today } = await farmerAt(client, 'Heat Alert Farmer', {
        municipality: 'Dagupan City',
        province: 'Pangasinan',
      })
      await readTwice(client, auth)

      const answer = await weatherAlerts(client, auth)
      expect(answer).toMatchObject({
        status: 'AVAILABLE',
        location: { municipality: 'Dagupan City', province: 'Pangasinan' },
        forecastDays: 3,
        checkedAt: expect.any(String),
        message: expect.any(String),
      })
      expect(answer.alerts).toHaveLength(1)
      const [alert] = answer.alerts
      expect(alert).toEqual({
        id: expect.any(String),
        kind: 'HIGH_TEMPERATURE',
        severity: 'ADVISORY',
        location: { municipality: 'Dagupan City', province: 'Pangasinan' },
        periodStart: addDays(today, 1),
        periodEnd: addDays(today, 2),
        peak: { value: 35.3, unit: 'CELSIUS' },
        threshold: { value: 34, unit: 'CELSIUS' },
        title: expect.any(String),
        message: expect.any(String),
        explanation: expect.stringMatching(/oxygen/i),
        actions: expect.arrayContaining([expect.any(String)]),
        raisedAt: expect.any(String),
        ...PROVENANCE,
      })
      expect(
        [alert.title, alert.message, alert.explanation, ...alert.actions].join(' '),
      ).not.toMatch(FULL_WATER_CHANGE)

      const notifications = await weatherNotifications(client, auth)
      expect(notifications).toHaveLength(1)
      expect(notifications[0]).toMatchObject({
        category: 'CULTIVATION',
        type: 'WEATHER_ALERT',
        title: alert.title,
        message: alert.message,
        readAt: null,
        action: null,
        cultivationId: null,
        orderId: null,
        taskId: null,
        reminder: null,
        weatherAlert: { id: alert.id, kind: 'HIGH_TEMPERATURE', explanation: alert.explanation },
      })
      const unread = expectEnvelope(
        await client.get('/notifications/unread-count').set('Authorization', auth),
      )
      expect(unread.count).toBe(1)
    })

    it('raises a warning for a run of overcast days, matching the place whatever its case', async () => {
      const { auth, today } = await farmerAt(client, 'Overcast Alert Farmer', {
        municipality: '  dumangas ',
        province: 'ILOILO',
      })
      const { alerts } = await weatherAlerts(client, auth)
      expect(alerts).toEqual([
        expect.objectContaining({
          kind: 'OVERCAST_SPELL',
          severity: 'WARNING',
          periodStart: today,
          periodEnd: addDays(today, 2),
          peak: { value: 92, unit: 'PERCENT' },
          threshold: { value: 80, unit: 'PERCENT' },
          ...PROVENANCE,
        }),
      ])
      expect(await weatherNotifications(client, auth)).toHaveLength(1)
    })

    it('answers FORECAST_UNAVAILABLE when the forecast cannot be read, and Home still answers', async () => {
      const { auth } = await farmerAt(client, 'Remote Island Farmer', {
        municipality: 'Jomalig',
        province: 'Quezon',
      })
      expect(await weatherAlerts(client, auth)).toMatchObject({
        status: 'FORECAST_UNAVAILABLE',
        location: { municipality: 'Jomalig', province: 'Quezon' },
        checkedAt: null,
        alerts: [],
        message: expect.any(String),
      })
      await readTwice(client, auth)
      expect(await weatherNotifications(client, auth)).toEqual([])
    })

    it('lists only the alerts for the farm location saved now, keeping the notification already raised', async () => {
      const { auth } = await farmerAt(client, 'Moving Farmer', {
        municipality: 'Dagupan City',
        province: 'Pangasinan',
      })
      expect((await weatherAlerts(client, auth)).alerts).toHaveLength(1)

      await saveFarmLocation(client, auth, { municipality: 'San Pablo City', province: 'Laguna' })
      expect(await weatherAlerts(client, auth)).toMatchObject({ status: 'AVAILABLE', alerts: [] })
      expect(await weatherNotifications(client, auth)).toHaveLength(1)
    })

    it('carries a null weatherAlert on every notification that is not a weather alert', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      await weatherAlerts(client, auth)
      const list = expectPage(
        await client.get('/notifications?limit=100').set('Authorization', auth),
      )
      expect(list.length).toBeGreaterThan(0)
      for (const notification of list) {
        expect(notification).toHaveProperty('weatherAlert')
        if (notification.type !== 'WEATHER_ALERT') expect(notification.weatherAlert).toBeNull()
      }
    })

    it('reads any place the fixture does not list as a calm forecast', async () => {
      const { auth } = await farmerAt(client, 'Calm Place Farmer', {
        municipality: 'Tagbilaran City',
        province: 'Bohol',
      })
      expect(await weatherAlerts(client, auth)).toMatchObject({ status: 'AVAILABLE', alerts: [] })
    })
  })
}
