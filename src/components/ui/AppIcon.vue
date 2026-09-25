<script setup lang="ts">
export type AppIconName =
  | 'arrow-left'
  | 'bag'
  | 'bell'
  | 'check'
  | 'chevron-right'
  | 'cloud'
  | 'droplet'
  | 'fish'
  | 'home'
  | 'heart'
  | 'info'
  | 'minus'
  | 'plus'
  | 'profile'
  | 'search'
  | 'star'
  | 'sun'
  | 'truck'
  | 'warning'

withDefaults(
  defineProps<{
    name: AppIconName
    size?: number
    strokeWidth?: number
    label?: string
  }>(),
  {
    size: 24,
    strokeWidth: 1.9,
  },
)
</script>

<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    :stroke-width="strokeWidth"
    :width="size"
    :height="size"
    :aria-hidden="label ? undefined : true"
    :aria-label="label"
    :role="label ? 'img' : undefined"
    focusable="false"
  >
    <template v-if="name === 'home'">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </template>
    <template v-else-if="name === 'fish'">
      <path d="M4 12c3.2-4.5 7.4-6 12.4-3.9L21 5v14l-4.6-3.1C11.4 18 7.2 16.5 4 12Z" />
      <circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'droplet'">
      <path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Z" />
    </template>
    <template v-else-if="name === 'bag'">
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </template>
    <template v-else-if="name === 'profile'">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </template>
    <template v-else-if="name === 'arrow-left'">
      <path d="m15 18-6-6 6-6" />
    </template>
    <template v-else-if="name === 'chevron-right'">
      <path d="m9 18 6-6-6-6" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12 4 4L19 6" />
    </template>
    <template v-else-if="name === 'warning'">
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17.5h.01" />
    </template>
    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7h.01" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="name === 'minus'">
      <path d="M5 12h14" />
    </template>
    <template v-else-if="name === 'heart'">
      <path
        d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"
      />
    </template>
    <template v-else-if="name === 'star'">
      <path
        d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-2.9L6.4 20l1.1-6.2-4.6-4.4 6.3-.9L12 2.8Z"
      />
    </template>
    <template v-else-if="name === 'truck'">
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </template>
    <template v-else-if="name === 'cloud'">
      <path d="M7 18h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.2 3.2 0 0 0 7 18Z" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </template>
  </svg>
</template>

<style scoped>
.app-icon {
  display: block;
  flex: 0 0 auto;
}
</style>
