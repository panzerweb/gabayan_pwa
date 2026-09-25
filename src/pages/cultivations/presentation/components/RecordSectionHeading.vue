<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'

// A record tab's heading with the button that opens its form.
defineProps<{ title: string; description: string }>()
const emit = defineEmits<{ add: [] }>()
</script>

<template>
  <div class="section-heading">
    <div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
    <BaseButton size="sm" @click="emit('add')">Add</BaseButton>
  </div>
</template>

<style scoped>
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}
h1,
p {
  margin: 0;
}
h1 {
  font-size: 1.2rem;
}
p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
