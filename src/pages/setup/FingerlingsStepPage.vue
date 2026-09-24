<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { ApiError, createStockingEstimate } from '@/services/api'
import { useSessionStore } from '@stores/session.store'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const session = useSessionStore()
const router = useRouter()
const plannedFingerlings = ref(setup.draft.plannedFingerlings?.toString() ?? '')
const fieldError = ref('')
const formError = ref('')

const mutation = useMutation({
  mutationFn: (count: number) => {
    const token = session.accessToken
    const draft = setup.draft
    if (!token || !draft.speciesId || !draft.environmentId || !draft.dimensions) {
      throw new Error('Setup details are incomplete.')
    }
    return createStockingEstimate(
      {
        speciesId: draft.speciesId,
        environmentId: draft.environmentId,
        dimensions: draft.dimensions,
        plannedFingerlings: count,
      },
      token,
    )
  },
})

async function submit() {
  fieldError.value = ''
  formError.value = ''
  const count = Number(plannedFingerlings.value)
  if (!Number.isInteger(count) || count <= 0) {
    fieldError.value = 'Enter a whole number greater than 0.'
    return
  }
  if (!navigator.onLine) {
    formError.value = 'Reconnect before requesting a new stocking estimate.'
    return
  }
  try {
    const response = await mutation.mutateAsync(count)
    setup.setEstimate(response.data)
    await router.push('/setup/stocking-result')
  } catch (error) {
    formError.value =
      error instanceof ApiError
        ? error.message
        : 'We couldn’t prepare the estimate. Please try again.'
  }
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
    <form class="fingerling-form" novalidate @submit.prevent="submit">
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
        <BaseButton type="submit" :loading="mutation.isPending.value"
          >Calculate estimate</BaseButton
        >
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
