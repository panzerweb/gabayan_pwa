import { QueryClient } from '@tanstack/vue-query'

import { INVALIDATIONS, invalidateAfter, type InvalidatingMutation } from '@core/query'

// Contract §14, one row per mutation, as the feature key prefixes each row names.
const contractRows: Array<[InvalidatingMutation, string[][]]> = [
  [
    'cultivationCreate',
    [['home'], ['cultivations', 'list'], ['cultivations', 'detail'], ['tiers']],
  ],
  [
    'taskComplete',
    [
      ['home'],
      ['cultivations', 'tasks'],
      ['cultivations', 'detail'],
      ['cultivations', 'timeline'],
      ['notifications'],
      ['cultivations', 'feed-conversion'],
    ],
  ],
  [
    'growthCreate',
    [
      ['cultivations', 'detail'],
      ['cultivations', 'growth'],
      ['cultivations', 'feeding-plan'],
      ['cultivations', 'harvest-readiness'],
      ['home'],
      ['cultivations', 'feed-conversion'],
    ],
  ],
  [
    'mortalityCreate',
    [
      ['cultivations', 'detail'],
      ['cultivations', 'mortality'],
      ['cultivations', 'feeding-plan'],
      ['cultivations', 'harvest-readiness'],
      ['home'],
      ['cultivations', 'feed-conversion'],
    ],
  ],
  [
    'feedingCreate',
    [
      ['cultivations', 'tasks'],
      ['cultivations', 'feeding-records'],
      ['home'],
      ['cultivations', 'feed-conversion'],
    ],
  ],
  ['waterCheckCreate', [['cultivations', 'tasks'], ['cultivations', 'water-checks'], ['home']]],
  ['waterLogCreate', [['water-quality', 'logs']]],
  ['cartChange', [['cart']]],
  ['orderCreate', [['orders'], ['cart'], ['home'], ['notifications']]],
  [
    'harvestCreate',
    [
      ['cultivations', 'detail'],
      ['cultivations', 'list'],
      ['home'],
      ['cultivations', 'harvest-readiness'],
      ['tiers'],
    ],
  ],
  ['upgradeRequest', [['tiers']]],
]

describe('invalidation map', () => {
  it.each(contractRows)('invalidates what %s leaves stale', (mutation, prefixes) => {
    expect(INVALIDATIONS[mutation]).toEqual(prefixes)
  })

  it('holds a row for every mutation of contract §14 and no other', () => {
    expect(Object.keys(INVALIDATIONS).sort()).toEqual(contractRows.map(([name]) => name).sort())
  })

  it('refreshes every query under the mutated prefixes and leaves the others cached', async () => {
    const client = new QueryClient()
    client.setQueryData(['home', '2026-09-23'], 'home')
    client.setQueryData(['cultivations', 'detail', 'cul_001'], 'detail')
    client.setQueryData(['cultivations', 'growth', 'cul_001'], 'growth')
    client.setQueryData(['orders', 'list'], 'orders')

    await invalidateAfter(client, 'growthCreate')

    const invalidated = (key: string[]) => client.getQueryState(key)?.isInvalidated
    expect(invalidated(['home', '2026-09-23'])).toBe(true)
    expect(invalidated(['cultivations', 'detail', 'cul_001'])).toBe(true)
    expect(invalidated(['cultivations', 'growth', 'cul_001'])).toBe(true)
    expect(invalidated(['orders', 'list'])).toBe(false)
  })
})
