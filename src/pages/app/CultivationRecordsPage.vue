<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseModal from '@/components/overlays/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import {
  ApiError,
  createMortalityRecord,
  createWaterCheck,
  getFeedingPlan,
  listFeedingRecords,
  listMortalityRecords,
  listWaterChecks,
  recordsQueryKeys,
  type MortalityRecord,
} from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@stores/toast.store'
import { formatManilaDate, formatManilaTime, formatQuantity, manilaDateToday } from '@core/utils/format'

type RecordsTab = 'feeding' | 'mortality' | 'water' | 'plan'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const toast = useToastStore()
const queryClient = useQueryClient()
const { isOnline } = useOnlineStatus()
const cultivationId = computed(() => String(route.params.cultivationId))
const selectedTab = computed<RecordsTab>(() => {
  const value = String(route.query.tab ?? 'feeding')
  return ['feeding', 'mortality', 'water', 'plan'].includes(value)
    ? (value as RecordsTab)
    : 'feeding'
})
const modal = ref<'mortality' | 'water' | null>(null)
const recordDate = ref(manilaDateToday())
const fishCount = ref('')
const reason = ref<MortalityRecord['reason']>('UNKNOWN')
const clarity = ref('Clear')
const odor = ref('Normal')
const fishBehavior = ref('Active and feeding normally')
const unusualChanges = ref(false)
const actionTaken = ref('')
const notes = ref('')
const errorMessage = ref('')
const fieldError = ref('')
const idempotencyKey = ref(crypto.randomUUID())

const feedingQuery = useQuery({
  queryKey: computed(() => recordsQueryKeys.feedingRecords(cultivationId.value)),
  queryFn: () => listFeedingRecords(cultivationId.value, session.accessToken!),
})
const mortalityQuery = useQuery({
  queryKey: computed(() => recordsQueryKeys.mortality(cultivationId.value)),
  queryFn: () => listMortalityRecords(cultivationId.value, session.accessToken!),
})
const waterQuery = useQuery({
  queryKey: computed(() => recordsQueryKeys.waterChecks(cultivationId.value)),
  queryFn: () => listWaterChecks(cultivationId.value, session.accessToken!),
})
const planQuery = useQuery({
  queryKey: computed(() => recordsQueryKeys.feedingPlan(cultivationId.value)),
  queryFn: () => getFeedingPlan(cultivationId.value, session.accessToken!, manilaDateToday()),
})

const mortalityMutation = useMutation({
  mutationFn: () =>
    createMortalityRecord(
      cultivationId.value,
      {
        occurredOn: recordDate.value,
        fishCount: Number(fishCount.value),
        reason: reason.value,
        notes: notes.value.trim() || null,
      },
      session.accessToken!,
      idempotencyKey.value,
    ),
})
const waterMutation = useMutation({
  mutationFn: () =>
    createWaterCheck(
      cultivationId.value,
      {
        checkedAt: new Date(`${recordDate.value}T08:00:00+08:00`).toISOString(),
        observation: {
          clarity: clarity.value.trim(),
          odor: odor.value.trim(),
          fishBehavior: fishBehavior.value.trim(),
          unusualChanges: unusualChanges.value,
        },
        actionTaken: actionTaken.value.trim() || null,
        notes: notes.value.trim() || null,
      },
      session.accessToken!,
      idempotencyKey.value,
    ),
})

function chooseTab(tab: RecordsTab) {
  router.replace({ query: { ...route.query, tab } })
}

function startRecord(type: 'mortality' | 'water') {
  recordDate.value = manilaDateToday()
  fishCount.value = ''
  reason.value = 'UNKNOWN'
  clarity.value = 'Clear'
  odor.value = 'Normal'
  fishBehavior.value = 'Active and feeding normally'
  unusualChanges.value = false
  actionTaken.value = ''
  notes.value = ''
  fieldError.value = ''
  errorMessage.value = ''
  idempotencyKey.value = crypto.randomUUID()
  modal.value = type
}

