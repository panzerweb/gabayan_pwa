import type { VueWrapper } from '@vue/test-utils'

// Finds a button by its visible text.
export function button(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('button').find((candidate) => candidate.text() === label)
  if (!found) throw new Error(`No button "${label}"`)
  return found
}

// Finds the control a visible label points at through its `for` attribute, so a test fails
// when a label is missing or not associated with its input.
export function labelled(wrapper: VueWrapper, label: string) {
  const found = wrapper
    .findAll('label[for]')
    .find((candidate) => candidate.text().replace('*', '').trim() === label)
  if (!found) throw new Error(`No label "${label}"`)
  return wrapper.get(`[id="${found.attributes('for')}"]`)
}

// The submit button of the open form.
export function submitButton(wrapper: VueWrapper) {
  return wrapper.get('form button[type="submit"]')
}
