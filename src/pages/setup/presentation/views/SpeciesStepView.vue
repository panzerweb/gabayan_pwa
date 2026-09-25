<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import SpeciesCard from '../components/SpeciesCard.vue'
import { useSetupOptions } from '../composables/useSetupOptions'

const {
  species,
  speciesLoading,
  speciesLoadFailed,
  refetchSpecies,
  selectedSpeciesId,
  selectSpecies,
} = useSetupOptions()
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>What species will you raise?</h2>
      <p>
        Choose the fish or shrimp you plan to stock. Your answer tailors the compatibility check and
        the stocking estimate.
      </p>
    </div>
    <LoadingState v-if="speciesLoading" label="Loading species profiles…" />
    <ErrorState
      v-else-if="speciesLoadFailed"
      message="We couldn’t load the species profiles. Check your connection and try again."
      @retry="refetchSpecies()"
    />
    <EmptyState
      v-else-if="!species.length"
      title="No species profiles yet"
      message="Species profiles are being prepared. Please check back soon."
    />
    <div v-else class="setup-flow-list" role="radiogroup" aria-label="Species">
      <SpeciesCard
        v-for="item in species"
        :key="item.id"
        :species="item"
        :selected="selectedSpeciesId === item.id"
        @select="selectSpecies(item.id)"
      />
    </div>
    <div class="setup-flow-actions">
      <BaseButton :to="{ name: ROUTE_NAMES.setupEnvironment }" :disabled="!selectedSpeciesId">
        Continue
      </BaseButton>
    </div>
  </section>
</template>
