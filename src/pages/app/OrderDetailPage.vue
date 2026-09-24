<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { commerceQueryKeys, getOrder } from '@/services/api'
import { useSessionStore } from '@stores/session.store'
import { formatManilaDate, formatPhp } from '@core/utils/format'

const route = useRoute()
const session = useSessionStore()
const orderId = computed(() => String(route.params.orderId))
const query = useQuery({
  queryKey: computed(() => commerceQueryKeys.order(orderId.value)),
  queryFn: () => getOrder(orderId.value, session.accessToken!),
})
const order = computed(() => query.data.value?.data)
</script>

<template>
  <div>
    <AppHeader :title="order?.orderNumber ?? 'Order details'" show-back back-to="/app/orders" />
    <main class="order-page">
      <LoadingState v-if="query.isPending.value" label="Loading order…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <template v-else-if="order">
        <BaseCard v-if="route.query.placed === '1'" class="success-card" padding="lg">
          <span aria-hidden="true"><AppIcon name="check" :size="32" /></span>
          <div>
            <h1>Order placed</h1>
            <p>Your order is confirmed and the cart has been cleared.</p>
          </div>
        </BaseCard>
        <section class="order-heading">
          <div>
            <p>Placed {{ formatManilaDate(order.placedAt) }}</p>
            <h1>{{ formatPhp(order.total.amountMinor) }}</h1>
          </div>
          <StatusChip :label="order.status.replaceAll('_', ' ')" tone="info" />
        </section>
        <BaseButton :to="`/app/orders/${order.id}/tracking`"
          ><AppIcon name="truck" :size="19" /> Track order</BaseButton
        >
        <BaseCard padding="md">
          <h2>Items</h2>
          <ul class="items">
            <li v-for="item in order.items" :key="item.id">
              <span aria-hidden="true"><AppIcon name="bag" /></span>
              <div>
                <strong>{{ item.name }}</strong
                ><small>{{ item.quantity }} × {{ formatPhp(item.unitPrice.amountMinor) }}</small>
              </div>
              <b>{{ formatPhp(item.lineTotal.amountMinor) }}</b>
            </li>
          </ul>
        </BaseCard>
        <BaseCard class="summary" padding="md">
          <h2>Payment summary</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{{ formatPhp(order.subtotal.amountMinor) }}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{{ formatPhp(order.deliveryFee.amountMinor) }}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{{ order.paymentMethod.replaceAll('_', ' ') }}</dd>
            </div>
            <div class="summary__total">
              <dt>Total</dt>
              <dd>{{ formatPhp(order.total.amountMinor) }}</dd>
            </div>
          </dl>
        </BaseCard>
        <BaseCard padding="md"
          ><h2>Delivery address</h2>
          <address>
            {{ order.deliveryAddress.recipientName }}<br />{{ order.deliveryAddress.line1 }},
            {{ order.deliveryAddress.barangay }}<br />{{ order.deliveryAddress.cityMunicipality }},
            {{ order.deliveryAddress.province }} {{ order.deliveryAddress.postalCode }}
          </address></BaseCard
        >
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
.success-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  border-color: var(--color-success-200);
  background: var(--color-success-100);
}
.success-card > span {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: var(--color-success-700);
}
.success-card h1,
.success-card p {
  margin: 0;
}
.success-card h1 {
  font-size: 1.2rem;
}
.success-card p {
  margin-top: var(--space-1);
  color: var(--color-success-800);
  font-size: 0.75rem;
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
.order-page article > h2,
.items,
.summary dl,
.summary dt,
.summary dd,
address {
  margin: 0;
}
.order-page article > h2 {
  font-size: 1rem;
}
.items {
  padding: 0;
  list-style: none;
}
.items li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.items li:last-child {
  border-bottom: 0;
}
.items li > span {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: var(--radius-sm);
  color: var(--color-brand-700);
  background: var(--color-brand-100);
}
.items small {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
.items b {
  font-size: 0.75rem;
}
.summary dl {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.summary dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.summary dd {
  text-align: right;
}
.summary__total {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-text) !important;
  font-weight: 800;
}
address {
  margin-top: var(--space-3);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-style: normal;
  line-height: 1.55;
}
</style>
