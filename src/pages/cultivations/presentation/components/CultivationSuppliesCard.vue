<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import type { CultivationDetail } from '../../domain/cultivations.model'

// An optional way into the marketplace, filtered to this cultivation's species and setup.
defineProps<{ cultivation: CultivationDetail }>()
</script>

<template>
  <BaseCard class="supplies-card" padding="md">
    <div>
      <p>Optional farm supplies</p>
      <h2>Shop for this cultivation</h2>
    </div>
    <BaseButton
      :to="{
        name: ROUTE_NAMES.marketplace,
        query: { speciesId: cultivation.species.id, environmentId: cultivation.environment.id },
      }"
      variant="secondary"
    >
      Browse relevant supplies
    </BaseButton>
  </BaseCard>
</template>

<style scoped>
.supplies-card {
  display: grid;
  gap: var(--space-3);
  background: linear-gradient(145deg, white, var(--color-brand-50));
}
p,
h2 {
  margin: 0;
}
p {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
h2 {
  margin-top: var(--space-1);
  font-size: 1rem;
}
</style>
