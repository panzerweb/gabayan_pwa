import { mount } from '@vue/test-utils'

import SelectableCard from '@/components/ui/SelectableCard.vue'

describe('SelectableCard', () => {
  it('communicates selection without relying on color and emits an action', async () => {
    const wrapper = mount(SelectableCard, {
      props: {
        title: 'Tilapia',
        description: 'A demo species profile.',
        selected: true,
      },
    })

    expect(wrapper.get('[role="radio"]').attributes('aria-checked')).toBe('true')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })
})
