import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { ApiError } from '@core/http'
import { invalidateAfter } from '@core/query'
import { zodFieldErrors } from '@core/utils/validation'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { profileKeys } from '../../data/profile.keys'
import { profileRepository } from '../../data/profile.repository'
import {
  PROFILE_OFFLINE_MESSAGE,
  farmFormSchema,
  toFarmForm,
  toUpsertFarmRequest,
  type FarmForm,
  type UpsertFarmRequest,
} from '../../domain/profile.model'
import type { ProfileRepository } from '../../domain/profile.repository.interface'

const SAVE_FAILED = 'We could not save your farm profile. Please try again.'

// The farm profile answers 404 until the farmer creates one; that is an empty state.
function isFarmMissing(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

// The farm profile: its read, the create-or-edit form and the save.
export function useFarmProfile(repository: ProfileRepository = profileRepository) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const editing = ref(false)
  const form = ref<FarmForm>(toFarmForm(null))
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')

  const query = useQuery({
    queryKey: profileKeys.farm(),
    queryFn: () => repository.getFarmProfile(session.accessToken ?? ''),
    retry: (failureCount, error) => !isFarmMissing(error) && failureCount < 1,
  })

  const upsert = useMutation({
    mutationFn: (body: UpsertFarmRequest) =>
      repository.upsertFarmProfile(body, session.accessToken ?? ''),
  })

  const farm = computed(() => query.data.value?.data ?? null)
  const missing = computed(() => isFarmMissing(query.error.value))
  const loading = computed(() => query.isPending.value)
  const loadFailed = computed(() => query.isError.value && !missing.value)
  const saving = computed(() => upsert.isPending.value)

  function open() {
    form.value = toFarmForm(farm.value)
    fieldErrors.value = {}
    formError.value = ''
    editing.value = true
  }

  function close() {
    editing.value = false
  }

  async function save() {
    fieldErrors.value = {}
    formError.value = ''
    const parsed = farmFormSchema.safeParse(form.value)
    if (!parsed.success) {
      fieldErrors.value = zodFieldErrors(parsed.error)
      return
    }
    if (!isOnline.value) {
      formError.value = PROFILE_OFFLINE_MESSAGE
      return
    }
    try {
      await upsert.mutateAsync(toUpsertFarmRequest(parsed.data))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.farm() }),
        invalidateAfter(queryClient, 'farmUpdate'),
      ])
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, SAVE_FAILED)
      return
    }
    toast.show('Farm profile updated.', 'success')
    editing.value = false
  }

  return {
    farm,
    missing,
    loading,
    loadFailed,
    refetch: query.refetch,
    editing,
    form,
    fieldErrors,
    formError,
    saving,
    isOnline,
    open,
    close,
    save,
  }
}
