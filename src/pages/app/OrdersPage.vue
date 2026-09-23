<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import CartLink from '@/components/commerce/CartLink.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { commerceQueryKeys, listOrders } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { formatManilaDate, formatPhp } from '@/utils/format'

type OrderFilter = 'ALL' | 'ACTIVE' | 'DELIVERED'
const session = useSessionStore()
const selectedFilter = ref<OrderFilter>('ALL')
const query = useQuery({
  queryKey: commerceQueryKeys.orders,
  queryFn: () => listOrders(session.accessToken!),
})
const orders = computed(() => {
  const values = query.data.value?.data ?? []
  if (selectedFilter.value === 'DELIVERED')
    return values.filter((order) => order.status === 'DELIVERED')
  if (selectedFilter.value === 'ACTIVE')
    return values.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status))
  return values
})
function statusTone(status: string) {
  if (status === 'DELIVERED') return 'success'
  if (status === 'CANCELLED') return 'danger'
  return 'info'
}
</script>

<template>
  <div class="orders-page">
    <AppHeader title="Orders" subtitle="Supplies and delivery tracking">
      <template #trailing><CartLink /></template>
    </AppHeader>
    <main class="orders-page__content">
      <BaseCard class="shop-entry" padding="md">
        <span aria-hidden="true"><AppIcon name="bag" /></span>
        <div>
          <h2>Farm supplies</h2>
          <p>Browse products when they support a cultivation need.</p>
        </div>
        <BaseButton to="/app/marketplace" variant="secondary">Shop</BaseButton>
      </BaseCard>
      <div class="filters" role="group" aria-label="Filter orders">
        <button
          v-for="filter in ['ALL', 'ACTIVE', 'DELIVERED'] as const"
          :key="filter"
          type="button"
          :aria-pressed="selectedFilter === filter"
          @click="selectedFilter = filter"
        >
          {{ filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Active' : 'Delivered' }}
        </button>
      </div>
      <LoadingState v-if="query.isPending.value" label="Loading orders…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <template v-else-if="orders.length">
        <RouterLink
          v-for="order in orders"
          :key="order.id"
          class="order-link"
          :to="`/app/orders/${order.id}`"
        >
          <BaseCard class="order-card" padding="md">
            <div class="order-card__topline">
              <div>
                <p>{{ order.orderNumber }}</p>
                <h2>{{ order.itemCount }} {{ order.itemCount === 1 ? 'item' : 'items' }}</h2>
              </div>
              <StatusChip
                :label="order.status.replaceAll('_', ' ')"
                :tone="statusTone(order.status)"
              />
            </div>
            <div class="order-card__bottom">
              <span>Placed {{ formatManilaDate(order.placedAt) }}</span
              ><strong>{{ formatPhp(order.total.amountMinor) }}</strong>
            </div>
          </BaseCard>
        </RouterLink>
      </template>
      <EmptyState
        v-else
        icon="bag"
        title="No matching orders"
        message="Orders you place through Gabayan will appear here with their delivery progress."
        action-label="Explore supplies"
        action-to="/app/marketplace"
      />
    </main>
  </div>
</template>

<style scoped>
.orders-page__content {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.shop-entry {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-3);
  background: linear-gradient(145deg, white, var(--color-brand-50));
}
.shop-entry > span {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--color-brand-700);
  background: var(--color-brand-100);
}
.shop-entry h2,
.shop-entry p {
  margin: 0;
}
.shop-entry h2 {
  font-size: 1rem;
}
.shop-entry p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}
.shop-entry .button {
  grid-column: 1 / -1;
}
.filters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}
.filters button {
  min-height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  background: white;
  font-weight: 700;
}
.filters button[aria-pressed='true'] {
  border-color: var(--color-brand-700);
  color: white;
  background: var(--color-brand-700);
}
.order-link {
  color: inherit;
  text-decoration: none;
}
.order-link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
  border-radius: var(--radius-lg);
}
.order-card {
  display: grid;
  gap: var(--space-4);
}
.order-card__topline,
.order-card__bottom {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.order-card p,
.order-card h2 {
  margin: 0;
}
.order-card p {
  color: var(--color-brand-800);
  font-size: 0.75rem;
  font-weight: 800;
}
.order-card h2 {
  margin-top: var(--space-1);
  font-size: 1rem;
}
.order-card__bottom {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.order-card__bottom strong {
  color: var(--color-text);
  font-size: 0.875rem;
}
button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
