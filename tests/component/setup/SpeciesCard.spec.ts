import { mount } from '@vue/test-utils'

import SpeciesCard from '@pages/setup/presentation/components/SpeciesCard.vue'

import { shrimp, tilapia } from '../../unit/setup/fixtures'

describe('SpeciesCard', () => {
  it('shows the local name, the local image and a demo label with its icon', () => {
    const wrapper = mount(SpeciesCard, { props: { species: shrimp } })

    expect(wrapper.get('strong').text()).toBe('Shrimp (Hipon)')
    const image = wrapper.get('img')
    expect(image.attributes('src')).toBe('/mock-media/shrimp.svg')
    expect(image.attributes('alt')).toBe('Shrimp on a pond bottom')
    const chip = wrapper.get('.status-chip')
    expect(chip.text()).toBe('Demo figures, not yet reviewed')
    expect(chip.find('svg').exists()).toBe(true)
    expect(wrapper.text()).toContain('Additional planning may help')
  })

  it('is a radio named by the species and described by its summary and provenance', () => {
    const wrapper = mount(SpeciesCard, { props: { species: tilapia, selected: true } })

    const radio = wrapper.get('[role="radio"]')
    expect(radio.attributes('aria-checked')).toBe('true')
    const title = wrapper.get(`#${radio.attributes('aria-labelledby')}`)
    expect(title.text()).toBe('Tilapia')
    const described = radio
      .attributes('aria-describedby')
      ?.split(' ')
      .map((id) => wrapper.get(`#${id}`).text())
      .join(' ')
    expect(described).toContain(tilapia.shortDescription)
    expect(described).toContain('Demo figures, not yet reviewed')
  })

  it('reports the choice when pressed', async () => {
    const wrapper = mount(SpeciesCard, { props: { species: shrimp } })

    expect(wrapper.get('[role="radio"]').attributes('aria-checked')).toBe('false')
    await wrapper.get('[role="radio"]').trigger('click')

    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('falls back to an icon when the image cannot be loaded', async () => {
    const wrapper = mount(SpeciesCard, { props: { species: shrimp } })

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.species-card__media svg').exists()).toBe(true)
  })
})
