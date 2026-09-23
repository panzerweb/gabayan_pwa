<script setup lang="ts">
import AppIcon, { type AppIconName } from './AppIcon.vue'

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

withDefaults(
  defineProps<{
    label: string
    tone?: StatusTone
    icon?: AppIconName
  }>(),
  {
    tone: 'neutral',
  },
)

const fallbackIcons: Record<StatusTone, AppIconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'warning',
}
</script>

<template>
  <span class="status-chip" :class="`status-chip--${tone}`">
    <AppIcon :name="icon ?? fallbackIcons[tone]" :size="15" :stroke-width="2.2" />
    {{ label }}
  </span>
</template>

<style scoped>
.status-chip {
  display: inline-flex;
  min-height: 1.75rem;
  align-items: center;
  gap: var(--space-1);
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  color: var(--color-text-muted);
  background: var(--color-neutral-100);
  font-size: 0.75rem;
  font-weight: 750;
  line-height: 1;
}

.status-chip--info {
  color: var(--color-brand-800);
  background: var(--color-brand-100);
}

.status-chip--success {
  color: var(--color-success-800);
  background: var(--color-success-100);
}

.status-chip--warning {
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.status-chip--danger {
  color: var(--color-danger-800);
  background: var(--color-danger-100);
}
</style>
