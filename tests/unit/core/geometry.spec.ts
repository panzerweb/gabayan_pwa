import { calculateRectangularArea, calculateRectangularVolume } from '@core/utils/geometry'

describe('rectangular culture-area calculations', () => {
  it('calculates area and water volume without formatting strings', () => {
    expect(calculateRectangularArea(5, 4)).toBe(20)
    expect(calculateRectangularVolume(5, 4, 1.5)).toBe(30)
  })

  it('does not silently coerce invalid measurements to zero', () => {
    expect(calculateRectangularArea(0, 4)).toBeNull()
    expect(calculateRectangularVolume(5, 4, Number.NaN)).toBeNull()
  })
})
