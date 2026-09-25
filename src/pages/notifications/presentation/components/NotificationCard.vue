<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaTime, formatQuantity } from '@core/utils/format'
import WeatherAlertDetail from '@pages/weather-alerts/presentation/components/WeatherAlertDetail.vue'

import { notificationCategoryDisplay, type Notification } from '../../domain/notifications.model'
import NotificationReminderDetail from './NotificationReminderDetail.vue'

// One notification. Unread ones say so in words as well as with the accent, and offer
// either their action or "Mark as read". A reminder the server raised also shows its figures,
// and a weather alert its explanation and steps.
const props = defineProps<{ notification: Notification }>()
const emit = defineEmits<{
  open: [notification: Notification]
  read: [notification: Notification]
}>()

const category = computed(() => notificationCategoryDisplay(props.notification.category))
const unread = computed(() => !props.notification.readAt)
</script>

<template>
  <BaseCard class="notification-card" :class="{ 'notification-card--unread': unread }" padding="md">
    <div class="notification-card__topline">
      <StatusChip :label="category.label" :tone="category.tone" :icon="category.icon" />
      <span>
        <span v-if="unread" class="notification-card__unread">Unread · </span>
        <time :datetime="notification.occurredAt">{{
          formatManilaTime(notification.occurredAt)
        }}</time>
      </span>
    </div>
    <h3>{{ notification.title }}</h3>
    <p>{{ notification.message }}</p>
    <p v-if="notification.recommendedAmount" class="notification-card__amount">
      Planned amount:
      {{
        formatQuantity(notification.recommendedAmount.value, notification.recommendedAmount.unit)
      }}
    </p>
    <NotificationReminderDetail
      v-if="notification.reminder"
      :type="notification.type"
      :reminder="notification.reminder"
    />
    <WeatherAlertDetail
      v-if="notification.weatherAlert"
      :alert="notification.weatherAlert"
      :show-title="false"
    />
    <BaseButton v-if="notification.action" variant="secondary" @click="emit('open', notification)">
      {{ notification.action.label }}
    </BaseButton>
    <button
      v-else-if="unread"
      class="notification-card__mark-read"
      type="button"
      @click="emit('read', notification)"
    >
      Mark as read
    </button>
  </BaseCard>
</template>

<style scoped>
.notification-card {
  position: relative;
  display: grid;
  gap: var(--space-2);
}
.notification-card--unread {
  border-color: var(--color-brand-200);
  background: linear-gradient(90deg, var(--color-brand-50), var(--color-surface) 30%);
}
.notification-card--unread::before {
  position: absolute;
  top: var(--space-4);
  left: -0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-brand-600);
  content: '';
}
.notification-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.notification-card__topline > span {
  color: var(--color-text-subtle);
  font-size: 0.625rem;
  text-align: right;
}
.notification-card__unread {
  color: var(--color-brand-800);
  font-weight: 800;
}
h3,
p {
  margin: 0;
}
h3 {
  margin-top: var(--space-1);
  font-size: 1rem;
}
p {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}
.notification-card__amount {
  color: var(--color-brand-800);
  font-weight: 700;
}
.notification-card .button {
  margin-top: var(--space-2);
}
.notification-card__mark-read {
  min-height: 2.75rem;
  justify-self: start;
  padding: 0;
  border: 0;
  color: var(--color-brand-800);
  background: transparent;
  font-weight: 750;
}
.notification-card__mark-read:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
