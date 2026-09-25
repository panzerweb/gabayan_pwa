import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import type { Envelope } from '@core/http'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { marketplaceKeys } from '../../data/marketplace.keys'
import { marketplaceRepository } from '../../data/marketplace.repository'
import type { ProductDetail } from '../../domain/marketplace.model'
import type { MarketplaceRepository } from '../../domain/marketplace.repository.interface'

// Favouriting a product. Contract §14 allows this to be optimistic: the heart changes at
// once, goes back if the server refuses, and the product lists refresh either way.
export function useFavoriteToggle(
  productId: Ref<string>,
  repository: MarketplaceRepository = marketplaceRepository,
) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()

  const detailKey = () => marketplaceKeys.product(productId.value)

  function setFavorite(favorite: boolean) {
    queryClient.setQueryData<Envelope<ProductDetail>>(detailKey(), (current) =>
      current ? { ...current, data: { ...current.data, isFavorite: favorite } } : current,
    )
  }

  const mutation = useMutation({
    mutationFn: (favorite: boolean) => {
      const accessToken = session.accessToken ?? ''
      return favorite
        ? repository.favoriteProduct(productId.value, accessToken)
        : repository.unfavoriteProduct(productId.value, accessToken)
    },
    onMutate: async (favorite) => {
      await queryClient.cancelQueries({ queryKey: detailKey() })
      setFavorite(favorite)
    },
    onError: (_error, favorite) => {
      setFavorite(!favorite)
      toast.show('Could not update this favorite.', 'danger')
    },
    onSuccess: (result) => setFavorite(result.data.isFavorite),
    onSettled: () => queryClient.invalidateQueries({ queryKey: marketplaceKeys.products() }),
  })

  function toggle(isFavorite: boolean) {
    mutation.mutate(!isFavorite)
  }

  return { toggle, pending: computed(() => mutation.isPending.value) }
}
