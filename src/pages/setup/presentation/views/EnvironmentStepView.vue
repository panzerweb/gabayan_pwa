<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import SelectableCard from '@components/ui/SelectableCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import CompatibilityNotice from '../components/CompatibilityNotice.vue'
import { useCompatibility } from '../composables/useCompatibility'
import { useSetupOptions } from '../composables/useSetupOptions'

const {
  environments,
  environmentsLoading,
  environmentsLoadFailed,
  refetchEnvironments,
  selectedEnvironmentId,
  selectEnvironment,
} = useSetupOptions()
const { compatibility, checking, checkFailed, recheck, canContinue } = useCompatibility()
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>Where will you raise them?</h2>
      <p>Choose the culture environment that best matches your planned setup.</p>
    </div>
    <LoadingState v-if="environmentsLoading" label="Loading culture environments…" />
    <ErrorState v-else-if="environmentsLoadFailed" @retry="refetchEnvironments()" />
    <EmptyState
      v-else-if="!environments.length"
      title="No culture environments yet"
      message="Environment profiles are being prepared. Please check back soon."
    />
    <div v-else class="setup-flow-list" role="radiogroup" aria-label="Culture environment">
      <SelectableCard
        v-for="environment in environments"
        :key="environment.id"
        :title="environment.name"
        :description="environment.shortDescription"
        :selected="selectedEnvironmentId === environment.id"
        @select="selectEnvironment(environment.id)"
      />
    </div>
    <LoadingState v-if="checking" compact label="Checking this combination…" />
    <CompatibilityNotice v-else-if="compatibility" :compatibility="compatibility" />
    <div v-else-if="checkFailed" class="compatibility-error">
      <p class="form-error" role="alert">We couldn’t check this combination.</p>
      <BaseButton variant="text" @click="recheck()">Check again</BaseButton>
    </div>
    <div class="setup-flow-actions">
      <BaseButton :to="{ name: ROUTE_NAMES.setupWaterRanges }" :disabled="!canContinue">
        Continue
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.compatibility-error {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-5);
}
</style>
