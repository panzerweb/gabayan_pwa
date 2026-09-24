<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import EquipmentRecommendationList from '../components/EquipmentRecommendationList.vue'
import { useEquipmentRecommendations } from '../composables/useEquipmentRecommendations'
import { useSetupStore } from '../stores/setup.store'

const route = useRoute()
const cultivationId = computed(() => String(route.params.cultivationId))
const { recommendations, products, marketplaceQuery, loading, loadFailed, refetch } =
  useEquipmentRecommendations(cultivationId)

// The cultivation exists now, so the wizard's draft has served its purpose.
const setup = useSetupStore()
onMounted(() => setup.reset())
</script>

<template>
  <section class="setup-flow-page success-page">
    <div class="success-page__icon" aria-hidden="true"><AppIcon name="check" :size="42" /></div>
    <div class="setup-flow-intro">
      <h2>Your cultivation is ready</h2>
      <p>
        Gabayan saved your plan. You can now review optional setup support and continue to Home.
      </p>
    </div>
    <LoadingState v-if="loading" compact label="Preparing setup recommendations…" />
    <ErrorState
      v-else-if="loadFailed"
      title="The cultivation was saved"
      message="Recommendations are temporarily unavailable. You can still continue to Home."
      @retry="refetch()"
    />
    <EquipmentRecommendationList
      v-else-if="recommendations && products.length"
      :cultivation-id="cultivationId"
      :products="products"
      :disclaimer="recommendations.disclaimer"
      :is-demo="recommendations.isDemo"
    />
    <div class="setup-flow-actions">
      <BaseButton
        :to="{ name: ROUTE_NAMES.marketplace, query: marketplaceQuery }"
        variant="secondary"
      >
        Browse relevant supplies
      </BaseButton>
      <BaseButton :to="{ name: ROUTE_NAMES.home }">Continue to Home</BaseButton>
    </div>
  </section>
</template>

<style scoped>
.success-page__icon {
  display: grid;
  width: 5.5rem;
  height: 5.5rem;
  place-items: center;
  margin-bottom: var(--space-5);
  border-radius: 50%;
  color: var(--color-success-800);
  background: var(--color-success-100);
  box-shadow: 0 0 0 0.75rem rgb(220 252 231 / 55%);
}
</style>
