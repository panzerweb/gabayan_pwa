<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'

import type { ProductDetail } from '../../domain/marketplace.model'

defineProps<{ specifications: ProductDetail['specifications'] }>()
</script>

<template>
  <BaseCard padding="md">
    <h2 class="section-title">Specifications</h2>
    <dl v-if="specifications.length" class="specs">
      <div v-for="specification in specifications" :key="specification.label">
        <dt>{{ specification.label }}</dt>
        <dd>{{ specification.value }}</dd>
      </div>
    </dl>
    <p v-else class="specs-empty">The supplier has not listed specifications for this product.</p>
  </BaseCard>
</template>

<style scoped>
.section-title,
.specs,
.specs dt,
.specs dd,
.specs-empty {
  margin: 0;
}
.section-title {
  font-size: 1rem;
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
.specs-empty {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
