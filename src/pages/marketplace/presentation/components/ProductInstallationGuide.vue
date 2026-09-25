<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseCard from '@components/ui/BaseCard.vue'

import type { InstallationGuide } from '../../domain/marketplace.model'

// How to set a product up: the cautions first, so they are read before the numbered steps,
// then the steps in order and the guide's disclaimer.
defineProps<{ guide: InstallationGuide }>()
</script>

<template>
  <BaseCard padding="md">
    <section class="install-guide" aria-labelledby="install-guide-heading">
      <h2 id="install-guide-heading">How to install</h2>
      <div v-if="guide.cautions.length" class="install-guide__cautions">
        <strong><AppIcon name="warning" :size="18" /> Before you start</strong>
        <ul aria-label="Safety cautions">
          <li v-for="caution in guide.cautions" :key="caution">{{ caution }}</li>
        </ul>
      </div>
      <ol class="install-guide__steps" aria-label="Installation steps">
        <li v-for="step in guide.steps" :key="step.order">
          <span class="install-guide__number" aria-hidden="true">{{ step.order }}</span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.instruction }}</p>
          </div>
        </li>
      </ol>
      <p class="install-guide__disclaimer">
        <strong v-if="guide.isDemo">Demo guide. </strong>{{ guide.disclaimer }}
      </p>
    </section>
  </BaseCard>
</template>

<style scoped>
.install-guide {
  display: grid;
  gap: var(--space-3);
}
.install-guide h2,
.install-guide p,
.install-guide ul,
.install-guide ol {
  margin: 0;
}
.install-guide h2 {
  font-size: 1rem;
}
.install-guide__cautions {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.8rem;
  line-height: 1.45;
}
.install-guide__cautions strong {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.install-guide__cautions ul {
  display: grid;
  gap: var(--space-1);
  padding-left: var(--space-5);
}
.install-guide__steps {
  display: grid;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}
.install-guide__steps li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
}
.install-guide__number {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  color: var(--color-brand-800);
  background: var(--color-brand-100);
  font-size: 0.875rem;
  font-weight: 800;
}
.install-guide__steps strong {
  font-size: 0.875rem;
}
.install-guide__steps p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
.install-guide__disclaimer {
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
}
</style>