async function invalidateRecords() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['cultivation', cultivationId.value] }),
    queryClient.invalidateQueries({ queryKey: recordsQueryKeys.feedingPlan(cultivationId.value) }),
    queryClient.invalidateQueries({ queryKey: recordsQueryKeys.readiness(cultivationId.value) }),
    queryClient.invalidateQueries({ queryKey: ['home-dashboard'] }),
  ])
}

async function submitMortality() {
  fieldError.value = ''
  errorMessage.value = ''
  if (!Number.isInteger(Number(fishCount.value)) || Number(fishCount.value) <= 0) {
    fieldError.value = 'Enter a whole number greater than 0.'
    return
  }
  if (!isOnline.value) {
    errorMessage.value = 'Reconnect before saving mortality. It has not been queued.'
    return
  }
  try {
    const result = await mortalityMutation.mutateAsync()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: recordsQueryKeys.mortality(cultivationId.value) }),
      invalidateRecords(),
    ])
    toast.show(
      `Mortality saved. Estimated live fish: ${result.data.stock.estimatedLiveFish.toLocaleString()}.`,
      'success',
    )
    modal.value = null
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : 'We couldn’t save this record.'
  }
}

async function submitWater() {
  errorMessage.value = ''
  if (!clarity.value.trim() || !odor.value.trim() || !fishBehavior.value.trim()) {
    errorMessage.value = 'Describe clarity, odor, and fish behavior.'
    return
  }
  if (!isOnline.value) {
    errorMessage.value = 'Reconnect before saving this water check. It has not been queued.'
    return
  }
  try {
    const result = await waterMutation.mutateAsync()
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: recordsQueryKeys.waterChecks(cultivationId.value),
      }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    ])
    toast.show(result.data.guidance[0]?.title ?? 'Water check saved.', 'success')
    modal.value = null
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : 'We couldn’t save this check.'
  }
}
</script>

