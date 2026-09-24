import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { ordersKeys } from '../../data/orders.keys'
import { ordersRepository } from '../../data/orders.repository'
import type { OrdersRepository } from '../../domain/orders.repository.interface'

// One order as it was placed: its lines, payment summary and delivery address.
export function useOrderDetail(
  orderId: Ref<string>,
  repository: OrdersRepository = ordersRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => ordersKeys.detail(orderId.value)),
    queryFn: () => repository.getOrder(orderId.value, session.accessToken ?? ''),
  })

  return {
    order: computed(() => query.data.value?.data ?? null),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
