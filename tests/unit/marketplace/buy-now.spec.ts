import {
  buyNowQuery,
  presetQuantityFrom,
  productDetailSchema,
} from '@pages/marketplace/domain/marketplace.model'

import { aeratorDetail, aeratorDetailWithGuide } from './fixtures'

describe('Buy now and installation guides', () => {
  it('puts the suggested quantity, and the cultivation when known, in the product query', () => {
    expect(buyNowQuery(2, 'cul_00002')).toEqual({ quantity: '2', cultivationId: 'cul_00002' })
    expect(buyNowQuery(1)).toEqual({ quantity: '1' })
  })

  it('never links with a quantity below one', () => {
    expect(buyNowQuery(0)).toEqual({ quantity: '1' })
    expect(buyNowQuery(2.7)).toEqual({ quantity: '2' })
  })

  it('reads a preset quantity only when the query holds a whole number above zero', () => {
    expect(presetQuantityFrom({ quantity: '3' })).toBe(3)
    expect(presetQuantityFrom({ quantity: ['2', '5'] })).toBe(2)
    expect(presetQuantityFrom({ quantity: '0' })).toBeNull()
    expect(presetQuantityFrom({ quantity: '-1' })).toBeNull()
    expect(presetQuantityFrom({ quantity: '1.5' })).toBeNull()
    expect(presetQuantityFrom({ quantity: 'many' })).toBeNull()
    expect(presetQuantityFrom({})).toBeNull()
  })

  it('parses a product with its installation steps, a product with none, and one from an API without the field', () => {
    const guided = productDetailSchema.parse(aeratorDetailWithGuide)
    expect(guided.installationGuide?.steps.map((step) => step.order)).toEqual([1, 2])
    expect(productDetailSchema.parse({ ...aeratorDetail, installationGuide: null })).toMatchObject({
      installationGuide: null,
    })
    expect(productDetailSchema.parse(aeratorDetail).installationGuide).toBeUndefined()
  })

  it('refuses a guide with no steps', () => {
    const empty = {
      ...aeratorDetailWithGuide,
      installationGuide: { ...aeratorDetailWithGuide.installationGuide, steps: [] },
    }
    expect(productDetailSchema.safeParse(empty).success).toBe(false)
  })
})
