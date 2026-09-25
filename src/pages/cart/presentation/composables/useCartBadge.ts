import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { cartKeys } from '../../data/cart.keys'
import { cartRepository } from '../../data/cart.repository'
import { cartBadge } from '../../domain/cart.model'
import type { CartRepository } from '../../domain/cart.repository.interface'

// The item count shown on the cart icon, read from the same query as the cart screen.
export function useCartBadge(repository: CartRepository = cartRepository) {
  const session = useSessionStore()
  const query = useQuery({
    queryKey: cartKeys.detail(),
    queryFn: () => repository.getCart(session.accessToken ?? ''),
  })

  const badge = computed(() => cartBadge(query.data.value?.data.itemCount ?? 0))

  return {
    label: computed(() => badge.value.label),
    count: computed(() => badge.value.badge),
  }
}
