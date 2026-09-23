<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { commerceQueryKeys, getOrderTracking } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { formatManilaDate, formatManilaTime } from '@/utils/format'

const route = useRoute()
const session = useSessionStore()
const orderId = computed(() => String(route.params.orderId))
const query = useQuery({
  queryKey: computed(() => commerceQueryKeys.tracking(orderId.value)),
  queryFn: () => getOrderTracking(orderId.value, session.accessToken!),
})
const tracking = computed(() => query.data.value?.data)
</script>

<template>
  <div>
    <AppHeader title="Track order" show-back :back-to="`/app/orders/${orderId}`" />
    <main class="tracking-page">
      <LoadingState v-if="query.isPending.value" label="Loading delivery progress…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <template v-else-if="tracking">
        <BaseCard class="tracking-summary" padding="md"
          ><div>
            <p>{{ tracking.orderNumber }}</p>
            <h1>{{ tracking.status.replaceAll('_', ' ') }}</h1>
          </div>
          <StatusChip
            v-if="tracking.estimatedDeliveryDate"
            :label="`Est. ${formatManilaDate(tracking.estimatedDeliveryDate)}`"
            tone="info"
          />
          <dl v-if="tracking.courier">
            <div>
              <dt>Courier</dt>
              <dd>{{ tracking.courier.name }}</dd>
            </div>
            <div>
              <dt>Tracking number</dt>
              <dd>{{ tracking.courier.trackingNumber }}</dd>
            </div>
          </dl></BaseCard
        >
        <ol class="timeline" aria-label="Order progress">
          <li
            v-for="event in tracking.events"
            :key="event.id"
            :class="{ current: event.current, completed: event.completed }"
          >
            <span aria-hidden="true" />
            <div>
              <StatusChip v-if="event.current" label="Current" tone="info" />
              <h2>{{ event.label }}</h2>
              <p>{{ event.description }}</p>
              <small v-if="event.occurredAt"
                >{{ formatManilaDate(event.occurredAt) }} ·
                {{ formatManilaTime(event.occurredAt) }}</small
              ><small v-else>Upcoming</small>
            </div>
          </li>
        </ol>
        <p class="delivery-note">
          Delivery updates are supplied by the mock courier timeline and may change.
        </p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.tracking-page {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
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
.timeline {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
.timeline li {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
}
.timeline li::before {
  position: absolute;
  top: 1rem;
  bottom: 0;
  left: 0.45rem;
  width: 2px;
  background: var(--color-border);
  content: '';
}
.timeline li:last-child::before {
  display: none;
}
.timeline li > span {
  z-index: 1;
  width: 1rem;
  height: 1rem;
  margin-top: 0.35rem;
  border: 3px solid white;
  border-radius: 50%;
  background: var(--color-border-strong);
  box-shadow: 0 0 0 1px var(--color-border-strong);
}
.timeline li.completed > span {
  background: var(--color-success-700);
}
.timeline li.current > span {
  background: var(--color-brand-600);
  box-shadow: 0 0 0 3px var(--color-brand-100);
}
.timeline h2,
.timeline p,
.timeline small {
  margin: 0;
}
.timeline h2 {
  margin-top: var(--space-2);
  font-size: 1rem;
}
.timeline p,
.timeline small {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}
.delivery-note {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 0.7rem;
  text-align: center;
}
</style>
