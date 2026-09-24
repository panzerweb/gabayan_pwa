<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import {
  ApiError,
  completeHarvest,
  getHarvestReadiness,
  recordsQueryKeys,
  type HarvestCompletion,
} from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@stores/toast.store'
import { formatManilaDate, formatPhp, formatQuantity, manilaDateToday } from '@core/utils/format'

const route = useRoute()
const session = useSessionStore()
const toast = useToastStore()
const queryClient = useQueryClient()
const { isOnline } = useOnlineStatus()
const cultivationId = computed(() => String(route.params.cultivationId))
const harvestDate = ref(manilaDateToday())
const numberHarvested = ref('')
const totalWeight = ref('')
const averageWeight = ref('')
const sellingPrice = ref('')
const notes = ref('')
const errorMessage = ref('')
const idempotencyKey = ref(crypto.randomUUID())
const completion = ref<HarvestCompletion | null>(null)

const query = useQuery({
  queryKey: computed(() => recordsQueryKeys.readiness(cultivationId.value)),
  queryFn: () => getHarvestReadiness(cultivationId.value, session.accessToken!),
})
const readiness = computed(() => query.data.value?.data)
const canRecord = computed(() =>
  ['READY_SOON', 'POTENTIALLY_READY'].includes(readiness.value?.status ?? ''),
)
const readinessLabel = computed(() =>
  (readiness.value?.status ?? 'INSUFFICIENT_DATA').replaceAll('_', ' '),
)

const mutation = useMutation({
  mutationFn: () =>
    completeHarvest(
      cultivationId.value,
      {
        harvestDate: harvestDate.value,
        numberHarvested: Number(numberHarvested.value),
        totalHarvestWeight: { value: Number(totalWeight.value), unit: 'KG' },
        averageFishWeight: { value: Number(averageWeight.value), unit: 'G' },
        sellingPricePerKg: {
          amountMinor: Math.round(Number(sellingPrice.value) * 100),
          currency: 'PHP',
        },
        notes: notes.value.trim() || null,
      },
      session.accessToken!,
      idempotencyKey.value,
    ),
})

async function submit() {
  errorMessage.value = ''
  const count = Number(numberHarvested.value)
  const weight = Number(totalWeight.value)
  const average = Number(averageWeight.value)
  const price = Number(sellingPrice.value)
  if (!Number.isInteger(count) || count <= 0 || weight <= 0 || average <= 0 || price < 0) {
    errorMessage.value = 'Enter valid harvested count, weight, average weight, and selling price.'
    return
  }
  if (!isOnline.value) {
    errorMessage.value =
      'Reconnect before completing harvest. This high-impact record is not queued.'
    return
  }
  try {
    const result = await mutation.mutateAsync()
    completion.value = result.data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cultivations'] }),
      queryClient.invalidateQueries({ queryKey: ['cultivation', cultivationId.value] }),
      queryClient.invalidateQueries({ queryKey: ['cultivation-timeline', cultivationId.value] }),
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] }),
    ])
    toast.show('Harvest recorded. Cultivation moved to Completed.', 'success')
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'We couldn’t record the harvest.'
  }
}
</script>

