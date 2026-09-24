<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import CartLink from '@/components/commerce/CartLink.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import {
  addCartItem,
  ApiError,
  commerceQueryKeys,
  getProduct,
  setProductFavorite,
} from '@/services/api'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'
import { formatPhp } from '@core/utils/format'

const route = useRoute()
const session = useSessionStore()
const toast = useToastStore()
const queryClient = useQueryClient()
const { isOnline } = useOnlineStatus()
const productId = computed(() => String(route.params.productId))
const quantity = ref(1)
const query = useQuery({
  queryKey: computed(() => commerceQueryKeys.product(productId.value)),
  queryFn: () => getProduct(productId.value, session.accessToken!),
})
const product = computed(() => query.data.value?.data)
const addMutation = useMutation({
  mutationFn: () => addCartItem(productId.value, quantity.value, session.accessToken!),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.cart })
    toast.show('Added to cart.', 'success')
  },
  onError: (error) =>
    toast.show(error instanceof ApiError ? error.message : 'Could not add this item.', 'danger'),
})
const favoriteMutation = useMutation({
  mutationFn: () =>
    setProductFavorite(productId.value, !product.value?.isFavorite, session.accessToken!),
  onSuccess: async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: commerceQueryKeys.product(productId.value) }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
    ])
  },
  onError: () => toast.show('Could not update this favorite.', 'danger'),
})
</script>

<template>
  <div>
    <AppHeader title="Product details" show-back back-to="/app/marketplace">
      <template #trailing><CartLink /></template>
    </AppHeader>
    <main class="product-page">
      <LoadingState v-if="query.isPending.value" label="Loading product…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <template v-else-if="product">
        <div class="product-visual" aria-hidden="true"><AppIcon name="bag" :size="56" /></div>
        <section class="product-info">
          <div class="product-info__topline">
            <StatusChip :label="product.category.name" tone="info" />
            <button
              type="button"
              class="favorite"
              :aria-label="product.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
              :aria-pressed="product.isFavorite"
              :disabled="favoriteMutation.isPending.value"
              @click="favoriteMutation.mutate()"
            >
              <AppIcon name="heart" :size="20" />
            </button>
          </div>
          <h1>{{ product.name }}</h1>
          <div class="rating">
            <AppIcon name="star" :size="16" /> {{ product.rating ?? 'New' }}
            <span>· {{ product.soldCount }} sold</span>
          </div>
          <strong class="price">{{ formatPhp(product.price.amountMinor) }}</strong>
          <p>{{ product.description }}</p>
        </section>

        <BaseCard v-if="product.recommendation" class="recommendation" padding="md">
          <StatusChip label="Suggested for your setup" tone="success" />
          <h2>Why this may help</h2>
          <p>{{ product.recommendation.why }}</p>
          <small
            >Optional equipment recommendation. Confirm actual site needs before purchasing.</small
          >
        </BaseCard>

        <BaseCard padding="md">
          <h2 class="section-title">Specifications</h2>
          <dl class="specs">
            <div v-for="specification in product.specifications" :key="specification.label">
              <dt>{{ specification.label }}</dt>
              <dd>{{ specification.value }}</dd>
            </div>
          </dl>
        </BaseCard>

        <section class="purchase-panel" aria-label="Purchase options">
          <div class="quantity-control">
            <span>Quantity</span>
            <div>
              <button
                type="button"
                aria-label="Decrease quantity"
                :disabled="quantity <= 1"
                @click="quantity--"
              >
                <AppIcon name="minus" :size="18" />
              </button>
              <strong aria-live="polite">{{ quantity }}</strong>
              <button
                type="button"
                aria-label="Increase quantity"
                :disabled="quantity >= product.maximumOrderQuantity"
                @click="quantity++"
              >
                <AppIcon name="plus" :size="18" />
              </button>
            </div>
          </div>
          <p v-if="!isOnline" class="offline-note">
            Reconnect before adding items. Cart changes are not queued offline.
          </p>
          <BaseButton
            :disabled="!isOnline || product.availability === 'OUT_OF_STOCK'"
            :loading="addMutation.isPending.value"
            @click="addMutation.mutate()"
          >
            {{
              product.availability === 'OUT_OF_STOCK'
                ? 'Out of stock'
                : `Add to cart · ${formatPhp(product.price.amountMinor * quantity)}`
            }}
          </BaseButton>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.product-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) calc(var(--space-7) + env(safe-area-inset-bottom));
}
.product-visual {
  display: grid;
  min-height: 15rem;
  place-items: center;
  border-radius: var(--radius-xl);
  color: var(--color-brand-700);
  background:
    radial-gradient(circle at 72% 22%, rgb(255 255 255 / 85%) 0 2rem, transparent 2.05rem),
    linear-gradient(145deg, var(--color-brand-100), var(--color-aqua-100));
}
.product-info {
  display: grid;
  gap: var(--space-2);
}
.product-info__topline {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.favorite {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-muted);
  background: white;
}
.favorite[aria-pressed='true'] {
  color: var(--color-danger-700);
  background: var(--color-danger-100);
}
.product-info h1,
.product-info p,
.recommendation h2,
.recommendation p,
.recommendation small,
.section-title,
.specs,
.specs dt,
.specs dd {
  margin: 0;
}
.product-info h1 {
  font-size: 1.55rem;
  line-height: 1.2;
  letter-spacing: -0.03em;
}
.rating {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-warning-700);
  font-size: 0.8125rem;
  font-weight: 700;
}
.rating span {
  color: var(--color-text-muted);
  font-weight: 500;
}
.price {
  color: var(--color-brand-800);
  font-size: 1.3rem;
}
.product-info p,
.recommendation p,
.recommendation small {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
}
.recommendation {
  display: grid;
  gap: var(--space-2);
  border-color: var(--color-success-200);
  background: #f7fff9;
}
.recommendation h2,
.section-title {
  font-size: 1rem;
}
.recommendation small {
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
}
.specs {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.specs > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.specs dt {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.specs dd {
  font-size: 0.75rem;
  font-weight: 750;
}
.purchase-panel {
  display: grid;
  gap: var(--space-3);
  padding-top: var(--space-2);
}
.quantity-control {
  display: flex;
  min-height: 3rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.quantity-control > span {
  font-size: 0.875rem;
  font-weight: 750;
}
.quantity-control > div {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.quantity-control button {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-brand-800);
  background: white;
}
.quantity-control button:disabled {
  opacity: 0.45;
}
.offline-note {
  margin: 0;
  color: var(--color-danger-700);
  font-size: 0.75rem;
}
button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
