<script setup lang="ts">
import { computed } from 'vue'

import StatusChip from '@components/ui/StatusChip.vue'

import { orderStatusDisplay, type OrderStatus } from '../../domain/orders.model'

const props = defineProps<{ status: OrderStatus }>()

const display = computed(() => orderStatusDisplay(props.status))
</script>

<template>
  <StatusChip :label="display.label" :tone="display.tone" :icon="display.icon" />
</template>
