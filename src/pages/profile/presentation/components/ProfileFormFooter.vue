<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'

// The end of every profile form: the form message, and a submit button that is disabled
// while offline with the reason beside it, since profile changes are never queued.
withDefaults(
  defineProps<{
    label: string
    online: boolean
    loading?: boolean
    error?: string | undefined
  }>(),
  {
    loading: false,
    error: '',
  },
)
</script>

<template>
  <div class="form-footer">
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <p v-if="!online" class="offline-note">Reconnect to save. Changes are not queued offline.</p>
    <BaseButton type="submit" :loading="loading" :disabled="!online">{{ label }}</BaseButton>
  </div>
</template>

<style scoped>
.form-footer {
  display: grid;
  gap: var(--space-3);
}
.form-error,
.offline-note {
  margin: 0;
}
.offline-note {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
