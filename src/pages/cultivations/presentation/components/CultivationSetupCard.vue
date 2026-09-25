<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'
import { formatManilaDate, formatQuantity } from '@core/utils/format'

import type { CultivationDetail } from '../../domain/cultivations.model'

// The culture unit as it was set up: its dimensions, water volume and stocking date.
defineProps<{ cultivation: CultivationDetail }>()
</script>

<template>
  <BaseCard class="setup-card" padding="md">
    <h2>Culture setup</h2>
    <dl>
      <div>
        <dt>Dimensions</dt>
        <dd>
          {{ cultivation.dimensions.lengthM }} × {{ cultivation.dimensions.widthM }} ×
          {{ cultivation.dimensions.waterDepthM }} m
        </dd>
      </div>
      <div>
        <dt>Water volume estimate</dt>
        <dd>{{ formatQuantity(cultivation.estimatedWaterVolumeM3, 'M3') }}</dd>
      </div>
      <div>
        <dt>Stocked</dt>
        <dd>
          {{ cultivation.stockedOn ? formatManilaDate(cultivation.stockedOn) : 'Not yet stocked' }}
        </dd>
      </div>
    </dl>
  </BaseCard>
</template>

<style scoped>
h2,
dl,
dt,
dd {
  margin: 0;
}
h2 {
  font-size: 1rem;
}
dl {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
dt {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
dd {
  font-size: 0.75rem;
  font-weight: 750;
  text-align: right;
}
</style>
