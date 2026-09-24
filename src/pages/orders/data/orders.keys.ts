// Query keys for the account's orders, all under `['orders']`, the prefix placing an
// order invalidates.
export const ordersKeys = {
  all: () => ['orders'] as const,
  list: () => ['orders', 'list'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
  tracking: (orderId: string) => ['orders', 'tracking', orderId] as const,
}
