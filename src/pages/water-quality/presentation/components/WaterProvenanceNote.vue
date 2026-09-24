<script setup lang="ts">
import StatusChip from '@components/ui/StatusChip.vue'

import type { RuleSource } from '../../domain/water-quality.model'

// How far the water figures can be trusted: a demo label, the disclaimer, and the sources
// they were drawn from.
defineProps<{
  isDemo: boolean
  disclaimer: string
  sources?: RuleSource[] | undefined
}>()
</script>

<template>
  <aside class="water-provenance" aria-label="About these figures">
    <StatusChip v-if="isDemo" label="Demo figures, not yet reviewed" tone="warning" />
    <p>{{ disclaimer }}</p>
    <ul v-if="sources?.length" class="water-provenance__sources">
      <li v-for="source in sources" :key="source.title">
        {{ source.organization }}: {{ source.title }}
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.water-provenance {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  background: var(--color-neutral-100);
  font-size: 0.75rem;
  line-height: 1.45;
}
p,
ul {
  margin: 0;
}
.water-provenance__sources {
  padding-left: var(--space-4);
}
</style>
