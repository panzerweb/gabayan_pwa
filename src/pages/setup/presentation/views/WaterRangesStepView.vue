<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@components/ui/BaseButton.vue'
import WaterThresholdsPanel from '@pages/water-quality/presentation/components/WaterThresholdsPanel.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { useSetupOptions } from '../composables/useSetupOptions'

// Shows the suggested water ranges for the chosen species and culture system. It asks for
// no readings and never blocks the wizard.
const { species, environments, selectedSpeciesId, selectedEnvironmentId } = useSetupOptions()

const intro = computed(() => {
  const chosenSpecies = species.value.find((item) => item.id === selectedSpeciesId.value)
  const environment = environments.value.find((item) => item.id === selectedEnvironmentId.value)
  if (!chosenSpecies || !environment) return 'These are the water ranges to aim for.'
  return `These are the water ranges to aim for with ${chosenSpecies.commonName} (${chosenSpecies.localName}) in a ${environment.name.toLowerCase()}.`
})
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>Good water for your stock</h2>
      <p>
        {{ intro }} You don’t need any readings yet; a test kit or meter helps once your stock are
        in.
      </p>
    </div>
    <WaterThresholdsPanel
      v-if="selectedSpeciesId && selectedEnvironmentId"
      :species-id="selectedSpeciesId"
      :environment-id="selectedEnvironmentId"
    />
    <div class="setup-flow-actions">
      <BaseButton :to="{ name: ROUTE_NAMES.setupDimensions }">Continue</BaseButton>
    </div>
  </section>
</template>
