<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@router/route-names'
</script>

<template>
  <BaseCard class="shop-entry" padding="md">
    <span aria-hidden="true"><AppIcon name="bag" /></span>
    <div>
      <h2>Farm supplies</h2>
      <p>Browse products when they support a cultivation need.</p>
    </div>
    <BaseButton :to="{ name: ROUTE_NAMES.marketplace }" variant="secondary">Shop</BaseButton>
  </BaseCard>
</template>

<style scoped>
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
</style>
