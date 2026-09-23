import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import BottomNavigation from '@/components/navigation/BottomNavigation.vue'

describe('BottomNavigation', () => {
  it('contains exactly the four approved primary destinations', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/app/home', component: { template: '<div />' } },
        { path: '/app/cultivations', component: { template: '<div />' } },
        { path: '/app/orders', component: { template: '<div />' } },
        { path: '/app/profile', component: { template: '<div />' } },
      ],
    })
    await router.push('/app/home')
    await router.isReady()

    const wrapper = mount(BottomNavigation, { global: { plugins: [router] } })
    const links = wrapper.findAll('a')

    expect(links).toHaveLength(4)
    expect(links.map((link) => link.text())).toEqual(['Home', 'Cultivations', 'Orders', 'Profile'])
    expect(links[0]?.classes()).toContain('router-link-active')
  })
})
