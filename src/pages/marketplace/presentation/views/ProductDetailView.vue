<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { formatPhp } from '@core/utils/format'
import CartLink from '@pages/cart/presentation/components/CartLink.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { CART_OFFLINE_MESSAGE } from '../../domain/marketplace.model'
import ProductGallery from '../components/ProductGallery.vue'
import ProductInfo from '../components/ProductInfo.vue'
import ProductInstallationGuide from '../components/ProductInstallationGuide.vue'
import ProductQuantity from '../components/ProductQuantity.vue'
import ProductRecommendation from '../components/ProductRecommendation.vue'
import ProductSpecifications from '../components/ProductSpecifications.vue'
import { useAddToCart } from '../composables/useAddToCart'
import { useFavoriteToggle } from '../composables/useFavoriteToggle'
import { useProductDetail } from '../composables/useProductDetail'
import { useQuantityPreset } from '../composables/useQuantityPreset'

const route = useRoute()
const productId = computed(() => String(route.params.productId))

const { product, loading, loadFailed, refetch } = useProductDetail(productId)
const { toggle: toggleFavorite, pending: favoritePending } = useFavoriteToggle(productId)
const { quantity, isOnline, adding, add } = useAddToCart(productId)
const { presetQuantity } = useQuantityPreset(
  quantity,
  computed(() => product.value?.maximumOrderQuantity),
)

const outOfStock = computed(() => product.value?.availability === 'OUT_OF_STOCK')
</script>

<template>
  <div>
    <AppHeader title="Product details" show-back :back-to="{ name: ROUTE_NAMES.marketplace }">
      <template #trailing><CartLink /></template>
    </AppHeader>
    <main class="product-page">
      <LoadingState v-if="loading" label="Loading product…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else-if="product">
        <ProductGallery />
        <ProductInfo
          :product="product"
          :favorite-pending="favoritePending"
          @toggle-favorite="toggleFavorite(product.isFavorite)"
        />
        <ProductRecommendation v-if="product.recommendation" :why="product.recommendation.why" />
        <ProductSpecifications :specifications="product.specifications" />
        <ProductInstallationGuide
          v-if="product.installationGuide"
          :guide="product.installationGuide"
        />

        <section class="purchase-panel" aria-label="Purchase options">
          <ProductQuantity v-model="quantity" :maximum="product.maximumOrderQuantity" />
          <p v-if="presetQuantity !== null" class="preset-note">
            Suggested quantity for your need: {{ presetQuantity }}. You can change it.
          </p>
          <p v-if="!isOnline" class="offline-note">{{ CART_OFFLINE_MESSAGE }}</p>
          <BaseButton :disabled="!isOnline || outOfStock" :loading="adding" @click="add">
            {{
              outOfStock
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
.purchase-panel {
  display: grid;
  gap: var(--space-3);
  padding-top: var(--space-2);
}
.preset-note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.offline-note {
  margin: 0;
  color: var(--color-danger-700);
  font-size: 0.75rem;
}
</style>
