<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import GrowthChart from '../components/GrowthChart.vue'
import GrowthRecordSheet from '../components/GrowthRecordSheet.vue'
import { useGrowthRecords } from '../composables/useGrowthRecords'

const route = useRoute()
const cultivationId = computed(() => String(route.params.cultivationId))
const { measurements, loading, loadFailed, refetch } = useGrowthRecords(cultivationId)
const adding = ref(false)
</script>

<template>
  <div>
    <AppHeader
      title="Growth records"
      show-back
      :back-to="{ name: ROUTE_NAMES.cultivationDetail, params: { cultivationId } }"
    />
    <main class="growth-page">
      <section class="page-heading">
        <div>
          <p>Measured samples</p>
          <h1>Track average fish weight</h1>
        </div>
        <BaseButton size="sm" @click="adding = true">Add record</BaseButton>
      </section>
      <LoadingState v-if="loading" label="Loading growth records…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <BaseCard v-else padding="md">
        <GrowthChart :measurements="measurements" />
      </BaseCard>
      <p class="estimate-note">
        Growth samples update demo feeding and harvest estimates. They are not a scientific
        assessment for your farm.
      </p>
    </main>

    <GrowthRecordSheet :cultivation-id="cultivationId" :open="adding" @close="adding = false" />
  </div>
</template>

<style scoped>
.growth-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}
.page-heading p,
.page-heading h1 {
  margin: 0;
}
.page-heading p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.page-heading h1 {
  margin-top: var(--space-1);
  font-size: 1.25rem;
}
.estimate-note {
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
