<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { buyNowQuery } from '../../domain/marketplace.model'

// "Buy now" on a recommended product: opens the product with the suggested quantity preset
// through the route query. Meant for reuse by any screen that recommends a product; the
// product name keeps several buttons on one screen distinguishable to screen readers.
const props = withDefaults(
  defineProps<{
    productId: string
    productName: string
    quantity?: number
    cultivationId?: string
    variant?: 'primary' | 'secondary'
  }>(),
  { quantity: 1, variant: 'primary' },
)

const to = computed(() => ({
  name: ROUTE_NAMES.productDetail,
  params: { productId: props.productId },
  query: buyNowQuery(props.quantity, props.cultivationId),
}))
</script>

<template>
  <BaseButton class="buy-now" :to="to" :variant="variant" :aria-label="`Buy now: ${productName}`">
    Buy now
  </BaseButton>
</template>

<style scoped>
.buy-now {
  min-height: 3rem;
}
</style>
