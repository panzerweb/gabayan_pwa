<script setup lang="ts">
import StatusChip from '@components/ui/StatusChip.vue'

import type { FeedSource } from '../../domain/feeds.model'

// How far the feed figures can be trusted: a demo label, the disclaimer, the rule version and,
// on the full guide, the sources they are to be reviewed against.
defineProps<{
  isDemo: boolean
  disclaimer: string
  ruleVersion: string
  sources?: FeedSource[] | undefined
}>()
</script>

<template>
  <aside class="feed-provenance" aria-label="About these feed figures">
    <StatusChip v-if="isDemo" label="Demo figures, not yet reviewed" tone="warning" />
    <p>{{ disclaimer }}</p>
    <ul v-if="sources?.length" class="feed-provenance__sources">
      <li v-for="source in sources" :key="source.title">
        {{ source.organization }}: {{ source.title }}
      </li>
    </ul>
    <small>Rule {{ ruleVersion }}</small>
  </aside>
</template>

<style scoped>
.feed-provenance {
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
.feed-provenance__sources {
  padding-left: var(--space-4);
}
</style>
