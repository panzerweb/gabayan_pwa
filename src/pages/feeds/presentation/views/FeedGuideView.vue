<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { ROUTE_NAMES } from '@router/route-names'

import FeedGuideProvenance from '../components/FeedGuideProvenance.vue'
import FeedStageDetails from '../components/FeedStageDetails.vue'
import { useFeedGuide } from '../composables/useFeedGuide'
import { useFeedGuideRoute } from '../composables/useFeedGuideRoute'

// A species' whole feed guide, one card per growth stage, with the stage a cultivation is in
// marked when the guide was opened from it.
const { speciesId, cultivationId, stage, backTo } = useFeedGuideRoute()
const { guide, loading, loadFailed, notFound, refetch } = useFeedGuide(speciesId)
</script>

<template>
  <div>
    <AppHeader
      title="Feed guide"
      :subtitle="guide ? `${guide.species.commonName} (${guide.species.localName})` : ''"
      show-back
      :back-to="backTo"
    />
    <main class="feed-guide-page">
      <LoadingState v-if="loading" label="Loading feed guide…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <EmptyState
        v-else-if="notFound"
        title="No feed guide yet"
        message="There is no feed guide for this fish yet. Ask your local feed supplier which feed suits its size."
        action-label="Back to Home"
        :action-to="{ name: ROUTE_NAMES.home }"
      />
      <template v-else-if="guide">
        <p class="feed-guide-page__intro">
          Which commercial feed suits each growth stage. Choose the stage by the average weight of
          your latest growth sample.
        </p>
        <BaseCard
          v-for="item in guide.stages"
          :key="item.growthStageCode"
          class="feed-guide-stage"
          padding="lg"
        >
          <section :aria-labelledby="`feed-stage-${item.growthStageCode}`">
            <div class="feed-guide-stage__heading">
              <h2 :id="`feed-stage-${item.growthStageCode}`">{{ item.growthStage }} stage</h2>
              <StatusChip
                v-if="item.growthStageCode === stage"
                label="Your fish now"
                tone="info"
                icon="fish"
              />
            </div>
            <FeedStageDetails :stage="item" :cultivation-id="cultivationId ?? undefined" />
          </section>
        </BaseCard>
        <FeedGuideProvenance
          :is-demo="guide.isDemo"
          :disclaimer="guide.disclaimer"
          :rule-version="guide.ruleVersion"
          :sources="guide.sources"
        />
      </template>
    </main>
  </div>
</template>

<style scoped>
.feed-guide-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.feed-guide-page__intro {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.45;
}
.feed-guide-stage section {
  display: grid;
  gap: var(--space-3);
}
.feed-guide-stage__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.feed-guide-stage h2 {
  margin: 0;
  color: var(--color-brand-800);
  font-size: 1.125rem;
}
</style>
