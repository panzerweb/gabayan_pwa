<script setup lang="ts">
import { useRouter } from 'vue-router'

import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import BaseInput from '@components/ui/BaseInput.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { useStockingEstimate } from '../composables/useStockingEstimate'

const router = useRouter()
const { plannedFingerlings, fieldError, formError, estimating, submitPlannedCount } =
  useStockingEstimate()

async function calculate() {
  if (await submitPlannedCount()) await router.push({ name: ROUTE_NAMES.setupStockingResult })
}
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>How many fingerlings are you planning?</h2>
      <p>Enter your planned count. The server will compare it with the configured demo range.</p>
    </div>
    <BaseCard class="fingerling-note" padding="md">
      Start with the quantity you are considering—not the number you think Gabayan expects.
    </BaseCard>
    <form class="fingerling-form" novalidate @submit.prevent="calculate">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <BaseInput
        v-model="plannedFingerlings"
        label="Planned fingerlings"
        type="number"
        inputmode="numeric"
        suffix="fish"
        :min="1"
        :step="1"
        :error="fieldError"
        required
      />
      <div class="setup-flow-actions">
        <BaseButton type="submit" :loading="estimating">Calculate estimate</BaseButton>
      </div>
    </form>
  </section>
</template>

<style scoped>
.fingerling-note {
  margin-top: var(--space-6);
  color: var(--color-text-muted);
  background: var(--color-neutral-50);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.fingerling-form {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-6);
}
</style>
