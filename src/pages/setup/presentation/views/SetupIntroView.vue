<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@router/route-names'
</script>

<template>
  <section class="setup-flow-page setup-intro">
    <div class="setup-intro__visual" aria-hidden="true"><AppIcon name="fish" :size="48" /></div>
    <div class="setup-flow-intro">
      <h2>Plan your first cultivation</h2>
      <p>
        Answer four short questions. Gabayan will prepare a demo stocking estimate and explain how
        it was calculated.
      </p>
    </div>
    <BaseCard class="setup-intro__steps" padding="lg">
      <ol>
        <li>
          <strong>Choose a species</strong
          ><span>Tell us which fish or shrimp you plan to raise.</span>
        </li>
        <li>
          <strong>Select an environment</strong
          ><span>We’ll check the demo compatibility profile.</span>
        </li>
        <li>
          <strong>Measure the culture area</strong
          ><span>Enter length, width, and water depth.</span>
        </li>
        <li>
          <strong>Enter fingerlings</strong><span>Compare your plan with an estimated range.</span>
        </li>
      </ol>
    </BaseCard>
    <p class="setup-intro__disclaimer">
      Estimates are planning aids, not scientifically verified advice. Local conditions and
      qualified guidance still matter.
    </p>
    <div class="setup-flow-actions">
      <BaseButton :to="{ name: ROUTE_NAMES.setupSpecies }">Start setup</BaseButton>
      <BaseButton :to="{ name: ROUTE_NAMES.home }" variant="text">Set up later</BaseButton>
    </div>
  </section>
</template>

<style scoped>
.setup-intro__visual {
  display: grid;
  width: 6rem;
  height: 6rem;
  place-items: center;
  margin-bottom: var(--space-5);
  border-radius: 50%;
  color: var(--color-brand-700);
  background: linear-gradient(145deg, var(--color-brand-100), var(--color-aqua-100));
}

.setup-intro__steps {
  margin-top: var(--space-6);
}

.setup-intro__steps ol {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding-left: 1.25rem;
}

.setup-intro__steps li {
  padding-left: var(--space-2);
}

.setup-intro__steps strong,
.setup-intro__steps span {
  display: block;
}

.setup-intro__steps strong {
  font-size: 0.875rem;
}

.setup-intro__steps span {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}

.setup-intro__disclaimer {
  margin: var(--space-4) 0 0;
  color: var(--color-text-subtle);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
