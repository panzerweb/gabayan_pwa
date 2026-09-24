<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatPhp } from '@core/utils/format'

import type { ProductDetail } from '../../domain/marketplace.model'

defineProps<{ product: ProductDetail; favoritePending?: boolean }>()

const emit = defineEmits<{ 'toggle-favorite': [] }>()
</script>

<template>
  <section class="product-info">
    <div class="product-info__topline">
      <StatusChip :label="product.category.name" tone="info" />
      <button
        type="button"
        class="favorite"
        :aria-label="product.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        :aria-pressed="product.isFavorite"
        :disabled="favoritePending"
        @click="emit('toggle-favorite')"
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
</template>

<style scoped>
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
.favorite:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
.product-info h1,
.product-info p {
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
.product-info p {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
}
</style>
