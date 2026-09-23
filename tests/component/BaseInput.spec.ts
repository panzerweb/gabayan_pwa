import { mount } from '@vue/test-utils'

import BaseInput from '@/components/ui/BaseInput.vue'

describe('BaseInput', () => {
  it('associates its visible label and error with the input', async () => {
    const wrapper = mount(BaseInput, {
      props: {
        label: 'Culture area',
        error: 'Enter a valid area.',
        required: true,
      },
    })

    const input = wrapper.get('input')
    const label = wrapper.get('label')
    const error = wrapper.get('[role="alert"]')

    expect(label.attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toContain(error.attributes('id'))
    expect(input.attributes('aria-invalid')).toBe('true')

    await input.setValue('250')
    expect(wrapper.emitted('update:modelValue')).toEqual([['250']])
  })
})
