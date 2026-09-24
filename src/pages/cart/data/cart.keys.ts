// Query keys for the cart and checkout. Everything sits under `['cart']`, the prefix a cart
// change invalidates. The delivery addresses are read under the profile's key instead, so
// an address added on Profile shows at checkout straight away.
export const cartKeys = {
  all: () => ['cart'] as const,
  detail: () => ['cart', 'detail'] as const,
  paymentOptions: () => ['cart', 'payment-options'] as const,
}
