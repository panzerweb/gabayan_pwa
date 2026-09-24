<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import DeliveryAddressCard from '@pages/orders/presentation/components/DeliveryAddressCard.vue'
import type { Address } from '@pages/profile/domain/profile.model'
import { ROUTE_NAMES } from '@router/route-names'

defineProps<{ address: Address | null }>()
</script>

<template>
  <DeliveryAddressCard v-if="address" :address="address" heading="Deliver to" show-label />
  <BaseCard v-else class="no-address" padding="md">
    <h2>No delivery address yet</h2>
    <p>Add the address where the courier should bring your supplies, then come back here.</p>
    <BaseButton :to="{ name: ROUTE_NAMES.profile }" variant="secondary">
      Add an address in Profile
    </BaseButton>
  </BaseCard>
</template>

<style scoped>
.no-address {
  display: grid;
  gap: var(--space-3);
}
.no-address h2,
.no-address p {
  margin: 0;
}
.no-address h2 {
  font-size: 1rem;
}
.no-address p {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
