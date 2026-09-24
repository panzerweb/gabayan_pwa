import { PRIMARY_DESTINATIONS } from '@core/navigation'
import { ROUTE_NAMES } from '@router/route-names'

describe('primary destinations', () => {
  it('are exactly Home, Cultivations, Orders and Profile, in that order', () => {
    expect(PRIMARY_DESTINATIONS.map(({ label, routeName }) => [label, routeName])).toEqual([
      ['Home', ROUTE_NAMES.home],
      ['Cultivations', ROUTE_NAMES.cultivations],
      ['Orders', ROUTE_NAMES.orders],
      ['Profile', ROUTE_NAMES.profile],
    ])
  })

  it('never offer the marketplace, cart or notifications as a tab', () => {
    const names = PRIMARY_DESTINATIONS.map(({ routeName }) => routeName)

    expect(names).not.toContain(ROUTE_NAMES.marketplace)
    expect(names).not.toContain(ROUTE_NAMES.cart)
    expect(names).not.toContain(ROUTE_NAMES.notifications)
  })
})
