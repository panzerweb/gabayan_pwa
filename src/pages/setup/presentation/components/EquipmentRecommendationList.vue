<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { formatPhp } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import type { RecommendedProduct } from '../../domain/setup.model'

defineProps<{
  cultivationId: string
  products: RecommendedProduct[]
  disclaimer: string
  isDemo: boolean
}>()
</script>

<template>
  <section class="recommendations" aria-labelledby="recommendations-heading">
    <div>
      <p>Optional setup support</p>
      <h3 id="recommendations-heading">Recommended equipment</h3>
    </div>
    <BaseCard
      v-for="product in products"
      :key="product.id"
      class="recommendation-card"
      padding="md"
    >
      <span class="recommendation-card__icon" aria-hidden="true"><AppIcon name="plus" /></span>
      <div>
        <strong>{{ product.name }}</strong>
        <p>{{ product.whyRelevant }}</p>
        <span>{{ formatPhp(product.price.amountMinor) }}</span>
        <BaseButton
          :to="{
            name: ROUTE_NAMES.productDetail,
            params: { productId: product.id },
            query: { cultivationId },
          }"
          variant="text"
        >
          View product
        </BaseButton>
      </div>
    </BaseCard>
    <p class="recommendations__disclaimer">
      <strong v-if="isDemo">Demo recommendation. </strong>{{ disclaimer }}
    </p>
  </section>
</template>

<style scoped>
.recommendations {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.recommendations > div > p,
.recommendations h3 {
  margin: 0;
}

.recommendations > div > p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.recommendations h3 {
  margin-top: var(--space-1);
  font-size: 1.125rem;
}

.recommendation-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
}

.recommendation-card__icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--color-brand-700);
  background: var(--color-brand-100);
}

.recommendation-card strong,
.recommendation-card p,
.recommendation-card div > span {
  display: block;
  margin: 0;
}
.recommendation-card p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}
.recommendation-card div > span {
  margin-top: var(--space-2);
  color: var(--color-brand-800);
  font-size: 0.8125rem;
  font-weight: 800;
}

.recommendations__disclaimer {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
}
</style>
