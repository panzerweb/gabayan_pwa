import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { zodFieldErrors } from '@core/utils/validation'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { profileKeys } from '../../data/profile.keys'
import { profileRepository } from '../../data/profile.repository'
import {
  PROFILE_OFFLINE_MESSAGE,
  reminderSettingsFormSchema,
  toNotificationSettingsPatch,
  toReminderSettingsForm,
  type NotificationSettingsPatch,
  type ReminderSettingsForm,
} from '../../domain/profile.model'
import type { ProfileRepository } from '../../domain/profile.repository.interface'

const SAVE_FAILED = 'We could not save your reminder preferences. Please try again.'

// Reminder and notification preferences. The form is reset from every server answer,
// so after a save it shows exactly what was stored.
export function useReminderSettings(repository: ProfileRepository = profileRepository) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const form = ref<ReminderSettingsForm | null>(null)
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')

  const query = useQuery({
    queryKey: profileKeys.notificationSettings(),
    queryFn: () => repository.getNotificationSettings(session.accessToken ?? ''),
  })

  const update = useMutation({
    mutationFn: (body: NotificationSettingsPatch) =>
      repository.updateNotificationSettings(body, session.accessToken ?? ''),
  })

  watch(
    () => query.data.value?.data,
    (settings) => {
      if (settings) form.value = toReminderSettingsForm(settings)
    },
    { immediate: true },
  )

  const loading = computed(() => query.isPending.value)
  const loadFailed = computed(() => query.isError.value)
  const saving = computed(() => update.isPending.value)

  async function save() {
    if (!form.value) return
    fieldErrors.value = {}
    formError.value = ''
    const parsed = reminderSettingsFormSchema.safeParse(form.value)
    if (!parsed.success) {
      fieldErrors.value = zodFieldErrors(parsed.error)
      return
    }
    if (!isOnline.value) {
      formError.value = PROFILE_OFFLINE_MESSAGE
      return
    }
    try {
      const response = await update.mutateAsync(toNotificationSettingsPatch(form.value))
      queryClient.setQueryData(profileKeys.notificationSettings(), response)
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, SAVE_FAILED)
      return
    }
    toast.show('Notification preferences saved.', 'success')
  }

  return {
    form,
    loading,
    loadFailed,
    refetch: query.refetch,
    fieldErrors,
    formError,
    saving,
    isOnline,
    save,
  }
}
