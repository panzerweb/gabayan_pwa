import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

import { ordersKeys } from '../../data/orders.keys'
import { ordersRepository } from '../../data/orders.repository'
import { filterOrders, orderFilterFrom, type OrderFilter } from '../../domain/orders.model'
import type { OrdersRepository } from '../../domain/orders.repository.interface'

// The order history with its All / Active / Delivered tab, which lives in the route query.
export function useOrders(repository: OrdersRepository = ordersRepository) {
  const route = useRoute()
  const router = useRouter()
  const session = useSessionStore()

  const query = useQuery({
    queryKey: ordersKeys.list(),
    queryFn: () => repository.listOrders(session.accessToken ?? ''),
  })

  const filter = computed(() => orderFilterFrom(route.query.show))
  const orders = computed(() => filterOrders(query.data.value?.data ?? [], filter.value))

  function selectFilter(next: OrderFilter) {
    return router.replace({
      name: ROUTE_NAMES.orders,
      query: next === 'all' ? {} : { show: next },
    })
  }

  return {
    orders,
    filter,
    selectFilter,
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
