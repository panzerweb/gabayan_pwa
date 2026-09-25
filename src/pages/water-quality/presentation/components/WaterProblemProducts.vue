<script setup lang="ts">
import { computed } from 'vue'

import StatusChip from '@components/ui/StatusChip.vue'
import { formatPhp } from '@core/utils/format'
import { availabilityStatus } from '@pages/marketplace/domain/marketplace.model'
import BuyNowButton from '@pages/marketplace/presentation/components/BuyNowButton.vue'

import type { WaterProblemProduct } from '../../domain/water-quality.model'

// The products the server suggests for one out-of-range reading, each with why it may help
// and a "Buy now" that opens it with the suggested quantity. The entries are plain blocks
// rather than a nested list, since they sit inside a reading's list item.
const props = defineProps<{ parameterName: string; products: WaterProblemProduct[] }>()

const items = computed(() =>
  props.products.map((product) => ({ product, stock: availabilityStatus(product.availability) })),
)
</script>

<template>
  <section class="problem-products" :aria-label="`Products that may help with ${parameterName}`">
    <strong>Products that may help</strong>
    <div class="problem-products__items">
      <div v-for="{ product, stock } in items" :key="product.id" class="problem-product">
        <div class="problem-product__heading">
          <span>{{ product.name }}</span>
          <span class="problem-product__price">{{ formatPhp(product.price.amountMinor) }}</span>
        </div>
        <p>{{ product.whyRelevant }}</p>
        <StatusChip v-if="stock" :label="stock.label" :tone="stock.tone" />
        <BuyNowButton
          :product-id="product.id"
          :product-name="product.name"
          :quantity="product.suggestedQuantity"
          variant="secondary"
        />
      </div>
    </div>
    <small>Optional. Check what your own setup needs before buying.</small>
  </section>
</template>

<style scoped>
.problem-products {
  display: grid;
  gap: var(--space-2);
  font-size: 0.8rem;
}
.problem-products__items {
  display: grid;
  gap: var(--space-2);
}
.problem-product {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.problem-product__heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  font-weight: 750;
}
.problem-product__price {
  color: var(--color-brand-800);
}
.problem-product p,
.problem-products small {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.45;
}
.problem-products small {
  font-size: 0.6875rem;
}
</style>
