import { mount } from '@vue/test-utils'

import WeatherAlertDetail from '@pages/weather-alerts/presentation/components/WeatherAlertDetail.vue'

import { heatAlert, overcastAlert } from '../../unit/weather-alerts/fixtures'

describe('WeatherAlertDetail', () => {
  it('words a cloudy-spell warning with a label and icon for its kind and severity', () => {
    const wrapper = mount(WeatherAlertDetail, { props: { alert: overcastAlert } })

    const chips = wrapper.findAll('.status-chip').map((chip) => chip.text())
    expect(chips.slice(0, 2)).toEqual(['Cloudy spell', 'Warning'])
    expect(wrapper.findAll('.status-chip svg').length).toBeGreaterThanOrEqual(2)
    expect(wrapper.text()).toContain('Wed, Sep 23 – Fri, Sep 25')
    expect(wrapper.text()).toContain('Forecast cloud cover up to 92%')
  })

  it('leaves the title to a notification that already shows it', () => {
    const wrapper = mount(WeatherAlertDetail, { props: { alert: heatAlert, showTitle: false } })

    expect(wrapper.find('h3').exists()).toBe(false)
    expect(wrapper.text()).toContain(heatAlert.explanation)
  })

  it('shows the demo disclaimer only while the rule is a demo', () => {
    const verified = { ...heatAlert, isDemo: false, sourceStatus: 'VERIFIED' as const }
    const wrapper = mount(WeatherAlertDetail, { props: { alert: verified } })

    expect(wrapper.find('[aria-label="About this alert"]').exists()).toBe(false)
  })
})
