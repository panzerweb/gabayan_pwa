// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { bearer, idempotencyKey, signInAsDemo } from './support/accounts.mjs'
import { createContractClient } from './support/client.mjs'
import { DEMO_CULTIVATION, SEED_DAY, findCultivation, listSeedDayTasks } from './support/demo.mjs'
import { expectEnvelope, expectError } from './support/envelope.mjs'

// Behaviour of the mock that needs the untouched seed - the demo farmer's afternoon feeding
// still DUE - so it runs on a fresh in-process mock whatever server the main suite targets.
describe('mock API parity with the FastAPI feeding-record rules', () => {
  const client = createContractClient({ baseUrl: null })

  it('completes the feeding task a feeding record names, once', async () => {
    const { accessToken } = await signInAsDemo(client)
    const auth = bearer(accessToken)
    const cultivation = await findCultivation(client, accessToken, DEMO_CULTIVATION)
    const tasks = await listSeedDayTasks(client, accessToken, cultivation.id)
    const feeding = tasks.find((task) => task.type === 'FEEDING' && task.status === 'DUE')

    const created = expectEnvelope(
      await client
        .post(`/cultivations/${cultivation.id}/feeding-records`)
        .set('Authorization', auth)
        .set('Idempotency-Key', idempotencyKey('tasked-feeding'))
        .send({
          fedAt: '2026-09-23T16:05:00+08:00',
          amount: { value: 1.1, unit: 'KG' },
          taskId: feeding.id,
          notes: 'Fish came up quickly.',
        }),
      201,
    )
    expect(created).toMatchObject({
      record: { taskId: feeding.id, fedAt: '2026-09-23T08:05:00Z' },
      completedTask: {
        id: feeding.id,
        status: 'COMPLETED',
        completedAt: '2026-09-23T08:05:00Z',
        completionRecordType: 'FEEDING_RECORD',
        completionRecordId: created.record.id,
      },
      dailyProgress: { recorded: { value: 2.3, unit: 'KG' } },
    })

    const home = expectEnvelope(
      await client.get(`/dashboard/home?date=${SEED_DAY}`).set('Authorization', auth),
    )
    expect(home).toMatchObject({
      taskSummary: { completed: 2, total: 3 },
      unreadNotificationCount: 2,
    })

    const repeated = await client
      .post(`/cultivations/${cultivation.id}/feeding-records`)
      .set('Authorization', auth)
      .set('Idempotency-Key', idempotencyKey('tasked-feeding-again'))
      .send({ fedAt: '2026-09-23T08:10:00Z', amount: { value: 1, unit: 'KG' }, taskId: feeding.id })
    expectError(repeated, 409, 'CONFLICT')

    const reopen = await client
      .post(`/tasks/${feeding.id}/reopen`)
      .set('Authorization', auth)
      .send({ reason: 'Recorded against the wrong round.' })
    expectError(reopen, 409, 'CONFLICT')
  })
})
