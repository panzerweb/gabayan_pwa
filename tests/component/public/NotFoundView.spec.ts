import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import NotFoundView from '@pages/public/presentation/views/NotFoundView.vue'
import { publicRoutes } from '@router/routes/public.routes'

describe('NotFoundView', () => {
  it('leads back to the welcome route', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: publicRoutes })
    const wrapper = mount(NotFoundView, { global: { plugins: [router] } })

    expect(wrapper.get('h1').text()).toBe('This page swam away')
    expect(wrapper.get('a').attributes('href')).toBe('/welcome')
  })
})
