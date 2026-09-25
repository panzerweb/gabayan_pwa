import { mount } from '@vue/test-utils'

import PlanCard from '@pages/tiers/presentation/components/PlanCard.vue'

import { freePlan, proPlan } from '../../unit/tiers/fixtures'

describe('PlanCard', () => {
  it('shows the price, the culture-system limit and everything the plan includes', () => {
    const wrapper = mount(PlanCard, { props: { plan: freePlan } })

    expect(wrapper.get('.plan-card__title').text()).toContain('Free')
    expect(wrapper.text()).toContain('₱0.00 / month')
    expect(wrapper.text()).toContain('1 culture system')
    const included = wrapper.get('ul')
    expect(included.attributes('aria-label')).toBe('Free includes')
    expect(included.findAll('li').map((item) => item.text())).toEqual(
      freePlan.entitlements.map((entitlement) => entitlement.label),
    )
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('says a plan without a price has pricing coming soon', () => {
    const wrapper = mount(PlanCard, { props: { plan: proPlan } })

    expect(wrapper.text()).toContain('Pricing coming soon')
    expect(wrapper.text()).toContain('Up to 10 culture systems')
  })

  it('offers the plan as a labelled radio and reports the choice', async () => {
    const wrapper = mount(PlanCard, {
      props: { plan: proPlan, selectable: true, selected: false, name: 'plan-step' },
    })

    const radio = wrapper.get('input[type="radio"]')
    expect(radio.attributes('name')).toBe('plan-step')
    expect(wrapper.get(`label[for="${radio.attributes('id')}"]`).text()).toContain('Pro')
    await radio.setValue(true)

    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('marks the chosen plan checked and the current plan with a labelled chip', () => {
    const wrapper = mount(PlanCard, {
      props: { plan: freePlan, selectable: true, selected: true, current: true },
    })

    expect((wrapper.get('input').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.classes()).toContain('plan-card--selected')
    expect(wrapper.get('.status-chip').text()).toBe('Current plan')
  })

  it('renders an action given for the plan', () => {
    const wrapper = mount(PlanCard, {
      props: { plan: proPlan },
      slots: { action: '<button type="button">Request Pro</button>' },
    })

    expect(wrapper.get('button').text()).toBe('Request Pro')
  })
})
