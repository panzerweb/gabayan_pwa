// Query keys for the account's own profile resources. The signed-in user lives in the
// session store, so it has no key here.
export const profileKeys = {
  all: () => ['profile'] as const,
  farm: () => ['profile', 'farm'] as const,
  addresses: () => ['profile', 'addresses'] as const,
  notificationSettings: () => ['profile', 'notification-settings'] as const,
}
