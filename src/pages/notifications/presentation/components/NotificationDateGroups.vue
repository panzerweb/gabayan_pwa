<script setup lang="ts">
import type { Notification, NotificationDateGroup } from '../../domain/notifications.model'
import NotificationCard from './NotificationCard.vue'

// Notifications under a heading for each Manila date they occurred on.
defineProps<{ groups: NotificationDateGroup[] }>()

const emit = defineEmits<{
  open: [notification: Notification]
  read: [notification: Notification]
}>()
</script>

<template>
  <section
    v-for="group in groups"
    :key="group.date"
    class="notification-group"
    :aria-labelledby="`notifications-${group.date}`"
  >
    <h2 :id="`notifications-${group.date}`">{{ group.label }}</h2>
    <NotificationCard
      v-for="notification in group.notifications"
      :key="notification.id"
      :notification="notification"
      @open="emit('open', $event)"
      @read="emit('read', $event)"
    />
  </section>
</template>

<style scoped>
.notification-group {
  display: grid;
  gap: var(--space-3);
}
.notification-group h2 {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
</style>
