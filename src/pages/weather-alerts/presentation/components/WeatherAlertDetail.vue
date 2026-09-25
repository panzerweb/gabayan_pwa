<script setup lang="ts">
import { computed } from 'vue'

import StatusChip from '@components/ui/StatusChip.vue'

import {
  weatherKindDisplay,
  weatherPeakLine,
  weatherPeriodLabel,
  weatherSeverityDisplay,
  type WeatherAlert,
} from '../../domain/weather-alerts.model'

// One weather alert: what is coming and when, the risk to the fish in plain words, a few
// steps to take, and the demo provenance. Shared by the Home weather card and the
// notification a weather alert raises, which shows its own title and message.
const props = withDefaults(defineProps<{ alert: WeatherAlert; showTitle?: boolean }>(), {
  showTitle: true,
})

const kind = computed(() => weatherKindDisplay(props.alert.kind))
const severity = computed(() => weatherSeverityDisplay(props.alert.severity))
const period = computed(() => weatherPeriodLabel(props.alert.periodStart, props.alert.periodEnd))
const peak = computed(() => weatherPeakLine(props.alert))
</script>

<template>
  <article class="weather-alert" :aria-label="`${kind.label}, ${period}`">
    <div class="weather-alert__chips">
      <StatusChip :label="kind.label" :tone="kind.tone" :icon="kind.icon" />
      <StatusChip :label="severity.label" :tone="severity.tone" :icon="severity.icon" />
    </div>
    <h3 v-if="showTitle">{{ alert.title }}</h3>
    <p class="weather-alert__period">
      <time :datetime="alert.periodStart">{{ period }}</time>
    </p>
    <p class="weather-alert__peak">{{ peak }}</p>
    <p class="weather-alert__explanation">{{ alert.explanation }}</p>
    <div v-if="alert.actions.length" class="weather-alert__actions">
      <p>What you can do</p>
      <ul>
        <li v-for="action in alert.actions" :key="action">{{ action }}</li>
      </ul>
    </div>
    <aside v-if="alert.isDemo" class="weather-alert__provenance" aria-label="About this alert">
      <StatusChip label="Demo estimate" tone="warning" icon="info" />
      <p>{{ alert.disclaimer }}</p>
      <small>Rule {{ alert.ruleVersion }}</small>
    </aside>
  </article>
</template>

<style scoped>
.weather-alert {
  display: grid;
  gap: var(--space-2);
}
.weather-alert__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
h3,
p,
ul {
  margin: 0;
}
h3 {
  font-size: 1rem;
}
p,
li {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}
.weather-alert__period {
  color: var(--color-text);
  font-weight: 750;
}
.weather-alert__peak {
  color: var(--color-brand-800);
  font-weight: 700;
}
.weather-alert__explanation {
  color: var(--color-text);
}
.weather-alert__actions {
  display: grid;
  gap: var(--space-1);
}
.weather-alert__actions > p {
  color: var(--color-text);
  font-weight: 750;
}
.weather-alert__actions ul {
  display: grid;
  gap: var(--space-1);
  padding-left: var(--space-5);
}
.weather-alert__provenance {
  display: grid;
  gap: var(--space-1);
  justify-items: start;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
}
.weather-alert__provenance p,
.weather-alert__provenance small {
  font-size: 0.75rem;
}
</style>
