<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate } from '@core/utils/format'

import { orderStatusDisplay, type OrderTracking } from '../../domain/orders.model'

defineProps<{ tracking: OrderTracking }>()
</script>

<template>
  <BaseCard class="tracking-summary" padding="md">
    <div>
      <div>
        <p>{{ tracking.orderNumber }}</p>
        <h1>{{ orderStatusDisplay(tracking.status).label }}</h1>
      </div>
      <StatusChip
        v-if="tracking.estimatedDeliveryDate"
        :label="`Est. ${formatManilaDate(tracking.estimatedDeliveryDate)}`"
        tone="info"
        icon="truck"
      />
    </div>
    <dl v-if="tracking.courier">
      <div>
        <dt>Courier</dt>
        <dd>{{ tracking.courier.name }}</dd>
      </div>
      <div>
        <dt>Tracking number</dt>
        <dd>{{ tracking.courier.trackingNumber }}</dd>
      </div>
    </dl>
  </BaseCard>
</template>

<style scoped>
.tracking-summary {
  display: grid;
  gap: var(--space-4);
  background: linear-gradient(145deg, white, var(--color-brand-50));
}
.tracking-summary > div:first-child {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-3);
}
.tracking-summary p,
.tracking-summary h1,
.tracking-summary dl,
.tracking-summary dt,
.tracking-summary dd {
  margin: 0;
}
.tracking-summary p {
  color: var(--color-brand-800);
  font-size: 0.75rem;
  font-weight: 800;
}
.tracking-summary h1 {
  margin-top: var(--space-1);
  font-size: 1.35rem;
}
.tracking-summary dl {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}
.tracking-summary dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 0.75rem;
}
.tracking-summary dt {
  color: var(--color-text-muted);
}
.tracking-summary dd {
  font-weight: 750;
}
</style>
