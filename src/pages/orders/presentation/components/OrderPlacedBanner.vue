<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseCard from '@components/ui/BaseCard.vue'
</script>

<template>
  <BaseCard class="success-card" padding="lg" role="status">
    <span aria-hidden="true"><AppIcon name="check" :size="32" /></span>
    <div>
      <h1>Order placed</h1>
      <p>Your order is confirmed and the cart has been cleared.</p>
    </div>
  </BaseCard>
</template>

<style scoped>
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
</style>
