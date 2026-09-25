import { flushPromises, type VueWrapper } from '@vue/test-utils'

import MarketplaceView from '@pages/marketplace/presentation/views/MarketplaceView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { cart } from '../../unit/cart/fixtures'
import { aeration, aerator, envelope, page, testing } from '../../unit/marketplace/fixtures'
import { mountInApp, refusingRepository } from '../support/app'

const repositories = vi.hoisted(() => ({
  marketplace: {} as Record<string, ReturnType<typeof vi.fn>>,
  cart: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/marketplace/data/marketplace.repository', () => ({
  get marketplaceRepository() {
    return repositories.marketplace
  },
}))
vi.mock('@pages/cart/data/cart.repository', () => ({
  get cartRepository() {
    return repositories.cart
  },
}))

beforeEach(() => {
  repositories.marketplace = refusingRepository(['listProductCategories', 'listProducts'] as const)
  repositories.marketplace.listProductCategories!.mockResolvedValue(page([aeration, testing]))
  repositories.marketplace.listProducts!.mockResolvedValue(page([aerator]))
  repositories.cart = { getCart: vi.fn().mockResolvedValue(envelope(cart)) }
})

function button(wrapper: VueWrapper, text: string) {
  const found = wrapper.findAll('button').find((item) => item.text() === text)
  if (!found) throw new Error(`No button "${text}"`)
  return found
}

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(MarketplaceView, { name: ROUTE_NAMES.marketplace, query })
  await flushPromises()
  return mounted
}

function lastFilters() {
  return repositories.marketplace.listProducts!.mock.calls.at(-1)?.[0]
}

describe('MarketplaceView', () => {
  it('lists the products suited to the cultivation it was opened from', async () => {
    const { wrapper } = await open({ speciesId: 'sp_tilapia', environmentId: 'env_pond' })

    expect(lastFilters()).toEqual({
      suitableSpeciesId: 'sp_tilapia',
      suitableEnvironmentId: 'env_pond',
      sort: 'name',
      order: 'asc',
    })
    expect(wrapper.get('h1#results-heading').text()).toBe('1 products')
    expect(wrapper.text()).toContain('Compact Pond Aerator')
    expect(wrapper.get('a[aria-label="Cart with 1 items"]').text()).toContain('1')
  })

  it('keeps the chosen category and sort in the route query', async () => {
    const { wrapper, router } = await open({ speciesId: 'sp_tilapia' })

    await button(wrapper, 'Aeration').trigger('click')
    await flushPromises()
    await wrapper.get('select').setValue('price_desc')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({
      speciesId: 'sp_tilapia',
      categoryId: 'cat_aeration',
      sortBy: 'price_desc',
    })
    expect(lastFilters()).toMatchObject({
      categoryId: 'cat_aeration',
      sort: 'price',
      order: 'desc',
    })
    expect(button(wrapper, 'Aeration').attributes('aria-pressed')).toBe('true')
  })

  it('searches on submit and clears every filter from the empty state', async () => {
    const { wrapper, router } = await open({ categoryId: 'cat_testing' })
    repositories.marketplace.listProducts!.mockResolvedValue(page([]))

    await wrapper.get('input[type="search"]').setValue('  paddle wheel ')
    await wrapper.get('form[role="search"]').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({
      search: 'paddle wheel',
      categoryId: 'cat_testing',
    })
    expect(wrapper.text()).toContain('No products found')

    await button(wrapper, 'Clear filters').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({})
    expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('')
  })

  it('offers a retry when the products cannot be loaded', async () => {
    repositories.marketplace.listProducts!.mockRejectedValue(new TypeError('Failed to fetch'))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Try Again')
    repositories.marketplace.listProducts!.mockResolvedValue(page([aerator]))
    await button(wrapper, 'Try Again').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Compact Pond Aerator')
  })
})
