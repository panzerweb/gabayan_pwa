<script setup lang="ts">
import { computed } from 'vue'

import { initialsOf } from '../../domain/profile.model'

const props = defineProps<{
  fullName: string | undefined
  email: string | undefined
}>()

const initials = computed(() => initialsOf(props.fullName))
</script>

<template>
  <section class="profile-summary">
    <span aria-hidden="true">{{ initials }}</span>
    <div>
      <h1>{{ fullName }}</h1>
      <p>{{ email }}</p>
    </div>
  </section>
</template>

<style scoped>
.profile-summary {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-block: var(--space-2);
}
.profile-summary > span {
  display: grid;
  width: 4rem;
  height: 4rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: linear-gradient(145deg, var(--color-brand-600), var(--color-aqua-600));
  font-weight: 800;
}
h1,
p {
  margin: 0;
}
h1 {
  font-size: 1.125rem;
}
p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
