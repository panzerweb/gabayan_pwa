<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

// Shown instead of the harvest form while the estimate is not ready: points the farmer at a
// fresh growth sample, the only thing that can move readiness.
defineProps<{ cultivationId: string }>()
</script>

<template>
  <BaseCard class="monitor-card" padding="md">
    <p>
      Add a current growth measurement before recording harvest. Readiness is never inferred from
      elapsed time alone.
    </p>
    <BaseButton
      :to="{ name: ROUTE_NAMES.cultivationGrowth, params: { cultivationId } }"
      variant="secondary"
    >
      Update growth measurement
    </BaseButton>
  </BaseCard>
</template>

<style scoped>
.monitor-card {
  display: grid;
  gap: var(--space-3);
}
p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
