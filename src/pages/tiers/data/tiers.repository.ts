import type { TiersRepository } from '../domain/tiers.repository.interface'
import { createUpgradeRequestApi, getAccountTierApi, listPlansApi } from './tiers.api'

export const tiersRepository: TiersRepository = {
  listPlans: listPlansApi,
  getAccountTier: getAccountTierApi,
  createUpgradeRequest: createUpgradeRequestApi,
}
