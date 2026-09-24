<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import CartLink from '@pages/cart/presentation/components/CartLink.vue'
import { ROUTE_NAMES } from '@router/route-names'

import OrderCard from '../components/OrderCard.vue'
import OrderFilterTabs from '../components/OrderFilterTabs.vue'
import ShopEntryCard from '../components/ShopEntryCard.vue'
import { useOrders } from '../composables/useOrders'

const { orders, filter, selectFilter, loading, loadFailed, refetch } = useOrders()
</script>

<template>
  <div class="orders-page">
    <AppHeader title="Orders" subtitle="Supplies and delivery tracking">
      <template #trailing><CartLink /></template>
    </AppHeader>
    <main class="orders-page__content">
      <ShopEntryCard />
      <OrderFilterTabs :selected="filter" @select="selectFilter" />
      <LoadingState v-if="loading" label="Loading orders…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else-if="orders.length">
        <OrderCard v-for="order in orders" :key="order.id" :order="order" />
      </template>
      <EmptyState
        v-else
        icon="bag"
        title="No matching orders"
        message="Orders you place through Gabayan will appear here with their delivery progress."
        action-label="Explore supplies"
        :action-to="{ name: ROUTE_NAMES.marketplace }"
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
</style>
