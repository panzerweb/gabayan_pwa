<script setup lang="ts">
import { computed } from 'vue'

import StatusChip from '@components/ui/StatusChip.vue'
import { formatQuantity } from '@core/utils/format'

import {
  WATER_READING_FIELDS,
  formatThresholdRange,
  readingStatusPresentation,
  type WaterSafetyCheck,
} from '../../domain/water-quality.model'
import WaterProblemProducts from './WaterProblemProducts.vue'

// The server's answer for each entered reading: its status as label, icon and colour, the
// suggested range, what the parameter means and what to do, with any products that may help
// an out-of-range reading. Readings left blank are named.
const props = defineProps<{ check: WaterSafetyCheck }>()

const notChecked = computed(() =>
  props.check.notChecked.map((parameter) => WATER_READING_FIELDS[parameter].label).join(', '),
)
</script>

<template>
  <section class="safety-results" aria-label="Safety check results">
    <ul class="safety-results__list" aria-label="Your readings">
      <li v-for="result in check.results" :key="result.parameter" class="safety-result">
        <div class="safety-result__heading">
          <strong>{{ result.name }}: {{ formatQuantity(result.value, result.unit) }}</strong>
          <StatusChip
            :label="readingStatusPresentation(result.status).label"
            :tone="readingStatusPresentation(result.status).tone"
            :icon="readingStatusPresentation(result.status).icon"
          />
        </div>
        <p class="safety-result__range">Suggested: {{ formatThresholdRange(result) }}</p>
        <p class="safety-result__explanation">{{ result.explanation }}</p>
        <div
          :class="[
            'safety-result__guidance',
            `safety-result__guidance--${result.guidance.severity.toLowerCase()}`,
          ]"
        >
          <strong>{{ result.guidance.title }}</strong>
          <span>{{ result.guidance.message }}</span>
        </div>
        <WaterProblemProducts
          v-if="result.recommendedProducts?.length"
          :parameter-name="result.name"
          :products="result.recommendedProducts"
        />
      </li>
    </ul>
    <p v-if="check.notChecked.length" class="safety-results__skipped">
      Not checked: {{ notChecked }}.
    </p>
  </section>
</template>

<style scoped>
.safety-results,
.safety-results__list {
  display: grid;
  gap: var(--space-3);
}
.safety-results__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.safety-result {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.safety-result__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.safety-result__range,
.safety-result__explanation,
.safety-results__skipped {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
}
.safety-result__range,
.safety-results__skipped {
  color: var(--color-text-muted);
}
.safety-result__guidance {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.78rem;
  line-height: 1.45;
}
.safety-result__guidance--info {
  color: var(--color-brand-900);
  background: var(--color-brand-50);
}
.safety-result__guidance--caution,
.safety-result__guidance--action {
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}
</style>
