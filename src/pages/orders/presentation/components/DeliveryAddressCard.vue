<script setup lang="ts">
import { computed } from 'vue'

import BaseCard from '@components/ui/BaseCard.vue'

import { addressLines, type AddressSnapshot } from '../../domain/orders.model'

// A delivery address block; checkout reuses it for the address an order will go to.
const props = withDefaults(
  defineProps<{ address: AddressSnapshot; heading?: string; showLabel?: boolean }>(),
  { heading: 'Delivery address', showLabel: false },
)

const lines = computed(() => addressLines(props.address))
</script>

<template>
  <BaseCard padding="md">
    <p v-if="showLabel" class="eyebrow">{{ heading }}</p>
    <h2>{{ showLabel ? address.label : heading }}</h2>
    <address>
      <span v-for="line in lines" :key="line">{{ line }}</span>
    </address>
    <p v-if="address.deliveryInstructions" class="instructions">
      {{ address.deliveryInstructions }}
    </p>
  </BaseCard>
</template>

<style scoped>
.eyebrow,
h2,
address,
.instructions {
  margin: 0;
}
.eyebrow {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-weight: 750;
}
h2 {
  font-size: 1rem;
}
.eyebrow + h2 {
  margin-top: var(--space-1);
}
address {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-style: normal;
  line-height: 1.55;
}
address span {
  display: block;
}
.instructions {
  margin-top: var(--space-2);
  color: var(--color-text-subtle);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
