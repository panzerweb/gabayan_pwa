import {
  canContinueFromEnvironment,
  canReviewEstimate,
  compatibilityDisplay,
  createCultivationRequest,
  dimensionsFormErrors,
  dimensionsFormFrom,
  dimensionsFrom,
  equipmentRecommendationsSchema,
  formatDepthRange,
  formatSpace,
  parseFingerlings,
  parseMeters,
  recommendedProducts,
  sizingGuidanceSchema,
  sizingTitle,
  spaceMeasure,
  spaceShortfallMessage,
  speciesNote,
  speciesSourceDisplay,
  speciesTitle,
  stockingEstimateRequest,
  stockingEstimateSchema,
  stockingResultContent,
  stockingStatusLabel,
} from '@pages/setup/domain/setup.model'

import {
  aboveRangeEstimate,
  bangusAboveRangeEstimate,
  bangusPondSizing,
  compatible,
  inRangeEstimate,
  milkfish,
  notRecommended,
  recommendations,
  tilapia,
} from './fixtures'

const noDetails = { cultivationName: '', stockedOn: '', aboveRangeReason: '' }

describe('setup model', () => {
  it('parses a representative stocking estimate and equipment recommendation payload', () => {
    expect(stockingEstimateSchema.parse(inRangeEstimate).basis.densityUnit).toBe('FISH_PER_M3')
    expect(equipmentRecommendationsSchema.parse(recommendations).sections).toHaveLength(1)
  })

  it('parses sizing guidance and an estimate carrying the space it needs', () => {
    expect(sizingGuidanceSchema.parse(bangusPondSizing).waterDepth?.unit).toBe('M')
    expect(sizingGuidanceSchema.parse({ ...bangusPondSizing, waterDepth: null }).waterDepth).toBe(
      null,
    )
    expect(stockingEstimateSchema.parse(bangusAboveRangeEstimate).additionalSpaceNeeded).toEqual({
      value: 4500,
      unit: 'M2',
    })
  })

  it('writes an area with its hectares once it is pond-sized, and keeps small spaces precise', () => {
    expect(formatSpace({ value: 5000, unit: 'M2' })).toBe('5,000 m² (0.5 ha)')
    expect(formatSpace({ value: 500, unit: 'M2' })).toBe('500 m²')
    expect(formatSpace({ value: 0.0546, unit: 'M3' })).toBe('0.055 m³')
    expect(formatSpace({ value: 27.28, unit: 'M3' })).toBe('27.28 m³')
    expect(spaceMeasure('M2')).toContain('length × width')
    expect(spaceMeasure('M3')).toContain('depth')
  })

  it('writes a depth range with one decimal', () => {
    expect(formatDepthRange({ minimum: 1, maximum: 1.2, unit: 'M' })).toBe('1.0–1.2 m')
    expect(formatDepthRange({ minimum: 1.5, maximum: 1.5, unit: 'M' })).toBe('1.5 m')
  })

  it('titles the sizing dialog with the fish and culture system', () => {
    expect(sizingTitle(milkfish, { name: 'Pond' })).toBe(
      'Suggested pond size for Milkfish (Bangus)',
    )
    expect(sizingTitle(undefined, { name: 'Pond' })).toBe('Suggested size')
  })

  it('names the extra space an above-range plan needs, and nothing otherwise', () => {
    expect(spaceShortfallMessage(bangusAboveRangeEstimate)).toBe(
      '5,000 fish need about 5,000 m² (0.5 ha) of water surface (length × width). ' +
        'Your area has 500 m², so it needs about 4,500 m² (0.45 ha) more, or plan fewer fish.',
    )
    expect(spaceShortfallMessage({ ...bangusAboveRangeEstimate, status: 'RECOMMENDED' })).toBeNull()
    const { additionalSpaceNeeded: _omitted, ...savedBefore } = bangusAboveRangeEstimate
    void _omitted
    expect(spaceShortfallMessage(savedBefore)).toBeNull()
    expect(spaceShortfallMessage(aboveRangeEstimate)).toBeNull()
  })

  it('names a species by both names only where the local name differs', () => {
    expect(speciesTitle(tilapia)).toBe('Tilapia')
    expect(speciesTitle(milkfish)).toBe('Milkfish (Bangus)')
    expect(speciesNote(milkfish)).toBe('Additional planning may help')
  })

  it('says how far a species profile has been reviewed, in words beside an icon', () => {
    expect(speciesSourceDisplay('DEMO')).toEqual({
      label: 'Demo figures, not yet reviewed',
      tone: 'warning',
      icon: 'warning',
    })
    expect(speciesSourceDisplay('DRAFT')).toMatchObject({ label: 'Draft figures', icon: 'info' })
    expect(speciesSourceDisplay('VERIFIED')).toMatchObject({
      label: 'Reviewed figures',
      tone: 'success',
      icon: 'check',
    })
    expect(speciesSourceDisplay('RETIRED')).toMatchObject({ label: 'Retired profile' })
  })

  it('shows a compatible pairing with a check and any other with a warning', () => {
    expect(compatibilityDisplay('COMPATIBLE')).toEqual({ tone: 'success', icon: 'check' })
    expect(compatibilityDisplay('CAUTION')).toEqual({ tone: 'warning', icon: 'warning' })
  })

  it('opens the dimensions step only for a checked pairing that is not advised against', () => {
    expect(canContinueFromEnvironment('env_pond', compatible, false)).toBe(true)
    expect(canContinueFromEnvironment('env_pond', compatible, true)).toBe(false)
    expect(canContinueFromEnvironment('env_pond', undefined, false)).toBe(false)
    expect(canContinueFromEnvironment('env_cage', notRecommended, false)).toBe(false)
    expect(canContinueFromEnvironment('env_cage', compatible, false)).toBe(false)
    expect(canContinueFromEnvironment(null, compatible, false)).toBe(false)
  })

  it('never reads a blank or zero measurement as a dimension', () => {
    expect(parseMeters('')).toBeNull()
    expect(parseMeters('0')).toBeNull()
    expect(parseMeters('abc')).toBeNull()
    expect(parseMeters('20000')).toBeNull()
    expect(parseMeters(' 1.5 ')).toBe(1.5)
  })

  it('names each missing dimension and builds dimensions once all three are valid', () => {
    const form = { lengthM: '5', widthM: '', waterDepthM: '0' }

    expect(dimensionsFormErrors(form)).toEqual({
      widthM: 'Enter a width greater than 0.',
      waterDepthM: 'Enter a water depth greater than 0.',
    })
    expect(dimensionsFrom(form)).toBeNull()
    expect(dimensionsFrom({ ...form, widthM: '4', waterDepthM: '1.5' })).toEqual({
      lengthM: 5,
      widthM: 4,
      waterDepthM: 1.5,
    })
    expect(dimensionsFormFrom({ lengthM: 5, widthM: 4, waterDepthM: 1.5 })).toEqual({
      lengthM: '5',
      widthM: '4',
      waterDepthM: '1.5',
    })
  })

  it('accepts only a whole fingerling count above zero', () => {
    expect(parseFingerlings('500')).toBe(500)
    for (const invalid of ['', '0', '12.5', '-3', '1e3', 'many']) {
      expect(parseFingerlings(invalid)).toBeNull()
    }
  })

  it('builds the estimate request only once every earlier step is answered', () => {
    const draft = {
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
    }

    expect(stockingEstimateRequest(draft, 500)).toEqual({ ...draft, plannedFingerlings: 500 })
    expect(stockingEstimateRequest({ ...draft, dimensions: null }, 500)).toBeNull()
  })

  it('words each stocking result with a label, an icon and a tone', () => {
    expect(stockingResultContent('ABOVE_RANGE')).toMatchObject({
      title: 'Your plan is above the demo range',
      tone: 'warning',
      icon: 'warning',
    })
    expect(stockingResultContent('RECOMMENDED').icon).toBe('check')
    expect(stockingStatusLabel('BELOW_RANGE')).toBe('Below the demo range')
  })

  it('holds an above-range plan back from review until the warning is confirmed', () => {
    expect(canReviewEstimate(inRangeEstimate, false)).toBe(true)
    expect(canReviewEstimate(aboveRangeEstimate, false)).toBe(false)
    expect(canReviewEstimate(aboveRangeEstimate, true)).toBe(true)
  })

  it('builds a creation request from the estimate, leaving blank details out', () => {
    expect(createCultivationRequest(inRangeEstimate, noDetails, false)).toEqual({
      estimateId: 'est_demo_tilapia_pond_500',
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
      initialFingerlings: 500,
      stockedOn: null,
    })
  })

  it('sends the above-range confirmation and reason only for an above-range plan', () => {
    const request = createCultivationRequest(
      aboveRangeEstimate,
      { cultivationName: '  Maria’s Pond ', stockedOn: '2026-09-23', aboveRangeReason: ' ' },
      true,
    )

    expect(request).toMatchObject({
      name: 'Maria’s Pond',
      initialFingerlings: 800,
      stockedOn: '2026-09-23',
      acceptedAboveRangeWarning: true,
      aboveRangeReason: null,
    })
  })

  it('lists every recommended product across sections', () => {
    expect(recommendedProducts(recommendations).map(({ id }) => id)).toEqual(['prd_pond_aerator'])
  })
})
