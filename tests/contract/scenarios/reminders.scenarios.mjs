import { describe, expect, it } from 'vitest'

import { bearer, idempotencyKey, registerAccount } from '../support/accounts.mjs'
import { createCultivation } from '../support/demo.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

// Contract §12 Reminders. Every farmer is a fresh account and every date is counted from the
// server's own today (Home's `date`), so the scenarios hold on the pinned mock and on a live
// server alike. The morning feeding time is 00:00, always passed, and the afternoon one 23:59,
// not yet passed.
const REMINDER_TYPES = ['FEEDING_DUE', 'WATER_CHANGE_DUE', 'HARVEST_APPROACHING']
const FULL_WATER_CHANGE = /\b(all|whole|entire)\b[^.]*\bwater\b|100 ?%|replace the water/i

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function stockedFarmer(client, name, { stockedDaysAgo, settings = {} }) {
  const { accessToken } = await registerAccount(client, name)
  const auth = bearer(accessToken)
  const { date: today } = expectEnvelope(
    await client.get('/dashboard/home').set('Authorization', auth),
  )
  expectEnvelope(await client.get('/users/me/notification-settings').set('Authorization', auth))
  expectEnvelope(
    await client
      .patch('/users/me/notification-settings')
      .set('Authorization', auth)
      .send({ morningFeedingTime: '00:00', afternoonFeedingTime: '23:59', ...settings }),
  )
  const cultivation = await createCultivation(client, accessToken, {
    stockedOn: addDays(today, -stockedDaysAgo),
  })
  return { auth, today, cultivation }
}

// Reads Home, the unread count and the notification list, as a farmer opening the app does.
async function readTwice(client, auth) {
  for (let round = 0; round < 2; round += 1) {
    expectEnvelope(await client.get('/dashboard/home').set('Authorization', auth))
    expectEnvelope(await client.get('/notifications/unread-count').set('Authorization', auth))
    expectPage(await client.get('/notifications?limit=100').set('Authorization', auth))
  }
}

async function reminders(client, auth, type) {
  const list = expectPage(await client.get('/notifications?limit=100').set('Authorization', auth))
  return list.filter((notification) =>
    type ? notification.type === type : REMINDER_TYPES.includes(notification.type),
  )
}

async function recordSample(client, auth, cultivationId, measuredOn, grams) {
  return expectEnvelope(
    await client
      .post(`/cultivations/${cultivationId}/growth-measurements`)
      .set('Authorization', auth)
      .set('Idempotency-Key', idempotencyKey('reminder-sample'))
      .send({ measuredOn, numberOfFishSampled: 20, averageWeight: { value: grams, unit: 'G' } }),
    201,
  )
}

async function feedingTasks(client, auth, today, cultivationId) {
  const tasks = expectPage(
    await client
      .get(`/tasks?date=${today}&cultivationId=${encodeURIComponent(cultivationId)}`)
      .set('Authorization', auth),
  )
  return tasks.filter((task) => task.type === 'FEEDING')
}

