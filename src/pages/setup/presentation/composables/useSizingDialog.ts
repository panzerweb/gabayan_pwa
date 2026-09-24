import { computed, onMounted, ref } from 'vue'

import { setupRepository } from '../../data/setup.repository'
import { sizingTitle } from '../../domain/setup.model'
import type { SetupRepository } from '../../domain/setup.repository.interface'
import { useSetupStore } from '../stores/setup.store'
import { useSetupOptions } from './useSetupOptions'

// The suggested-size dialog of the dimensions step. It opens by itself the first time the
// farmer reaches the step, before any measurement is saved, and can be reopened from the step.
export function useSizingDialog(repository: SetupRepository = setupRepository) {
  const setup = useSetupStore()
  const { species, environments } = useSetupOptions(repository)
  const open = ref(false)
  const speciesId = computed(() => setup.draft.speciesId ?? '')
  const environmentId = computed(() => setup.draft.environmentId ?? '')
  const available = computed(() => Boolean(speciesId.value && environmentId.value))
  const firstVisit = setup.draft.dimensions === null

  // Opened after mount so the dialog moves focus into itself as it appears.
  onMounted(() => {
    if (firstVisit && available.value) open.value = true
  })

  return {
    speciesId,
    environmentId,
    available,
    title: computed(() =>
      sizingTitle(
        species.value.find((item) => item.id === speciesId.value),
        environments.value.find((item) => item.id === environmentId.value),
      ),
    ),
    open,
    show: () => {
      open.value = true
    },
    close: () => {
      open.value = false
    },
  }
}
