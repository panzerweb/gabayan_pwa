// Mutation keys for the sign-in screens. Authentication holds no cached server state of
// its own: the signed-in session lives in the session store.
export const authKeys = {
  all: () => ['auth'] as const,
  register: () => ['auth', 'register'] as const,
  login: () => ['auth', 'login'] as const,
  google: () => ['auth', 'google'] as const,
  forgotPassword: () => ['auth', 'forgot-password'] as const,
  resetPassword: () => ['auth', 'reset-password'] as const,
}
