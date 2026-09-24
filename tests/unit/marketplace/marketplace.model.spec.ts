import {
  availabilityStatus,
  clampQuantity,
  marketplaceQueryFrom,
  productDetailSchema,
  productFiltersFrom,
} from '@pages/marketplace/domain/marketplace.model'

import { aeratorDetail } from './fixtures'

describe('marketplace model', () => {
  it('reads the filters a cultivation screen links with out of the route query', () => {
    const state = marketplaceQueryFrom({
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      sortBy: 'price_desc',
      search: ['  aerator ', 'ignored'],
    })

    expect(state).toEqual({
      search: 'aerator',
      categoryId: '',
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      sortBy: 'price_desc',
    })
    expect(productFiltersFrom(state)).toEqual({
      search: 'aerator',
      suitableSpeciesId: 'sp_tilapia',
      suitableEnvironmentId: 'env_pond',
      sort: 'price',
      order: 'desc',
    })
  })

  it('falls back to sorting by name for a sort the contract does not know', () => {
    const state = marketplaceQueryFrom({ sortBy: 'popularity_desc' })

    expect(state.sortBy).toBe('name_asc')
    expect(productFiltersFrom(state)).toEqual({ sort: 'name', order: 'asc' })
  })

  it('describes stock in words only when a product is not plainly available', () => {
    expect(availabilityStatus('AVAILABLE')).toBeNull()
    expect(availabilityStatus('LOW_STOCK')).toEqual({ label: 'Low stock', tone: 'warning' })
    expect(availabilityStatus('OUT_OF_STOCK')).toEqual({ label: 'Out of stock', tone: 'danger' })
  })

  it('keeps a quantity between one and the most one order may hold', () => {
    expect(clampQuantity(0, 4)).toBe(1)
    expect(clampQuantity(3, 4)).toBe(3)
    expect(clampQuantity(9, 4)).toBe(4)
    expect(clampQuantity(Number.NaN, 4)).toBe(1)
  })

  it('parses a product detail and refuses a price in anything but centavos', () => {
    expect(productDetailSchema.parse(aeratorDetail)).toEqual(aeratorDetail)
    expect(
      productDetailSchema.safeParse({
        ...aeratorDetail,
        price: { amountMinor: 1299.5, currency: 'PHP' },
      }).success,
    ).toBe(false)
  })
})
