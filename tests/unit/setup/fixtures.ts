import type {
  CompatibilityResult,
  CultureEnvironment,
  EquipmentRecommendations,
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
