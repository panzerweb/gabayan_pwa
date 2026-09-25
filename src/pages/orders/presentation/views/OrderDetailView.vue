<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { formatManilaDate, formatPhp } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import DeliveryAddressCard from '../components/DeliveryAddressCard.vue'
import OrderItemsCard from '../components/OrderItemsCard.vue'
import OrderPaymentSummary from '../components/OrderPaymentSummary.vue'
import OrderPlacedBanner from '../components/OrderPlacedBanner.vue'
import OrderStatusChip from '../components/OrderStatusChip.vue'
import { useOrderDetail } from '../composables/useOrderDetail'

const route = useRoute()
const orderId = computed(() => String(route.params.orderId))
// Checkout lands here with `?placed=1` right after the order is created.
const justPlaced = computed(() => route.query.placed === '1')

const { order, loading, loadFailed, refetch } = useOrderDetail(orderId)
</script>

<template>
  <div>
    <AppHeader
      :title="order?.orderNumber ?? 'Order details'"
      show-back
      :back-to="{ name: ROUTE_NAMES.orders }"
    />
    <main class="order-page">
      <LoadingState v-if="loading" label="Loading order…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else-if="order">
        <OrderPlacedBanner v-if="justPlaced" />
        <section class="order-heading">
          <div>
            <p>Placed {{ formatManilaDate(order.placedAt) }}</p>
            <h1>{{ formatPhp(order.total.amountMinor) }}</h1>
          </div>
          <OrderStatusChip :status="order.status" />
        </section>
        <BaseButton :to="{ name: ROUTE_NAMES.orderTracking, params: { orderId: order.id } }"
          ><AppIcon name="truck" :size="19" /> Track order</BaseButton
        >
        <OrderItemsCard :items="order.items" />
        <OrderPaymentSummary :order="order" />
        <DeliveryAddressCard :address="order.deliveryAddress" />
      </template>
    </main>
  </div>
</template>

<style scoped>
.order-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.order-heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.order-heading p,
.order-heading h1 {
  margin: 0;
}
.order-heading p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.order-heading h1 {
  margin-top: var(--space-1);
  font-size: 1.7rem;
}
</style>
