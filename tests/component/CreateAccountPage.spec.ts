import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import CreateAccountPage from '@/pages/auth/CreateAccountPage.vue'

describe('CreateAccountPage', () => {
  it('shows field-level validation before sending an invalid form', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/create-account', component: CreateAccountPage },
        { path: '/sign-in', component: { template: '<div />' } },
      ],
    })
    await router.push('/create-account')
    await router.isReady()

    const wrapper = mount(CreateAccountPage, {
      global: { plugins: [createPinia(), router] },
    })
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Enter at least 2 characters.')
    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(wrapper.text()).toContain('Accept the terms to continue.')
  })
})
