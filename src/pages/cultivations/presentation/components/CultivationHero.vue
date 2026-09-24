<script setup lang="ts">
import StatusChip from '@components/ui/StatusChip.vue'

import type { CultivationDetail } from '../../domain/cultivations.model'

defineProps<{ cultivation: CultivationDetail }>()
</script>

<template>
  <section class="hero">
    <div>
      <StatusChip
        :label="
          cultivation.growthStage.isEstimated
            ? `${cultivation.growthStage.name} (estimated)`
            : cultivation.growthStage.name
        "
        tone="success"
        icon="fish"
      />
      <h1>Day {{ cultivation.dayNumber ?? '—' }}</h1>
      <p>{{ cultivation.species.commonName }} · {{ cultivation.environment.name }}</p>
    </div>
    <strong>{{ cultivation.progressPercent }}%</strong>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
h1,
p {
  margin: 0;
}
h1 {
  margin-top: var(--space-2);
  font-size: 1.75rem;
}
p {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.hero > strong {
  color: var(--color-aqua-700);
  font-size: 1.5rem;
}
</style>
