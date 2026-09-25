import { mount } from '@vue/test-utils'

import type { ProductSummary } from '@pages/marketplace/domain/marketplace.model'
import ProductCard from '@pages/marketplace/presentation/components/ProductCard.vue'

const product: ProductSummary = {
  id: 'prd_test',
  sku: 'GBY-TEST',
  name: 'Freshwater Test Kit',
  shortDescription: 'A test product.',
  primaryImage: { url: '/icon.svg', alt: 'Test kit' },
  price: { amountMinor: 64900, currency: 'PHP' },
  rating: 4.5,
  ratingCount: 67,
  soldCount: 143,
  availability: 'LOW_STOCK',
  stockQuantity: 6,
  category: { id: 'cat_testing', code: 'TESTING', name: 'Testing', icon: 'testing', sortOrder: 4 },
  badges: ['Low stock'],
  isFavorite: false,
}

describe('ProductCard', () => {
  it('shows price, rating, category, and a non-color-only stock status', () => {
    const wrapper = mount(ProductCard, {
      props: { product },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    expect(wrapper.text()).toContain('Freshwater Test Kit')
    expect(wrapper.text()).toContain('₱649.00')
    expect(wrapper.text()).toContain('4.5')
    expect(wrapper.text()).toContain('Testing')
    expect(wrapper.text()).toContain('Low stock')
  })
})
