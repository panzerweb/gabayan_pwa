import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { ordersKeys } from '../../data/orders.keys'
import { ordersRepository } from '../../data/orders.repository'
import type { OrdersRepository } from '../../domain/orders.repository.interface'

// The delivery progress of one order, as the server reports it; nothing is inferred here.
export function useOrderTracking(
  orderId: Ref<string>,
  repository: OrdersRepository = ordersRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => ordersKeys.tracking(orderId.value)),
    queryFn: () => repository.getOrderTracking(orderId.value, session.accessToken ?? ''),
  })

  return {
    tracking: computed(() => query.data.value?.data ?? null),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
