import { mount } from '@vue/test-utils'

import { emptyReadingsForm } from '@pages/water-quality/domain/water-quality.model'
import WaterReadingsForm from '@pages/water-quality/presentation/components/WaterReadingsForm.vue'

import { tilapiaPondThresholds } from '../../unit/water-quality/fixtures'

function mountForm(props: Partial<InstanceType<typeof WaterReadingsForm>['$props']> = {}) {
  return mount(WaterReadingsForm, {
    props: { form: emptyReadingsForm(), fieldErrors: {}, ...props },
    global: { stubs: { RouterLink: true } },
  })
}

describe('WaterReadingsForm', () => {
  it('labels each of the seven readings with its unit and ties the label to its input', () => {
    const wrapper = mountForm()

    const labels = wrapper.findAll('label').map((label) => label.text())
    expect(labels).toEqual([
      'Salinity (ppt)',
      'pH (scale 0–14)',
      'Ammonia (mg/L)',
      'Nitrite (mg/L)',
      'Nitrate (mg/L)',
      'Dissolved oxygen (mg/L)',
      'Water temperature (°C)',
    ])
    for (const label of wrapper.findAll('label')) {
      const input = wrapper.get(`#${label.attributes('for')}`)
      expect(input.attributes('inputmode')).toBe('decimal')
    }
  })

  it('explains each parameter and its suggested range once the ranges are known', () => {
    const wrapper = mountForm({ thresholds: tilapiaPondThresholds.thresholds })

    const ammonia = wrapper.findAll('.field')[2]
    expect(ammonia?.text()).toContain('A waste that builds up from fish droppings')
    expect(ammonia?.text()).toContain('Suggested: Up to 0.5 mg/L.')
  })

  it('shows a validation message beside the reading it belongs to', () => {
    const wrapper = mountForm({
      fieldErrors: { 'readings.ph': 'Enter a number from 0 to 14.' },
    })

    const ph = wrapper.findAll('.field')[1]
    const input = ph!.get('input')
    const message = ph!.get('[role="alert"]')
    expect(message.text()).toBe('Enter a number from 0 to 14.')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toContain(message.attributes('id'))
  })

  it('asks for at least one reading when none was entered', () => {
    const wrapper = mountForm({ fieldErrors: { readings: 'Enter at least one reading to check.' } })

    expect(wrapper.get('.form-error').text()).toBe('Enter at least one reading to check.')
  })

  it('reports each typed reading and the submit to its parent', async () => {
    const wrapper = mountForm()

    await wrapper.findAll('input')[2]!.setValue('1.2')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('update:reading')).toEqual([['AMMONIA', '1.2']])
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('disables every reading and the button while offline', () => {
    const wrapper = mountForm({ disabled: true })

    expect(
      wrapper.findAll('input').every((input) => input.attributes('disabled') !== undefined),
    ).toBe(true)
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
