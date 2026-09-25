import { describe, expect, it } from 'vitest'

import { bearer, registerAccount } from '../support/accounts.mjs'
import { expectEnvelope, expectPage } from '../support/envelope.mjs'

export function registerProfileContract(client) {
  describe('current user, farm, addresses and preferences', () => {
    it('reads back the profile, farm, addresses and reminder settings of a new account', async () => {
      const session = await registerAccount(client, 'Profile Reader')
      const auth = bearer(session.accessToken)

      const me = expectEnvelope(await client.get('/users/me').set('Authorization', auth))
      expect(me).toMatchObject({
        id: session.user.id,
        email: session.user.email,
        timezone: 'Asia/Manila',
        version: expect.any(Number),
      })
      expect(Object.keys(me).some((key) => /password/i.test(key))).toBe(false)

      const saved = expectEnvelope(
        await client.put('/users/me/farm').set('Authorization', auth).send({
          name: 'Santos Backyard Ponds',
          region: 'Central Luzon',
          province: 'Pampanga',
          municipality: 'Guagua',
          experienceLevel: 'BEGINNER',
          notes: null,
        }),
      )
      const farm = expectEnvelope(await client.get('/users/me/farm').set('Authorization', auth))
      expect(farm).toMatchObject({
        id: saved.id,
        name: 'Santos Backyard Ponds',
        experienceLevel: 'BEGINNER',
        version: saved.version,
      })

      const empty = expectPage(await client.get('/users/me/addresses').set('Authorization', auth))
      expect(empty).toEqual([])

      const settings = expectEnvelope(
        await client.get('/users/me/notification-settings').set('Authorization', auth),
      )
      expect(settings).toMatchObject({
        feedingReminders: expect.any(Boolean),
        morningFeedingTime: expect.stringMatching(/^\d{2}:\d{2}$/),
        afternoonFeedingTime: expect.stringMatching(/^\d{2}:\d{2}$/),
        timezone: 'Asia/Manila',
        version: expect.any(Number),
      })
    })
  })
}
