import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import WelcomeView from '@pages/public/presentation/views/WelcomeView.vue'
import { publicRoutes } from '@router/routes/public.routes'

function testRouter() {
  return createRouter({ history: createMemoryHistory(), routes: publicRoutes })
}

describe('WelcomeView', () => {
  it('opens create account and sign in through their named routes', () => {
    const wrapper = mount(WelcomeView, { global: { plugins: [testRouter()] } })

    const getStarted = wrapper.findAll('a').find((link) => link.text() === 'Get Started')
    const signIn = wrapper.findAll('a').find((link) => link.text() === 'I already have an account')

    expect(wrapper.get('h1').text()).toBe('Start your fish farming journey with confidence.')
    expect(getStarted?.attributes('href')).toBe('/create-account')
    expect(signIn?.attributes('href')).toBe('/sign-in')
  })

  it('keeps the illustration out of the accessibility tree', () => {
    const wrapper = mount(WelcomeView, { global: { plugins: [testRouter()] } })

    expect(wrapper.get('.welcome-illustration').attributes('aria-hidden')).toBe('true')
  })
})
