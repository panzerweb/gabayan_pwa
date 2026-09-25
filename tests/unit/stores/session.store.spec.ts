import { createPinia, setActivePinia } from 'pinia'

import { ApiError } from '@core/http'
import { queryClient } from '@core/query'
import { authRepository } from '@pages/auth/data/auth.repository'
import type { AuthSession, UserProfile } from '@pages/auth/domain/auth.model'
import { cultivationsRepository } from '@pages/cultivations/data/cultivations.repository'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

vi.mock('@pages/auth/data/auth.repository', () => ({
  authRepository: {
    refreshAccessToken: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}))
vi.mock('@pages/cultivations/data/cultivations.repository', () => ({
  cultivationsRepository: { listCultivations: vi.fn() },
}))

const meta = { requestId: 'req_1' }
const juan = { id: 'usr_juan', fullName: 'Juan Dela Cruz' } as UserProfile

function unauthorized() {
  return new ApiError(401, {
    code: 'AUTH_REQUIRED',
    message: 'Your session has ended.',
    fields: null,
    details: null,
    requestId: 'req_2',
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('session store', () => {
  it('restores a session through the auth repository', async () => {
    vi.mocked(authRepository.refreshAccessToken).mockResolvedValue({
      data: { accessToken: 'access_1', tokenType: 'Bearer', expiresInSeconds: 900 },
      meta,
    })
    vi.mocked(authRepository.getCurrentUser).mockResolvedValue({ data: juan, meta })
    vi.mocked(cultivationsRepository.listCultivations).mockResolvedValue({
      data: [],
      meta,
      page: { cursor: null, nextCursor: null, limit: 1, total: 2 },
    } as never)
    const session = useSessionStore()

    await session.restore()

    expect(authRepository.getCurrentUser).toHaveBeenCalledWith('access_1')
    expect(session.isAuthenticated).toBe(true)
    expect(session.user).toEqual(juan)
    expect(session.suggestedRouteName).toBe(ROUTE_NAMES.home)
  })

  it('counts cultivations through the cultivations repository with a one-row page', async () => {
    vi.mocked(authRepository.refreshAccessToken).mockResolvedValue({
      data: { accessToken: 'access_1', tokenType: 'Bearer', expiresInSeconds: 900 },
      meta,
    })
    vi.mocked(authRepository.getCurrentUser).mockResolvedValue({ data: juan, meta })
    vi.mocked(cultivationsRepository.listCultivations).mockResolvedValue({
      data: [],
      meta,
      page: { cursor: null, nextCursor: null, limit: 1, total: 0 },
    } as never)
    const session = useSessionStore()

    await session.restore()

    expect(cultivationsRepository.listCultivations).toHaveBeenCalledWith('access_1', 1)
    expect(session.hasCultivation).toBe(false)
    expect(session.suggestedRouteName).toBe(ROUTE_NAMES.setupIntro)
  })

  it('treats a refused refresh as signed out', async () => {
    vi.mocked(authRepository.refreshAccessToken).mockRejectedValue(unauthorized())
    const session = useSessionStore()

    await session.restore()

    expect(session.isAuthenticated).toBe(false)
    expect(session.initialized).toBe(true)
    expect(authRepository.getCurrentUser).not.toHaveBeenCalled()
  })

  it('lets any other restore failure reach the caller', async () => {
    vi.mocked(authRepository.refreshAccessToken).mockRejectedValue(new TypeError('offline'))

    await expect(useSessionStore().restore()).rejects.toThrow('offline')
  })

  it('suggests setup until the farmer has a cultivation', () => {
    const session = useSessionStore()
    session.acceptSession({
      accessToken: 'access_1',
      user: juan,
      onboarding: { hasCultivation: false, suggestedRoute: '/setup' },
    } as AuthSession)

    expect(session.suggestedRouteName).toBe(ROUTE_NAMES.setupIntro)
    session.markCultivationCreated()
    expect(session.suggestedRouteName).toBe(ROUTE_NAMES.home)
  })

  it('signs out through the repository and clears local state even when that fails', async () => {
    vi.mocked(authRepository.logout).mockRejectedValue(new TypeError('offline'))
    const clearCache = vi.spyOn(queryClient, 'clear')
    const session = useSessionStore()
    session.$patch({ accessToken: 'access_1', user: juan, hasCultivation: true })

    await session.signOut()

    expect(authRepository.logout).toHaveBeenCalledWith('access_1')
    expect(clearCache).toHaveBeenCalled()
    expect(session.isAuthenticated).toBe(false)
    expect(session.hasCultivation).toBe(false)
  })
})
