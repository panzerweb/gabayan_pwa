<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import type { ProductSummary } from '@/services/api'
import { formatPhp } from '@core/utils/format'

defineProps<{ product: ProductSummary }>()
</script>

<template>
  <RouterLink class="product-link" :to="`/app/products/${product.id}`">
    <BaseCard class="product-card" padding="none">
      <div class="product-card__visual" aria-hidden="true">
        <AppIcon name="bag" :size="34" />
        <span v-if="product.isFavorite"><AppIcon name="heart" :size="18" /></span>
      </div>
      <div class="product-card__body">
        <p>{{ product.category.name }}</p>
        <h2>{{ product.name }}</h2>
        <div class="product-card__rating">
          <AppIcon name="star" :size="14" />
          <span
            >{{ product.rating ?? 'New' }}
            <small v-if="product.rating">({{ product.ratingCount }})</small></span
          >
        </div>
        <strong>{{ formatPhp(product.price.amountMinor) }}</strong>
        <StatusChip
          v-if="product.availability !== 'AVAILABLE'"
          :label="product.availability === 'LOW_STOCK' ? 'Low stock' : 'Out of stock'"
          :tone="product.availability === 'LOW_STOCK' ? 'warning' : 'danger'"
        />
      </div>
    </BaseCard>
  </RouterLink>
</template>

<style scoped>
.product-link {
  color: inherit;
  text-decoration: none;
}
.product-link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
  border-radius: var(--radius-lg);
}
.product-card {
  height: 100%;
  overflow: hidden;
}
.product-card__visual {
  position: relative;
  display: grid;
  min-height: 7.5rem;
  place-items: center;
  color: var(--color-brand-700);
  background:
    radial-gradient(circle at 70% 25%, rgb(255 255 255 / 80%) 0 1rem, transparent 1.05rem),
    linear-gradient(145deg, var(--color-brand-100), var(--color-aqua-100));
}
.product-card__visual > span {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  color: var(--color-danger-700);
  background: white;
}
.product-card__body {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
}
.product-card p,
.product-card h2 {
  margin: 0;
}
.product-card p {
  color: var(--color-text-subtle);
  font-size: 0.625rem;
  font-weight: 750;
  text-transform: uppercase;
}
.product-card h2 {
  min-height: 2.5rem;
  font-size: 0.875rem;
  line-height: 1.35;
}
.product-card__rating {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-warning-700);
  font-size: 0.7rem;
}
.product-card__rating small {
  color: var(--color-text-muted);
}
.product-card strong {
  margin-top: var(--space-1);
  color: var(--color-brand-800);
  font-size: 0.9375rem;
}
</style>
