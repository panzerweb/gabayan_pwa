import { mount } from '@vue/test-utils'

import BaseModal from '@/components/overlays/BaseModal.vue'

describe('BaseModal', () => {
  it('labels the dialog and closes with Escape', async () => {
    const wrapper = mount(BaseModal, {
      attachTo: document.body,
      props: { open: true, title: 'Confirm stocking plan', description: 'Review before saving.' },
      slots: { default: 'Dialog content' },
    })

    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(
      document.getElementById(dialog?.getAttribute('aria-labelledby') ?? '')?.textContent,
    ).toBe('Confirm stocking plan')
    expect(
      document.getElementById(dialog?.getAttribute('aria-describedby') ?? '')?.textContent,
    ).toBe('Review before saving.')

    await dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })
})
