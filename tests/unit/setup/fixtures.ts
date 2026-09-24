import type {
  CompatibilityResult,
  CultureEnvironment,
  EquipmentRecommendations,
  SizingGuidance,
  SpeciesSummary,
  StockingEstimate,
} from '@pages/setup/domain/setup.model'

import { batch001Detail } from '../cultivations/fixtures'
import { aeration, aerator } from '../marketplace/fixtures'

export const inRangeEstimate: StockingEstimate = batch001Detail.stockingEstimateSnapshot

export const tilapia: SpeciesSummary = inRangeEstimate.species

export const milkfish: SpeciesSummary = {
  ...tilapia,
  id: 'sp_milkfish',
  commonName: 'Milkfish',
  localName: 'Bangus',
  slug: 'milkfish',
  shortDescription: 'A familiar Philippine fish often raised in brackish ponds and cages.',
  beginnerFriendly: false,
}

export const shrimp: SpeciesSummary = {
  ...tilapia,
  id: 'sp_shrimp',
  commonName: 'Shrimp',
  localName: 'Hipon',
  slug: 'shrimp',
  shortDescription: 'Raised in brackish-water ponds and needs close water-quality care.',
  beginnerFriendly: false,
  image: { url: '/mock-media/shrimp.svg', alt: 'Shrimp on a pond bottom' },
}

export const pond: CultureEnvironment = inRangeEstimate.environment

export const fishCage: CultureEnvironment = {
  ...pond,
  id: 'env_cage',
  code: 'CAGE',
  name: 'Fish Cage',
  shortDescription: 'For net cages set in open water.',
}

export const compatible: CompatibilityResult = inRangeEstimate.compatibility

export const notRecommended: CompatibilityResult = {
  ...compatible,
  environmentId: 'env_cage',
  status: 'NOT_RECOMMENDED',
  title: 'This pairing is not recommended',
  message: 'This demo profile does not support this fish in a cage.',
  alternatives: [{ environmentId: 'env_pond', name: 'Pond' }],
}

export const aboveRangeEstimate: StockingEstimate = {
  ...inRangeEstimate,
  estimateId: 'est_demo_tilapia_pond_800',
  plannedFingerlings: 800,
  status: 'ABOVE_RANGE',
  differenceToRange: 250,
}

export const belowRangeEstimate: StockingEstimate = {
  ...inRangeEstimate,
  estimateId: 'est_demo_tilapia_pond_300',
  plannedFingerlings: 300,
  status: 'BELOW_RANGE',
  differenceToRange: -150,
}

// The brief's worked example: 5,000 bangus need about 5,000 m² of pond, 1.0-1.2 m deep.
export const bangusPondSizing: SizingGuidance = {
  speciesId: 'sp_milkfish',
  environmentId: 'env_pond',
  basis: 'SURFACE_AREA',
  spacePerFish: { value: 1, unit: 'M2' },
  exampleFingerlings: 5000,
  exampleSpace: { value: 5000, unit: 'M2' },
  waterDepth: { minimum: 1, maximum: 1.2, unit: 'M' },
  spaceBasis:
    'Demo range of about one square metre of pond per bangus, for a semi-intensive pond kept at least 1.0-1.2 m deep.',
  depthBasis:
    "From the Gabayan brief's sizing sample: a semi-intensive bangus pond kept at least 1.0-1.2 m deep. Not yet reviewed.",
  sources: [
    {
      title: 'Gabayan product brief: semi-intensive bangus pond sizing sample',
      organization: 'Gabayan',
      url: null,
      reviewedAt: null,
      reviewedBy: null,
    },
  ],
  isDemo: true,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09-gabayan',
  disclaimer: inRangeEstimate.disclaimer,
}

export const tilapiaTankSizing: SizingGuidance = {
  ...bangusPondSizing,
  speciesId: 'sp_tilapia',
  environmentId: 'env_tank',
  basis: 'WATER_VOLUME',
  spacePerFish: { value: 0.0715, unit: 'M3' },
  exampleFingerlings: 200,
  exampleSpace: { value: 14.29, unit: 'M3' },
  waterDepth: null,
  spaceBasis: 'Demo density range for this prototype profile.',
  depthBasis:
    "No suggested depth for a tank or container yet. The brief's 1.0-1.2 m figure is for ponds and cages.",
  sources: [],
}

// 5,000 bangus in a 20 x 25 m pond: above the demo range, 4,500 m² short.
export const bangusAboveRangeEstimate: StockingEstimate = {
  ...inRangeEstimate,
  estimateId: 'est_00042',
  species: milkfish,
  dimensions: { lengthM: 20, widthM: 25, waterDepthM: 1.2 },
  surfaceAreaM2: 500,
  estimatedWaterVolumeM3: 600,
  plannedFingerlings: 5000,
  recommendedMinimum: 400,
  recommendedMaximum: 500,
  status: 'ABOVE_RANGE',
  differenceToRange: 4500,
  suggestedFingerlings: 450,
  requiredSpace: { value: 5000, unit: 'M2' },
  additionalSpaceNeeded: { value: 4500, unit: 'M2' },
  basis: {
    type: 'SURFACE_AREA',
    densityMinimum: 0.8,
    densityMaximum: 1,
    densityUnit: 'FISH_PER_M2',
    inputAreaM2: 500,
    inputVolumeM3: 600,
    explanation: bangusPondSizing.spaceBasis,
  },
  ruleVersion: 'demo-2026-09-gabayan',
}

export const recommendations: EquipmentRecommendations = {
  cultivationId: 'cul_00002',
  context: {
    species: {
      id: tilapia.id,
      commonName: tilapia.commonName,
      localName: tilapia.localName,
      image: tilapia.image,
    },
    environment: { id: pond.id, code: pond.code, name: pond.name },
    initialFingerlings: 500,
    estimatedWaterVolumeM3: 30,
  },
  sections: [
    {
      category: aeration,
      reason: 'Optional equipment to review before stocking.',
      products: [
        {
          id: aerator.id,
          name: aerator.name,
          shortDescription: aerator.shortDescription,
          price: aerator.price,
          category: aeration,
          recommendationBadge: 'Suggested for setup',
          whyRelevant:
            'Aeration may help support dissolved oxygen when appropriate for your setup.',
          suggestedQuantity: 1,
          mandatory: false,
        },
      ],
    },
  ],
  isDemo: true,
  ruleVersion: 'demo-2026-09',
  disclaimer: inRangeEstimate.disclaimer,
}
