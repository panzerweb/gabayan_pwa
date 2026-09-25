<script setup lang="ts">
import { computed, toRef } from 'vue'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatQuantity } from '@core/utils/format'

import { formatDepthRange, formatSpace, spaceMeasure } from '../../domain/setup.model'
import { useSizingGuidance } from '../composables/useSizingGuidance'

// The suggested culture-area size and water depth for one fish in one culture system, with
// where the figures come from. Every loading, refusal and error state is handled here.
const props = defineProps<{ speciesId: string; environmentId: string }>()

const { guidance, loading, loadFailed, incompatibleMessage, refetch } = useSizingGuidance(
  toRef(props, 'speciesId'),
  toRef(props, 'environmentId'),
)

const exampleLabel = computed(() =>
  guidance.value ? `For ${formatQuantity(guidance.value.exampleFingerlings, 'COUNT')} fish` : '',
)
</script>

<template>
  <section class="sizing" aria-label="Suggested size and depth">
    <LoadingState v-if="loading" label="Loading the suggested size…" />
    <p v-else-if="incompatibleMessage" class="sizing__notice" role="alert">
      {{ incompatibleMessage }}
    </p>
    <ErrorState
      v-else-if="loadFailed || !guidance"
      title="We couldn’t load the suggested size"
      message="You can still enter your own measurements."
      @retry="refetch()"
    />
    <template v-else>
      <dl class="sizing__facts">
        <div>
          <dt>{{ exampleLabel }}</dt>
          <dd>
            About {{ formatSpace(guidance.exampleSpace) }}
            <span>{{ spaceMeasure(guidance.exampleSpace.unit) }}</span>
          </dd>
        </div>
        <div>
          <dt>Each fish</dt>
          <dd>
            About {{ formatSpace(guidance.spacePerFish) }}
            <span>{{ spaceMeasure(guidance.spacePerFish.unit) }}</span>
          </dd>
        </div>
        <div>
          <dt>Water depth</dt>
          <dd v-if="guidance.waterDepth">
            At least {{ formatDepthRange(guidance.waterDepth) }}
            <span>Deeper water warms more slowly and holds oxygen better.</span>
          </dd>
          <dd v-else>No suggested depth yet</dd>
        </div>
      </dl>
      <p class="sizing__basis">{{ guidance.spaceBasis }}</p>
      <p class="sizing__basis">{{ guidance.depthBasis }}</p>
      <aside class="sizing__provenance" aria-label="About these figures">
        <StatusChip v-if="guidance.isDemo" label="Demo figures, not yet reviewed" tone="warning" />
        <p>{{ guidance.disclaimer }}</p>
        <ul v-if="guidance.sources.length">
          <li v-for="source in guidance.sources" :key="source.title">
            {{ source.organization }}: {{ source.title }}
          </li>
        </ul>
      </aside>
    </template>
  </section>
</template>

<style scoped>
.sizing {
  display: grid;
  gap: var(--space-3);
}

.sizing__facts {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-brand-50);
}

.sizing__facts dt {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.sizing__facts dd {
  margin: var(--space-1) 0 0;
  font-weight: 700;
}

.sizing__facts dd span {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 400;
}

.sizing__basis,
.sizing__notice {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.sizing__notice {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.sizing__provenance {
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

.sizing__provenance p,
.sizing__provenance ul {
  margin: 0;
}

.sizing__provenance ul {
  padding-left: var(--space-4);
}
</style>
