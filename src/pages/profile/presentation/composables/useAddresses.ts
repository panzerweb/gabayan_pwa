import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { zodFieldErrors } from '@core/utils/validation'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { profileKeys } from '../../data/profile.keys'
import { profileRepository } from '../../data/profile.repository'
import {
  PROFILE_OFFLINE_MESSAGE,
  addressFormSchema,
  newAddressForm,
  toAddressWrite,
  type Address,
  type AddressForm,
  type AddressWrite,
} from '../../domain/profile.model'
import type { ProfileRepository } from '../../domain/profile.repository.interface'

const ADD_FAILED = 'We could not add this address. Please try again.'
const ACTION_FAILED = 'We could not update this address. Please try again.'

type AddressAction = { type: 'default' | 'remove'; address: Address }

// The delivery address book: the list, the add form, and making an address the default
// or removing it. The default itself cannot be removed; the server refuses it.
export function useAddresses(repository: ProfileRepository = profileRepository) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const adding = ref(false)
  const form = ref<AddressForm>(newAddressForm(null, false))
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')
  const actionError = ref('')
  const pendingAddressId = ref<string | null>(null)

  const query = useQuery({
    queryKey: profileKeys.addresses(),
    queryFn: () => repository.listAddresses(session.accessToken ?? ''),
  })

  const create = useMutation({
    mutationFn: (body: AddressWrite) => repository.createAddress(body, session.accessToken ?? ''),
  })

  const act = useMutation({
    mutationFn: async ({ type, address }: AddressAction) => {
      const accessToken = session.accessToken ?? ''
      if (type === 'default')
        await repository.updateAddress(address.id, { isDefault: true }, accessToken)
      else await repository.deleteAddress(address.id, accessToken)
    },
  })

  const addresses = computed(() => query.data.value?.data ?? [])
  const loading = computed(() => query.isPending.value)
  const loadFailed = computed(() => query.isError.value)
  const saving = computed(() => create.isPending.value)

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: profileKeys.addresses() })
  }

  // The first address an account adds is proposed as its default.
  function open() {
    form.value = newAddressForm(session.user, addresses.value.length === 0)
    fieldErrors.value = {}
    formError.value = ''
    adding.value = true
  }

  function close() {
    adding.value = false
  }

  async function save() {
    fieldErrors.value = {}
    formError.value = ''
    const parsed = addressFormSchema.safeParse(form.value)
    if (!parsed.success) {
      fieldErrors.value = zodFieldErrors(parsed.error)
      return
    }
    if (!isOnline.value) {
      formError.value = PROFILE_OFFLINE_MESSAGE
      return
    }
    try {
      await create.mutateAsync(toAddressWrite(parsed.data))
      await refresh()
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, ADD_FAILED)
      return
    }
    toast.show('Address added.', 'success')
    adding.value = false
  }

  async function run(action: AddressAction, success: string) {
    actionError.value = ''
    if (!isOnline.value) {
      actionError.value = PROFILE_OFFLINE_MESSAGE
      return
    }
    pendingAddressId.value = action.address.id
    try {
      await act.mutateAsync(action)
      await refresh()
      toast.show(success, 'success')
    } catch (error) {
      actionError.value = describeError(error, ACTION_FAILED)
    } finally {
      pendingAddressId.value = null
    }
  }

  function makeDefault(address: Address) {
    return run({ type: 'default', address }, 'Default address updated.')
  }

  function remove(address: Address) {
    return run({ type: 'remove', address }, 'Address removed.')
  }

  return {
    addresses,
    loading,
    loadFailed,
    refetch: query.refetch,
    adding,
    form,
    fieldErrors,
    formError,
    saving,
    actionError,
    pendingAddressId,
    isOnline,
    open,
    close,
    save,
    makeDefault,
    remove,
  }
}
