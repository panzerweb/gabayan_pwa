<script setup lang="ts">
import AppBrand from '@/components/brand/AppBrand.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <div class="welcome-page">
    <section class="welcome-page__hero">
      <header class="welcome-page__header">
        <AppBrand inverse />
      </header>

      <div class="welcome-illustration" aria-hidden="true">
        <div class="welcome-illustration__sun" />
        <svg viewBox="0 0 360 270" focusable="false">
          <path
            class="hill hill--back"
            d="M0 170C65 135 120 139 178 164c62 27 120 19 182-26v132H0Z"
          />
          <path class="hill hill--front" d="M0 202c68-22 129-12 186 20 51 28 109 27 174-4v72H0Z" />
          <path
            class="water"
            d="M15 223c51-27 99-25 145 5 47 30 96 31 147 3 16-9 33-13 53-11v70H0v-58c5-3 10-6 15-9Z"
          />
          <path
            class="pond-line"
            d="M24 243c43-20 87-17 132 8 51 28 102 28 153 1 16-8 32-12 49-11"
          />
          <path
            class="person"
            d="M185 114c12 0 22 10 22 22 0 9-5 16-12 20l12 58h-50l12-58c-7-4-12-11-12-20 0-12 10-22 22-22h6Z"
          />
          <path class="hat" d="M153 127c9-17 22-25 39-24 16 1 28 9 36 24-26 7-51 7-75 0Z" />
          <path class="rod" d="m198 163 57-54" />
          <path class="line" d="M255 109c35 21 42 55 20 102" />
          <path class="fish" d="M260 218c17-13 34-11 50 4-16 15-33 16-50 4l-13 10 2-24Z" />
          <circle class="fish-eye" cx="299" cy="221" r="2" />
        </svg>
        <span class="bubble bubble--one" />
        <span class="bubble bubble--two" />
        <span class="bubble bubble--three" />
      </div>
    </section>

    <section class="welcome-page__content" aria-labelledby="welcome-heading">
      <p class="eyebrow">Your aquaculture companion</p>
      <h1 id="welcome-heading">Start your fish farming journey with confidence.</h1>
      <p class="welcome-page__copy">
        From preparing your culture area to feeding and harvest, Gabayan guides you every step of
        the way.
      </p>

      <div class="welcome-page__actions">
        <BaseButton to="/create-account">Get Started</BaseButton>
        <BaseButton to="/sign-in" variant="secondary">I already have an account</BaseButton>
      </div>

      <p class="welcome-page__promise">Alaga mo, gabay namin.</p>
    </section>
  </div>
</template>

<style scoped>
.welcome-page {
  min-height: 100dvh;
  background: var(--color-surface);
}

.welcome-page__hero {
  position: relative;
  min-height: 45dvh;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  border-radius: 0 0 2rem 2rem;
  background:
    radial-gradient(circle at 78% 14%, rgb(255 255 255 / 18%) 0 4rem, transparent 4.1rem),
    linear-gradient(155deg, var(--color-brand-800), var(--color-brand-600));
}

.welcome-page__header {
  position: relative;
  z-index: 2;
  width: min(100%, 32rem);
  margin-inline: auto;
  padding: var(--space-5) var(--space-5) 0;
}

.welcome-illustration {
  position: relative;
  width: min(100%, 30rem);
  margin: -0.5rem auto 0;
}

.welcome-illustration svg {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  overflow: visible;
}

.welcome-illustration__sun {
  position: absolute;
  top: 2.5rem;
  right: 18%;
  width: 4.5rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #fef3c7;
  box-shadow: 0 0 0 1rem rgb(254 243 199 / 14%);
}

.hill--back {
  fill: #a7f3d0;
  opacity: 0.6;
}

.hill--front {
  fill: #4ade80;
  opacity: 0.72;
}

.water {
  fill: #38bdf8;
}

.pond-line,
.rod,
.line {
  fill: none;
  stroke: #e0f2fe;
  stroke-linecap: round;
  stroke-width: 4;
}

.line {
  stroke-width: 2;
}

.person {
  fill: #0c4a6e;
}

.hat {
  fill: #fbbf24;
}

.fish {
  fill: #fff;
}

.fish-eye {
  fill: #075985;
}

.bubble {
  position: absolute;
  z-index: 2;
  width: 0.55rem;
  aspect-ratio: 1;
  border: 2px solid rgb(255 255 255 / 72%);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

.bubble--one {
  right: 18%;
  bottom: 12%;
}

.bubble--two {
  right: 12%;
  bottom: 19%;
  width: 0.8rem;
  animation-delay: 500ms;
}

.bubble--three {
  right: 22%;
  bottom: 23%;
  width: 0.4rem;
  animation-delay: 900ms;
}

.welcome-page__content {
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

.welcome-page__copy {
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.65;
}

.welcome-page__actions {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.welcome-page__promise {
  margin: var(--space-5) 0 0;
  color: var(--color-text-subtle);
  font-size: 0.8125rem;
  font-weight: 650;
  text-align: center;
}

@keyframes float {
  50% {
    translate: 0 -0.5rem;
  }
}

@media (min-height: 780px) {
  .welcome-page__hero {
    min-height: 48dvh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bubble {
    animation: none;
  }
}
</style>
