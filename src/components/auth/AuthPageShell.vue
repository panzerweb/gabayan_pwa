<script setup lang="ts">
import AppBrand from '@/components/brand/AppBrand.vue'

defineProps<{ eyebrow: string; title: string; message: string }>()
</script>

<template>
  <main class="auth-page app-frame">
    <header><AppBrand /></header>
    <section class="auth-page__content">
      <div class="auth-page__intro">
        <p>{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <span>{{ message }}</span>
      </div>
      <slot />
      <footer v-if="$slots.footer"><slot name="footer" /></footer>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  background: var(--color-surface);
}

.auth-page > header {
  padding: calc(var(--space-5) + env(safe-area-inset-top)) var(--space-5) var(--space-3);
}

.auth-page__content {
  display: grid;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-5) calc(var(--space-6) + env(safe-area-inset-bottom));
}

.auth-page__intro p,
.auth-page__intro h1,
.auth-page__intro span {
  margin: 0;
}

.auth-page__intro p {
  color: var(--color-aqua-700);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-page__intro h1 {
  margin-top: var(--space-2);
  font-size: clamp(2rem, 8vw, 2.5rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.auth-page__intro span {
  display: block;
  margin-top: var(--space-3);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.auth-page__content > footer {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-align: center;
}

.auth-page__content > footer :deep(a) {
  color: var(--color-brand-700);
  font-weight: 750;
}
</style>
