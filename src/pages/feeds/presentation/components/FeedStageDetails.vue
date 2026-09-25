<script setup lang="ts">
import { computed } from 'vue'

import StatusChip from '@components/ui/StatusChip.vue'
import { formatPhp } from '@core/utils/format'
import { availabilityStatus } from '@pages/marketplace/domain/marketplace.model'
import BuyNowButton from '@pages/marketplace/presentation/components/BuyNowButton.vue'

import {
  formatFeedingsPerDay,
  formatPelletSize,
  formatProteinRange,
  formatStageWeight,
  type FeedGuideStage,
} from '../../domain/feeds.model'

// One growth stage of a feed guide: the feed to look for, the figures on its label, where they
// come from, and the matching feeds in the shop with a "Buy now" each.
const props = defineProps<{ stage: FeedGuideStage; cultivationId?: string | undefined }>()

const feedings = computed(() => formatFeedingsPerDay(props.stage.feedingsPerDay))
const products = computed(() =>
  props.stage.products.map((product) => ({
    product,
    stock: availabilityStatus(product.availability),
  })),
)
// "Buy now" carries the cultivation only when the stage is shown for one.
const buyNowContext = computed(() =>
  props.cultivationId ? { cultivationId: props.cultivationId } : {},
)
</script>

<template>
  <div class="feed-stage">
    <p class="feed-stage__type">{{ stage.feedType }}</p>
    <dl>
      <div>
        <dt>Protein</dt>
        <dd>{{ formatProteinRange(stage.proteinPercent) }}</dd>
      </div>
      <div>
        <dt>Pellet size</dt>
        <dd>{{ formatPelletSize(stage.pelletSize) }}</dd>
      </div>
      <div v-if="feedings">
        <dt>How often</dt>
        <dd>{{ feedings }}</dd>
      </div>
      <div>
        <dt>Fish weight</dt>
        <dd>{{ formatStageWeight(stage.weightRange) }}</dd>
      </div>
    </dl>
    <p class="feed-stage__hint">
      Protein helps fish grow; pellets should be small enough for your fish to swallow whole.
    </p>
    <small class="feed-stage__basis">{{ stage.basis }}</small>

    <div class="feed-stage__products">
      <strong>Feeds in the shop</strong>
      <template v-if="products.length">
        <div v-for="{ product, stock } in products" :key="product.id" class="feed-product">
          <div class="feed-product__heading">
            <span>{{ product.name }}</span>
            <span class="feed-product__price">{{ formatPhp(product.price.amountMinor) }}</span>
          </div>
          <StatusChip v-if="stock" :label="stock.label" :tone="stock.tone" />
          <BuyNowButton
            :product-id="product.id"
            :product-name="product.name"
            v-bind="buyNowContext"
            variant="secondary"
          />
        </div>
      </template>
      <p v-else class="feed-stage__none">
        No matching feed in the shop yet. Look for these figures on the label at your local feed
        supplier.
      </p>
    </div>
  </div>
</template>

<style scoped>
.feed-stage {
  display: grid;
  gap: var(--space-3);
}
.feed-stage p,
.feed-stage dl {
  margin: 0;
}
.feed-stage__type {
  font-weight: 750;
}
dl {
  display: grid;
  gap: var(--space-2);
}
dl div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
dt {
  color: var(--color-text-muted);
}
dd {
  margin: 0;
  font-weight: 750;
  text-align: right;
}
.feed-stage__hint,
.feed-stage__none,
.feed-stage__basis {
  color: var(--color-text-muted);
  line-height: 1.45;
}
.feed-stage__hint,
.feed-stage__none {
  font-size: 0.8rem;
}
.feed-stage__basis {
  font-size: 0.6875rem;
}
.feed-stage__products {
  display: grid;
  gap: var(--space-2);
  font-size: 0.8rem;
}
.feed-product {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.feed-product__heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  font-weight: 750;
}
.feed-product__price {
  color: var(--color-brand-800);
}
</style>
