<script setup lang="ts">
import { useId } from 'vue'

import AppIcon from '@components/ui/AppIcon.vue'
import StatusChip from '@components/ui/StatusChip.vue'

import { cultureSystemLimitLabel, planPriceLabel, type TierPlan } from '../../domain/tiers.model'

// One plan: its price (or that it has none yet), its culture-system limit and everything it
// includes. As a choice it carries a radio in the `name` group; the `action` slot holds a
// button when the plan is offered rather than chosen.
withDefaults(
  defineProps<{
    plan: TierPlan
    selectable?: boolean
    selected?: boolean
    current?: boolean
    name?: string
  }>(),
  { selectable: false, selected: false, current: false, name: 'plan' },
)

const emit = defineEmits<{ select: [] }>()

const inputId = useId()
</script>

<template>
  <article
    class="plan-card"
    :class="{ 'plan-card--selected': selectable && selected, 'plan-card--current': current }"
  >
    <div class="plan-card__head">
      <input
        v-if="selectable"
        :id="inputId"
        class="plan-card__radio"
        type="radio"
        :name="name"
        :value="plan.code"
        :checked="selected"
        @change="emit('select')"
      />
      <component
        :is="selectable ? 'label' : 'div'"
        class="plan-card__title"
        :for="selectable ? inputId : undefined"
      >
        <strong>{{ plan.name }}</strong>
        <span class="plan-card__price">{{ planPriceLabel(plan) }}</span>
      </component>
      <StatusChip v-if="current" label="Current plan" tone="success" />
    </div>
    <p class="plan-card__description">{{ plan.description }}</p>
    <p class="plan-card__limit">
      <AppIcon name="fish" :size="18" />
      {{ cultureSystemLimitLabel(plan.cultureSystemLimit) }}
    </p>
    <ul class="plan-card__entitlements" :aria-label="`${plan.name} includes`">
      <li v-for="entitlement in plan.entitlements" :key="entitlement.code">
        <AppIcon name="check" :size="16" :stroke-width="2.4" />
        {{ entitlement.label }}
      </li>
    </ul>
    <slot name="action" />
  </article>
</template>

<style scoped>
.plan-card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.plan-card--selected {
  border-color: var(--color-brand-600);
  background: var(--color-brand-50);
  box-shadow: 0 0 0 2px rgb(2 132 199 / 12%);
}

.plan-card--current {
  border-color: var(--color-success-200);
}

.plan-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.plan-card__radio {
  width: 1.375rem;
  height: 1.375rem;
  flex: none;
  margin: 0;
  accent-color: var(--color-brand-700);
}

.plan-card__radio:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.plan-card__title {
  display: grid;
  min-height: 2.75rem;
  flex: 1;
  align-content: center;
  gap: var(--space-1);
}

label.plan-card__title {
  cursor: pointer;
}

.plan-card__title strong {
  font-size: 1rem;
}

.plan-card__price {
  color: var(--color-brand-800);
  font-size: 0.875rem;
  font-weight: 700;
}

.plan-card__description,
.plan-card__limit {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.plan-card__description {
  color: var(--color-text-muted);
}

.plan-card__limit {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
}

.plan-card__entitlements {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
}

.plan-card__entitlements li {
  display: flex;
  align-items: start;
  gap: var(--space-2);
  line-height: 1.4;
}

.plan-card__entitlements :deep(svg) {
  flex: none;
  margin-top: 0.1rem;
  color: var(--color-success-700);
}
</style>
