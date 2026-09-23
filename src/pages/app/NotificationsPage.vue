<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  operationalQueryKeys,
  type Notification,
} from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { formatManilaDate, formatManilaTime, formatQuantity } from '@/utils/format'

type Filter = 'ALL' | Notification['category']
const filters: { label: string; value: Filter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Cultivation', value: 'CULTIVATION' },
  { label: 'Orders', value: 'ORDER' },
  { label: 'Learning', value: 'EDUCATION' },
]

const session = useSessionStore()
const router = useRouter()
const queryClient = useQueryClient()
const selectedFilter = ref<Filter>('ALL')
const category = computed(() => (selectedFilter.value === 'ALL' ? undefined : selectedFilter.value))
const query = useQuery({
  queryKey: computed(() => operationalQueryKeys.notifications(category.value)),
  queryFn: () => listNotifications(session.accessToken!, category.value),
})
const unreadCount = computed(
  () => query.data.value?.data.filter((item) => !item.readAt).length ?? 0,
)

async function refreshNotifications() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: ['home-dashboard'] }),
  ])
}

const readMutation = useMutation({
  mutationFn: (notificationId: string) =>
    markNotificationRead(notificationId, session.accessToken!),
  onSuccess: refreshNotifications,
})
const readAllMutation = useMutation({
  mutationFn: () => markAllNotificationsRead(session.accessToken!),
  onSuccess: refreshNotifications,
})

async function openNotification(notification: Notification) {
  if (!notification.readAt) await readMutation.mutateAsync(notification.id)
  if (notification.action) await router.push(notification.action.deepLink)
}
</script>

<template>
  <div class="notifications-page">
    <AppHeader title="Notifications" show-back back-to="/app/home">
      <template #trailing>
        <BaseButton
          v-if="unreadCount > 0"
          variant="text"
          :loading="readAllMutation.isPending.value"
          @click="readAllMutation.mutate()"
        >
          Mark all read
        </BaseButton>
      </template>
    </AppHeader>
    <main>
      <div class="filters" role="group" aria-label="Filter notifications">
        <button
          v-for="filter in filters"
          :key="filter.value"
          type="button"
          :aria-pressed="selectedFilter === filter.value"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
      <LoadingState v-if="query.isPending.value" label="Loading notifications…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <template v-else>
        <BaseCard
          v-for="notification in query.data.value?.data"
          :key="notification.id"
          class="notification-card"
          :class="{ 'notification-card--unread': !notification.readAt }"
          padding="md"
        >
          <div class="notification-card__topline">
            <StatusChip
              :label="notification.category === 'EDUCATION' ? 'Learning' : notification.category"
              :tone="notification.category === 'EDUCATION' ? 'warning' : 'info'"
            />
            <span
              >{{ formatManilaDate(notification.occurredAt) }} ·
              {{ formatManilaTime(notification.occurredAt) }}</span
            >
          </div>
          <h2>{{ notification.title }}</h2>
          <p>{{ notification.message }}</p>
          <p v-if="notification.recommendedAmount" class="notification-card__amount">
            Planned amount:
            {{
              formatQuantity(
                notification.recommendedAmount.value,
                notification.recommendedAmount.unit,
              )
            }}
          </p>
          <BaseButton
            v-if="notification.action"
            variant="secondary"
            :loading="
              readMutation.isPending.value && readMutation.variables.value === notification.id
            "
            @click="openNotification(notification)"
          >
            {{ notification.action.label }}
          </BaseButton>
          <button
            v-else-if="!notification.readAt"
            class="mark-read"
            type="button"
            @click="readMutation.mutate(notification.id)"
          >
            Mark as read
          </button>
        </BaseCard>
        <EmptyState
          v-if="query.data.value?.data.length === 0"
          title="Nothing here yet"
          message="Notifications matching this filter will appear here."
        />
      </template>
    </main>
  </div>
</template>

<style scoped>
.notifications-page main {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.filters {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}
.filters button {
  min-height: 2.75rem;
  flex: 0 0 auto;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  background: var(--color-surface);
  font-weight: 700;
}
.filters button[aria-pressed='true'] {
  border-color: var(--color-brand-700);
  color: white;
  background: var(--color-brand-700);
}
.filters button:focus-visible,
.mark-read:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
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
h2,
p {
  margin: 0;
}
h2 {
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
.mark-read {
  min-height: 2.75rem;
  justify-self: start;
  padding: 0;
  border: 0;
  color: var(--color-brand-800);
  background: transparent;
  font-weight: 750;
}
</style>
