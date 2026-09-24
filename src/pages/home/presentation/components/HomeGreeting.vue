<script setup lang="ts">
defineProps<{ name: string; headline: string }>()
</script>

<template>
  <section class="home-greeting">
    <p>Good day, {{ name }}</p>
    <h1>{{ headline }}</h1>
  </section>
</template>

<style scoped>
.home-greeting p,
.home-greeting h1 {
  margin: 0;
}
.home-greeting p {
  color: var(--color-aqua-700);
  font-size: 0.75rem;
  font-weight: 800;
}
.home-greeting h1 {
  margin-top: var(--space-1);
  font-size: clamp(1.7rem, 7vw, 2rem);
  line-height: 1.14;
  letter-spacing: -0.04em;
}
</style>
