import { useMutation } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { zodFieldErrors } from '@core/utils/validation'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { profileRepository } from '../../data/profile.repository'
import {
  PROFILE_OFFLINE_MESSAGE,
  personalDetailsFormSchema,
  type UpdateUserRequest,
} from '../../domain/profile.model'
import type { ProfileRepository } from '../../domain/profile.repository.interface'

const UPDATE_FAILED = 'We could not update your personal details. Please try again.'

// Personal details of the signed-in farmer: the edit form, its validation and the save,
// which replaces the session's user with the server's answer.
export function useProfileDetails(repository: ProfileRepository = profileRepository) {
  const session = useSessionStore()
  const toast = useToastStore()
  const { isOnline } = useOnlineStatus()

  const editing = ref(false)
  const fullName = ref('')
  const mobileNumber = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')

  const update = useMutation({
    mutationFn: (body: UpdateUserRequest) =>
      repository.updateCurrentUser(body, session.accessToken ?? ''),
  })

  const user = computed(() => session.user)
  const saving = computed(() => update.isPending.value)

  function open() {
    fullName.value = session.user?.fullName ?? ''
    mobileNumber.value = session.user?.mobileNumber ?? ''
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
    const parsed = personalDetailsFormSchema.safeParse({
      fullName: fullName.value,
      mobileNumber: mobileNumber.value,
    })
    if (!parsed.success) {
      fieldErrors.value = zodFieldErrors(parsed.error)
      return
    }
    if (!isOnline.value) {
      formError.value = PROFILE_OFFLINE_MESSAGE
      return
    }
    try {
      const response = await update.mutateAsync(parsed.data)
      session.user = response.data
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, UPDATE_FAILED)
      return
    }
    toast.show('Personal details updated.', 'success')
    editing.value = false
  }

  return {
    user,
    editing,
    fullName,
    mobileNumber,
    fieldErrors,
    formError,
    saving,
    isOnline,
    open,
    close,
    save,
  }
}
