import { mount } from '@vue/test-utils'

import WaterLogTrend from '@pages/water-quality/presentation/components/WaterLogTrend.vue'

import { seededLogs, waterLog } from '../../unit/water-quality/log-fixtures'

describe('WaterLogTrend', () => {
  it('opens on the first parameter with a reading out of range and flags that reading', () => {
    const wrapper = mount(WaterLogTrend, { props: { logs: seededLogs } })

    expect(wrapper.get<HTMLInputElement>('input[value="AMMONIA"]').element.checked).toBe(true)
    expect(wrapper.get('svg').attributes('aria-label')).toBe('Ammonia trend with 3 readings')
    const flagged = wrapper.findAll('.water-trend__flagged')
    expect(flagged).toHaveLength(1)
    expect(flagged[0]!.text()).toContain('0.8 mg/L, above range')
    expect(wrapper.findAll('circle')).toHaveLength(2)
    expect(wrapper.text()).toContain('Suggested range (shaded): Up to 0.5 mg/L')
  })

  it('lists the readings newest first, each with its status in words', () => {
    const wrapper = mount(WaterLogTrend, { props: { logs: seededLogs } })

    const items = wrapper.get('ol[aria-label="Ammonia readings, newest first"]').findAll('li')
    expect(items.map((item) => item.text())).toEqual([
      expect.stringMatching(/Sep 22, 2026.*0\.4 mg\/L.*Within range/),
      expect.stringMatching(/Sep 17, 2026.*0\.8 mg\/L.*Above range/),
      expect.stringMatching(/Sep 10, 2026.*0\.2 mg\/L.*Within range/),
    ])
  })

  it('shows another parameter when it is chosen, leaving out logs that did not measure it', async () => {
    const wrapper = mount(WaterLogTrend, { props: { logs: seededLogs } })

    await wrapper.get('input[value="NITRATE"]').setValue(true)

    expect(wrapper.get('svg').attributes('aria-label')).toBe('Nitrate trend with 2 readings')
    expect(wrapper.findAll('.water-trend__flagged')).toHaveLength(0)
  })

  it('says so when a parameter has no saved reading', async () => {
    const wrapper = mount(WaterLogTrend, {
      props: { logs: [waterLog('wlog_1', '2026-09-21T22:00:00Z', { PH: 7.2 })] },
    })

    expect(wrapper.get<HTMLInputElement>('input[value="PH"]').element.checked).toBe(true)
    await wrapper.get('input[value="SALINITY"]').setValue(true)

    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.text()).toContain('No salinity readings saved yet.')
  })
})
