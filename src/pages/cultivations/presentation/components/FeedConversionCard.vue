<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate, formatQuantity } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import {
  feedConversionLine,
  type FeedConversion,
  type Quantity,
} from '../../domain/cultivations.model'
import FeedConversionIntervals from './FeedConversionIntervals.vue'

// The feed conversion ratio the server worked out from this cultivation's records: the
// figure with a plain explanation, what it was worked out from, its history between samples,
// and the demo disclaimer. Without enough records it says what is missing and where to add it.
const props = defineProps<{ conversion: FeedConversion }>()

function kg(quantity: Quantity | null) {
  return quantity ? formatQuantity(quantity.value, quantity.unit) : '—'
}

function recordCount(count: number) {
  return `${count} feeding ${count === 1 ? 'record' : 'records'}`
}
</script>

<template>
  <BaseCard padding="md">
    <div class="fcr">
      <p class="fcr__explanation">
        The feed conversion ratio (FCR) is how many kilograms of feed went into each kilogram your
        fish gained. A lower number means less feed for the same growth.
      </p>

      <template v-if="props.conversion.status === 'CALCULATED' && props.conversion.ratio !== null">
        <div class="fcr__figure">
          <span>Feed conversion ratio</span>
          <strong>{{ props.conversion.ratio }}</strong>
          <p>{{ feedConversionLine(props.conversion.ratio) }}</p>
        </div>
        <dl class="fcr__details">
          <div>
            <dt>Period</dt>
            <dd>
              {{ formatManilaDate(props.conversion.periodStart ?? '') }} to
              {{ formatManilaDate(props.conversion.periodEnd ?? '') }}
            </dd>
          </div>
          <div>
            <dt>Feed given</dt>
            <dd>
              {{ kg(props.conversion.feedGiven) }} from
              {{ recordCount(props.conversion.feedingRecordCount) }}
            </dd>
          </div>
          <div>
            <dt>Stock weight</dt>
            <dd>
              {{ kg(props.conversion.startBiomass) }} to {{ kg(props.conversion.endBiomass) }}
            </dd>
          </div>
          <div>
            <dt>Weight gained</dt>
            <dd>{{ kg(props.conversion.biomassGain) }}</dd>
          </div>
        </dl>
        <FeedConversionIntervals
          v-if="props.conversion.intervals.length > 1"
          :intervals="props.conversion.intervals"
        />
      </template>
      <div v-else class="fcr__missing">
        <StatusChip label="Not enough records yet" tone="info" icon="info" />
        <p>{{ props.conversion.message }}</p>
        <nav class="fcr__links" aria-label="Add the missing records">
          <RouterLink
            :to="{
              name: ROUTE_NAMES.cultivationGrowth,
              params: { cultivationId: props.conversion.cultivationId },
            }"
          >
            Growth records
          </RouterLink>
          <RouterLink
            :to="{
              name: ROUTE_NAMES.cultivationRecords,
              params: { cultivationId: props.conversion.cultivationId },
            }"
          >
            Feeding records
          </RouterLink>
        </nav>
      </div>

      <section class="fcr__basis" aria-label="How this is worked out">
        <h2>How this is worked out</h2>
        <ul>
          <li v-for="line in props.conversion.basis" :key="line">{{ line }}</li>
        </ul>
      </section>
      <aside class="fcr__provenance" aria-label="About this figure">
        <StatusChip
          v-if="props.conversion.isDemo"
          label="Demo calculation, not yet reviewed"
          tone="warning"
        />
        <p>{{ props.conversion.disclaimer }}</p>
      </aside>
    </div>
  </BaseCard>
</template>

<style scoped>
.fcr {
  display: grid;
  gap: var(--space-4);
}
.fcr__explanation,
.fcr__figure p,
.fcr__missing p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
}
.fcr__explanation {
  color: var(--color-text-muted);
}
.fcr__figure {
  display: grid;
  gap: var(--space-1);
}
.fcr__figure span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.fcr__figure strong {
  color: var(--color-brand-900);
  font-size: 2.25rem;
  line-height: 1.1;
}
.fcr__details {
  display: grid;
  gap: var(--space-2);
  margin: 0;
}
.fcr__details div {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: var(--space-3);
  font-size: 0.8rem;
}
.fcr__details dt {
  color: var(--color-text-muted);
}
.fcr__details dd {
  margin: 0;
  font-weight: 650;
}
.fcr__missing {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}
.fcr__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.fcr__links a {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  color: var(--color-brand-700);
  font-weight: 700;
}
.fcr__basis h2 {
  margin: 0 0 var(--space-2);
  font-size: 0.95rem;
}
.fcr__basis ul {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding-left: var(--space-4);
  font-size: 0.8rem;
  line-height: 1.45;
}
.fcr__provenance {
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
.fcr__provenance p {
  margin: 0;
}
</style>
