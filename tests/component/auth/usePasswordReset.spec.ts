import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '@core/http'
import type { AuthRepository } from '@pages/auth/domain/auth.repository.interface'
import { usePasswordReset } from '@pages/auth/presentation/composables/usePasswordReset'
import { ROUTE_NAMES } from '@router/route-names'

const meta = { requestId: 'req_1' }

function expiredToken() {
  return new ApiError(422, {
    code: 'VALIDATION_ERROR',
    message: 'This reset link is invalid or expired.',
    fields: { token: ['Request a new password reset link.'] },
    details: null,
    requestId: 'req_2',
  })
}

async function mountReset(repository: Partial<AuthRepository>, token?: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/reset-password', name: ROUTE_NAMES.resetPassword, component: {} }],
  })
  await router.push({ name: ROUTE_NAMES.resetPassword, query: token ? { token } : {} })
  await router.isReady()

  let reset!: ReturnType<typeof usePasswordReset>
  const Host = defineComponent({
    setup() {
      reset = usePasswordReset(repository as AuthRepository)
      return () => null
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  mount(Host, { global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } })
  return reset
}

describe('usePasswordReset', () => {
  it('shows the server’s answer once reset instructions are requested', async () => {
    const forgotPassword = vi.fn().mockResolvedValue({
      data: { message: 'If an account matches, password reset instructions are ready.' },
      meta,
    })
    const reset = await mountReset({ forgotPassword })
    reset.identifier.value = '  juan@example.com '

    await reset.requestInstructions()
    await flushPromises()

    expect(forgotPassword).toHaveBeenCalledWith('juan@example.com')
    expect(reset.message.value).toBe(
      'If an account matches, password reset instructions are ready.',
    )
  })

  it('says a refused token in the form message, since the token has no input', async () => {
    const resetPassword = vi.fn().mockRejectedValue(expiredToken())
    const reset = await mountReset({ resetPassword }, 'old-token')
    reset.password.value = 'NewPass123'
    reset.confirmPassword.value = 'NewPass123'

    await reset.updatePassword()
    await flushPromises()

    expect(resetPassword).toHaveBeenCalledWith({
      token: 'old-token',
      password: 'NewPass123',
      confirmPassword: 'NewPass123',
    })
    expect(reset.formError.value).toBe(
      'This reset link is invalid or has expired. Request a new one.',
    )
    expect(reset.fieldErrors.value).toEqual({})
  })

  it('refuses to send a new password without a token', async () => {
    const resetPassword = vi.fn()
    const reset = await mountReset({ resetPassword })
    reset.password.value = 'NewPass123'
    reset.confirmPassword.value = 'NewPass123'

    await reset.updatePassword()

    expect(resetPassword).not.toHaveBeenCalled()
    expect(reset.formError.value).toBe('This reset link is missing a token. Request a new one.')
  })
})
