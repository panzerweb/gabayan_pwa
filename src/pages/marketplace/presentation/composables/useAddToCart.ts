import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, type Ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { describeError } from '@core/errors'
import { invalidateAfter } from '@core/query'
import { cartKeys } from '@pages/cart/data/cart.keys'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { marketplaceRepository } from '../../data/marketplace.repository'
import { CART_OFFLINE_MESSAGE, type AddCartItemRequest } from '../../domain/marketplace.model'
import type { MarketplaceRepository } from '../../domain/marketplace.repository.interface'

// The quantity picker and "Add to cart" on a product. The server answers the new cart,
// which becomes the cart query's data before every cart query is invalidated.
export function useAddToCart(
  productId: Ref<string>,
  repository: MarketplaceRepository = marketplaceRepository,
) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const quantity = ref(1)

  const mutation = useMutation({
    mutationFn: (body: AddCartItemRequest) =>
      repository.addCartItem(body, session.accessToken ?? ''),
  })

  async function add() {
    if (!isOnline.value) {
      toast.show(CART_OFFLINE_MESSAGE, 'danger')
      return
    }
    try {
      const cart = await mutation.mutateAsync({
        productId: productId.value,
        quantity: quantity.value,
      })
      queryClient.setQueryData(cartKeys.detail(), cart)
      await invalidateAfter(queryClient, 'cartChange')
    } catch (error) {
      toast.show(describeError(error, 'Could not add this item.'), 'danger')
      return
    }
    toast.show('Added to cart.', 'success')
  }

  return {
    quantity,
    isOnline,
    adding: computed(() => mutation.isPending.value),
    add,
  }
}
