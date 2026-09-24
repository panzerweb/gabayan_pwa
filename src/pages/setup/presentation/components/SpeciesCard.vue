<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import AppIcon from '@components/ui/AppIcon.vue'
import StatusChip from '@components/ui/StatusChip.vue'

import {
  speciesNote,
  speciesSourceDisplay,
  speciesTitle,
  type SpeciesSummary,
} from '../../domain/setup.model'

const props = withDefaults(defineProps<{ species: SpeciesSummary; selected?: boolean }>(), {
  selected: false,
})

const emit = defineEmits<{ select: [] }>()

const id = useId()
const imageFailed = ref(false)
const source = computed(() => speciesSourceDisplay(props.species.sourceStatus))
</script>

<template>
  <button
    class="species-card"
    :class="{ 'species-card--selected': selected }"
    type="button"
    role="radio"
    :aria-checked="selected"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="`${id}-description ${id}-notes`"
    @click="emit('select')"
  >
    <span class="species-card__media">
      <img
        v-if="!imageFailed"
        :src="species.image.url"
        :alt="species.image.alt"
        width="72"
        height="72"
        loading="lazy"
        @error="imageFailed = true"
      />
      <AppIcon v-else name="fish" :size="32" />
    </span>
    <span class="species-card__content">
      <strong :id="`${id}-title`">{{ speciesTitle(species) }}</strong>
      <span :id="`${id}-description`">{{ species.shortDescription }}</span>
      <span :id="`${id}-notes`" class="species-card__notes">
        <StatusChip :label="source.label" :tone="source.tone" :icon="source.icon" />
        <small>{{ speciesNote(species) }}</small>
      </span>
    </span>
    <span class="species-card__indicator" aria-hidden="true" />
  </button>
</template>

<style scoped>
.species-card {
  display: grid;
  min-height: 5rem;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
}

.species-card--selected {
  border-color: var(--color-brand-600);
  background: var(--color-brand-50);
  box-shadow: 0 0 0 2px rgb(2 132 199 / 12%);
}

.species-card:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.species-card__media {
  display: grid;
  width: 4.5rem;
  height: 4.5rem;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius-sm);
  color: var(--color-aqua-700);
  background: var(--color-aqua-100);
}

.species-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.species-card__content {
  display: grid;
  gap: var(--space-1);
}

.species-card__content strong {
  font-size: 0.9375rem;
}

.species-card__content > span:not(.species-card__notes) {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.45;
}

.species-card__notes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.species-card__notes small {
  color: var(--color-aqua-700);
  font-size: 0.6875rem;
  font-weight: 750;
}

.species-card__indicator {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.1rem;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
}

.species-card--selected .species-card__indicator {
  border: 0.35rem solid var(--color-brand-700);
  background: white;
}
</style>
