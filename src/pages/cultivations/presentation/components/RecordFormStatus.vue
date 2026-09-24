<script setup lang="ts">
// The lines above a record form's submit button: why it is disabled while offline, and the
// sentence describing a failed save.
defineProps<{ isOnline: boolean; record: string; error: string }>()
</script>

<template>
  <p v-if="!isOnline" class="record-status record-status--offline" role="status">
    You are offline. Reconnect to save this {{ record }}; it will not be queued.
  </p>
  <p v-if="error" class="record-status record-status--error" role="alert">{{ error }}</p>
</template>

<style scoped>
.record-status {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
}
.record-status--offline {
  color: var(--color-text-muted);
}
.record-status--error {
  color: var(--color-danger-700);
  font-weight: 700;
}
</style>
