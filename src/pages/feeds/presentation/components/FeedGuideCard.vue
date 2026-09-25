<script setup lang="ts">
import { computed, toRef } from 'vue'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { useFeedGuide } from '../composables/useFeedGuide'
import FeedGuideProvenance from './FeedGuideProvenance.vue'
import FeedStageDetails from './FeedStageDetails.vue'

// The feed for a cultivation's current growth stage, shown beside its feeding plan, with a
// link to the species' whole guide. Meant for reuse by any cultivation screen.
const props = defineProps<{
  speciesId: string
  growthStageCode: string
  cultivationId: string
}>()

const { guide, currentStage, loading, loadFailed, notFound, refetch } = useFeedGuide(
  toRef(props, 'speciesId'),
  toRef(props, 'growthStageCode'),
)

const wholeGuide = computed(() => ({
  name: ROUTE_NAMES.feedGuide,
  params: { speciesId: props.speciesId },
  query: { cultivationId: props.cultivationId, stage: props.growthStageCode },
}))
</script>

<template>
  <LoadingState v-if="loading" compact label="Loading feed guide…" />
  <ErrorState v-else-if="loadFailed" title="We couldn't load the feed guide" @retry="refetch()" />
  <BaseCard v-else-if="notFound" class="feed-card" padding="lg">
    <p class="feed-card__empty">There is no feed guide for this fish yet.</p>
  </BaseCard>
  <BaseCard v-else-if="guide" class="feed-card" padding="lg">
    <section class="feed-card__body" aria-labelledby="feed-card-heading">
      <h2 id="feed-card-heading">
        {{ currentStage ? `Feed for the ${currentStage.growthStage} stage` : 'Which feed to use' }}
      </h2>
      <FeedStageDetails v-if="currentStage" :stage="currentStage" :cultivation-id="cultivationId" />
      <p v-else class="feed-card__empty">
        Record a growth sample to see the feed for your fish's current stage. The whole guide lists
        every stage.
      </p>
      <FeedGuideProvenance
        :is-demo="guide.isDemo"
        :disclaimer="guide.disclaimer"
        :rule-version="guide.ruleVersion"
      />
      <BaseButton :to="wholeGuide" variant="text">
        See the whole {{ guide.species.localName }} feed guide
      </BaseButton>
    </section>
  </BaseCard>
</template>

<style scoped>
.feed-card__body {
  display: grid;
  gap: var(--space-4);
}
.feed-card h2 {
  margin: 0;
  color: var(--color-brand-800);
  font-size: 1.125rem;
}
.feed-card__empty {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.45;
}
</style>
