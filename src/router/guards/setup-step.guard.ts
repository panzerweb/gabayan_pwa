import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

import type { SetupDraft } from '@pages/setup/domain/setup.model'
import { useSetupStore } from '@pages/setup/presentation/stores/setup.store'

import { ROUTE_NAMES, type RouteName } from '../route-names'

interface StepRequirement {
  isReady: (draft: SetupDraft) => boolean
  fallback: RouteName
}

// What the setup draft must hold before a step opens, and the step that collects it.
const STEP_REQUIREMENTS: Partial<Record<RouteName, StepRequirement>> = {
  [ROUTE_NAMES.setupEnvironment]: {
    isReady: (draft) => Boolean(draft.speciesId),
    fallback: ROUTE_NAMES.setupSpecies,
  },
  [ROUTE_NAMES.setupDimensions]: {
    isReady: (draft) => Boolean(draft.environmentId),
    fallback: ROUTE_NAMES.setupEnvironment,
  },
  [ROUTE_NAMES.setupFingerlings]: {
    isReady: (draft) => Boolean(draft.dimensions),
    fallback: ROUTE_NAMES.setupDimensions,
  },
  [ROUTE_NAMES.setupStockingResult]: {
    isReady: (draft) => Boolean(draft.estimate),
    fallback: ROUTE_NAMES.setupFingerlings,
  },
  [ROUTE_NAMES.setupReview]: {
    isReady: (draft) => Boolean(draft.estimate),
    fallback: ROUTE_NAMES.setupFingerlings,
  },
}

// Sends a farmer who opens a setup step early back to the step still missing its answer.
export function setupStepGuard(to: RouteLocationNormalized): NavigationGuardReturn {
  const requirement = STEP_REQUIREMENTS[to.name as RouteName]
  if (!requirement) return true

  const setup = useSetupStore()
  return requirement.isReady(setup.draft) ? true : { name: requirement.fallback }
}
