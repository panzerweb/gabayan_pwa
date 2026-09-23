<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'

import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SelectableCard from '@/components/ui/SelectableCard.vue'
import { getCompatibility, listCultureEnvironments } from '@/services/api'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const environmentsQuery = useQuery({
  queryKey: ['culture-environments', 'active'],
  queryFn: listCultureEnvironments,
})
const compatibilityMutation = useMutation({
  mutationFn: ({ speciesId, environmentId }: { speciesId: string; environmentId: string }) =>
    getCompatibility(speciesId, environmentId),
})
const environments = computed(() => environmentsQuery.data.value?.data ?? [])
const compatibility = computed(() => compatibilityMutation.data.value?.data)
const canContinue = computed(
  () =>
    Boolean(setup.draft.environmentId) &&
    compatibility.value?.status !== 'NOT_RECOMMENDED' &&
    !compatibilityMutation.isPending.value,
)

async function selectEnvironment(environmentId: string) {
  if (!setup.draft.speciesId) return
  setup.selectEnvironment(environmentId)
  await compatibilityMutation.mutateAsync({ speciesId: setup.draft.speciesId, environmentId })
}

onMounted(() => {
  if (setup.draft.speciesId && setup.draft.environmentId) {
    compatibilityMutation.mutate({
      speciesId: setup.draft.speciesId,
      environmentId: setup.draft.environmentId,
    })
  }
})
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>Where will you raise them?</h2>
      <p>Choose the culture environment that best matches your planned setup.</p>
    </div>
    <LoadingState v-if="environmentsQuery.isPending.value" label="Loading culture environments…" />
    <ErrorState v-else-if="environmentsQuery.isError.value" @retry="environmentsQuery.refetch()" />
    <div v-else class="setup-flow-list" role="radiogroup" aria-label="Culture environment">
      <SelectableCard
        v-for="environment in environments"
        :key="environment.id"
        :title="environment.name"
        :description="environment.shortDescription"
        :selected="setup.draft.environmentId === environment.id"
        @select="selectEnvironment(environment.id)"
      />
    </div>
    <aside
      v-if="compatibility"
      class="compatibility"
      :class="`compatibility--${compatibility.status.toLowerCase()}`"
      role="status"
    >
      <AppIcon :name="compatibility.status === 'COMPATIBLE' ? 'check' : 'warning'" />
      <div>
        <strong>{{ compatibility.title }}</strong>
        <p>{{ compatibility.message }}</p>
      </div>
    </aside>
    <p v-if="compatibilityMutation.isError.value" class="form-error" role="alert">
      We couldn’t check this combination. Choose it again to retry.
    </p>
    <div class="setup-flow-actions">
      <BaseButton to="/setup/dimensions" :disabled="!canContinue">Continue</BaseButton>
    </div>
  </section>
</template>

<style scoped>
.compatibility {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-3);
  border: 1px solid var(--color-success-200);
  border-radius: var(--radius-md);
  color: var(--color-success-800);
  background: var(--color-success-100);
}

.compatibility--caution,
.compatibility--not_recommended {
  border-color: var(--color-warning-200);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.compatibility strong,
.compatibility p {
  margin: 0;
}

.compatibility p {
  margin-top: var(--space-1);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