<template>
  <div>
    <AppHeader
      title="Harvest readiness"
      show-back
      :back-to="`/app/cultivations/${cultivationId}`"
    />
    <main class="harvest-page">
      <template v-if="completion">
        <section class="completion-heading">
          <span aria-hidden="true">✓</span>
          <p>Cultivation completed</p>
          <h1>{{ completion.cultivation.name }}</h1>
          <small>{{ formatManilaDate(completion.harvest.harvestDate) }}</small>
        </section>
        <BaseCard class="summary-card" padding="lg">
          <h2>Harvest summary</h2>
          <dl>
            <div>
              <dt>Fish harvested</dt>
              <dd>{{ completion.summary.fishHarvested.toLocaleString() }}</dd>
            </div>
            <div>
              <dt>Total harvest</dt>
              <dd>
                {{
                  formatQuantity(
                    completion.summary.totalHarvestWeight.value,
                    completion.summary.totalHarvestWeight.unit,
                  )
                }}
              </dd>
            </div>
            <div>
              <dt>Recorded mortality</dt>
              <dd>{{ completion.summary.recordedMortality }}</dd>
            </div>
            <div>
              <dt>Recorded survival</dt>
              <dd>{{ completion.summary.survivalRatePercent }}%</dd>
            </div>
            <div>
              <dt>Culture duration</dt>
              <dd>{{ completion.summary.cultureDurationDays }} days</dd>
            </div>
            <div>
              <dt>Estimated revenue</dt>
              <dd>{{ formatPhp(completion.summary.estimatedRevenue.amountMinor) }}</dd>
            </div>
          </dl>
          <p>
            This summary is based on your recorded values. Revenue is an estimate and does not
            subtract expenses.
          </p>
        </BaseCard>
        <BaseButton :to="{ path: '/app/cultivations', query: { view: 'completed' } }">
          View completed cultivations
        </BaseButton>
      </template>

      <template v-else>
        <LoadingState v-if="query.isPending.value" label="Checking harvest readiness…" />
        <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
        <template v-else-if="readiness">
          <BaseCard class="readiness-card" padding="lg">
            <StatusChip
              :label="readinessLabel"
              :tone="canRecord ? 'success' : readiness.status === 'MONITOR' ? 'warning' : 'neutral'"
            />
            <h1>{{ readiness.message }}</h1>
            <div class="readiness-metrics">
              <div>
                <span>Latest average</span
                ><strong>{{
                  readiness.estimatedAverageWeight
                    ? formatQuantity(
                        readiness.estimatedAverageWeight.value,
                        readiness.estimatedAverageWeight.unit,
                      )
                    : 'Not recorded'
                }}</strong>
              </div>
              <div>
                <span>Estimated biomass</span
                ><strong>{{
                  readiness.estimatedBiomass
                    ? formatQuantity(
                        readiness.estimatedBiomass.value,
                        readiness.estimatedBiomass.unit,
                      )
                    : 'Unavailable'
                }}</strong>
              </div>
            </div>
            <ul>
              <li v-for="basis in readiness.basis" :key="basis">{{ basis }}</li>
            </ul>
            <aside>
              <strong>Estimate notice</strong><span>{{ readiness.disclaimer }}</span
              ><small>Rule {{ readiness.ruleVersion }}</small>
            </aside>
          </BaseCard>

          <BaseCard v-if="canRecord" class="harvest-form-card" padding="lg">
            <h2>Record completed harvest</h2>
            <p>Only submit after the harvest has happened. This closes the cultivation.</p>
            <form @submit.prevent="submit">
              <BaseInput v-model="harvestDate" label="Harvest date" type="date" required />
              <BaseInput
                v-model="numberHarvested"
                label="Fish harvested"
                type="number"
                inputmode="numeric"
                :min="1"
                :step="1"
                required
              />
              <BaseInput
                v-model="totalWeight"
                label="Total harvest weight"
                type="number"
                inputmode="decimal"
                suffix="kg"
                :min="0.01"
                :step="0.01"
                required
              />
              <BaseInput
                v-model="averageWeight"
                label="Average fish weight"
                type="number"
                inputmode="decimal"
                suffix="g"
                :min="0.01"
                :step="0.01"
                required
              />
              <BaseInput
                v-model="sellingPrice"
                label="Selling price per kg"
                type="number"
                inputmode="decimal"
                suffix="PHP"
                :min="0"
                :step="0.01"
                required
              />
              <label class="text-field"
                ><span>Notes (optional)</span><textarea v-model="notes" rows="3" maxlength="300" />
              </label>
              <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
              <BaseButton type="submit" :loading="mutation.isPending.value" :disabled="!isOnline"
                >Complete cultivation</BaseButton
              >
            </form>
          </BaseCard>
          <BaseCard v-else padding="md">
            <p class="monitor-copy">
              Add a current growth measurement before recording harvest. Readiness is never inferred
              from elapsed time alone.
            </p>
            <BaseButton :to="`/app/cultivations/${cultivationId}/growth`" variant="secondary"
              >Update growth measurement</BaseButton
            >
          </BaseCard>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped>
.harvest-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.readiness-card,
.summary-card,
.harvest-form-card {
  display: grid;
  gap: var(--space-4);
}
.readiness-card h1,
.summary-card h2,
.harvest-form-card h2,
.harvest-form-card p,
.monitor-copy {
  margin: 0;
}
.readiness-card h1 {
  font-size: 1.3rem;
  line-height: 1.35;
}
.readiness-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.readiness-metrics div {
  display: grid;
  gap: var(--space-1);
}
.readiness-metrics span {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
.readiness-card ul {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.55;
}
.readiness-card aside {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.75rem;
  line-height: 1.45;
}
.harvest-form-card > p,
.monitor-copy {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
form {
  display: grid;
  gap: var(--space-4);
}
.text-field {
  display: grid;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 750;
}
textarea {
  resize: vertical;
  padding: 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font: inherit;
}
textarea:focus-visible {
  outline: 3px solid var(--color-focus);
}
.form-error {
  margin: 0;
  color: var(--color-danger-700);
  font-size: 0.75rem;
  font-weight: 700;
}
.completion-heading {
  display: grid;
  justify-items: center;
  text-align: center;
}
.completion-heading > span {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: var(--color-success-700);
  font-size: 1.5rem;
}
.completion-heading p,
.completion-heading h1,
.completion-heading small {
  margin: 0;
}
.completion-heading p {
  margin-top: var(--space-3);
  color: var(--color-success-800);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}
.completion-heading h1 {
  margin-top: var(--space-1);
  font-size: 1.5rem;
}
.completion-heading small {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
}
.summary-card h2 {
  font-size: 1.1rem;
}
.summary-card dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin: 0;
}
.summary-card dt {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
.summary-card dd {
  margin: var(--space-1) 0 0;
  font-weight: 800;
}
.summary-card p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
