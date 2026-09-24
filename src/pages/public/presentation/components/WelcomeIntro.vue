<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'
</script>

<template>
  <section class="welcome-intro" aria-labelledby="welcome-heading">
    <p class="eyebrow">Your aquaculture companion</p>
    <h1 id="welcome-heading">Start your fish farming journey with confidence.</h1>
    <p class="welcome-intro__copy">
      From preparing your culture area to feeding and harvest, Gabayan guides you every step of the
      way.
    </p>

    <div class="welcome-intro__actions">
      <BaseButton :to="{ name: ROUTE_NAMES.createAccount }">Get Started</BaseButton>
      <BaseButton :to="{ name: ROUTE_NAMES.signIn }" variant="secondary">
        I already have an account
      </BaseButton>
    </div>

    <p class="welcome-intro__promise">Alaga mo, gabay namin.</p>
  </section>
</template>

<style scoped>
.welcome-intro {
  width: min(100%, 32rem);
  margin-inline: auto;
  padding: var(--space-7) var(--space-5) calc(var(--space-6) + env(safe-area-inset-bottom));
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-aqua-700);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2rem, 8.6vw, 2.5rem);
  line-height: 1.08;
  letter-spacing: -0.045em;
}

.welcome-intro__copy {
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.65;
}

.welcome-intro__actions {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.welcome-intro__promise {
  margin: var(--space-5) 0 0;
  color: var(--color-text-subtle);
  font-size: 0.8125rem;
  font-weight: 650;
  text-align: center;
}
</style>
