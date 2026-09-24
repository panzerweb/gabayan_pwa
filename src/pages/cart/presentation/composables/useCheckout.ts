import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { ApiError } from '@core/http'
import { invalidateAfter } from '@core/query'
import { zodFieldErrors } from '@core/utils/validation'
import type { PaymentMethodType } from '@pages/orders/domain/orders.model'
import { profileKeys } from '@pages/profile/data/profile.keys'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

import { cartKeys } from '../../data/cart.keys'
import { cartRepository } from '../../data/cart.repository'
import {
  CHECKOUT_OFFLINE_MESSAGE,
  DEFAULT_PAYMENT_METHOD,
  checkoutContactFormSchema,
  contactFieldErrors,
  deliveryAddressFrom,
  initialPaymentMethod,
  type CheckoutContactForm,
  type CheckoutQuote,
  type CheckoutQuoteRequest,
  type CreateOrderRequest,
} from '../../domain/cart.model'
import type { CartRepository } from '../../domain/cart.repository.interface'

const QUOTE_FAILED = 'We couldn’t prepare the checkout total. Please try again.'
const PLACE_FAILED = 'We couldn’t place this order. Please try again.'
const QUOTE_CHANGED = 'Prices or your cart changed since the total was prepared. Review it again.'
const NO_ADDRESS = 'Add a delivery address on your profile before checking out.'

// One placement attempt: the quote it places and the key the server deduplicates on.
type PlacementAttempt = { quoteId: string; idempotencyKey: string }

// Checkout: the delivery address, contact details and payment method, the server's quote,
// and placing the order against that quote. Placing sends one Idempotency-Key per
// submission and reuses it when the same quote is retried, so a retry after a lost answer
// can never create a second order. Nothing is sent while offline.
export function useCheckout(repository: CartRepository = cartRepository) {
  const session = useSessionStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const contact = ref<CheckoutContactForm>({
    fullName: session.user?.fullName ?? '',
    mobileNumber: session.user?.mobileNumber ?? '',
    email: session.user?.email ?? '',
  })
  const paymentMethod = ref<PaymentMethodType>(DEFAULT_PAYMENT_METHOD)
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')
  const quote = ref<CheckoutQuote | null>(null)
  let attempt: PlacementAttempt | null = null

  const accessToken = () => session.accessToken ?? ''

  const cartQuery = useQuery({
    queryKey: cartKeys.detail(),
    queryFn: () => repository.getCart(accessToken()),
  })
  const addressQuery = useQuery({
    queryKey: profileKeys.addresses(),
    queryFn: () => repository.listDeliveryAddresses(accessToken()),
  })
  const paymentQuery = useQuery({
    queryKey: cartKeys.paymentOptions(),
    queryFn: () => repository.listPaymentOptions(accessToken()),
  })

  const quoteMutation = useMutation({
    mutationFn: (body: CheckoutQuoteRequest) => repository.createCheckoutQuote(body, accessToken()),
  })
  const orderMutation = useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: CreateOrderRequest; idempotencyKey: string }) =>
      repository.createOrder(body, idempotencyKey, accessToken()),
  })

  const cart = computed(() => cartQuery.data.value?.data ?? null)
  const address = computed(() => deliveryAddressFrom(addressQuery.data.value?.data ?? []))
  const paymentOptions = computed(() => paymentQuery.data.value?.data ?? [])
  const loading = computed(
    () => cartQuery.isPending.value || addressQuery.isPending.value || paymentQuery.isPending.value,
  )
  const loadFailed = computed(
    () => cartQuery.isError.value || addressQuery.isError.value || paymentQuery.isError.value,
  )

  watch(paymentOptions, (options) => {
    const current = options.find((option) => option.type === paymentMethod.value)
    if (!current?.enabled) paymentMethod.value = initialPaymentMethod(options)
  })

  // A quote holds the contact, payment method and address it was asked for; changing any
  // of them means the farmer reviews a fresh total before placing the order.
  watch([contact, paymentMethod, () => address.value?.id], () => clearQuote(), { deep: true })

  function clearQuote() {
    quote.value = null
    attempt = null
  }

  async function requestQuote() {
    fieldErrors.value = {}
    formError.value = ''
    const parsed = checkoutContactFormSchema.safeParse(contact.value)
    if (!parsed.success) {
      fieldErrors.value = zodFieldErrors(parsed.error)
      return
    }
    if (!cart.value || !address.value) {
      formError.value = NO_ADDRESS
      return
    }
    if (!isOnline.value) {
      formError.value = CHECKOUT_OFFLINE_MESSAGE
      return
    }
    try {
      const result = await quoteMutation.mutateAsync({
        addressId: address.value.id,
        contact: parsed.data,
        paymentMethod: paymentMethod.value,
        cartVersion: cart.value.version,
      })
      quote.value = result.data
      attempt = null
    } catch (error) {
      fieldErrors.value = contactFieldErrors(apiFieldErrors(error))
      formError.value = describeError(error, QUOTE_FAILED)
    }
  }

  async function placeOrder() {
    formError.value = ''
    const current = quote.value
    if (!current) return
    if (!isOnline.value) {
      formError.value = CHECKOUT_OFFLINE_MESSAGE
      return
    }
    if (attempt?.quoteId !== current.quoteId) {
      attempt = { quoteId: current.quoteId, idempotencyKey: crypto.randomUUID() }
    }
    let orderId: string
    try {
      const result = await orderMutation.mutateAsync({
        body: { quoteId: current.quoteId, acceptedTotal: current.total },
        idempotencyKey: attempt.idempotencyKey,
      })
      orderId = result.data.id
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        clearQuote()
        formError.value = QUOTE_CHANGED
        await queryClient.invalidateQueries({ queryKey: cartKeys.all() })
        return
      }
      formError.value = describeError(error, PLACE_FAILED)
      return
    }
    await invalidateAfter(queryClient, 'orderCreate')
    await router.replace({
      name: ROUTE_NAMES.orderDetail,
      params: { orderId },
      query: { placed: '1' },
    })
  }

  function retry() {
    return Promise.all([cartQuery.refetch(), addressQuery.refetch(), paymentQuery.refetch()])
  }

  return {
    cart,
    address,
    paymentOptions,
    loading,
    loadFailed,
    retry,
    isOnline,
    contact,
    paymentMethod,
    fieldErrors,
    formError,
    quote,
    requesting: computed(() => quoteMutation.isPending.value),
    placing: computed(() => orderMutation.isPending.value),
    requestQuote,
    placeOrder,
  }
}
