<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import NotificationDateGroups from '../components/NotificationDateGroups.vue'
import NotificationFilterTabs from '../components/NotificationFilterTabs.vue'
import { useNotifications } from '../composables/useNotifications'

const {
  filter,
  selectFilter,
  groups,
  isEmpty,
  unreadCount,
  loading,
  loadFailed,
  refetch,
  markRead,
  markAllRead,
  markingAll,
  openNotification,
} = useNotifications()
</script>

<template>
  <div class="notifications-page">
    <AppHeader title="Notifications" show-back :back-to="{ name: ROUTE_NAMES.home }">
      <template #trailing>
        <BaseButton
          v-if="unreadCount > 0"
          variant="text"
          :loading="markingAll"
          @click="markAllRead"
        >
          Mark all read
        </BaseButton>
      </template>
    </AppHeader>
    <main class="notifications-page__content">
      <NotificationFilterTabs :selected="filter" @select="selectFilter" />
      <LoadingState v-if="loading" label="Loading notifications…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <EmptyState
        v-else-if="isEmpty"
        icon="bell"
        title="Nothing here yet"
        message="Notifications matching this filter will appear here."
      />
      <NotificationDateGroups v-else :groups="groups" @open="openNotification" @read="markRead" />
    </main>
  </div>
</template>

<style scoped>
.notifications-page__content {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
</style>
