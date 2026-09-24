<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import BaseModal from '@/components/overlays/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { ApiError, completeTask, operationalQueryKeys, type FarmTask } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@stores/toast.store'

const props = defineProps<{ task: FarmTask | null; open: boolean }>()
const emit = defineEmits<{ close: []; completed: [] }>()

const session = useSessionStore()
const toast = useToastStore()
const queryClient = useQueryClient()
const { isOnline } = useOnlineStatus()
const amount = ref('')
const notes = ref('')
const errorMessage = ref('')
const amountError = ref('')
const idempotencyKey = ref(crypto.randomUUID())
const unit = computed(() => props.task?.recommendedAmount?.unit ?? 'KG')

watch(
  () => [props.open, props.task] as const,
  ([open, task]) => {
    if (!open || !task) return
    amount.value = String(task.recommendedAmount?.value ?? '')
    notes.value = ''
    errorMessage.value = ''
    amountError.value = ''
    idempotencyKey.value = crypto.randomUUID()
  },
)

const mutation = useMutation({
  mutationFn: () => {
    const token = session.accessToken
    if (!token || !props.task) throw new Error('Your session is unavailable.')
    return completeTask(
      props.task.id,
      {
        completedAt: new Date().toISOString(),
        actualAmount: { value: Number(amount.value), unit: unit.value },
        notes: notes.value.trim() || null,
      },
      token,
      idempotencyKey.value,
    )
  },
})

async function submit() {
  errorMessage.value = ''
  amountError.value = ''
  const parsedAmount = Number(amount.value)
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    amountError.value = 'Enter an amount greater than 0.'
    return
  }
  if (!isOnline.value) {
    errorMessage.value = 'Reconnect before recording this feeding. It has not been queued.'
    return
  }
  try {
    await mutation.mutateAsync()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['cultivation'] }),
      queryClient.invalidateQueries({ queryKey: operationalQueryKeys.unreadNotifications }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ])
    toast.show('Feeding record saved.', 'success')
    emit('completed')
    emit('close')
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'We couldn’t save this feeding. Please try again.'
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    variant="sheet"
    title="Record feeding"
    :description="task ? `Complete ${task.title.toLowerCase()} for this cultivation.` : ''"
    @close="emit('close')"
  >
    <form class="feeding-form" @submit.prevent="submit">
      <BaseInput
        v-model="amount"
        label="Actual amount given"
        type="number"
        inputmode="decimal"
        :suffix="unit.toLowerCase()"
        :step="0.01"
        :min="0.01"
        :error="amountError"
        required
      />
      <label class="feeding-form__notes">
        <span>Notes (optional)</span>
        <textarea
          v-model="notes"
          rows="3"
          maxlength="300"
          placeholder="Example: Fish responded normally"
        />
      </label>
      <p class="feeding-form__estimate">
        The planned amount is a demo estimate. Adjust only from your actual observation and local
        guidance.
      </p>
      <p v-if="errorMessage" class="feeding-form__error" role="alert">{{ errorMessage }}</p>
      <BaseButton type="submit" :loading="mutation.isPending.value" :disabled="!isOnline">
        Save feeding record
      </BaseButton>
    </form>
  </BaseModal>
</template>

<style scoped>
.feeding-form {
  display: grid;
  gap: var(--space-4);
}

.feeding-form__notes {
  display: grid;
  gap: var(--space-2);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 750;
}

textarea {
  min-height: 5.5rem;
  resize: vertical;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font: inherit;
}

textarea:focus-visible {
  outline: 3px solid rgb(14 165 233 / 15%);
  border-color: var(--color-brand-600);
}

.feeding-form__estimate,
.feeding-form__error {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
}

.feeding-form__estimate {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.feeding-form__error {
  color: var(--color-danger-700);
  font-weight: 700;
}
</style>
