<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SelectableCard from '@/components/ui/SelectableCard.vue'
import { listSpecies } from '@/services/api'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const query = useQuery({
  queryKey: ['species', 'active'],
  queryFn: () => listSpecies({ active: true }),
})
const species = computed(() => query.data.value?.data ?? [])
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>What species will you raise?</h2>
      <p>Your answer helps tailor compatibility checks and the stocking estimate.</p>
    </div>
    <LoadingState v-if="query.isPending.value" label="Loading fish profiles…" />
    <ErrorState
      v-else-if="query.isError.value"
      message="We couldn’t load the fish profiles. Check your connection and try again."
      @retry="query.refetch()"
    />
    <div v-else class="setup-flow-list" role="radiogroup" aria-label="Fish species">
      <SelectableCard
        v-for="item in species"
        :key="item.id"
        :title="
          item.localName === item.commonName
            ? item.commonName
            : `${item.commonName} (${item.localName})`
        "
        :description="item.shortDescription"
        :meta="
          item.beginnerFriendly ? 'Beginner-friendly demo profile' : 'Additional planning may help'
        "
        :selected="setup.draft.speciesId === item.id"
        @select="setup.selectSpecies(item.id)"
      />
    </div>
    <div class="setup-flow-actions">
      <BaseButton to="/setup/environment" :disabled="!setup.draft.speciesId">Continue</BaseButton>
    </div>
  </section>
</template>
