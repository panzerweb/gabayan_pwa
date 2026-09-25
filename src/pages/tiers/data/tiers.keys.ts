// Query keys for the plans and the account's own tier. `account` sits under the `tiers`
// prefix the invalidation map refreshes after a cultivation is created or harvested.
export const tiersKeys = {
  all: () => ['tiers'] as const,
  plans: () => ['tiers', 'plans'] as const,
  account: () => ['tiers', 'account'] as const,
}
