import { describe, expect, it } from 'vitest'

import { bearer, signInAsDemo } from '../support/accounts.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

export function registerNotificationContract(client) {
  describe('notifications', () => {
    it('keeps the first read time when a notification is read again', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const [read] = expectPage(
        await client.get('/notifications?read=true').set('Authorization', auth),
      )

      const again = expectEnvelope(
        await client.post(`/notifications/${read.id}/read`).set('Authorization', auth),
      )
      expect(again).toMatchObject({ id: read.id, readAt: read.readAt })
    })

    it('answers an unknown notification as not found', async () => {
      const { accessToken } = await signInAsDemo(client)
      const response = await client
        .post('/notifications/ntf_unknown/read')
        .set('Authorization', bearer(accessToken))

      expectError(response, 404, 'NOT_FOUND')
    })
  })
}
