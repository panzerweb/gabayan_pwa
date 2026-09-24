import type { AppIconName } from '@components/ui/AppIcon.vue'
import { ROUTE_NAMES, type RouteName } from '@router/route-names'

export interface PrimaryDestination {
  label: string
  routeName: RouteName
  icon: AppIconName
}

// The bottom navigation after onboarding: exactly these four, in this order. Marketplace,
// cart, notifications and settings are secondary routes reached from these screens.
export const PRIMARY_DESTINATIONS: readonly PrimaryDestination[] = [
  { label: 'Home', routeName: ROUTE_NAMES.home, icon: 'home' },
  { label: 'Cultivations', routeName: ROUTE_NAMES.cultivations, icon: 'fish' },
  { label: 'Orders', routeName: ROUTE_NAMES.orders, icon: 'bag' },
  { label: 'Profile', routeName: ROUTE_NAMES.profile, icon: 'profile' },
]