export function registerReminderContract(client) {
  describe('reminders', () => {
    it('raises the passed feeding slot and a partial water change once, however often the app is read', async () => {
      const { auth, today, cultivation } = await stockedFarmer(client, 'Reminder Farmer', {
        stockedDaysAgo: 7,
      })

      await readTwice(client, auth)

      const [feeding, ...extraFeeding] = await reminders(client, auth, 'FEEDING_DUE')
      expect(extraFeeding).toEqual([])
      expect(feeding).toMatchObject({
        category: 'CULTIVATION',
        cultivationId: cultivation.id,
        readAt: null,
        recommendedAmount: null,
        taskId: expect.any(String),
        reminder: {
          waterChangePercent: null,
          harvestWindowDays: null,
          isDemo: true,
          disclaimer: expect.any(String),
        },
      })
      const tasks = await feedingTasks(client, auth, today, cultivation.id)
      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toMatchObject({ id: feeding.taskId, status: 'DUE', recommendedAmount: null })
      expect(Date.parse(tasks[0].scheduledAt)).toBe(Date.parse(`${today}T00:00:00+08:00`))
      expect(Date.parse(feeding.occurredAt)).toBe(Date.parse(tasks[0].scheduledAt))

      const [waterChange, ...extraWater] = await reminders(client, auth, 'WATER_CHANGE_DUE')
      expect(extraWater).toEqual([])
      expect(waterChange).toMatchObject({
        category: 'CULTIVATION',
        cultivationId: cultivation.id,
        reminder: {
          waterChangePercent: 30,
          harvestWindowDays: null,
          isDemo: true,
          sourceStatus: 'DEMO',
          basis: expect.any(String),
          ruleVersion: expect.any(String),
          disclaimer: expect.any(String),
        },
      })
      expect(`${waterChange.title} ${waterChange.message}`).not.toMatch(FULL_WATER_CHANGE)

      expect(await reminders(client, auth, 'HARVEST_APPROACHING')).toEqual([])
      const unread = expectEnvelope(
        await client.get('/notifications/unread-count').set('Authorization', auth),
      )
      expect(unread.count).toBe(2)
    })

    it('raises a harvest alert once a current sample reaches the target band, and only once', async () => {
      const { auth, today, cultivation } = await stockedFarmer(client, 'Harvest Alert Farmer', {
        stockedDaysAgo: 130,
      })
      await readTwice(client, auth)
      expect(await reminders(client, auth, 'HARVEST_APPROACHING')).toEqual([])

      await recordSample(client, auth, cultivation.id, today, 380)
      await readTwice(client, auth)

      const alerts = await reminders(client, auth, 'HARVEST_APPROACHING')
      expect(alerts).toHaveLength(1)
      expect(alerts[0]).toMatchObject({
        category: 'CULTIVATION',
        cultivationId: cultivation.id,
        readAt: null,
        action: { deepLink: expect.stringMatching(/\/harvest$/) },
        reminder: {
          waterChangePercent: null,
          harvestWindowDays: { minimum: 120, maximum: 150 },
          latestAverageWeight: { value: 380, unit: 'G' },
          targetWeightRange: {
            minimum: { value: 350, unit: 'G' },
            maximum: { value: 450, unit: 'G' },
          },
          isDemo: true,
          sourceStatus: 'DEMO',
        },
      })
    })

    it('raises no harvest alert without a current sample in the band, however many days have passed', async () => {
      const { auth, today, cultivation } = await stockedFarmer(client, 'Long Culture Farmer', {
        stockedDaysAgo: 200,
      })
      await readTwice(client, auth)
      expect(await reminders(client, auth, 'HARVEST_APPROACHING')).toEqual([])

      // A heavy sample weighed three weeks ago is no longer current.
      await recordSample(client, auth, cultivation.id, addDays(today, -20), 420)
      await readTwice(client, auth)
      expect(await reminders(client, auth, 'HARVEST_APPROACHING')).toEqual([])

      // A current sample below the band raises nothing either.
      await recordSample(client, auth, cultivation.id, today, 250)
      await readTwice(client, auth)
      expect(await reminders(client, auth, 'HARVEST_APPROACHING')).toEqual([])
    })

    it('raises nothing while the switches are off, and does not raise the skipped slots later', async () => {
      const off = { feedingReminders: false, waterMaintenance: false, harvestReminders: false }
      const { auth, today, cultivation } = await stockedFarmer(client, 'Quiet Farmer', {
        stockedDaysAgo: 130,
        settings: off,
      })
      await recordSample(client, auth, cultivation.id, today, 400)
      await readTwice(client, auth)
      expect(await reminders(client, auth)).toEqual([])
      // The day's feeding schedule stands; only its notification follows the switch.
      expect(await feedingTasks(client, auth, today, cultivation.id)).toHaveLength(1)

      expectEnvelope(
        await client
          .patch('/users/me/notification-settings')
          .set('Authorization', auth)
          .send({ feedingReminders: true, waterMaintenance: true, harvestReminders: true }),
      )
      await readTwice(client, auth)
      expect(await reminders(client, auth)).toEqual([])
    })

    it('raises the afternoon feeding only once its time has passed on the mock clock', async () => {
      if (!(await client.servesMockFixtures())) return
      const { accessToken } = await registerAccount(client, 'Clocked Farmer')
      const auth = bearer(accessToken)
      const { date: today } = expectEnvelope(
        await client.get('/dashboard/home').set('Authorization', auth),
      )
      const cultivation = await createCultivation(client, accessToken, {
        stockedOn: addDays(today, -3),
      })
      const feedingTitles = async (now) => {
        const response = await client
          .get('/notifications?limit=100')
          .set('Authorization', auth)
          .set('X-Mock-Now', now)
        return expectPage(response)
          .filter((notification) => notification.type === 'FEEDING_DUE')
          .map((notification) => notification.title)
      }

      expect(await feedingTitles(`${today}T07:59:00+08:00`)).toEqual([])
      expect(await feedingTitles(`${today}T12:00:00+08:00`)).toEqual(['Morning feeding is due'])
      expect(await feedingTitles(`${today}T16:31:00+08:00`)).toEqual([
        'Afternoon feeding is due',
        'Morning feeding is due',
      ])
      expect(await feedingTitles(`${today}T18:00:00+08:00`)).toHaveLength(2)
      expect(await feedingTasks(client, auth, today, cultivation.id)).toHaveLength(2)

      const malformed = await client
        .get('/notifications')
        .set('Authorization', auth)
        .set('X-Mock-Now', 'tomorrow')
      expectError(malformed, 400, 'BAD_REQUEST')
    })
  })
}
