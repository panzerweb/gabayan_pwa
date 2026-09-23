import { z } from 'zod'

import { ApiError, apiRequest } from '@/services/api/http'
import { envelopeSchema } from '@/services/api/schemas'

const exampleEnvelope = envelopeSchema(z.object({ name: z.string() }))

describe('apiRequest', () => {
  it('validates a successful envelope at the boundary', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ data: { name: 'Tilapia' }, meta: { requestId: 'req_test' } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
    )

    const result = await apiRequest('/species/sp_tilapia', {
      method: 'GET',
      schema: exampleEnvelope,
    })

    expect(result.data.name).toBe('Tilapia')
  })

  it('throws the stable API error shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'NOT_FOUND',
              message: 'We could not find that fish profile.',
              fields: null,
              details: null,
              requestId: 'req_test',
            },
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const request = apiRequest('/species/missing', {
      method: 'GET',
      schema: exampleEnvelope,
    })

    await expect(request).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      requestId: 'req_test',
    } satisfies Partial<ApiError>)
  })
})
