<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@components/ui/AppIcon.vue'

import { compatibilityDisplay, type CompatibilityResult } from '../../domain/setup.model'

const props = defineProps<{ compatibility: CompatibilityResult }>()

const display = computed(() => compatibilityDisplay(props.compatibility.status))
</script>

<template>
  <aside class="compatibility" :class="`compatibility--${display.tone}`" role="status">
    <AppIcon :name="display.icon" />
    <div>
      <strong>{{ compatibility.title }}</strong>
      <p>{{ compatibility.message }}</p>
      <p v-if="compatibility.alternatives.length" class="compatibility__alternatives">
        You could consider:
        {{ compatibility.alternatives.map((alternative) => alternative.name).join(', ') }}.
      </p>
    </div>
  </aside>
</template>

<style scoped>
.compatibility {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-3);
  border: 1px solid var(--color-success-200);
  border-radius: var(--radius-md);
  color: var(--color-success-800);
  background: var(--color-success-100);
}

.compatibility--warning {
  border-color: var(--color-warning-200);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.compatibility strong,
.compatibility p {
  margin: 0;
}

.compatibility p {
  margin-top: var(--space-1);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