<template>
  <div>
    <AppHeader title="Farm records" show-back :back-to="`/app/cultivations/${cultivationId}`" />
    <main class="records-page">
      <nav class="record-tabs" aria-label="Farm record categories">
        <button
          v-for="tab in ['feeding', 'mortality', 'water', 'plan'] as RecordsTab[]"
          :key="tab"
          type="button"
          :aria-current="selectedTab === tab ? 'page' : undefined"
          @click="chooseTab(tab)"
        >
          {{ tab === 'plan' ? 'Feed plan' : tab[0]?.toUpperCase() + tab.slice(1) }}
        </button>
      </nav>

      <template v-if="selectedTab === 'feeding'">
        <LoadingState v-if="feedingQuery.isPending.value" label="Loading feeding records…" />
        <ErrorState v-else-if="feedingQuery.isError.value" @retry="feedingQuery.refetch()" />
        <EmptyState
          v-else-if="!feedingQuery.data.value?.data.length"
          title="No feeding records"
          message="Complete a feeding task to add the first record."
        />
        <BaseCard
          v-for="record in feedingQuery.data.value?.data"
          v-else
          :key="record.id"
          class="record-card"
          padding="md"
        >
          <div>
            <strong>{{ formatQuantity(record.amount.value, record.amount.unit) }}</strong
            ><span>{{ formatManilaTime(record.fedAt) }}</span>
          </div>
          <p>{{ record.notes || 'No notes recorded.' }}</p>
          <small>{{ formatManilaDate(record.fedAt) }} · {{ record.recordedBy.fullName }}</small>
        </BaseCard>
      </template>

      <template v-else-if="selectedTab === 'mortality'">
        <div class="section-heading">
          <div>
            <h1>Mortality records</h1>
            <p>Keep the stock estimate auditable.</p>
          </div>
          <BaseButton size="sm" @click="startRecord('mortality')">Add</BaseButton>
        </div>
        <LoadingState v-if="mortalityQuery.isPending.value" label="Loading mortality…" />
        <ErrorState v-else-if="mortalityQuery.isError.value" @retry="mortalityQuery.refetch()" />
        <EmptyState
          v-else-if="!mortalityQuery.data.value?.data.length"
          title="No mortality recorded"
          message="Add a record only when a loss is observed."
        />
        <BaseCard
          v-for="record in mortalityQuery.data.value?.data"
          v-else
          :key="record.id"
          class="record-card"
          padding="md"
        >
          <div>
            <strong>{{ record.fishCount }} fish</strong
            ><StatusChip :label="record.reason.replace('_', ' ')" tone="warning" />
          </div>
          <p>{{ record.notes || 'No notes recorded.' }}</p>
          <small
            >{{ formatManilaDate(record.occurredOn) }} · {{ record.recordedBy.fullName }}</small
          >
        </BaseCard>
      </template>

      <template v-else-if="selectedTab === 'water'">
        <div class="section-heading">
          <div>
            <h1>Water checks</h1>
            <p>Record observations before taking major action.</p>
          </div>
          <BaseButton size="sm" @click="startRecord('water')">Add</BaseButton>
        </div>
        <LoadingState v-if="waterQuery.isPending.value" label="Loading water checks…" />
        <ErrorState v-else-if="waterQuery.isError.value" @retry="waterQuery.refetch()" />
        <EmptyState
          v-else-if="!waterQuery.data.value?.data.length"
          title="No water checks"
          message="Record the visible condition and fish behavior."
        />
        <BaseCard
          v-for="record in waterQuery.data.value?.data"
          v-else
          :key="record.id"
          class="record-card"
          padding="md"
        >
          <div>
            <strong>{{ record.observation.clarity || 'Clarity not noted' }}</strong
            ><StatusChip
              :label="record.observation.unusualChanges ? 'Change noted' : 'No unusual change'"
              :tone="record.observation.unusualChanges ? 'warning' : 'success'"
            />
          </div>
          <p>{{ record.observation.fishBehavior }} · {{ record.observation.odor }}</p>
          <aside
            v-for="guidance in record.guidance"
            :key="guidance.title"
            :class="`guidance guidance--${guidance.severity.toLowerCase()}`"
          >
            <strong>{{ guidance.title }}</strong
            ><span>{{ guidance.message }}</span
            ><small>{{ guidance.disclaimer }}</small>
          </aside>
          <small>{{ formatManilaDate(record.checkedAt) }} · {{ record.recordedBy.fullName }}</small>
        </BaseCard>
      </template>

      <template v-else>
        <LoadingState v-if="planQuery.isPending.value" label="Loading feeding plan…" />
        <ErrorState v-else-if="planQuery.isError.value" @retry="planQuery.refetch()" />
        <BaseCard v-else-if="planQuery.data.value" class="plan-card" padding="lg">
          <p>Daily demo estimate</p>
          <h1>
            {{
              formatQuantity(
                planQuery.data.value.data.dailyTotal.value,
                planQuery.data.value.data.dailyTotal.unit,
              )
            }}
          </h1>
          <dl>
            <div>
              <dt>Estimated live fish</dt>
              <dd>{{ planQuery.data.value.data.estimatedLiveFish.toLocaleString() }}</dd>
            </div>
            <div>
              <dt>Average weight basis</dt>
              <dd>
                {{
                  formatQuantity(
                    planQuery.data.value.data.estimatedAverageWeight.value,
                    planQuery.data.value.data.estimatedAverageWeight.unit,
                  )
                }}
              </dd>
            </div>
            <div>
              <dt>Demo feed rate</dt>
              <dd>{{ planQuery.data.value.data.feedRatePercent }}%</dd>
            </div>
          </dl>
          <ul>
            <li v-for="feeding in planQuery.data.value.data.feedings" :key="feeding.scheduledAt">
              <span>{{ feeding.label }} · {{ formatManilaTime(feeding.scheduledAt) }}</span
              ><strong>{{
                formatQuantity(feeding.recommendedAmount.value, feeding.recommendedAmount.unit)
              }}</strong>
            </li>
          </ul>
          <p>{{ planQuery.data.value.data.explanation }}</p>
          <aside class="estimate-note">
            <strong>Estimate notice</strong><span>{{ planQuery.data.value.data.disclaimer }}</span
            ><small>Rule {{ planQuery.data.value.data.ruleVersion }}</small>
          </aside>
        </BaseCard>
      </template>
    </main>

    <BaseModal
      :open="modal === 'mortality'"
      variant="sheet"
      title="Add mortality record"
      description="This updates estimated live fish and the feeding estimate."
      @close="modal = null"
    >
      <form class="record-form" @submit.prevent="submitMortality">
        <BaseInput v-model="recordDate" label="Date observed" type="date" required />
        <BaseInput
          v-model="fishCount"
          label="Number of fish"
          type="number"
          inputmode="numeric"
          :min="1"
          :step="1"
          :error="fieldError"
          required
        />
        <label class="text-field"
          ><span>Likely reason</span
          ><select v-model="reason">
            <option value="UNKNOWN">Unknown</option>
            <option value="WATER_QUALITY">Water quality</option>
            <option value="DISEASE">Disease</option>
            <option value="HANDLING">Handling</option>
            <option value="PREDATION">Predation</option>
            <option value="OTHER">Other</option>
          </select></label
        >
        <label class="text-field"
          ><span>Notes (optional)</span><textarea v-model="notes" rows="3" maxlength="300" />
        </label>
        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
        <BaseButton type="submit" :loading="mortalityMutation.isPending.value" :disabled="!isOnline"
          >Save mortality record</BaseButton
        >
      </form>
    </BaseModal>

    <BaseModal
      :open="modal === 'water'"
      variant="sheet"
      title="Add water check"
      description="Describe what you observed. Guidance remains conditional."
      @close="modal = null"
    >
      <form class="record-form" @submit.prevent="submitWater">
        <BaseInput v-model="recordDate" label="Check date" type="date" required />
        <BaseInput v-model="clarity" label="Water clarity" required />
        <BaseInput v-model="odor" label="Odor" required />
        <BaseInput v-model="fishBehavior" label="Fish behavior" required />
        <label class="check-field"
          ><input v-model="unusualChanges" type="checkbox" /><span
            >I noticed an unusual change</span
          ></label
        >
        <BaseInput v-model="actionTaken" label="Action taken (optional)" />
        <label class="text-field"
          ><span>Notes (optional)</span><textarea v-model="notes" rows="3" maxlength="300" />
        </label>
        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
        <BaseButton type="submit" :loading="waterMutation.isPending.value" :disabled="!isOnline"
          >Save water check</BaseButton
        >
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.records-page,
.record-form {
  display: grid;
  gap: var(--space-4);
}
.records-page {
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.record-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
}
.record-tabs button {
  min-height: 2.75rem;
  padding: var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: transparent;
  font-size: 0.7rem;
  font-weight: 750;
}
.record-tabs button[aria-current='page'] {
  color: var(--color-brand-800);
  background: white;
  box-shadow: var(--shadow-sm);
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}
.section-heading h1,
.section-heading p,
.record-card p,
.record-card small,
.plan-card p,
.plan-card h1,
.plan-card dl {
  margin: 0;
}
.section-heading h1 {
  font-size: 1.2rem;
}
.section-heading p,
.record-card p,
.record-card small,
.plan-card > p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.record-card {
  display: grid;
  gap: var(--space-2);
}
.record-card > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.guidance,
.estimate-note {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  line-height: 1.45;
}
.guidance--info {
  color: var(--color-brand-900);
  background: var(--color-brand-50);
}
.guidance--caution,
.guidance--action,
.estimate-note {
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}
.guidance small,
.estimate-note small {
  opacity: 0.8;
}
.plan-card {
  display: grid;
  gap: var(--space-4);
}
.plan-card h1 {
  color: var(--color-brand-800);
  font-size: 2rem;
}
.plan-card dl {
  display: grid;
  gap: var(--space-2);
}
.plan-card dl div,
.plan-card li {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.plan-card dt {
  color: var(--color-text-muted);
}
.plan-card dd {
  margin: 0;
  font-weight: 750;
}
.plan-card ul {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.text-field {
  display: grid;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 750;
}
select,
textarea {
  min-height: 3.25rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: white;
  font: inherit;
}
textarea {
  resize: vertical;
}
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid var(--color-focus);
}
.check-field {
  display: flex;
  min-height: 3rem;
  align-items: center;
  gap: var(--space-3);
  font-size: 0.875rem;
  font-weight: 700;
}
.check-field input {
  width: 1.25rem;
  height: 1.25rem;
}
.form-error {
  margin: 0;
  color: var(--color-danger-700);
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
