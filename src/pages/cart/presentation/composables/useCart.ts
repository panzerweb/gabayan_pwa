import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { describeError } from '@core/errors'
import { invalidateAfter } from '@core/query'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { cartKeys } from '../../data/cart.keys'
import { cartRepository } from '../../data/cart.repository'
import { CART_CHANGE_OFFLINE_MESSAGE, type CartItem } from '../../domain/cart.model'
import type { CartRepository } from '../../domain/cart.repository.interface'

// A quantity of null removes the line.
type CartChange = { item: CartItem; quantity: number | null }

// The cart screen: its lines and totals as the server priced them, and changing a line's
// quantity or removing it. Changes are pessimistic; the totals come back from the server.
export function useCart(repository: CartRepository = cartRepository) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const pendingItemId = ref<string | null>(null)
  const actionError = ref('')

  const query = useQuery({
    queryKey: cartKeys.detail(),
    queryFn: () => repository.getCart(session.accessToken ?? ''),
  })

  const change = useMutation({
    mutationFn: ({ item, quantity }: CartChange) => {
      const accessToken = session.accessToken ?? ''
      return quantity === null
        ? repository.removeCartItem(item.id, accessToken)
        : repository.updateCartItem(item.id, { quantity }, accessToken)
    },
  })

  const cart = computed(() => query.data.value?.data ?? null)
  const loading = computed(() => query.isPending.value)
  const loadFailed = computed(() => query.isError.value)

  async function run(action: CartChange, failure: string, success?: string) {
    actionError.value = ''
    if (!isOnline.value) {
      actionError.value = CART_CHANGE_OFFLINE_MESSAGE
      return
    }
    pendingItemId.value = action.item.id
    try {
      const result = await change.mutateAsync(action)
      queryClient.setQueryData(cartKeys.detail(), result)
      await invalidateAfter(queryClient, 'cartChange')
      if (success) toast.show(success, 'info')
    } catch (error) {
      actionError.value = describeError(error, failure)
    } finally {
      pendingItemId.value = null
    }
  }

  function changeQuantity(item: CartItem, quantity: number) {
    if (quantity < 1) return Promise.resolve()
    return run({ item, quantity }, 'We could not update this item. Please try again.')
  }

  function remove(item: CartItem) {
    return run(
      { item, quantity: null },
      'We could not remove this item. Please try again.',
      'Item removed from cart.',
    )
  }

  return {
    cart,
    loading,
    loadFailed,
    refetch: query.refetch,
    isOnline,
    pendingItemId,
    actionError,
    changeQuantity,
    remove,
  }
}
