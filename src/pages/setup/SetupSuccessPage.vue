<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { getEquipmentRecommendations } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import { formatPhp } from '@core/utils/format'

const route = useRoute()
const session = useSessionStore()
const setup = useSetupStore()
const cultivationId = computed(() => String(route.params.cultivationId))
const query = useQuery({
  queryKey: ['equipment-recommendations', cultivationId],
  queryFn: () => {
    if (!session.accessToken) throw new Error('Sign in to continue.')
    return getEquipmentRecommendations(cultivationId.value, session.accessToken)
  },
})

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
    <LoadingState v-if="query.isPending.value" compact label="Preparing setup recommendations…" />
    <ErrorState
      v-else-if="query.isError.value"
      title="The cultivation was saved"
      message="Recommendations are temporarily unavailable. You can still continue to Home."
      @retry="query.refetch()"
    />
    <template v-else-if="query.data.value">
      <section class="success-page__recommendations" aria-labelledby="recommendations-heading">
        <div>
          <p>Optional setup support</p>
          <h3 id="recommendations-heading">Recommended equipment</h3>
        </div>
        <BaseCard
          v-for="product in query.data.value.data.sections.flatMap((section) => section.products)"
          :key="product.id"
          class="recommendation-card"
          padding="md"
        >
          <span class="recommendation-card__icon" aria-hidden="true"><AppIcon name="plus" /></span>
          <div>
            <strong>{{ product.name }}</strong>
            <p>{{ product.whyRelevant }}</p>
            <span>{{ formatPhp(product.price.amountMinor) }}</span>
            <BaseButton
              :to="{ path: `/app/products/${product.id}`, query: { cultivationId } }"
              variant="text"
            >
              View product
            </BaseButton>
          </div>
        </BaseCard>
        <p class="success-page__disclaimer">{{ query.data.value.data.disclaimer }}</p>
      </section>
    </template>
    <div class="setup-flow-actions">
      <BaseButton
        :to="{
          path: '/app/marketplace',
          query: {
            speciesId: query.data.value?.data.context.species.id,
            environmentId: query.data.value?.data.context.environment.id,
          },
        }"
        variant="secondary"
      >
        Browse relevant supplies
      </BaseButton>
      <BaseButton to="/app/home">Continue to Home</BaseButton>
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

.success-page__recommendations {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.success-page__recommendations > div > p,
.success-page__recommendations h3 {
  margin: 0;
}

.success-page__recommendations > div > p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.success-page__recommendations h3 {
  margin-top: var(--space-1);
  font-size: 1.125rem;
}

.recommendation-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
}

.recommendation-card__icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--color-brand-700);
  background: var(--color-brand-100);
}

.recommendation-card strong,
.recommendation-card p,
.recommendation-card div > span {
  display: block;
  margin: 0;
}
.recommendation-card p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}
.recommendation-card div > span {
  margin-top: var(--space-2);
  color: var(--color-brand-800);
  font-size: 0.8125rem;
  font-weight: 800;
}

.success-page__disclaimer {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
}
</style>
