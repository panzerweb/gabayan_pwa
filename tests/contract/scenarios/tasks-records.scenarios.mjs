import { describe, expect, it } from 'vitest'

import { bearer, idempotencyKey, registerAccount, signInAsDemo } from '../support/accounts.mjs'
import {
  DEMO_CULTIVATION,
  SEED_DAY,
  createCultivation,
  findCultivation,
  listSeedDayTasks,
} from '../support/demo.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

const STOCKING_DAY = '2026-09-01'

// The demo farmer's seeded tasks on the seed day. Earlier scenarios complete the afternoon
// feeding, so both feedings are COMPLETED with a linked record and the water check is DUE.
async function demoTasks(client) {
  const { accessToken } = await signInAsDemo(client)
  const cultivation = await findCultivation(client, accessToken, DEMO_CULTIVATION)
  const tasks = await listSeedDayTasks(client, accessToken, cultivation.id)
  return {
    accessToken,
    cultivation,
    feeding: tasks.find((task) => task.type === 'FEEDING' && task.status === 'COMPLETED'),
    waterCheck: tasks.find((task) => task.type === 'WATER_CHECK'),
  }
}

function recordFeeding(client, token, cultivationId, body, key = idempotencyKey('feeding')) {
  return client
    .post(`/cultivations/${cultivationId}/feeding-records`)
    .set('Authorization', bearer(token))
    .set('Idempotency-Key', key)
    .send(body)
}

