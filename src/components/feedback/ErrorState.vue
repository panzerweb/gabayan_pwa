<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

withDefaults(
  defineProps<{
    title?: string
    message?: string
    retryLabel?: string
  }>(),
  {
    title: "We couldn't load this right now",
    message: 'Check your connection and try again.',
    retryLabel: 'Try Again',
  },
)

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="error-state" role="alert">
    <span class="error-state__visual" aria-hidden="true">
      <AppIcon name="warning" :size="30" />
    </span>
    <div>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
    </div>
    <BaseButton variant="secondary" @click="emit('retry')">{{ retryLabel }}</BaseButton>
  </section>
</template>

<style scoped>
.error-state {
  display: grid;
  place-items: center;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-5);
  text-align: center;
}

.error-state__visual {
  display: grid;
  width: 4rem;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

h2,
p {
  margin: 0;
}

h2 {
  font-size: 1.125rem;
}

p {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  line-height: 1.55;
}
</style>
