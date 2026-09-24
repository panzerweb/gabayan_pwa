<script setup lang="ts">
import BaseModal from '@components/overlays/BaseModal.vue'
import BaseButton from '@components/ui/BaseButton.vue'

import SizingGuidancePanel from './SizingGuidancePanel.vue'

// The dialog the dimensions step shows with the suggested size for the chosen fish.
defineProps<{ open: boolean; title: string; speciesId: string; environmentId: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <BaseModal
    :open="open"
    :title="title"
    description="A starting point before you measure your own area."
    @close="emit('close')"
  >
    <SizingGuidancePanel :species-id="speciesId" :environment-id="environmentId" />
    <template #actions>
      <BaseButton @click="emit('close')">Got it</BaseButton>
    </template>
  </BaseModal>
</template>