export function registerTaskAndRecordContract(client) {
  describe('tasks', () => {
    it("lists and reads the demo farmer's tasks with their audit fields", async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)

      const tasks = expectPage(
        await client.get(`/tasks?date=${SEED_DAY}`).set('Authorization', auth),
      )
      expect(tasks).toHaveLength(3)
      expect(tasks.map((task) => task.scheduledAt)).toEqual(
        [...tasks.map((task) => task.scheduledAt)].sort(),
      )
      const waterCheck = tasks.find((task) => task.type === 'WATER_CHECK')

      const task = expectEnvelope(
        await client.get(`/tasks/${waterCheck.id}`).set('Authorization', auth),
      )
      expect(task).toMatchObject({
        id: waterCheck.id,
        type: 'WATER_CHECK',
        status: 'DUE',
        deepLink: expect.stringMatching(/^\//),
        audit: {
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          version: expect.any(Number),
        },
      })
    })

    it('reopens a completed task that created no farm record, back to DUE', async () => {
      const { accessToken } = await registerAccount(client, 'Reopen Tester')
      const auth = bearer(accessToken)
      const cultivation = await createCultivation(client, accessToken, { stockedOn: STOCKING_DAY })
      const water = await client
        .post(`/cultivations/${cultivation.id}/water-checks`)
        .set('Authorization', auth)
        .set('Idempotency-Key', idempotencyKey('concerning-water'))
        .send({
          checkedAt: '2026-09-23T07:30:00+08:00',
          observation: {
            clarity: 'Greener than yesterday',
            odor: 'Normal',
            fishBehavior: 'Gasping near the surface',
            unusualChanges: true,
          },
        })
      const [followUp] = expectEnvelope(water, 201).generatedTasks

      const completion = await client
        .post(`/tasks/${followUp.id}/complete`)
        .set('Authorization', auth)
        .set('Idempotency-Key', idempotencyKey('follow-up'))
        .send({ completedAt: new Date().toISOString(), notes: 'Rechecked after an hour.' })
      const completed = expectEnvelope(completion)
      expect(completed).toMatchObject({ task: { status: 'COMPLETED' }, linkedRecord: null })

      const reopened = expectEnvelope(
        await client
          .post(`/tasks/${followUp.id}/reopen`)
          .set('Authorization', auth)
          .send({ reason: 'Marked done by mistake.' }),
      )
      expect(reopened).toMatchObject({
        id: followUp.id,
        status: 'DUE',
        completedAt: null,
        completionRecordType: null,
        completionRecordId: null,
      })
      expect(reopened.audit.version).toBeGreaterThan(completed.task.audit.version)

      const again = await client
        .post(`/tasks/${followUp.id}/reopen`)
        .set('Authorization', auth)
        .send({ reason: 'Twice.' })
      expect(expectError(again, 409, 'INVALID_STATE_TRANSITION').details).toMatchObject({
        status: 'DUE',
      })
    })

    it('refuses to reopen a task whose completion created a farm record (D-21)', async () => {
      const { accessToken, feeding } = await demoTasks(client)
      const response = await client
        .post(`/tasks/${feeding.id}/reopen`)
        .set('Authorization', bearer(accessToken))
        .send({ reason: 'Recorded the wrong amount.' })

      expect(expectError(response, 409, 'CONFLICT').details).toEqual({
        status: 'COMPLETED',
        completionRecordType: 'FEEDING_RECORD',
      })
    })

    it('asks why a task is being reopened', async () => {
      const { accessToken, feeding } = await demoTasks(client)
      const response = await client
        .post(`/tasks/${feeding.id}/reopen`)
        .set('Authorization', bearer(accessToken))
        .send({ reason: '   ' })

      expect(expectError(response, 422, 'VALIDATION_ERROR').fields).toHaveProperty('reason')
    })
  })

  describe('operational records', () => {
    it('reads growth, mortality, feeding and water-check histories with the feeding plan', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const { id } = await findCultivation(client, accessToken, DEMO_CULTIVATION)
      const read = (path) => client.get(`/cultivations/${id}${path}`).set('Authorization', auth)

      const growth = expectPage(await read('/growth-measurements?sort=measuredOn&order=desc'))
      expect(growth.map((record) => record.measuredOn)).toEqual(
        [...growth.map((record) => record.measuredOn)].sort().reverse(),
      )
      expect(growth[0]).toMatchObject({ cultivationId: id, averageWeight: { unit: 'G' } })

      const mortality = expectPage(await read('/mortality-records'))
      expect(mortality[0]).toMatchObject({ cultivationId: id, fishCount: expect.any(Number) })

      const plan = expectEnvelope(await read(`/feeding-plan?date=${SEED_DAY}`))
      expect(plan).toMatchObject({
        cultivationId: id,
        date: SEED_DAY,
        dailyTotal: { value: expect.any(Number), unit: 'KG' },
        isDemo: true,
        sourceStatus: 'DEMO',
        disclaimer: expect.any(String),
      })

      const feedings = expectPage(await read('/feeding-records'))
      expect(feedings[0]).toMatchObject({ cultivationId: id, taskId: expect.any(String) })

      const waterChecks = expectPage(await read('/water-checks'))
      expect(waterChecks[0]).toMatchObject({ cultivationId: id, observation: expect.any(Object) })
    })

    it('records a feeding without a task and reports the day against the plan', async () => {
      const { accessToken } = await registerAccount(client, 'Feeding Recorder')
      const auth = bearer(accessToken)
      const cultivation = await createCultivation(client, accessToken, { stockedOn: STOCKING_DAY })
      const body = {
        fedAt: '2026-09-23T08:30:00+08:00',
        amount: { value: 800, unit: 'G' },
        notes: 'Fed by hand at the shallow end.',
      }
      const key = idempotencyKey('untasked-feeding')

      const created = expectEnvelope(
        await recordFeeding(client, accessToken, cultivation.id, body, key),
        201,
      )
      expect(created).toMatchObject({
        record: {
          cultivationId: cultivation.id,
          taskId: null,
          fedAt: '2026-09-23T00:30:00Z',
          amount: { value: 800, unit: 'G' },
          notes: 'Fed by hand at the shallow end.',
          recordedBy: { fullName: 'Feeding Recorder' },
        },
        completedTask: null,
        dailyProgress: {
          recorded: { value: 0.8, unit: 'KG' },
          planned: { value: expect.any(Number), unit: 'KG' },
        },
      })

      const replay = expectEnvelope(
        await recordFeeding(client, accessToken, cultivation.id, body, key),
        201,
      )
      expect(replay.record.id).toBe(created.record.id)

      const listed = expectPage(
        await client
          .get(`/cultivations/${cultivation.id}/feeding-records`)
          .set('Authorization', auth),
      )
      expect(listed.map((record) => record.id)).toEqual([created.record.id])
    })

    it('refuses a completed, non-feeding or foreign task named by a feeding', async () => {
      const { accessToken, cultivation, feeding, waterCheck } = await demoTasks(client)
      const body = (taskId) => ({
        fedAt: '2026-09-23T08:05:00Z',
        amount: { value: 1, unit: 'KG' },
        taskId,
      })

      const done = await recordFeeding(client, accessToken, cultivation.id, body(feeding.id))
      expect(expectError(done, 409, 'CONFLICT').details).toMatchObject({ status: 'COMPLETED' })

      const notFeeding = await recordFeeding(
        client,
        accessToken,
        cultivation.id,
        body(waterCheck.id),
      )
      expect(expectError(notFeeding, 422, 'VALIDATION_ERROR').fields).toHaveProperty('taskId')

      const other = await registerAccount(client, 'Foreign Task Tester')
      const own = await createCultivation(client, other.accessToken, { stockedOn: STOCKING_DAY })
      const foreign = await recordFeeding(client, other.accessToken, own.id, body(feeding.id))
      expect(expectError(foreign, 422, 'VALIDATION_ERROR').fields).toHaveProperty('taskId')
    })

    it('refuses a feeding before stocking, in the future, without a time zone or amount', async () => {
      const { accessToken } = await registerAccount(client, 'Feeding Validator')
      const planning = await createCultivation(client, accessToken)
      const stocked = await createCultivation(client, accessToken, { stockedOn: STOCKING_DAY })
      const feed = (cultivationId, overrides) =>
        recordFeeding(client, accessToken, cultivationId, {
          fedAt: '2026-09-23T08:00:00Z',
          amount: { value: 1, unit: 'KG' },
          ...overrides,
        })

      expect(
        expectError(await feed(planning.id, {}), 409, 'INVALID_STATE_TRANSITION').details,
      ).toMatchObject({
        status: 'PLANNING',
      })
      for (const fedAt of ['2026-08-01T08:00:00Z', '2099-01-01T08:00:00Z', '2026-09-23T08:00:00']) {
        const error = expectError(await feed(stocked.id, { fedAt }), 422, 'VALIDATION_ERROR')
        expect(error.fields, fedAt).toHaveProperty('fedAt')
      }
      const nothing = expectError(
        await feed(stocked.id, { amount: { value: 0, unit: 'KG' } }),
        422,
        'VALIDATION_ERROR',
      )
      expect(nothing.fields).toHaveProperty('amount')

      const listed = expectPage(
        await client
          .get(`/cultivations/${stocked.id}/feeding-records`)
          .set('Authorization', bearer(accessToken)),
      )
      expect(listed).toEqual([])
    })
  })
}
