<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
}>()
</script>

<template>
  <div class="section-heading">
    <div>
      <p>{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
    </div>
    <slot name="action" />
  </div>
</template>

<style scoped>
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}
p,
h2 {
  margin: 0;
}
p {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.5;
  text-transform: uppercase;
}
h2 {
  margin-top: var(--space-1);
  font-size: 1.1rem;
}
</style>
