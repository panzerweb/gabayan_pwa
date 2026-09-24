import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import CreateAccountView from '@pages/auth/presentation/views/CreateAccountView.vue'
import { ROUTE_NAMES } from '@router/route-names'

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/create-account', name: ROUTE_NAMES.createAccount, component: CreateAccountView },
      { path: '/sign-in', name: ROUTE_NAMES.signIn, component: { template: '<div />' } },
      { path: '/setup', name: ROUTE_NAMES.setupIntro, component: { template: '<div />' } },
    ],
  })
  await router.push('/create-account')
  await router.isReady()

  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = mount(CreateAccountView, {
    global: { plugins: [createPinia(), router, [VueQueryPlugin, { queryClient }]] },
  })
  return { wrapper, router }
}

async function fillValidForm(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  await wrapper.get('input[name="fullName"]').setValue('Maria Santos')
  await wrapper.get('input[name="email"]').setValue('juan@example.com')
  await wrapper.get('input[name="mobileNumber"]').setValue('09171234568')
  await wrapper.get('input[name="password"]').setValue('SafeDemo123!')
  await wrapper.get('input[name="confirmPassword"]').setValue('SafeDemo123!')
  await wrapper.get('input[type="checkbox"]').setValue(true)
}

describe('CreateAccountView', () => {
  it('shows field-level validation before sending an invalid form', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = await mountView()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Enter at least 2 characters.')
    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(wrapper.text()).toContain('Accept the terms to continue.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('puts a duplicate-email refusal beside the email input', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'DUPLICATE_EMAIL',
              message: 'An account already uses this email.',
              fields: { email: ['Try signing in or use another email.'] },
              details: null,
              requestId: 'req_1',
            },
          },
          409,
        ),
      ),
    )
    const { wrapper, router } = await mountView()
    await fillValidForm(wrapper)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('An account already uses this email.')
    const email = wrapper.get('input[name="email"]')
    expect(email.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get(`#${email.attributes('aria-describedby')}`).text()).toBe(
      'Try signing in or use another email.',
    )
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.createAccount)
  })
})
